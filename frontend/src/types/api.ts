// API Response Types matching backend models

export interface Trade {
  _id: string;
  portfolio_id: number | null;
  strategy_id: number;
  symbol_id: number;
  quantity: number;
  type: 'buy' | 'sell';
  trade_date: string;
  fees: number | null;
  confidence_level: number | null;
  entry_reason: string;
  photo: string | null;
  notes: string | null;
  exit_reason: string;
  outcome: 'win' | 'loss' | 'neutral';
  entry_price: number;
  exit_price: number;
  take_profit: number;
  stop_loss: number;
  entry_id: number | null;
  pl: number | null;
  tags: string[];
  is_greed: boolean;
  is_fomo: boolean;
  market_condition: string;
  entry_execution: string;
  exit_execution: string;
  emotional_state: string;
  createdAt?: string;
  updatedAt?: string;
  post_trade_thoughts?: string;
  rule_violations?: string[];
}

export interface Strategy {
  _id: string;
  id: number;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Symbol {
  _id: string;
  id: number;
  symbol: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradeResponse {
  trades: Trade[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface PnlCalendarDay {
  date: string;
  pnl: number;
  returns: number;
  count: number;
}

export interface PnlCalendarResponse {
  days: PnlCalendarDay[];
  totalPnl: number;
  totalTrades: number;
}

export interface PerformanceMetric {
    winRate: number;
    avgRr: number;
    expectancy: number;
    totalTrades: number;
}