import { Mutex } from 'async-mutex';

class OrderQueueManager {
  private placeOrderBatchFast: (payloads: any[]) => Promise<string[]>;
  private queue: any[] = [];
  private mutex = new Mutex();
  private processing = false;
  private results: string[] = [];
  private orderTimestamps10s: number[] = []; // Array to store the timestamps of each order in the last 10 seconds
  private orderTimestamps60s: number[] = []; // Array to store the timestamps of each order in the last 60 seconds

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
      // Remove timestamps older than 10 seconds and 60 seconds
      const now = Date.now();
      this.orderTimestamps10s = this.orderTimestamps10s.filter(
        (timestamp) => now - timestamp < 10000
      );
      this.orderTimestamps60s = this.orderTimestamps60s.filter(
        (timestamp) => now - timestamp < 60000
      );

      // Check if the number of orders in the last 10 seconds and 60 seconds is less than the limit
      if (this.orderTimestamps10s.length >= 300 || this.orderTimestamps60s.length >= 1200) {
        // If the limit is reached, wait until the oldest order is more than 10 seconds old
        await sleep(now - Math.min(this.orderTimestamps10s[0], this.orderTimestamps60s[0]) + 1);
        continue;
      }

      // Calculate the maximum batch size allowed by the rate limits
      const maxAllowedSize = Math.min(
        300 - this.orderTimestamps10s.length, // orders per 10 seconds
        1200 - this.orderTimestamps60s.length, // orders per 60 seconds
        this.queue.length,
        5
      );

      const release = await this.mutex.acquire();
      const batch = this.queue.splice(0, maxAllowedSize);
      release();
      this.emitter.emit('orderManager', this.queue.length); // Emit event after splice

      // Add new timestamps
      for (let i = 0; i < batch.length; i++) {
        this.orderTimestamps10s.push(now);
        this.orderTimestamps60s.push(now);
      }

      // Send the batch orders to the API
      this.placeOrderBatchFast(batch)
        .then((orderIds) => {
          this.results.push(...orderIds);
          this.emitter.emit('batchResolved', orderIds);
        })
        .catch((error) => {
          this.emitter.emit('error', 'An unexpected error occurred:', error);
        });

      // Adjust sleeping time based on the remaining rate limit
      const remainingTime10s = 10000 - (now - this.orderTimestamps10s[0]);
      const remainingTime60s = 60000 - (now - this.orderTimestamps60s[0]);
      const remainingLots10s = Math.floor((300 - this.orderTimestamps10s.length) / 5);
      const remainingLots60s = Math.floor((1200 - this.orderTimestamps60s.length) / 5);
      const sleepTime10s = remainingLots10s > 0 ? remainingTime10s / remainingLots10s : 1000;
      const sleepTime60s = remainingLots60s > 0 ? remainingTime60s / remainingLots60s : 1000;

      await sleep(Math.min(sleepTime10s, sleepTime60s));
    }

  }
}

export default OrderQueueManager;