import express, { type Request, type Response } from "express";
import { validateRequest } from "../middleware/validateRequest";
import Symbol from "../models/symbol";
import {
	createSymbolValidator,
	updateSymbolValidator,
} from "../validators/symbolValidators";

const router = express.Router();

const buildMarketTypeFilter = (marketType?: string) => {
	if (marketType === "forex") {
		return { market_type: "forex" };
	}
	if (marketType === "equity") {
		return {
			$or: [{ market_type: "equity" }, { market_type: { $exists: false } }],
		};
	}
	return {};
};

// Get all symbols
router.get("/", async (req: Request, res: Response) => {
	try {
		const marketType = req.query.market_type as string | undefined;
		const symbols = await Symbol.find(buildMarketTypeFilter(marketType)).sort({
			id: 1,
		});
		res.json(symbols);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get symbol by ID
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const symbol = await Symbol.findOne({ id: parseInt(req.params.id) });
		if (!symbol) return res.status(404).json({ message: "Symbol not found" });
		res.json(symbol);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Create symbol
router.post(
	"/",
	createSymbolValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const symbol = new Symbol(req.body);
			const savedSymbol = await symbol.save();
			res.status(201).json(savedSymbol);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Update symbol
router.put(
	"/:id",
	updateSymbolValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const symbol = await Symbol.findOne({ id: parseInt(req.params.id) });
			if (!symbol) return res.status(404).json({ message: "Symbol not found" });

			Object.assign(symbol, req.body);
			const updatedSymbol = await symbol.save();
			res.json(updatedSymbol);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Delete symbol
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const symbol = await Symbol.findOneAndDelete({
			id: parseInt(req.params.id),
		});
		if (!symbol) return res.status(404).json({ message: "Symbol not found" });
		res.json({ message: "Symbol deleted successfully" });
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

export default router;
