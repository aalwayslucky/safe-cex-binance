import axios from "axios";
import retry, { isNetworkError } from "axios-retry";
import createHmac from "create-hmac";
import omit from "lodash/omit";
import qs from "qs";

import type { ExchangeOptions } from "../../types";
import { virtualClock } from "../../utils/virtual-clock";

import {
  BASE_URL,
  ENDPOINTS,
  PUBLIC_ENDPOINTS,
  RECV_WINDOW,
} from "./binance.types";

const RATE_LIMIT = {
  maxRequestsPer10Seconds: 60,
  maxRequestsPerMinute: 240,
};

const tokenBucket = {
  tokens: RATE_LIMIT.maxRequestsPer10Seconds,
  lastRefill: Date.now(),
  refillRate: RATE_LIMIT.maxRequestsPer10Seconds / 10, // 10 seconds
  maxTokens: RATE_LIMIT.maxRequestsPer10Seconds,
};
export const createAPI = (options: ExchangeOptions) => {
  const xhr = axios.create({
    baseURL: BASE_URL[options.testnet ? "testnet" : "livenet"],
    paramsSerializer: {
      serialize: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
    },
    headers: {
      "X-MBX-APIKEY": options.key,
      "Content-Type": "application/json, chartset=utf-8",
    },
  });

  // retry requests on network errors instead of throwing
  retry(xhr, { retries: 3, retryCondition: isNetworkError });

  xhr.interceptors.request.use((config) => {
    // on livenet, don't sign listen key requests (they don't need it)
    if (config.url === ENDPOINTS.LISTEN_KEY && !options.testnet) {
      return config;
    }
    if (config.url === ENDPOINTS.BATCH_ORDERS) {
      const now = Date.now();
      const tokensAvailable = tokenBucket.tokens;
      const timeSinceLastRefill = (now - tokenBucket.lastRefill) / 1000; // seconds
      const tokensToRefill = Math.min(
        tokenBucket.refillRate * timeSinceLastRefill,
        tokenBucket.maxTokens - tokensAvailable
      );
      tokenBucket.tokens = Math.min(
        tokenBucket.maxTokens,
        tokensAvailable + tokensToRefill
      );
      tokenBucket.lastRefill = now;

      if (tokenBucket.tokens < 1) {
        const waitTime = tokenBucket.refillRate * 10 - timeSinceLastRefill; // 10 seconds
        setTimeout(() => {}, waitTime * 1000);
      }

      tokenBucket.tokens--;
    }
    // don't sign requests if no API key is provided
    // and don't add the timeout option
    if (PUBLIC_ENDPOINTS.some((str) => config.url?.startsWith(str))) {
      return config;
    }

    const nextConfig = { ...config };
    const timestamp = virtualClock.getCurrentTime().valueOf();

    const data = config.data || config.params || {};
    data.timestamp = timestamp;
    data.recvWindow = RECV_WINDOW;

    const asString = qs.stringify(data, { arrayFormat: "repeat" });
    const signature = createHmac("sha256", options.secret)
      .update(asString)
      .digest("hex");

    data.signature = signature;
    nextConfig.params = data;

    // use cors-anywhere to bypass CORS
    // Binance doesn't allow CORS on their testnet API
    if (
      nextConfig.method !== "get" &&
      options.testnet &&
      options.corsAnywhere
    ) {
      nextConfig.baseURL = `${options.corsAnywhere}/${config.baseURL}`;
    }

    // Add timeout to signed requests (default is 5s)
    nextConfig.timeout = options?.extra?.recvWindow ?? RECV_WINDOW;

    // remove data from POST/PUT/DELETE requests
    // Binance API takes data as query params
    return omit(nextConfig, "data");
  });

  return xhr;
};
