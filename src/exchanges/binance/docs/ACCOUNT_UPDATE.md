```json
{
  "e": "ACCOUNT_UPDATE", // Event type
  "T": 1719513970134, // Transaction time
  "E": 1719513970135, // Event time
  "a": {
    "B": [
      // Balances
      {
        "a": "USDT", // Asset
        "wb": "19063.47171448", // Wallet balance
        "cw": "19063.47171448", // Cross wallet balance
        "bc": "0" // Balance change
      }
    ],
    "P": [
      // Positions
      {
        "s": "INJUSDT", // Symbol
        "pa": "2.1", // Position amount
        "ep": "23.364", // Entry price
        "cr": "-242.96000203", // (Pre-fee) accumulated realized
        "up": "-0.01050000", // Unrealized PnL
        "mt": "cross", // Margin type
        "iw": "0", // Isolated wallet
        "ps": "BOTH", // Position side
        "ma": "USDT", // Margin asset
        "bep": "23.3710092" // Break-even price
      }
    ],
    "m": "ORDER" // Event reason type
  }
}
```
