import axios from "axios";
import express, { type Request, type Response } from "express";
import { NseIndia } from "stock-nse-india";
import WatchlistItem from "../models/watchlistItem";

const router = express.Router();
const nseIndia = new NseIndia();

let cachedSymbols: string[] = [];

router.get("/symbols", async (_req: Request, res: Response) => {
	try {
		if (cachedSymbols.length === 0) {
			cachedSymbols = await nseIndia.getAllStockSymbols();
		}
		res.json(cachedSymbols);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/", async (req: Request, res: Response) => {
	try {
		const item = new WatchlistItem(req.body);
		await item.save();
		res.status(201).json(item);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
});

router.get("/", async (_req: Request, res: Response) => {
	try {
		const items = await WatchlistItem.find().sort({ added_at: -1 });
		res.json(items);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.put("/:id", async (req: Request, res: Response) => {
	try {
		const item = await WatchlistItem.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true, runValidators: true },
		);
		if (!item) {
			return res.status(404).json({ error: "Item not found" });
		}
		res.json(item);
	} catch (error) {
		res.status(400).json({ error: (error as Error).message });
	}
});

router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const item = await WatchlistItem.findByIdAndDelete(req.params.id);
		if (!item) {
			return res.status(404).json({ error: "Item not found" });
		}
		res.json({ message: "Item deleted" });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/price", async (req: Request, res: Response) => {
	const { symbol, exchange } = req.query;

	if (!symbol || !exchange) {
		return res.status(400).json({ error: "symbol and exchange are required" });
	}

	try {
		if (exchange.toString().toUpperCase() === "NSE") {
			const data = await nseIndia.getEquityIntradayData(
				symbol.toString().toUpperCase(),
			);
			return res.json({
				symbol: symbol.toString().toUpperCase(),
				exchange: exchange.toString().toUpperCase(),
				price: data.closePrice || null,
				timestamp: new Date().toISOString(),
			});
		}

		return res.json({
			symbol: symbol.toString().toUpperCase(),
			exchange: exchange.toString().toUpperCase(),
			price: null,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Price fetch error:", error);
		res.json({ error: "Price unavailable", symbol, exchange });
	}
});

export default router;
