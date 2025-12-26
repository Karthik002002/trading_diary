import express, { Request, Response } from "express";
import Trade from "../models/trade";
import Tag from "../models/tag";

import { validateRequest } from "../middleware/validateRequest";
import {
	createTradeValidator,
	updateTradeValidator,
} from "../validators/tradeValidators";

const router = express.Router();

import { upload } from "../middleware/uploadMiddleware";
import mongoose from "mongoose";

const buildTradeQuery = (query: any) => {
	const { strategy_id, outcome, search, symbol, portfolio_id, status, tags } =
		query;
	const mongoQuery: any = {};

	if (strategy_id) {
		mongoQuery.strategy_id = Number(strategy_id);
	}
	if (symbol) {
		mongoQuery.symbol_id = Number(symbol);
	}
	if (portfolio_id) {
		mongoQuery.portfolio_id = Number(portfolio_id);
	}
	if (outcome) {
		mongoQuery.outcome = outcome;
	}
	if (status) {
		mongoQuery.status = status;
	}
	if (tags) {
		// If tags are provided as comma separated string or array
		const tagIds = Array.isArray(tags) ? tags : String(tags).split(",");
		// If user sends IDs (which they should for filtering), use them directly
		if (tagIds.length > 0) {
			mongoQuery.tags = { $in: tagIds };
		}
	}
	if (search) {
		const searchRegex = { $regex: search, $options: "i" };
		mongoQuery.$or = [
			{ entry_reason: searchRegex },
			{ exit_reason: searchRegex },
			{ notes: searchRegex },
		];
	}
	return mongoQuery;
};

