# Trading Diary API Documentation

This document provides a detailed explanation of the available backend API endpoints, their request structures, and response formats.

## Base URL
`http://localhost:5000/api`

---

## Trades API

Endpoints for managing and analyzing trades.

### Trade Data Model

Every trade object contains the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `ObjectId` | Unique trade identifier (MongoDB ID) |
| `portfolio_id` | `number \| null` | ID of the portfolio this trade belongs to |
| `strategy_id` | `number` | **Required.** ID of the trading strategy used |
| `symbol_id` | `number` | **Required.** ID of the trading symbol/instrument |
| `quantity` | `number` | **Required.** Number of units traded |
| `type` | `'buy' \| 'sell'` | **Required.** Trade direction |
| `trade_date` | `Date` | **Required.** Date and time of the trade (defaults to now) |
| `fees` | `number` | Trading fees incurred (default: 0) |
| `confidence_level` | `number` (1-10) | Trader's confidence level before the trade |
| `entry_reason` | `string` | **Required.** Reason for entering the trade |
| `exit_reason` | `string` | **Required.** Reason for exiting the trade |
| `outcome` | `'win' \| 'loss' \| 'neutral'` | **Required.** Result of the trade |
| `entry_price` | `number` | **Required.** Price at which the trade was entered |
| `exit_price` | `number` | Price at which the trade was exited |
| `stop_loss` | `number` | Stop loss price level |
| `take_profit` | `number` | Take profit price level |
| `photo` | `string \| null` | Path to the main trade screenshot |
| `notes` | `string \| null` | General notes about the trade |
| `is_greed` | `boolean` | Whether the trade was influenced by greed |
| `is_fomo` | `boolean` | Whether the trade was influenced by FOMO |
| `tags` | `string[]` | User-defined tags for categorization |
| `market_condition` | `'trending' \| 'ranging' \| 'volatile' \| 'choppy'` | Market condition at the time of trade |
| `entry_execution` | `'perfect' \| 'early' \| 'late'` | Quality of trade entry execution |
| `exit_execution` | `'perfect' \| 'early' \| 'late'` | Quality of trade exit execution |
| `emotional_state` | `string[]` | Emotional states: `calm`, `anxious`, `overconfident`, `fearful`, `tilted` |
| `post_trade_thoughts` | `string` | Reflections after the trade |
| `rule_violations` | `string[]` | Violated trading rules: `Early Exit`, `Late Exit`, `Early Entry`, `Late Entry`, `Overconfidence`, `Fear`, `Tilt`, `Revenge Trade` |
| `timeframe_photos` | `{ type: string, photo: string }[]` | Array of multi-timeframe screenshots. Timeframe types include: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1D`, `1W`, `1M`. **Duplicates are not allowed.** |

#### Calculated Fields (Auto-generated on save)

| Field | Type | Calculation |
|-------|------|-------------|
| `pl` | `number` | Realized Profit/Loss: `(exit_price - entry_price) * quantity - fees` for buy trades. |
| `planned_rr` | `number` | Planned Risk-Reward: `abs(take_profit - entry_price) / abs(entry_price - stop_loss)` |
| `actual_rr` | `number` | Actual Risk-Reward based on exit price vs. stop loss distance. |
| `returns` | `number` | Percentage return: `((exit_price - entry_price) / entry_price) * 100` |
| `createdAt` | `Date` | Timestamp when the trade was created |
| `updatedAt` | `Date` | Timestamp when the trade was last updated |

---

### 1. Get All Trades

Retrieves a paginated list of trades with optional filtering.

- **URL**: `/trades`
- **Method**: `GET`
- **Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | 1 | Page number for pagination |
| `limit` | `number` | 20 | Number of trades per page |
| `strategy_id` | `number` | - | Filter by strategy ID |
| `symbol` | `number` | - | Filter by symbol ID |
| `outcome` | `string` | - | Filter by `win`, `loss`, or `neutral` |
| `search` | `string` | - | Search in `entry_reason`, `exit_reason`, and `notes` |

- **Response (200 OK)**:
```json
{
  "trades": [
    {
      "_id": "60f5e3...",
      "strategy_id": 1,
      "symbol_id": 2,
      "quantity": 100,
      "type": "buy",
      "trade_date": "2023-12-15T10:30:00Z",
      "entry_price": 50.50,
      "exit_price": 52.00,
      "outcome": "win",
      "pl": 150,
      "returns": 2.97,
      "tags": ["breakout", "strong-trend"],
      "timeframe_photos": [
        { "type": "30m", "photo": "/uploads/30m_chart.png" }
      ],
      ...
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

### 2. Get Single Trade

Retrieves a single trade by its ID.

- **URL**: `/trades/:id`
- **Method**: `GET`
- **URL Parameters**: `id` - MongoDB ObjectId of the trade.
- **Response (200 OK)**: Full trade object.
- **Response (404 Not Found)**: `{ "message": "Trade not found" }`

---

### 3. Create Trade

Creates a new trade record. Supports image uploads for screenshots.

- **URL**: `/trades`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `strategy_id` | `number` | Yes | ID of the trading strategy |
| `symbol_id` | `number` | Yes | ID of the trading symbol |
| `quantity` | `number` | Yes | Number of units traded |
| `type` | `string` | Yes | `buy` or `sell` |
| `entry_price` | `number` | Yes | Entry price |
| `exit_price` | `number` | No | Exit price |
| `trade_date` | `string` | No | ISO date string |
| `outcome` | `string` | Yes | `win`, `loss`, or `neutral` |
| `entry_reason` | `string` | Yes | Reason for entry |
| `exit_reason` | `string` | Yes | Reason for exit |
| `stop_loss` | `number` | No | Stop loss level (for RR calculation) |
| `take_profit` | `number` | No | Take profit level (for RR calculation) |
| `photo` | `file` | No | Main trade screenshot |
| `timeframe_photos` | `JSON string` | No | Array of `{type, photo}` |
| `[timeframe_type]` | `file` | No | Timeframe screenshot (e.g., field name `1h`, `30m`) |
| `tags` | `JSON string` | No | Array of tag strings |
| `rule_violations` | `JSON string` | No | Array of rule violations |
| ... | ... | ... | Other optional fields per Trade Data Model |

- **Response (201 Created)**: Full trade object with calculated fields.
- **Response (400 Bad Request)**: `{ "message": "Validation error message" }`

---

### 4. Update Trade

Updates an existing trade. Supports image uploads.

- **URL**: `/trades/:id`
- **Method**: `PUT`
- **Content-Type**: `multipart/form-data`
- **URL Parameters**: `id` - MongoDB ObjectId of the trade.
- **Body Fields**: Same as Create Trade.
- **Response (200 OK)**: Updated trade object.
- **Response (404 Not Found)**: `{ "message": "Trade not found" }`

---

### 5. Delete Trade

Deletes a trade by its ID.

- **URL**: `/trades/:id`
- **Method**: `DELETE`
- **URL Parameters**: `id` - MongoDB ObjectId of the trade.
- **Response (200 OK)**: `{ "message": "Trade deleted" }`
- **Response (404 Not Found)**: `{ "message": "Trade not found" }`

---

## Statistics Endpoints

### 6. Performance Metrics

Calculates advanced performance statistics for filtered trades.

- **URL**: `/trades/stats/performance-metric`
- **Method**: `GET`
- **Query Parameters**: Same as Get All Trades (`strategy_id`, `symbol`, `outcome`, `search`).

- **Response (200 OK)**:

| Field | Type | Description |
|-------|------|-------------|
| `winRate` | `number` | Percentage of winning trades: `(wins / (wins + losses)) * 100` |
| `avgRr` | `number` | Average actual Risk-Reward ratio across all trades |
| `expectancy` | `number` | Expected value per trade: `(win_prob * avg_win_pl) + (loss_prob * avg_loss_pl)` |
| `totalTrades` | `number` | Total number of trades matching the filter |
| `avgConfidence` | `number` | Average confidence level (1-10) |
| `consistencyScore` | `number` | Standard deviation of P/L (lower = more consistent) |
| `bestTrade` | `number` | Maximum P/L from a single trade |
| `worstTrade` | `number` | Minimum P/L from a single trade |
| `maxDrawdown` | `number` | Maximum peak-to-trough equity decline (%) |

```json
{
  "winRate": 65.00,
  "avgRr": 1.85,
  "expectancy": 120.50,
  "totalTrades": 50,
  "avgConfidence": 7.2,
  "consistencyScore": 150.25,
  "bestTrade": 500.00,
  "worstTrade": -200.00,
  "maxDrawdown": 12.50
}
```

---

### 7. Execution Metrics

Retrieves statistics related to entry/exit efficiency, behavioral mistakes, and rule violations.

- **URL**: `/trades/stats/execution-metric`
- **Method**: `GET`
- **Query Parameters**: Same as Get All Trades.

- **Response (200 OK)**:

| Field | Type | Description |
|-------|------|-------------|
| `efficiency.entryEfficiency` | `number` | Percentage of trades with `entry_execution === 'perfect'` |
| `efficiency.exitEfficiency` | `number` | Percentage of trades with `exit_execution === 'perfect'` |
| `mistakes.greed` | `number` | Count of trades where `is_greed === true` |
| `mistakes.fomo` | `number` | Count of trades where `is_fomo === true` |
| `mistakes.ruleViolations` | `object` | Map of rule violation type to count |

```json
{
  "efficiency": {
    "entryEfficiency": 72.00,
    "exitEfficiency": 65.00
  },
  "mistakes": {
    "greed": 5,
    "fomo": 3,
    "ruleViolations": {
      "Early Exit": 4,
      "Late Entry": 2,
      "Revenge Trade": 1
    }
  }
}
```

---

### 8. P&L Calendar

Retrieves daily P&L and return data for a specific month/year. Used for calendar heatmap visualization.

- **URL**: `/trades/pnl/calendar`
- **Method**: `GET`
- **Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `month` | `number` | Yes | Month (1-12) |
| `year` | `number` | Yes | Year (e.g., 2024) |

- **Response (200 OK)**:

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Date in `YYYY-MM-DD` format |
| `pnl` | `number` | Total P/L for the day |
| `returns` | `number` | Total percentage return for the day |
| `count` | `number` | Number of trades on that day |

```json
[
  { "date": "2024-12-01", "pnl": 250.00, "returns": 2.5, "count": 3 },
  { "date": "2024-12-02", "pnl": -75.00, "returns": -0.8, "count": 1 },
  { "date": "2024-12-05", "pnl": 100.50, "returns": 1.0, "count": 2 }
]
```

---

## Strategies API

Endpoints for managing trading strategies.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/strategies` | List all strategies |
| `POST` | `/strategies` | Create a new strategy |
| `PUT` | `/strategies/:id` | Update a strategy by ID |
| `DELETE` | `/strategies/:id` | Delete a strategy by ID |

---

## Symbols API

Endpoints for managing trading symbols/assets.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/symbols` | List all symbols |
| `POST` | `/symbols` | Create a new symbol |
| `PUT` | `/symbols/:id` | Update a symbol by ID |
| `DELETE` | `/symbols/:id` | Delete a symbol by ID |

---

## Portfolios API

Endpoints for managing portfolios.

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/portfolios` | List all portfolios |
| `POST` | `/portfolios` | Create a new portfolio |
| `PUT` | `/portfolios/:id` | Update a portfolio by ID |
| `DELETE` | `/portfolios/:id` | Delete a portfolio by ID |

---

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "message": "Error description here"
}
```

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - Validation errors or invalid input |
| `404` | Not Found - Resource does not exist |
| `500` | Internal Server Error - Unexpected server error |
