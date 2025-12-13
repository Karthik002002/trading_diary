"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSymbolValidator = exports.createSymbolValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createSymbolValidator = [
    (0, express_validator_1.body)('symbol').isString().trim().notEmpty().withMessage('Symbol is required'),
    (0, express_validator_1.body)('name').isString().trim().notEmpty().withMessage('Name is required'),
];
exports.updateSymbolValidator = [
    (0, express_validator_1.body)('symbol').optional().isString().trim().notEmpty().withMessage('Symbol must be a valid string'),
    (0, express_validator_1.body)('name').optional().isString().trim().notEmpty().withMessage('Name must be a valid string'),
];
