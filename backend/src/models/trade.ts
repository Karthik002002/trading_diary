import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  portfolio_id: number | null;
  strategy_id: number;
  symbol_id: number;
  quantity: number;
  type: 'buy' | 'sell';
  trade_date: Date;
  fees: number | null;
  confidence_level: number | null;
  entry_reason: string;
  photo: string | null;
  notes: string | null;
  exit_reason: string;
  outcome: 'win' | 'loss' | 'neutral';
  entry_price: number;
  exit_price: number;
  entry_id: number | null;
  pl: number | null;
  tags: string[];
}

const TradeSchema: Schema = new Schema(
  {
    portfolio_id: { type: Number, required: false, default: null },
    strategy_id: { type: Number, required: true },
    symbol_id: { type: Number, required: true },
    quantity: { type: Number, required: true },
    type: { type: String, enum: ['buy', 'sell'], required: true },
    trade_date: { type: Date, required: true, default: Date.now },
    fees: { type: Number, required: false, default: 0 },
    confidence_level: { type: Number, min: 1, max: 10, required: false, default: null },
    entry_reason: { type: String, required: true },
    photo: { type: String, required: false, default: null },
    notes: { type: String, required: false, default: null },
    exit_reason: { type: String, required: true },
    outcome: { type: String, enum: ['win', 'loss', 'neutral'], required: true },
    entry_price: { type: Number, required: true },
    stop_loss: { type: Number, required: false },
    take_profit: { type: Number, required: false },
    entry_id: { type: Number, required: false, default: null },
    pl: { type: Number, required: false },
    rr: { type: Number, required: false },
    is_greed: { type: Boolean, required: false, default: false },
    is_fomo: { type: Boolean, required: false, default: false },
    tags: { type: [String], required: false, default: [] },
    market_condition: {
      type: String,
      enum: ['trending', 'ranging', 'volatile', 'choppy'],
      required: false,
    },
    entry_execution: {
      type: String,
      enum: ['perfect', 'early', 'late'],
      required: false,
    },
    exit_execution: {
      type: String,
      enum: ['perfect', 'early', 'late'],
      required: false,
    },
    emotional_state: {
      type: [String],
      enum: ['calm', 'anxious', 'overconfident', 'fearful', 'tilted'],
      default: [],
    },
    post_trade_thoughts: { type: String, required: false, default: null },
    rule_violations: { type: [String], required: false, default: [], enum: ["Early Exit", "Late Exit", "Overconfidence", "Fear", "Tilt", "Early Entry", "Late Entry", "Revenge Trade"] },
  },
  {
    timestamps: true,
  }
);

TradeSchema.pre('save', async function () {
  const trade = this as unknown as ITrade;
  const { entry_price, exit_price, quantity, type, fees } = trade;
  const feesVal = fees || 0;

  if (entry_price != null && exit_price != null && quantity != null) {
    let profit = 0;

    if (type === 'buy') {
      profit = (exit_price - entry_price) * quantity;
    } else if (type === 'sell') {
      profit = (entry_price - exit_price) * quantity;
    }

    trade.pl = profit - feesVal;
  }
});

export default mongoose.model<ITrade>('Trade', TradeSchema);
