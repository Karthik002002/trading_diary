import express, { Request, Response } from "express";
import Strategy from "../models/strategy";
import { validateRequest } from "../middleware/validateRequest";
import {
	createStrategyValidator,
	updateStrategyValidator,
} from "../validators/strategyValidators";

const router = express.Router();

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
