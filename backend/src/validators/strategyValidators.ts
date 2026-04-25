import { body } from "express-validator";

export const createStrategyValidator = [
	body("name").notEmpty().withMessage("Name is required"),
	body("market_type")
		.optional()
		.isIn(["equity", "forex"])
		.withMessage("Market type must be either equity or forex"),
	body("description")
		.optional({ nullable: true })
		.isString()
		.withMessage("Description must be a string"),
	body("dailyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Daily loss limit must be a number"),
	body("monthlyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Monthly loss limit must be a number"),
	body("weeklyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Weekly loss limit must be a number"),
	body("consecutiveLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Consecutive loss limit must be a number"),
];

export const updateStrategyValidator = [
	body("name").optional().notEmpty().withMessage("Name cannot be empty"),
	body("market_type")
		.optional()
		.isIn(["equity", "forex"])
		.withMessage("Market type must be either equity or forex"),
	body("description")
		.optional({ nullable: true })
		.isString()
		.withMessage("Description must be a string"),
	body("dailyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Daily loss limit must be a number"),
	body("monthlyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Monthly loss limit must be a number"),
	body("weeklyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Weekly loss limit must be a number"),
	body("consecutiveLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Consecutive loss limit must be a number"),
];
