import { body } from 'express-validator';

export const createPortfolioValidator = [
  body('name').notEmpty().withMessage('Name is required'),
];

export const updatePortfolioValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
];
