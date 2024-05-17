import { Mutex } from 'async-mutex';

class OrderQueueManager {
  private placeOrderBatchFast: (payloads: any[]) => Promise<string[]>;

  private queue: any[] = [];
  private mutex = new Mutex();
  private ordersPer10s = 290;
  private ordersPer60s = 1200;
  private lastResetTime = Date.now();
  private processing = false;
  private results: string[] = [];

  constructor(
    private emitter: any,
    placeOrderBatchFast: (payloads: any[]) => Promise<string[]>
  ) {
    this.placeOrderBatchFast = placeOrderBatchFast;
  }

  enqueueOrders = async (orders: any[]) => {
    const release = await this.mutex.acquire();
    try {
      this.queue.push(...orders);
      this.emitter.emit('orderManager', this.queue.length); // Emit event after enqueue
      if (!this.processing) {
        this.processing = true;
        this.startProcessing();
      }
    } finally {
      release();
    }
  };
  isProcessing() {
    return this.processing;
  }

  getResults() {
    const resultsCopy = [...this.results];
    this.results = [];
    return resultsCopy;
  }
  startEmittingQueueLength = () => {
    setInterval(() => {
      if (this.queue.length > 0) {
        this.emitter.emit('error', this.queue.length);
      }
    }, 1000);
  };
  private async startProcessing() {
    try {
      while (this.queue.length > 0) {
        await this.processOrders();
      }
    } catch (error) {
      this.emitter.emit('error', 'Error in processing loop:', error);
    } finally {
      this.processing = false; // Ensure the flag is reset even if an error occurs
    }
  }

  private async processOrders() {
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const promises = []; // Array to hold all the promises

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeElapsed = now - this.lastResetTime;

      // Reset rate limits based on time
      if (timeElapsed >= 10000) {
        // every 10 seconds
        this.ordersPer10s = 290;
      }
      if (timeElapsed >= 60000) {
        // every 60 seconds
        this.ordersPer60s = 1200;
        this.lastResetTime = now;
      }

      // Calculate the maximum batch size allowed by the rate limits
      const maxAllowedSize = Math.min(
        this.ordersPer10s, // orders per 10 seconds
        this.ordersPer60s, // orders per 60 seconds
        this.queue.length,
        5
      );

      const release = await this.mutex.acquire();

      const batch = this.queue.splice(0, maxAllowedSize);
      release();
      this.emitter.emit('orderManager', this.queue.length); // Emit event after splice

      // Update remaining limits
      this.ordersPer10s -= batch.length;
      this.ordersPer60s -= batch.length;

      // Send the batch orders to the API
      promises.push(
        this.placeOrderBatchFast(batch)
          .then((orderIds) => {
            this.results.push(...orderIds);
            this.emitter.emit('batchResolved', orderIds);

          })
          .catch((error) => {
            this.emitter.emit('error', 'An unexpected error occurred:', error);
          })
      );

      // Adjust sleeping time based on the remaining rate limit
      let waitTime;
      if (this.ordersPer10s <= 0) {
        waitTime = 10000 - (timeElapsed % 10000);
      } else if (this.ordersPer60s <= 0) {
        waitTime = 60000 - (timeElapsed % 60000);
      }

      if (waitTime) {
        await sleep(waitTime);
      } else {
        const remainingTime = 10000 - (timeElapsed % 10000);
        const remainingLots = Math.floor(this.ordersPer10s / 5);
        const sleepTime =
          remainingLots > 0 ? remainingTime / remainingLots : 1000;

        await sleep(sleepTime);
      }
    }

    await Promise.all(promises);
  }
}

export default OrderQueueManager;
