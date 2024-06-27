# Modify Order (TRADE)

## Endpoint

`PUT /fapi/v1/order`

## Description

Order modification function, currently only supports LIMIT order modification. Modified orders will be reordered in the match queue.

## Rate Limits

- 1 on 10s order rate limit (X-MBX-ORDER-COUNT-10S)
- 1 on 1min order rate limit (X-MBX-ORDER-COUNT-1M)
- 1 on IP rate limit (x-mbx-used-weight-1m)

## Parameters

| Name              | Type    | Mandatory | Description                                                                                                                                                                      |
| ----------------- | ------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orderId           | LONG    | NO        |                                                                                                                                                                                  |
| origClientOrderId | STRING  | NO        |                                                                                                                                                                                  |
| symbol            | STRING  | YES       |                                                                                                                                                                                  |
| side              | ENUM    | YES       | SELL, BUY; side needs to be the same as the original order                                                                                                                       |
| quantity          | DECIMAL | YES       | Order quantity, cannot be sent with closePosition=true                                                                                                                           |
| price             | DECIMAL | YES       |                                                                                                                                                                                  |
| priceMatch        | ENUM    | NO        | Only available for LIMIT/STOP/TAKE_PROFIT order; can be set to OPPONENT/OPPONENT_5/OPPONENT_10/OPPONENT_20/QUEUE/QUEUE_5/QUEUE_10/QUEUE_20; Cannot be passed together with price |
| recvWindow        | LONG    | NO        |                                                                                                                                                                                  |
| timestamp         | LONG    | YES       |                                                                                                                                                                                  |

**Note:**

- Either `orderId` or `origClientOrderId` must be sent. The `orderId` will prevail if both are sent.
- Both `quantity` and `price` must be sent, which is different from the `dapi` modify order endpoint.
- When the new `quantity` or `price` doesn't satisfy `PRICE_FILTER` / `PERCENT_FILTER` / `LOT_SIZE`, the amendment will be rejected and the order will stay as it is.
- However, the order will be cancelled by the amendment in the following situations:
  - When the order is in partially filled status and the new `quantity` <= `executedQty`
  - When the order is `GTX` and the new price will cause it to be executed immediately
- One order can only be modified less than 10000 times.
- Order modification will preserve the original `selfTradePreventionMode` of the order.

## Response

```json
{
  "orderId": 20072994037,
  "symbol": "BTCUSDT",
  "pair": "BTCUSDT",
  "status": "NEW",
  "clientOrderId": "LJ9R4QZDihCaS8UAOOLpgW",
  "price": "30005",
  "avgPrice": "0.0",
  "origQty": "1",
  "executedQty": "0",
  "cumQty": "0",
  "cumBase": "0",
  "timeInForce": "GTC",
  "type": "LIMIT",
  "reduceOnly": false,
  "closePosition": false,
  "side": "BUY",
  "positionSide": "LONG",
  "stopPrice": "0",
  "workingType": "CONTRACT_PRICE",
  "priceProtect": false,
  "origType": "LIMIT",
  "priceMatch": "NONE",
  "selfTradePreventionMode": "NONE",
  "goodTillDate": 0,
  "updateTime": 1629182711600
}
```
