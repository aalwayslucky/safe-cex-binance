export class TokenBucket {
  private capacity10s: number;
  private tokens10s: number;
  private capacity60s: number;
  private tokens60s: number;
  private capacity1s: number; // New bucket for per-second limit
  private tokens1s: number; // New bucket for per-second limit

  constructor() {
    this.capacity10s = 300;
    this.tokens10s = 150;
    this.capacity60s = 1200;
    this.tokens60s = 1000;
    this.capacity1s = 30; // Initialize with a reasonable per-second limit
    this.tokens1s = 30; // Initialize with a reasonable per-second limit
    setInterval(() => this.addToken(), 1000);
  }

  take(): boolean {
    if (this.tokens10s >= 5 && this.tokens60s >= 5 && this.tokens1s >= 5) {
      // Check the per-second bucket as well
      this.tokens10s -= 5;
      this.tokens60s -= 5;
      this.tokens1s -= 5; // Use 1 token from the per-second bucket
      return true;
    }
    return false;
  }
  waitForTokens(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.tokens10s >= 5 && this.tokens60s >= 5 && this.tokens1s >= 5) {
          // Check the per-second bucket as well
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private addToken(): void {
    if (this.tokens10s < this.capacity10s) this.tokens10s += 29;
    if (this.tokens60s < this.capacity60s) this.tokens60s += 19;
    if (this.tokens1s < this.capacity1s) this.tokens1s += 30; // Add 1 token per second
  }
}
