import type { BaseExchange } from './exchanges/base';
import { BinanceExchange } from './exchanges/binance/binance.exchange';

import { DefaultStore } from './store/store.base';
import type { Store } from './store/store.interface';
import type { ExchangeName, ExchangeOptions } from './types';
import { virtualClock } from './utils/virtual-clock';

const exchanges: Record<ExchangeName, typeof BaseExchange> = {
 
  binance: BinanceExchange,

};

export const createExchange = (
  exchangeName: keyof typeof exchanges,
  options: ExchangeOptions,
  store?: Store
) => {
  // start the virtual clock to contact exchanges
  // with a server timestamp
  virtualClock.start();

  const Exchange = exchanges[exchangeName];
  return new Exchange(options, store || new DefaultStore());
};
