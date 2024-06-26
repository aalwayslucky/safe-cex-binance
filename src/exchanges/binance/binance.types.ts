import {
  OrderType,
  OrderSide,
  PositionSide,
  OrderTimeInForce,
} from '../../types';

export const RECV_WINDOW = 5000;
export const BASE_URL = {
  livenet: 'https://fapi.binance.com',
  testnet: 'https://testnet.binancefuture.com',
};

export const BASE_WS_URL = {
  public: {
    livenet: 'wss://fstream.binance.com/ws',
    testnet: 'wss://stream.binancefuture.com/ws',
  },
  private: {
    livenet: 'wss://fstream.binance.com/ws',
    testnet: 'wss://stream.binancefuture.com/ws',
  },
};

export const ENDPOINTS = {
  BALANCE: '/fapi/v2/balance',
  MARKETS: '/fapi/v1/exchangeInfo',
  ACCOUNT: '/fapi/v2/account',
  POSITIONS: '/fapi/v2/positionRisk',
  LEVERAGE_BRACKET: '/fapi/v1/leverageBracket',
  TICKERS_24H: '/fapi/v1/ticker/24hr',
  TICKERS_BOOK: '/fapi/v1/ticker/bookTicker',
  TICKERS_PRICE: '/fapi/v1/premiumIndex',
  HEDGE_MODE: '/fapi/v1/positionSide/dual',
  SET_LEVERAGE: '/fapi/v1/leverage',
  OPEN_ORDERS: '/fapi/v1/openOrders',
  CANCEL_SYMBOL_ORDERS: '/fapi/v1/allOpenOrders',
  ORDER: '/fapi/v1/order',
  BATCH_ORDERS: '/fapi/v1/batchOrders',
  KLINE: '/fapi/v1/klines',
  LISTEN_KEY: '/fapi/v1/listenKey',
  ORDERBOOK: '/fapi/v1/depth',
};
export const WEIGHTS = {
  BALANCE: 5,
  MARKETS: 1,
  ACCOUNT: 5,
  POSITIONS: 5,
  LEVERAGE_BRACKET: 1,
  TICKERS_24H: 40,
  TICKERS_BOOK: 5,
  TICKERS_PRICE: 5,
  HEDGE_MODE: 1,
  SET_LEVERAGE: 1,
  OPEN_ORDERS: 40,
  CANCEL_SYMBOL_ORDERS: 1,
  ORDER: 0,
  BATCH_ORDERS: 5,
  KLINE: 5,
  LISTEN_KEY: 1,
  ORDERBOOK: 10,
};

export const PUBLIC_ENDPOINTS = [
  ENDPOINTS.MARKETS,
  ENDPOINTS.TICKERS_24H,
  ENDPOINTS.TICKERS_BOOK,
  ENDPOINTS.TICKERS_PRICE,
  ENDPOINTS.KLINE,
  ENDPOINTS.ORDERBOOK,
];

export const ORDER_TYPE: Record<string, OrderType> = {
  LIMIT: OrderType.Limit,
  MARKET: OrderType.Market,
  STOP_MARKET: OrderType.StopLoss,
  TAKE_PROFIT_MARKET: OrderType.TakeProfit,
  TRAILING_STOP_MARKET: OrderType.TrailingStopLoss,
};

export const ORDER_SIDE: Record<string, OrderSide> = {
  BUY: OrderSide.Buy,
  SELL: OrderSide.Sell,
};

export const POSITION_SIDE: Record<string, PositionSide> = {
  LONG: PositionSide.Long,
  SHORT: PositionSide.Short,
};

export const TIME_IN_FORCE: Record<string, OrderTimeInForce> = {
  GTC: OrderTimeInForce.GoodTillCancel,
  IOC: OrderTimeInForce.ImmediateOrCancel,
  FOK: OrderTimeInForce.FillOrKill,
  GTX: OrderTimeInForce.PostOnly,
};
