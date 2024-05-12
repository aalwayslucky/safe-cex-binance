export class TokenBucket {
  private capacity10s: number;
  private tokens10s: number;
  private capacity60s: number;
  private tokens60s: number;

  constructor() {
    this.capacity10s = 300; // Hard coded value
    this.tokens10s = this.capacity10s;
    this.capacity60s = 1200; // Hard coded value
    this.tokens60s = this.capacity60s;
    setInterval(() => this.addToken(), 1000);
  }

  take(): boolean {
    if (this.tokens10s >= 5 && this.tokens60s >= 5) {
      this.tokens10s -= 5;
      this.tokens60s -= 5;
      return true;
    }

    return false;
  }

  private addToken(): void {
    if (this.tokens10s < this.capacity10s) {
      this.tokens10s += 1;
    }
    if (this.tokens60s < this.capacity60s) {
      this.tokens60s += 1;
    }
  }
}
