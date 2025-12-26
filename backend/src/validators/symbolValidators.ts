import { body } from "express-validator";

export const createSymbolValidator = [
	body("symbol").isString().trim().notEmpty().withMessage("Symbol is required"),
	body("name").isString().trim().notEmpty().withMessage("Name is required"),
];

export const updateSymbolValidator = [
	body("symbol")
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage("Symbol must be a valid string"),
	body("name")
		.optional()
		.isString()
		.trim()
		.notEmpty()
		.withMessage("Name must be a valid string"),
];
