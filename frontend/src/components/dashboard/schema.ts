// schemas/trade.schema.ts
import { z } from "zod";

export const tradeSchema = z.object({
  strategy_id: z.string(),
  symbol_id: z.string().min(1, "Symbol is required"),
  quantity: z.coerce.number().positive("Quantity must be > 0"),
  type: z.enum(["buy", "sell"]),
  trade_date: z.string(),
  confidence_level: z.coerce.number().min(1, "Confidence level must be between 1 and 10").max(10, "Confidence level must be between 1 and 10").optional(),
  entry_price: z.coerce.number().positive(),
  stop_loss: z.coerce.number().optional(),
  take_profit: z.coerce.number().optional(),
  entry_reason: z.string().optional(),
  exit_reason: z.string().optional(),
  outcome: z.enum(["win", "loss", "neutral"]),
  tags: z.array(z.string()).optional(),
  photo: z.any().optional(),
  market_condition: z.enum(["trending", "ranging", "volatile", "choppy"]).optional(),
  entry_execution: z.enum(["perfect", "early", "late"]).optional(),
  exit_execution: z.enum(["perfect", "early", "late"]).optional(),
  emotional_state: z.enum(["calm", "anxious", "overconfident", "fearful", "tilted"]).optional(),
  is_greed: z.boolean().optional(),
  is_fomo: z.boolean().optional(),
  post_trade_thoughts: z.string().optional(),
  rr: z.coerce.number().optional(),
  rule_violations: z.array(z.enum(["Early Exit", "Late Exit", "Overconfidence", "Fear", "Tilt", "Early Entry", "Late Entry", "Revenge Trade"])).optional(),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;
