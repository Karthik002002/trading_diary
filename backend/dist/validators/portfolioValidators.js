"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePortfolioValidator = exports.createPortfolioValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createPortfolioValidator = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
];
exports.updatePortfolioValidator = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
];
