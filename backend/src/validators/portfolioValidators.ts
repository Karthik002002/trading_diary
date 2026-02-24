import { body } from "express-validator";

export const createPortfolioValidator = [
	body("name").notEmpty().withMessage("Name is required"),
	body("market_type")
		.optional()
		.isIn(["equity", "forex"])
		.withMessage("Market type must be either equity or forex"),
];

export const updatePortfolioValidator = [
	body("name").optional().notEmpty().withMessage("Name cannot be empty"),
	body("market_type")
		.optional()
		.isIn(["equity", "forex"])
		.withMessage("Market type must be either equity or forex"),
];
