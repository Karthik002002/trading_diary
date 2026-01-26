import { body } from "express-validator";

export const createStrategyValidator = [
	body("name").notEmpty().withMessage("Name is required"),
	body("description")
		.optional({ nullable: true })
		.isString()
		.withMessage("Description must be a string"),
	body("monthlyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Monthly loss limit must be a number"),
	body("weeklyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Weekly loss limit must be a number"),
];

export const updateStrategyValidator = [
	body("name").optional().notEmpty().withMessage("Name cannot be empty"),
	body("description")
		.optional({ nullable: true })
		.isString()
		.withMessage("Description must be a string"),
	body("monthlyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Monthly loss limit must be a number"),
	body("weeklyLossLimit")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Weekly loss limit must be a number"),
];
