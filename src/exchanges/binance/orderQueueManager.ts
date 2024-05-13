import { Mutex } from 'async-mutex';

class OrderQueueManager {
  private placeOrderBatchFast: (payloads: any[]) => Promise<string[]>;

  private queue: any[] = [];
  private mutex = new Mutex();
  private readonly maxBatchSize = 5;
  private ordersPer10s = 300;
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

  async enqueueOrder(order: any) {
    const release = await this.mutex.acquire();
    try {
      this.queue.push(order);
      if (!this.processing) {
        this.processing = true;
        this.startProcessing();
      }
    } finally {
      release();
    }
  }
  enqueueOrders = async (orders: any[]) => {
    for (const order of orders) {
      await this.enqueueOrder(order);
    }
  };
  isProcessing() {
    return this.processing;
  }

  getResults() {
    return this.results;
  }

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

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeElapsed = now - this.lastResetTime;

      // Reset rate limits based on time
      if (timeElapsed >= 10000) {
        // every 10 seconds
        this.ordersPer10s = 300;
      }
      if (timeElapsed >= 60000) {
        // every 60 seconds
        this.ordersPer60s = 1200;
        this.lastResetTime = now;
      }

      // Calculate the maximum batch size allowed by the rate limits
      const maxAllowedSize = Math.min(
        this.maxBatchSize,
        this.ordersPer10s,
        this.ordersPer60s,
        this.queue.length
      );

      const release = await this.mutex.acquire();
      const batch = this.queue.splice(0, maxAllowedSize);
      release();

      // Update remaining limits
      this.ordersPer10s -= batch.length;
      this.ordersPer60s -= batch.length;

      // Send the batch orders to the API
      try {
        const orderIds = await this.placeOrderBatchFast(batch);
        this.results.push(...orderIds);
      } catch (error) {
        this.emitter.emit('error', 'An unexpected error occurred:', error);
      }

      // Adjust sleeping time based on the remaining rate limit
      if (this.ordersPer10s <= 0 || this.ordersPer60s <= 0) {
        const waitTime = Math.max(
          10000 - (timeElapsed % 10000),
          60000 - (timeElapsed % 60000)
        );
        await sleep(waitTime);
      } else {
        await sleep(1000); // Short sleep to prevent high CPU usage
      }
    }
  }
}

export default OrderQueueManager;
