# Trading Diary - Features Documentation

## Frontend Features

### 1. Dashboard & Portfolio Management

#### Dashboard Overview
- **Performance Metrics Display**: Real-time visualization of key trading metrics
  - Win Rate gauge chart showing win/loss percentage
  - Average Risk-Reward (Avg RR) ratio
  - Total Returns percentage
  - Maximum Drawdown (Max DD) percentage
  - Consistency Score (standard deviation of P&L)
  
- **Advanced Filtering System**: Multi-criteria filter system with URL-based state management
  - Filter by Portfolio
  - Filter by Trading Strategy
  - Filter by Outcome (Win/Loss/Neutral)
  - Filter by Symbol/Instrument
  - Filter by Trade Status (Ongoing/Completed)
  - Filter by Tags (multi-select)
  - Text search across trade reasons and notes
  
- **P&L Calendar**: Monthly calendar view showing daily profit/loss visualizations
  - Color-coded daily P&L
  - Trade count per day
  - Returns percentage per day

- **Keyboard Shortcuts**: Quick access to common actions
  - `Ctrl+M`: Open create trade modal
  - Paste image from clipboard to auto-open trade creation

#### Portfolio Management
- **Portfolio CRUD Operations**: Create, read, update, and delete portfolios
- **Balance Tracking**: Real-time portfolio balance updates
- **Transaction Management**:
  - PAYIN transactions (deposits)
  - PAYOUT transactions (withdrawals)
  - Transaction history with notes
  - Automatic balance adjustments

### 2. Trade Management

#### Create Trade
- **Comprehensive Trade Form** with accordion layout:
  - **Trade Details Section**:
    - Portfolio selection
    - Strategy selection
    - Symbol/Instrument selection (with inline symbol creation)
    - Entry price, stop loss, take profit
    - Exit price
    - Quantity
    - Trade date
    - Automatic Risk-Reward calculation
    - Confidence level
  
  - **Psychological & Rules Section**:
    - Entry reasoning (rich text)
    - Exit reasoning (rich text)
    - Notes
    - Tags (multi-select with create-on-type)
    - Emotional flags (Greed, FOMO)
    - Rule violations tracking
    - Entry/Exit execution quality (Perfect/Good/Poor)
  
  - **Photo Evidence Section**:
    - Main trade screenshot
    - Multiple timeframe photos (5m, 15m, 1h, 4h, 1d, 1w)
    - Drag-and-drop or paste support

#### Trade Table
- **Virtual Table**: Optimized for large datasets with virtualization
- **Pagination**: Configurable page size (default 20 trades per page)
- **Sortable Columns**: Sort by date, P&L, returns, etc.
- **Quick Actions**: 
  - View trade details
  - Edit trade
  - Delete trade (with confirmation)
  - View photo evidence in modal
- **Expandable Rows**: See trade details inline

#### Edit Trade
- Pre-populated form with existing trade data
- Support for updating all trade fields
- Automatic portfolio balance synchronization
- Image replacement capability

### 3. Settings Management

#### General Preferences
- **Dashboard Display Toggles**: Show/hide specific metrics
  - Win Rate
  - Average RR
  - Total Returns
  - Max Drawdown
  - Consistency Score
  
- **Trading Preferences**:
  - Max Loss percentage threshold
  - Default trade quantity
  
- **Data Preferences (Default Filters)**:
  - Default portfolio
  - Default strategy

#### Resource Management
- **Portfolio Manager**: Full CRUD for portfolios
- **Strategy Manager**: 
  - Create/edit/delete strategies
  - Rich text strategy descriptions (Lexical editor)
  - Strategy performance tracking
  
- **Symbol Manager**: 
  - Create/edit/delete trading symbols/instruments
  - Symbol metadata management

---

## Backend API Endpoints

### 1. Portfolio Routes (`/api/portfolios`)

#### `POST /api/portfolios`
**Purpose**: Create a new portfolio  
**Request Body**:
```json
{
  "name": "Main Trading Account",
  "initial_balance": 10000,
  "balance": 10000
}
```
**Response**: Created portfolio object with ID

