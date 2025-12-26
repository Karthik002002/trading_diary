import { body } from "express-validator";

export const createTradeValidator = [
	body("strategy_id").isNumeric().withMessage("Strategy ID must be a number"),
	body("symbol_id").isNumeric().withMessage("Symbol ID must be a number"),
	body("quantity").isNumeric().withMessage("Quantity must be a number"),
	body("type")
		.isIn(["buy", "sell"])
		.withMessage("Type must be either buy or sell"),
	body("trade_date").isISO8601().toDate().withMessage("Invalid trade date"),
	body("entry_price").isNumeric().withMessage("Entry price must be a number"),
	body("exit_price").isNumeric().withMessage("Exit price must be a number"),
	body("stop_loss")
		.isNumeric()
		.optional()
		.withMessage("Stop loss must be a number"),
	body("take_profit")
		.isNumeric()
		.optional()
		.withMessage("Take profit must be a number"),
	body("outcome")
		.isIn(["win", "loss", "neutral"])
		.withMessage("Outcome must be win, loss, or neutral"),
	body("confidence_level")
		.optional({ nullable: true })
		.isInt({ min: 1, max: 10 })
		.withMessage("Confidence level must be between 1 and 10"),
	body("market_condition")
		.optional({ nullable: true })
		.isIn(["trending", "ranging", "volatile", "choppy"])
		.withMessage(
			"Market condition must be trending, ranging, volatile, or choppy",
		),
	body("entry_execution")
		.optional({ nullable: true })
		.isIn(["perfect", "early", "late"])
		.withMessage("Entry execution must be perfect, early, or late"),
	body("exit_execution")
		.optional({ nullable: true })
		.isIn(["perfect", "early", "late"])
		.withMessage("Exit execution must be perfect, early, or late"),
	body("emotional_state")
		.optional({ nullable: true })
		.isIn(["calm", "anxious", "overconfident", "fearful", "tilted"])
		.withMessage(
			"Emotional state must be calm, anxious, overconfident, fearful, or tilted",
		),
	body("fees")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Fees must be a number"),
	body("is_greed")
		.optional({ nullable: true })
		.isBoolean()
		.withMessage("Is greed must be a boolean"),
	body("is_fomo")
		.optional({ nullable: true })
		.isBoolean()
		.withMessage("Is fomo must be a boolean"),
	body("entry_reason").notEmpty().withMessage("Entry reason is required"),
	body("exit_reason").notEmpty().withMessage("Exit reason is required"),
	body("photo")
		.optional()
		.isString()
		.withMessage("Photo must be a string URL or path"),
	body("post_trade_thoughts")
		.optional()
		.isString()
		.withMessage("Post trade thoughts must be a string"),
	body("rule_violations").optional(),
	body("timeframe_photos").optional(),
	body("stop_loss")
		.optional()
		.isNumeric()
		.withMessage("Stop loss must be a number"),
	body("take_profit")
		.optional()
		.isNumeric()
		.withMessage("Take profit must be a number"),
	body("status")
		.optional({ nullable: true })
		.isIn(["IN", "NIN"])
		.withMessage("Status must be either IN (ongoing) or NIN (completed)"),
];

export const updateTradeValidator = [
	body("strategy_id")
		.optional()
		.isNumeric()
		.withMessage("Strategy ID must be a number"),
	body("symbol_id")
		.optional()
		.isNumeric()
		.withMessage("Symbol ID must be a number"),
	body("quantity")
		.optional()
		.isNumeric()
		.withMessage("Quantity must be a number"),
	body("type")
		.optional()
		.isIn(["buy", "sell"])
		.withMessage("Type must be either buy or sell"),
	body("trade_date")
		.optional()
		.isISO8601()
		.toDate()
		.withMessage("Invalid trade date"),
	body("entry_price")
		.optional()
		.isNumeric()
		.withMessage("Entry price must be a number"),
	// body('exit_price')
	//   .optional()
	//   .isNumeric()
	//   .withMessage('Exit price must be a number'),
	body("outcome")
		.optional()
		.isIn(["win", "loss", "neutral"])
		.withMessage("Outcome must be win, loss, or neutral"),
	body("market_condition")
		.optional({ nullable: true })
		.isIn(["trending", "ranging", "volatile", "choppy"])
		.withMessage(
			"Market condition must be trending, ranging, volatile, or choppy",
		),
	body("entry_execution")
		.optional({ nullable: true })
		.isIn(["perfect", "early", "late"])
		.withMessage("Entry execution must be perfect, early, or late"),
	body("exit_execution")
		.optional({ nullable: true })
		.isIn(["perfect", "early", "late"])
		.withMessage("Exit execution must be perfect, early, or late"),
	body("emotional_state")
		.optional({ nullable: true })
		.isIn(["calm", "anxious", "overconfident", "fearful", "tilted"])
		.withMessage(
			"Emotional state must be calm, anxious, overconfident, fearful, or tilted",
		),
	body("confidence_level")
		.optional({ nullable: true })
		.isInt({ min: 1, max: 10 })
		.withMessage("Confidence level must be between 1 and 10"),
	body("fees")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Fees must be a number"),
	body("post_trade_thoughts")
		.optional()
		.isString()
		.withMessage("Post trade thoughts must be a string"),
	body("rule_violations")
		.optional()
		.isString()
		.withMessage("Rule violations must be a string"),
	body("stop_loss")
		.optional()
		.isNumeric()
		.withMessage("Stop loss must be a number"),
	body("take_profit")
		.optional()
		.isNumeric()
		.withMessage("Take profit must be a number"),
	body("is_greed")
		.optional()
		.isBoolean()
		.withMessage("Is greed must be a boolean"),
	body("is_fomo")
		.optional()
		.isBoolean()
		.withMessage("Is fomo must be a boolean"),
	body("photo")
		.optional()
		.isString()
		.withMessage("Photo must be a string URL or path"),
	body("timeframe_photos").optional(),
	body("status")
		.optional({ nullable: true })
		.isIn(["IN", "NIN"])
		.withMessage("Status must be either IN (ongoing) or NIN (completed)"),
];