// Get performance statistics
router.get("/stats/performance-metric", async (req: Request, res: Response) => {
	try {
		const query = buildTradeQuery(req.query);
		if (query._id && !mongoose.Types.ObjectId.isValid(query._id)) {
			delete query._id;
		}
		const stats = await Trade.aggregate([
			{ $match: query },
			{
				$group: {
					_id: null,
					totalTrades: { $sum: 1 },
					wins: { $sum: { $cond: [{ $eq: ["$outcome", "win"] }, 1, 0] } },
					losses: { $sum: { $cond: [{ $eq: ["$outcome", "loss"] }, 1, 0] } },
					totalPl: { $sum: "$pl" },
					totalRr: { $sum: "$actual_rr" },
					avgWin: {
						$avg: { $cond: [{ $eq: ["$outcome", "win"] }, "$pl", null] },
					},
					avgLoss: {
						$avg: { $cond: [{ $eq: ["$outcome", "loss"] }, "$pl", null] },
					},
					avgConfidence: { $avg: "$confidence_level" },
					stdDevPl: { $stdDevPop: "$pl" },
					maxPl: { $max: "$pl" },
					minPl: { $min: "$pl" },
				},
			},
		]);

		if (stats.length === 0) {
			return res.json({
				winRate: 0,
				avgRr: 0,
				expectancy: 0,
				totalTrades: 0,
				avgConfidence: 0,
				consistencyScore: 0,
				bestTrade: 0,
				worstTrade: 0,
				maxDrawdown: 0,
			});
		}

		const {
			totalTrades,
			wins,
			losses,
			totalRr,
			avgWin,
			avgLoss,
			avgConfidence,
			stdDevPl,
			maxPl,
			minPl,
		} = stats[0];

		// Calculate Max Drawdown %
		// We use common equity compounding (starting at 100)
		const tradesForDrawdown = await Trade.find(query)
			.sort({ trade_date: 1 })
			.select("returns");

		let currentEquity = 100;
		let peakEquity = 100;
		let maxDrawdownPercent = 0;

		tradesForDrawdown.forEach((trade) => {
			const tradeReturn = trade.returns || 0;
			currentEquity *= 1 + tradeReturn / 100;

			if (currentEquity > peakEquity) {
				peakEquity = currentEquity;
			}

			const drawdown = ((peakEquity - currentEquity) / peakEquity) * 100;
			if (drawdown > maxDrawdownPercent) {
				maxDrawdownPercent = drawdown;
			}
		});

		// If we want drawdown in %, we'd need an initial balance.
		// Without it, we'll return the absolute value or relative to peak.
		// For now, let's return absolute max drawdown.

		const winRate = totalTrades > 0 ? (wins / (wins + losses || 1)) * 100 : 0;
		const avgRr = totalTrades > 0 ? totalRr / totalTrades : 0;

		const winProb = wins / (wins + losses || 1);
		const lossProb = losses / (wins + losses || 1);
		const expectancy = winProb * (avgWin || 0) + lossProb * (avgLoss || 0);

		res.json({
			winRate: Number(winRate.toFixed(2)),
			avgRr: Number(avgRr.toFixed(2)),
			expectancy: Number(expectancy.toFixed(2)),
			totalTrades,
			avgConfidence: Number((avgConfidence || 0).toFixed(2)),
			consistencyScore: Number((stdDevPl || 0).toFixed(2)),
			bestTrade: Number((maxPl || 0).toFixed(2)),
			worstTrade: Number((minPl || 0).toFixed(2)),
			maxDrawdown: Number(maxDrawdownPercent.toFixed(2)),
		});
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get execution statistics
router.get("/stats/execution-metric", async (req: Request, res: Response) => {
	try {
		const query = buildTradeQuery(req.query);

		const stats = await Trade.aggregate([
			{ $match: query },
			{
				$facet: {
					executionStats: [
						{
							$group: {
								_id: null,
								perfectEntries: {
									$sum: {
										$cond: [{ $eq: ["$entry_execution", "perfect"] }, 1, 0],
									},
								},
								perfectExits: {
									$sum: {
										$cond: [{ $eq: ["$exit_execution", "perfect"] }, 1, 0],
									},
								},
								totalTrades: { $sum: 1 },
							},
						},
					],
					mistakeStats: [
						{
							$group: {
								_id: null,
								greedCount: { $sum: { $cond: ["$is_greed", 1, 0] } },
								fomoCount: { $sum: { $cond: ["$is_fomo", 1, 0] } },
							},
						},
					],
					ruleViolations: [
						{ $unwind: "$rule_violations" },
						{
							$group: {
								_id: "$rule_violations",
								count: { $sum: 1 },
							},
						},
					],
				},
			},
		]);

		const execution = stats[0].executionStats[0] || {
			perfectEntries: 0,
			perfectExits: 0,
			totalTrades: 0,
		};
		const mistakes = stats[0].mistakeStats[0] || {
			greedCount: 0,
			fomoCount: 0,
		};
		const ruleViolations = stats[0].ruleViolations.reduce(
			(acc: any, curr: any) => {
				acc[curr._id] = curr.count;
				return acc;
			},
			{},
		);

		res.json({
			efficiency: {
				entryEfficiency:
					execution.totalTrades > 0
						? Number(
								(
									(execution.perfectEntries / execution.totalTrades) *
									100
								).toFixed(2),
							)
						: 0,
				exitEfficiency:
					execution.totalTrades > 0
						? Number(
								(
									(execution.perfectExits / execution.totalTrades) *
									100
								).toFixed(2),
							)
						: 0,
			},
			mistakes: {
				greed: mistakes.greedCount,
				fomo: mistakes.fomoCount,
				ruleViolations,
			},
		});
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get P&L for calendar
router.get("/pnl/calendar", async (req: Request, res: Response) => {
	try {
		const { month, year } = req.query;

		if (!month || !year) {
			return res.status(400).json({ message: "Month and year are required" });
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
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$trade_date" } },
					totalReturn: { $sum: "$returns" },
					totalPnl: { $sum: "$pl" },
					count: { $sum: 1 },
				},
			},
			{
				$sort: { _id: 1 }, // Sort by date ascending
			},
		]);

		// Format for frontend: { date: 'YYYY-MM-DD', pnl: 123, count: 5 }
		const result = trades.map((t) => ({
			date: t._id,
			pnl: t.totalPnl,
			returns: t.totalReturn,
			count: t.count,
		}));

		res.json(result);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Create new trade
router.post(
	"/",
	upload.any(),
	createTradeValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			if (req.files && Array.isArray(req.files)) {
				const files = req.files as Express.Multer.File[];

				const mainPhoto = files.find((f) => f.fieldname === "photo");
				if (mainPhoto) {
					req.body.photo = mainPhoto.path;
				}

				if (
					req.body.rule_violations &&
					typeof req.body.rule_violations === "string"
				) {
					req.body.rule_violations = JSON.parse(req.body.rule_violations);
				}

				if (
					req.body.timeframe_photos &&
					typeof req.body.timeframe_photos === "string"
				) {
					req.body.timeframe_photos = JSON.parse(req.body.timeframe_photos);
				}

				if (req.body.tags && typeof req.body.tags === "string") {
					try {
						const parsedTags = JSON.parse(req.body.tags);
						if (Array.isArray(parsedTags)) {
							const tagIds = await Promise.all(
								parsedTags.map(async (tagName: string) => {
									let tag = await Tag.findOne({ name: tagName });
									if (!tag) {
										tag = await Tag.create({ name: tagName });
									}
									return tag._id;
								}),
							);
							req.body.tags = tagIds;
						}
					} catch (e) {
						console.error("Error parsing tags", e);
						req.body.tags = [];
					}
				}

				if (Array.isArray(req.body.timeframe_photos)) {
					req.body.timeframe_photos.forEach((tp: any) => {
						const tfFile = files.find((f) => f.fieldname === tp.type);
						if (tfFile) {
							tp.photo = tfFile.path;
						}
					});
				}
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
	},
);

// Get all trades
router.get("/", async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const skip = (page - 1) * limit;

		const query = buildTradeQuery(req.query);

		console.log(`Fetching trades page ${page} with limit ${limit}`, query);

		const [trades, total] = await Promise.all([
			Trade.find(query)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate("tags"),
			Trade.countDocuments(query),
		]);

		trades.forEach((trade) => {
			return {
				...trade,
				timeframe_photos: trade.timeframe_photos.map((pht) => ({
					...pht,
					photo: `${process.env.BASE_URL}${pht.photo}`,
				})),
			};
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
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const trade = await Trade.findById(req.params.id);
		if (!trade) return res.status(404).json({ message: "Trade not found" });
		await trade.populate("tags");
		res.json(trade);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Update trade
router.put(
	"/:id",
	upload.any(),
	updateTradeValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const trade = await Trade.findById(req.params.id);
			if (!trade) return res.status(404).json({ message: "Trade not found" });

			if (req.files && Array.isArray(req.files)) {
				const files = req.files as Express.Multer.File[];

				const mainPhoto = files.find((f) => f.fieldname === "photo");
				if (mainPhoto) {
					req.body.photo = mainPhoto.path;
				}

				if (
					req.body.rule_violations &&
					typeof req.body.rule_violations === "string"
				) {
					req.body.rule_violations = JSON.parse(req.body.rule_violations);
				}

				if (
					req.body.timeframe_photos &&
					typeof req.body.timeframe_photos === "string"
				) {
					req.body.timeframe_photos = JSON.parse(req.body.timeframe_photos);
				}

				if (req.body.tags && typeof req.body.tags === "string") {
					try {
						const parsedTags = JSON.parse(req.body.tags);
						if (Array.isArray(parsedTags)) {
							const tagIds = await Promise.all(
								parsedTags.map(async (tagName: string) => {
									let tag = await Tag.findOne({ name: tagName });
									if (!tag) {
										tag = await Tag.create({ name: tagName });
									}
									return tag._id;
								}),
							);
							req.body.tags = tagIds;
						}
					} catch (e) {
						console.error("Error parsing tags", e);
						req.body.tags = [];
					}
				}

				if (Array.isArray(req.body.timeframe_photos)) {
					req.body.timeframe_photos.forEach((tp: any) => {
						const tfFile = files.find((f) => f.fieldname === tp.type);
						if (tfFile) {
							tp.photo = tfFile.path;
						}
					});
				}
			}

			Object.assign(trade, req.body);
			const updatedTrade = await trade.save(); // save() triggers the pre-save hook for PL calc
			res.json(updatedTrade);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Delete trade
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const trade = await Trade.findByIdAndDelete(req.params.id);
		if (!trade) return res.status(404).json({ message: "Trade not found" });
		res.json({ message: "Trade deleted" });
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

export default router;
