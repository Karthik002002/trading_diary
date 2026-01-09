// schemas/trade.schema.ts
import { z } from "zod";

export const tradeSchema = z.object({
	strategy_id: z.number(),
	portfolio_id: z.number().nullable().optional(),
	symbol_id: z.number(),
	quantity: z.coerce.number().positive("Quantity must be > 0"),
	type: z.enum(["buy", "sell"]),
	trade_date: z.string(),
	confidence_level: z.coerce
		.number()
		.min(1, "Confidence level must be between 1 and 10")
		.max(10, "Confidence level must be between 1 and 10")
		.optional(),
	entry_price: z.coerce.number().positive(),
	exit_price: z.coerce.number().positive(),
	stop_loss: z.coerce.number().optional(),
	take_profit: z.coerce.number().optional(),
	entry_reason: z.string().optional(),
	exit_reason: z.string().optional(),
	outcome: z.enum(["win", "loss", "neutral", "missed"]),
	tags: z.array(z.string()).optional(),
	photo: z.any().optional(),
	before_photo: z.any().optional(),
	market_condition: z
		.enum(["trending", "ranging", "volatile", "choppy"])
		.optional(),
	entry_execution: z.enum(["perfect", "early", "late"]).optional(),
	exit_execution: z.enum(["perfect", "early", "late"]).optional(),
	emotional_state: z
		.enum(["calm", "anxious", "overconfident", "fearful", "tilted"])
		.optional(),
	is_greed: z.boolean().optional(),
	is_fomo: z.boolean().optional(),
	post_trade_thoughts: z.string().optional(),
	rr: z.coerce.number().optional(),
	rule_violations: z
		.array(
			z.enum([
				"Early Exit",
				"Late Exit",
				"Overconfidence",
				"Fear",
				"Tilt",
				"Early Entry",
				"Late Entry",
				"Revenge Trade",
			]),
		)
		.optional(),
	timeframe_photos: z
		.array(
			z.object({
				type: z.string(),
				photo: z.any().optional(),
			}),
		)
		.optional(),
	status: z.enum(["IN", "NIN"]).optional().default("NIN"),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;
