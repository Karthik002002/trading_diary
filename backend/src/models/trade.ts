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
  stop_loss: number;
  take_profit: number;
  planned_rr: number;
  actual_rr: number;
  entry_id: number | null;
  pl: number | null;
  rr: number | null;
  returns: number | null;
  is_greed: boolean | null;
  is_fomo: boolean | null;
  market_condition: string | null;
  entry_execution: string | null;
  exit_execution: string | null;
  emotional_state: string[] | null;
  post_trade_thoughts: string | null;
  rule_violations: string[] | null;
  tags: string[];
  timeframe_photos: { type: string; photo: string }[];
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
    exit_price: { type: Number, required: false },
    stop_loss: { type: Number, required: false },
    take_profit: { type: Number, required: false },
    entry_id: { type: Number, required: false, default: null },
    pl: { type: Number, required: false },
    rr: { type: Number, required: false },
    planned_rr: { type: Number, required: false },
    actual_rr: { type: Number, required: false },
    is_greed: { type: Boolean, required: false, default: false },
    is_fomo: { type: Boolean, required: false, default: false },
    returns: { type: Number, required: false },
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
    timeframe_photos: {
      type: [
        {
          type: { type: String, required: true },
          photo: { type: String, required: true },
        },
      ],
      default: [],
      validate: {
        validator: function (v: any[]) {
          const types = v.map((item) => item.type);
          return new Set(types).size === types.length;
        },
        message: 'Duplicate timeframe types are not allowed.',
      },
    },
  },
  {
    timestamps: true,
  }
);

TradeSchema.pre('save', function () {
  const trade = this as unknown as ITrade;

  const {
    entry_price,
    exit_price,
    quantity,
    type,
    fees = 0,
    stop_loss,
    take_profit,
  } = trade;

  // Only calculate when trade is closed
  if (
    entry_price == null ||
    exit_price == null ||
    quantity == null ||
    !type
  ) {
    return
  }

  // ------------------------
  // Realized P/L
  // ------------------------
  let grossProfit = 0;

  if (type === 'buy') {
    grossProfit = (exit_price - entry_price) * quantity;
  } else if (type === 'sell') {
    grossProfit = (entry_price - exit_price) * quantity;
  }

  trade.pl = grossProfit - (fees ?? 0);

  // ------------------------
  // Planned RR
  // ------------------------
  if (stop_loss != null && take_profit != null) {
    const plannedRisk = Math.abs(entry_price - stop_loss);
    const plannedReward = Math.abs(take_profit - entry_price);

    trade.planned_rr =
      plannedRisk > 0 ? plannedReward / plannedRisk : 0;
  } else {
    trade.planned_rr = 0;
  }

  // ------------------------
  // Actual RR
  // ------------------------
  if (stop_loss != null) {
    const actualRisk = Math.abs(entry_price - stop_loss);
    const actualReward = Math.abs(exit_price - entry_price);

    trade.actual_rr =
      actualRisk > 0 ? actualReward / actualRisk : 0;
  } else {
    trade.actual_rr = 0;
  }


  // ------------------------
  // Returns % - must account for trade type
  // ------------------------
  let returnPercent = 0;
  if (type === 'buy') {
    returnPercent = ((exit_price - entry_price) / entry_price) * 100;
  } else if (type === 'sell') {
    returnPercent = ((entry_price - exit_price) / entry_price) * 100;
  }
  trade.returns = Number(returnPercent.toFixed(2));


});

export default mongoose.model<ITrade>('Trade', TradeSchema);
