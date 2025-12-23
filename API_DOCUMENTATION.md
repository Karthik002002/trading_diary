# Trading Diary API Documentation

This document provides a detailed explanation of the available backend API endpoints, their request structures, and response formats.

## Base URL
`http://localhost:5000/api`

---

## Trades API
Endpoints for managing and analyzing trades.

### 1. Get All Trades
Retrieves a paginated list of trades with optional filtering.

- **URL**: `/trades`
- **Method**: `GET`
- **Query Parameters**:
  - `page` (number, default: 1): The page number.
  - `limit` (number, default: 20): Number of trades per page.
  - `strategy_id` (number): Filter by strategy.
  - `symbol` (number): Filter by symbol ID.
  - `outcome` (string): Filter by 'win', 'loss', or 'neutral'.
  - `search` (string): Search in reasons and notes.
- **Response**:
```json
{
  "trades": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### 2. Create Trade
Creates a new trade. Supports image uploads for screenshots.

- **URL**: `/trades`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body Fields**:
  - `strategy_id` (required, number)
  - `symbol_id` (required, number)
  - `quantity` (required, number)
  - `type` (required, 'buy' | 'sell')
  - `entry_price` (required, number)
  - `exit_price` (number)
  - `trade_date` (date)
  - `photo` (file)
  - ... (other trade fields)

### 3. Performance Metrics
Calculates advanced performance statistics for filtered trades.

- **URL**: `/trades/stats/performance-metric`
- **Method**: `GET`
- **Response**:
```json
{
  "winRate": 88.89,
  "avgRr": 0.57,
  "expectancy": 114.33,
  "totalTrades": 9,
  "avgConfidence": 5.56,
  "consistencyScore": 816.5,
  "bestTrade": 1000,
  "worstTrade": -1000,
  "maxDrawdown": 20.00
}
```

### 4. Execution Metrics
Retrieves statistics related to entry/exit efficiency, behavioral mistakes, and rule violations.

- **URL**: `/trades/stats/execution-metric`
- **Method**: `GET`
- **Query Parameters**: Same as `/trades` (`strategy_id`, `symbol`, `outcome`, `search`).
- **Response**:
```json
{
  "efficiency": {
    "entryEfficiency": 85.00,
    "exitEfficiency": 70.00
  },
  "mistakes": {
    "greed": 3,
    "fomo": 2,
    "ruleViolations": {
      "Early Exit": 5,
      "Fitted SL": 1
    }
  }
}
```

### 5. P&L Calendar
Retrieves daily P&L and return data for a specific month/year.

- **URL**: `/trades/pnl/calendar`
- **Method**: `GET`
- **Query Parameters**:
  - `month` (required, number, 1-12)
  - `year` (required, number)
- **Response**:
```json
[
  {
    "date": "2023-12-01",
    "pnl": 150.50,
    "returns": 1.25,
    "count": 2
  },
  {
    "date": "2023-12-02",
    "pnl": -50.00,
    "returns": -0.4,
    "count": 1
  }
]
```

### 6. Other Trade Endpoints
- **GET** `/trades/:id`: Retrieve a single trade by ID.
- **PUT** `/trades/:id`: Update an existing trade (supports image upload).
- **DELETE** `/trades/:id`: Delete a trade.

---

## Strategies API
Endpoints for managing trading strategies.

- **GET** `/strategies`: List all strategies.
- **POST** `/strategies`: Create a new strategy.
- **PUT** `/strategies/:id`: Update a strategy.
- **DELETE** `/strategies/:id`: Delete a strategy.

---

## Symbols API
Endpoints for managing trading symbols/assets.

- **GET** `/symbols`: List all symbols.
- **POST** `/symbols`: Create a new symbol.
- **PUT** `/symbols/:id`: Update a symbol.
- **DELETE** `/symbols/:id`: Delete a symbol.

---

## Portfolios API
Endpoints for managing portfolios.

- **GET** `/portfolios`: List all portfolios.
- **POST** `/portfolios`: Create a new portfolio.
- **PUT** `/portfolios/:id`: Update a portfolio.
- **DELETE** `/portfolios/:id`: Delete a portfolio.
