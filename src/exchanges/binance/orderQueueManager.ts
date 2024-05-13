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

  enqueueOrder(order: any) {
    this.queue.push(order);
    if (!this.processing) {
      this.processing = true;
      this.startProcessing();
    }
  }

  enqueueOrders = async (orders: any[]) => {
    const release = await this.mutex.acquire();
    try {
      for (const order of orders) {
        this.enqueueOrder(order);
      }
    } finally {
      release();
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
        this.queue.length
      );
      const debugDataInfo = {
        maxAllowedSize,
        remainingOrders10s: this.ordersPer10s,
        remainingOrders60s: this.ordersPer60s,
        queueLength: this.queue.length,
      };
      const debugDataString = `Max allowed size: ${debugDataInfo.maxAllowedSize}, Remaining orders in 10s window: ${debugDataInfo.remainingOrders10s}, Remaining orders in 60s window: ${debugDataInfo.remainingOrders60s}, Queue length: ${debugDataInfo.queueLength}`;
      this.emitter.emit('erro', debugDataString);

      const release = await this.mutex.acquire();
      const batch = this.queue.splice(0, maxAllowedSize);
      release();
      const debugDataq = {
        batchLength: batch.length,
        remainingOrders10s: this.ordersPer10s,
        remainingOrders60s: this.ordersPer60s,
        queueLength: this.queue.length,
      };
      const debugStringS = `Batch length: ${debugDataq.batchLength}, Remaining orders in 10s window: ${debugDataq.remainingOrders10s}, Remaining orders in 60s window: ${debugDataq.remainingOrders60s}, Queue length: ${debugDataq.queueLength}`;
      this.emitter.emit('error', debugStringS);
      // Update remaining limits
      this.ordersPer10s -= batch.length;
      this.ordersPer60s -= batch.length;

      // Send the batch orders to the API
      promises.push(
        this.placeOrderBatchFast(batch)
          .then((orderIds) => {
            this.results.push(...orderIds);
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
        const debugData = {
          waitTime,
          remainingOrders10s: this.ordersPer10s,
          remainingOrders60s: this.ordersPer60s,
          queueLength: this.queue.length,
        };

        const debugString = `waitTime : ${debugData.waitTime} ms, Remaining orders in 10s window: ${debugData.remainingOrders10s}, Remaining orders in 60s window: ${debugData.remainingOrders60s}, Queue length: ${debugData.queueLength}`;

        this.emitter.emit('error', debugString);
        await sleep(waitTime);
      } else {
        // Distribute the remaining orders evenly over the remaining time
        // Distribute the remaining orders evenly over the remaining time
        const remainingTime = 10000 - (timeElapsed % 10000);
        const remainingLots = Math.floor(this.ordersPer10s / 5);
        const sleepTime =
          remainingLots > 0 ? remainingTime / remainingLots : 1000;
        const debugData = {
          sleepTime,
          remainingOrders10s: this.ordersPer10s,
          remainingOrders60s: this.ordersPer60s,
          queueLength: this.queue.length,
        };

        const debugString = `Sleep time: ${debugData.sleepTime} ms, Remaining orders in 10s window: ${debugData.remainingOrders10s}, Remaining orders in 60s window: ${debugData.remainingOrders60s}, Queue length: ${debugData.queueLength}`;

        this.emitter.emit('error', debugString);
        await sleep(sleepTime);
      }
    }

    // Wait for all the promises to resolve
    await Promise.all(promises);
  }
}

export default OrderQueueManager;
