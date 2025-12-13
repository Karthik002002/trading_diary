import { body } from 'express-validator';

export const createTradeValidator = [
  body('strategy_id').isNumeric().withMessage('Strategy ID must be a number'),
  body('symbol_id').isNumeric().withMessage('Symbol ID must be a number'),
  body('quantity').isNumeric().withMessage('Quantity must be a number'),
  body('type')
    .isIn(['buy', 'sell'])
    .withMessage('Type must be either buy or sell'),
  body('trade_date').isISO8601().toDate().withMessage('Invalid trade date'),
  body('entry_price').isNumeric().withMessage('Entry price must be a number'),
  body('exit_price').isNumeric().withMessage('Exit price must be a number'),
  body('outcome')
    .isIn(['win', 'loss', 'neutral'])
    .withMessage('Outcome must be win, loss, or neutral'),
  body('confidence_level')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10 })
    .withMessage('Confidence level must be between 1 and 10'),
  body('fees')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage('Fees must be a number'),
  body('entry_reason').notEmpty().withMessage('Entry reason is required'),
  body('exit_reason').notEmpty().withMessage('Exit reason is required'),
  body('photo').optional().isString().withMessage('Photo must be a string URL or path'),
];

export const updateTradeValidator = [
  body('strategy_id')
    .optional()
    .isNumeric()
    .withMessage('Strategy ID must be a number'),
  body('symbol_id')
    .optional()
    .isNumeric()
    .withMessage('Symbol ID must be a number'),
  body('quantity')
    .optional()
    .isNumeric()
    .withMessage('Quantity must be a number'),
  body('type')
    .optional()
    .isIn(['buy', 'sell'])
    .withMessage('Type must be either buy or sell'),
  body('trade_date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Invalid trade date'),
  body('entry_price')
    .optional()
    .isNumeric()
    .withMessage('Entry price must be a number'),
  body('exit_price')
    .optional()
    .isNumeric()
    .withMessage('Exit price must be a number'),
  body('outcome')
    .optional()
    .isIn(['win', 'loss', 'neutral'])
    .withMessage('Outcome must be win, loss, or neutral'),
  body('confidence_level')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 10 })
    .withMessage('Confidence level must be between 1 and 10'),
  body('fees')
    .optional({ nullable: true })
    .isNumeric()
    .withMessage('Fees must be a number'),
  body('photo').optional().isString().withMessage('Photo must be a string URL or path'),
];
