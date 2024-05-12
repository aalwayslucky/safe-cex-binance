import type { TokenBucketConfig } from '../../types';

export class TokenBucket {
  private config: TokenBucketConfig;

  constructor(config: TokenBucketConfig) {
    this.config = config;

    // Refill tokens every second for the oneSecond rule
    setInterval(() => this.addToken('oneSecond'), 1000);

    // Refill tokens every 10 seconds for the tenSeconds rule
    setInterval(() => this.addToken('tenSeconds'), 10000);

    // Refill tokens every 60 seconds for the sixtySeconds rule
    setInterval(() => this.addToken('sixtySeconds'), 60000);
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

  private addToken(rule: 'oneSecond' | 'sixtySeconds' | 'tenSeconds'): void {
    if (this.config[rule].startWithTokens < this.config[rule].capacity)
      this.config[rule].startWithTokens += this.config[rule].addTokens;
  }
}
