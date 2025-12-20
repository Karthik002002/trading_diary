import express, { Request, Response } from 'express';
import Trade from '../models/trade';

import { validateRequest } from '../middleware/validateRequest';
import {
  createTradeValidator,
  updateTradeValidator,
} from '../validators/tradeValidators';

const router = express.Router();

import { upload } from '../middleware/uploadMiddleware';

// Get P&L for calendar
router.get('/pnl/calendar', async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const trades = await Trade.aggregate([
      {
        $match: {
          trade_date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$trade_date' } },
          totalPnl: { $sum: '$pl' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by date ascending
      }
    ]);

    // Format for frontend: { date: 'YYYY-MM-DD', pnl: 123, count: 5 }
    const result = trades.map(t => ({
      date: t._id,
      pnl: t.totalPnl,
      count: t.count
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Create new trade
router.post(
  '/',
  upload.single('photo'),
  createTradeValidator,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      if (req.file) {
        req.body.photo = req.file.path;
      }
      const { entry_price, stop_loss, take_profit } = req.body;

      // Validate required fields
      if (!stop_loss || !take_profit) {
        req.body.rr = null;
      } else {
        const riskPerUnit = Math.abs(entry_price - stop_loss);

        if (riskPerUnit === 0) {
          throw new Error("Stop loss cannot be equal to entry price");
        }

        const rr = (take_profit - entry_price) / riskPerUnit;


        req.body.rr = Number(rr.toFixed(2));
      }

      const trade = new Trade(req.body);
      const savedTrade = await trade.save();
      res.status(201).json(savedTrade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get all trades
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { strategy_id, outcome, search } = req.query;

    const query: any = {};

    if (strategy_id) {
      query.strategy_id = strategy_id;
    }

    if (outcome) {
      query.outcome = outcome;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { entry_reason: searchRegex },
        { exit_reason: searchRegex },
        { notes: searchRegex },
        // If we want to search by symbol name, we'd need to lookup symbol_id, but that is harder without aggregation or population.
        // For now searching text fields.
      ];
    }

    console.log(`Fetching trades page ${page} with limit ${limit}`, query);


    const [trades, total] = await Promise.all([
      Trade.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Trade.countDocuments(query),
    ]);

    trades.forEach((trade) => {
      console.log(trade.tags)
    });
    res.json({
      trades,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get single trade
router.get('/:id', async (req: Request, res: Response) => {
  // ... existing get id code ...
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Update trade
router.put(
  '/:id',
  upload.single('photo'),
  updateTradeValidator,
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const trade = await Trade.findById(req.params.id);
      if (!trade) return res.status(404).json({ message: 'Trade not found' });

      if (req.file) {
        req.body.photo = req.file.path;
      }

      Object.assign(trade, req.body);
      const updatedTrade = await trade.save(); // save() triggers the pre-save hook for PL calc
      res.json(updatedTrade);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete trade
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const trade = await Trade.findByIdAndDelete(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ message: 'Trade deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
