import { body } from 'express-validator';

export const createStrategyValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string'),
];

export const updateStrategyValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string'),
];
