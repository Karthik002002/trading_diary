"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStrategyValidator = exports.createStrategyValidator = void 0;
const express_validator_1 = require("express-validator");
exports.createStrategyValidator = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Description must be a string'),
];
exports.updateStrategyValidator = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('description')
        .optional({ nullable: true })
        .isString()
        .withMessage('Description must be a string'),
];