#### `GET /api/portfolios`
**Purpose**: Retrieve all portfolios  
**Response**: Array of portfolio objects

#### `GET /api/portfolios/:id`
**Purpose**: Get a specific portfolio by ID  
**Response**: Portfolio object with current balance

#### `PUT /api/portfolios/:id`
**Purpose**: Update portfolio details  
**Request Body**: Updated portfolio fields  
**Response**: Updated portfolio object

#### `DELETE /api/portfolios/:id`
**Purpose**: Delete a portfolio  
**Response**: Confirmation message

#### `POST /api/portfolios/:id/payin`
**Purpose**: Record a deposit (PAYIN) transaction  
**Request Body**:
```json
{
  "amount": 5000,
  "note": "Monthly deposit"
}
```
**Side Effects**: Increases portfolio balance  
**Response**: Portfolio and transaction objects

#### `POST /api/portfolios/:id/payout`
**Purpose**: Record a withdrawal (PAYOUT) transaction  
**Request Body**:
```json
{
  "amount": 1000,
  "note": "Profit withdrawal",
  "before_open": false
}
```
**Side Effects**: Decreases portfolio balance  
**Response**: Portfolio and transaction objects

#### `GET /api/portfolios/:id/transactions`
**Purpose**: Get all transactions for a portfolio  
**Response**: Array of transaction records sorted by date (newest first)

---

### 2. Trade Routes (`/api/trades`)

