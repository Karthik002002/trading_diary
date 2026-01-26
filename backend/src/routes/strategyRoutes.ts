import express, { type Request, type Response } from "express";
import dayjs from "dayjs";
import { validateRequest } from "../middleware/validateRequest";
import Strategy from "../models/strategy";
import Trade from "../models/trade";
import {
	createStrategyValidator,
	updateStrategyValidator,
} from "../validators/strategyValidators";

const router = express.Router();

// Get strategy limits and current losses
router.get("/status/limits", async (req: Request, res: Response) => {
	try {
		const strategies = await Strategy.find();
		const now = dayjs();
		const startOfWeek = now.startOf("week").toDate();
		const startOfMonth = now.startOf("month").toDate();

		const status = await Promise.all(
			strategies.map(async (strategy) => {
				const weeklyTrades = await Trade.find({
					strategy_id: strategy.id,
					trade_date: { $gte: startOfWeek },
				});
				const monthlyTrades = await Trade.find({
					strategy_id: strategy.id,
					trade_date: { $gte: startOfMonth },
				});

				const weeklyPL = weeklyTrades.reduce(
					(sum, t) => sum + (t.pl || 0),
					0,
				);
				const monthlyPL = monthlyTrades.reduce(
					(sum, t) => sum + (t.pl || 0),
					0,
				);

				const currentWeeklyLoss =
					weeklyPL < 0 ? Number(Math.abs(weeklyPL).toFixed(2)) : 0;
				const currentMonthlyLoss =
					monthlyPL < 0 ? Number(Math.abs(monthlyPL).toFixed(2)) : 0;

				return {
					strategyId: strategy.id,
					strategyName: strategy.name,
					weeklyLossLimit: strategy.weeklyLossLimit,
					monthlyLossLimit: strategy.monthlyLossLimit,
					currentWeeklyLoss,
					currentMonthlyLoss,
				};
			}),
		);

		res.json(status);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Create new strategy
router.post(
	"/",
	createStrategyValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const strategy = new Strategy(req.body);
			const savedStrategy = await strategy.save();
			res.status(201).json(savedStrategy);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Get all strategies
router.get("/", async (req: Request, res: Response) => {
	try {
		const strategies = await Strategy.find();
		res.json(strategies);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get single strategy
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const strategy = await Strategy.findOne({ id: parseInt(req.params.id) }); // Find by custom 'id'
		if (!strategy)
			return res.status(404).json({ message: "Strategy not found" });
		res.json(strategy);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Update strategy
router.put(
	"/:id",
	updateStrategyValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const strategy = await Strategy.findOne({ id: parseInt(req.params.id) });
			if (!strategy)
				return res.status(404).json({ message: "Strategy not found" });

			Object.assign(strategy, req.body);
			const updatedStrategy = await strategy.save();
			res.json(updatedStrategy);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Delete strategy
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const strategy = await Strategy.findOneAndDelete({
			id: parseInt(req.params.id),
		});
		if (!strategy)
			return res.status(404).json({ message: "Strategy not found" });
		res.json({ message: "Strategy deleted" });
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

export default router;
