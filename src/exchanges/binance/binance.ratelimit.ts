import type { TokenBucketConfig } from '../../types';

export class TokenBucket {
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig) {
    this.config = config;

    setInterval(() => this.addToken(), 1000);
  }

  take(): boolean {
    if (
      this.config.oneSecond.startWithTokens >=
        this.config.oneSecond.takeTokens &&
      this.config.tenSeconds.startWithTokens >=
        this.config.tenSeconds.takeTokens &&
      this.config.sixtySeconds.startWithTokens >=
        this.config.sixtySeconds.takeTokens
    ) {
      this.config.oneSecond.startWithTokens -= this.config.oneSecond.takeTokens;
      this.config.tenSeconds.startWithTokens -=
        this.config.tenSeconds.takeTokens;
      this.config.sixtySeconds.startWithTokens -=
        this.config.sixtySeconds.takeTokens;
      return true;
    }
    return false;
  }

  waitForTokens(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (
          this.config.oneSecond.startWithTokens >=
            this.config.oneSecond.takeTokens &&
          this.config.tenSeconds.startWithTokens >=
            this.config.tenSeconds.takeTokens &&
          this.config.sixtySeconds.startWithTokens >=
            this.config.sixtySeconds.takeTokens
        ) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  private addToken(): void {
    if (this.config.oneSecond.startWithTokens < this.config.oneSecond.capacity)
      this.config.oneSecond.startWithTokens += this.config.oneSecond.addTokens;
    if (
      this.config.tenSeconds.startWithTokens < this.config.tenSeconds.capacity
    )
      this.config.tenSeconds.startWithTokens +=
        this.config.tenSeconds.addTokens;
    if (
      this.config.sixtySeconds.startWithTokens <
      this.config.sixtySeconds.capacity
    )
      this.config.sixtySeconds.startWithTokens +=
        this.config.sixtySeconds.addTokens;
  }
}