#### `POST /api/trades`
**Purpose**: Create a new trade  
**Content-Type**: `multipart/form-data` (supports file uploads)  
**Request Body** (FormData):
- Trade details (portfolio_id, strategy_id, symbol_id, entry_price, stop_loss, take_profit, etc.)
- Photo uploads (main photo and timeframe photos)
- Tags (auto-created if they don't exist)
- Rule violations
- Psychological flags (is_greed, is_fomo)

**Side Effects**:
- Calculates Risk-Reward ratio automatically
- Creates new tags if they don't exist
- Updates portfolio balance with trade P&L
- Stores uploaded images

**Response**: Created trade object

#### `GET /api/trades`
**Purpose**: Retrieve trades with filtering and pagination  
**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `strategy_id`: Filter by strategy
- `outcome`: Filter by outcome (win/loss/neutral)
- `symbol`: Filter by symbol ID
- `portfolio_id`: Filter by portfolio
- `status`: Filter by status (IN/NIN)
- `tags`: Filter by tag IDs (comma-separated)
- `search`: Text search in reasons and notes

**Response**:
```json
{
  "trades": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

#### `GET /api/trades/:id`
**Purpose**: Get a specific trade by ID  
**Response**: Trade object with populated tags

#### `PUT /api/trades/:id`
**Purpose**: Update an existing trade  
**Content-Type**: `multipart/form-data`  
**Request Body**: Updated trade fields (similar to POST)

**Side Effects**:
- Recalculates P&L
- Synchronizes portfolio balance (handles portfolio changes)
- Updates or replaces images

**Response**: Updated trade object

#### `DELETE /api/trades/:id`
**Purpose**: Delete a trade  
**Side Effects**: Reverts portfolio balance by subtracting the trade's P&L  
**Response**: Confirmation message

#### `GET /api/trades/stats/performance-metric`
**Purpose**: Get performance statistics based on filters  
**Query Parameters**: Same as GET /api/trades (for filtering)

**Response**:
```json
{
  "winRate": 65.5,
  "avgRr": 2.3,
  "expectancy": 150.25,
  "totalTrades": 100,
  "totalReturns": 23.45,
  "totalPnl": 2500.75,
  "avgConfidence": 7.5,
  "consistencyScore": 125.30,
  "bestTrade": 450.00,
  "worstTrade": -200.00,
  "maxDrawdown": 12.5
}
```

**Calculated Metrics**:
- **Win Rate**: Percentage of winning trades
- **Average RR**: Average risk-reward ratio across all trades
- **Expectancy**: Expected value per trade (EV formula)
- **Consistency Score**: Standard deviation of P&L
- **Max Drawdown**: Maximum percentage drop from peak equity

#### `GET /api/trades/stats/execution-metric`
**Purpose**: Get execution quality and mistake statistics  
**Query Parameters**: Same filtering as GET /api/trades

**Response**:
```json
{
  "efficiency": {
    "entryEfficiency": 75.5,
    "exitEfficiency": 68.2
  },
  "mistakes": {
    "greed": 5,
    "fomo": 3,
    "ruleViolations": {
      "No confirmation": 2,
      "Over-leveraged": 1
    }
  }
}
```

**Calculated Metrics**:
- **Entry Efficiency**: Percentage of trades with "perfect" entry execution
- **Exit Efficiency**: Percentage of trades with "perfect" exit execution
- **Mistake Tracking**: Count of emotional (greed/FOMO) and rule violation instances

#### `GET /api/trades/pnl/calendar`
**Purpose**: Get daily P&L data for calendar visualization  
**Query Parameters**:
- `month`: Month number (1-12) **[Required]**
- `year`: Year (e.g., 2026) **[Required]**
- All standard filters (portfolio_id, strategy_id, etc.)

**Response**:
```json
[
  {
    "date": "2026-01-15",
    "pnl": 250.50,
    "returns": 2.5,
    "count": 3
  },
  ...
]
```

---

### 3. Strategy Routes (`/api/strategies`)

#### `POST /api/strategies`
**Purpose**: Create a new trading strategy  
**Request Body**:
```json
{
  "name": "Breakout Strategy",
  "description": "Rich text description (Lexical JSON)"
}
```
**Response**: Created strategy object

#### `GET /api/strategies`
**Purpose**: Retrieve all strategies  
**Response**: Array of strategy objects

#### `GET /api/strategies/:id`
**Purpose**: Get a specific strategy  
**Response**: Strategy object with description

#### `PUT /api/strategies/:id`
**Purpose**: Update a strategy  
**Request Body**: Updated fields  
**Response**: Updated strategy object

#### `DELETE /api/strategies/:id`
**Purpose**: Delete a strategy  
**Response**: Confirmation message

---

### 4. Symbol Routes (`/api/symbols`)

#### `POST /api/symbols`
**Purpose**: Create a new trading symbol/instrument  
**Request Body**:
```json
{
  "name": "EURUSD",
  "type": "forex"
}
```
**Response**: Created symbol object

#### `GET /api/symbols`
**Purpose**: Retrieve all symbols  
**Response**: Array of symbols sorted by ID

#### `GET /api/symbols/:id`
**Purpose**: Get a specific symbol  
**Response**: Symbol object

#### `PUT /api/symbols/:id`
**Purpose**: Update a symbol  
**Request Body**: Updated fields  
**Response**: Updated symbol object

#### `DELETE /api/symbols/:id`
**Purpose**: Delete a symbol  
**Response**: Confirmation message

---

### 5. Tag Routes (`/api/tags`)

#### `GET /api/tags`
**Purpose**: Retrieve all tags with optional search  
**Query Parameters**:
- `search`: Text search for tag names (case-insensitive)

**Response**: Array of tag objects sorted alphabetically

**Note**: Tags are auto-created when trades are submitted with new tag names. No explicit POST endpoint needed.

---

## Key Features Summary

### Money Handling
- **Automatic Balance Updates**: Portfolio balances automatically adjust when:
  - Creating a trade (adds P&L to portfolio)
  - Updating a trade (adjusts balance by the difference in P&L)
  - Deleting a trade (reverts P&L from portfolio)
  - Switching trade to different portfolio (removes from old, adds to new)
- **Manual Transactions**: PAYIN/PAYOUT endpoints for deposits and withdrawals
- **Transaction History**: Complete audit trail of all balance changes

### Data Persistence
- All data stored in MongoDB
- File uploads stored on server with path references
- Rich text content stored as Lexical JSON format

### State Management
- URL-based filter state (shareable links)
- Zustand for global state (preferences, filters)
- React Query for server state caching

### Performance Optimizations
- Virtual scrolling for large trade tables
- Pagination for trade lists
- Debounced search and filter inputs
- Optimistic UI updates
