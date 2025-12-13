import express, { Request, Response } from 'express';
import Portfolio from '../models/portfolio';
import { validateRequest } from '../middleware/validateRequest';
import {
  createPortfolioValidator,
  updatePortfolioValidator,
} from '../validators/portfolioValidators';

const router = express.Router();

// Create new portfolio
router.post(
  '/',
  createPortfolioValidator,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const portfolio = new Portfolio(req.body);
      const savedPortfolio = await portfolio.save();
      res.status(201).json(savedPortfolio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get all portfolios
router.get('/', async (req: Request, res: Response) => {
  try {
    const portfolios = await Portfolio.find();
    res.json(portfolios);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single portfolio
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const portfolio = await Portfolio.findOne({ id: parseInt(req.params.id) });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    res.json(portfolio);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update portfolio
router.put(
  '/:id',
  updatePortfolioValidator,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const portfolio = await Portfolio.findOne({ id: parseInt(req.params.id) });
      if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });

      Object.assign(portfolio, req.body);
      const updatedPortfolio = await portfolio.save();
      res.json(updatedPortfolio);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete portfolio
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!portfolio) return res.status(404).json({ message: 'Portfolio not found' });
    res.json({ message: 'Portfolio deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
