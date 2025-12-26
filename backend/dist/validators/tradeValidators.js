"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTradeValidator = exports.createTradeValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createTradeValidator = [
	(0, express_validator_1.body)("strategy_id")
		.isNumeric()
		.withMessage("Strategy ID must be a number"),
	(0, express_validator_1.body)("symbol_id")
		.isNumeric()
		.withMessage("Symbol ID must be a number"),
	(0, express_validator_1.body)("quantity")
		.isNumeric()
		.withMessage("Quantity must be a number"),
	(0, express_validator_1.body)("type")
		.isIn(["buy", "sell"])
		.withMessage("Type must be either buy or sell"),
	(0, express_validator_1.body)("trade_date")
		.isISO8601()
		.toDate()
		.withMessage("Invalid trade date"),
	(0, express_validator_1.body)("entry_price")
		.isNumeric()
		.withMessage("Entry price must be a number"),
	(0, express_validator_1.body)("exit_price")
		.isNumeric()
		.withMessage("Exit price must be a number"),
	(0, express_validator_1.body)("outcome")
		.isIn(["win", "loss", "neutral"])
		.withMessage("Outcome must be win, loss, or neutral"),
	(0, express_validator_1.body)("confidence_level")
		.optional({ nullable: true })
		.isInt({ min: 1, max: 10 })
		.withMessage("Confidence level must be between 1 and 10"),
	(0, express_validator_1.body)("fees")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Fees must be a number"),
	(0, express_validator_1.body)("entry_reason")
		.notEmpty()
		.withMessage("Entry reason is required"),
	(0, express_validator_1.body)("exit_reason")
		.notEmpty()
		.withMessage("Exit reason is required"),
	(0, express_validator_1.body)("photo")
		.optional()
		.isString()
		.withMessage("Photo must be a string URL or path"),
];
exports.updateTradeValidator = [
	(0, express_validator_1.body)("strategy_id")
		.optional()
		.isNumeric()
		.withMessage("Strategy ID must be a number"),
	(0, express_validator_1.body)("symbol_id")
		.optional()
		.isNumeric()
		.withMessage("Symbol ID must be a number"),
	(0, express_validator_1.body)("quantity")
		.optional()
		.isNumeric()
		.withMessage("Quantity must be a number"),
	(0, express_validator_1.body)("type")
		.optional()
		.isIn(["buy", "sell"])
		.withMessage("Type must be either buy or sell"),
	(0, express_validator_1.body)("trade_date")
		.optional()
		.isISO8601()
		.toDate()
		.withMessage("Invalid trade date"),
	(0, express_validator_1.body)("entry_price")
		.optional()
		.isNumeric()
		.withMessage("Entry price must be a number"),
	(0, express_validator_1.body)("exit_price")
		.optional()
		.isNumeric()
		.withMessage("Exit price must be a number"),
	(0, express_validator_1.body)("outcome")
		.optional()
		.isIn(["win", "loss", "neutral"])
		.withMessage("Outcome must be win, loss, or neutral"),
	(0, express_validator_1.body)("confidence_level")
		.optional({ nullable: true })
		.isInt({ min: 1, max: 10 })
		.withMessage("Confidence level must be between 1 and 10"),
	(0, express_validator_1.body)("fees")
		.optional({ nullable: true })
		.isNumeric()
		.withMessage("Fees must be a number"),
	(0, express_validator_1.body)("photo")
		.optional()
		.isString()
		.withMessage("Photo must be a string URL or path"),
];
