import express, { type Request, type Response } from "express";
import { validateRequest } from "../middleware/validateRequest";
import Portfolio from "../models/portfolio";
import {
	createPortfolioValidator,
	updatePortfolioValidator,
} from "../validators/portfolioValidators";
import PortfolioTransaction from "../models/portfolioTransaction";

const router = express.Router();

// Create new portfolio
router.post(
	"/",
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
	},
);

// Get all portfolios
router.get("/", async (req: Request, res: Response) => {
	try {
		const portfolios = await Portfolio.find();
		res.json(portfolios);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Get single portfolio
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const portfolio = await Portfolio.findOne({ id: parseInt(req.params.id) });
		if (!portfolio)
			return res.status(404).json({ message: "Portfolio not found" });
		res.json(portfolio);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Update portfolio
router.put(
	"/:id",
	updatePortfolioValidator,
	validateRequest,
	async (req: Request, res: Response) => {
		try {
			const portfolio = await Portfolio.findOne({
				id: parseInt(req.params.id),
			});
			if (!portfolio)
				return res.status(404).json({ message: "Portfolio not found" });

			Object.assign(portfolio, req.body);
			const updatedPortfolio = await portfolio.save();
			res.json(updatedPortfolio);
		} catch (error: any) {
			res.status(400).json({ message: error.message });
		}
	},
);

// Create a PAYIN transaction
router.post("/:id/payin", async (req: Request, res: Response) => {
	try {
		const portfolioIdNum = parseInt(req.params.id);

		const portfolio = await Portfolio.findOne({ id: portfolioIdNum });
		if (!portfolio) {
			return res.status(404).json({ message: "Portfolio not found" });
		}
		const { amount, note } = req.body;
		const { balance } = portfolio.toJSON();

		const transaction = new PortfolioTransaction({
			portfolioId: portfolio._id,
			type: "PAYIN",
			amount,
			note,
			balance,
		});

		await transaction.save();

		portfolio.balance += Number(amount);
		await portfolio.save();

		res.status(201).json({ portfolio, transaction });
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
});

// Create a PAYOUT transaction
router.post("/:id/payout", async (req: Request, res: Response) => {
	try {
		const portfolioIdNum = parseInt(req.params.id);
		const portfolio = await Portfolio.findOne({ id: portfolioIdNum });
		if (!portfolio) {
			return res.status(404).json({ message: "Portfolio not found" });
		}

		const { amount, note, before_open } = req.body;

		const transaction = new PortfolioTransaction({
			portfolioId: portfolio._id,
			type: "PAYOUT",
			amount,
			note,
			before_open,
		});

		await transaction.save();

		portfolio.balance -= Number(amount);
		await portfolio.save();

		res.status(201).json({ portfolio, transaction });
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
});

// Get transactions for a portfolio
router.get("/:id/transactions", async (req: Request, res: Response) => {
	try {
		const portfolioIdNum = parseInt(req.params.id);
		const portfolio = await Portfolio.findOne({ id: portfolioIdNum });
		if (!portfolio) {
			return res.status(404).json({ message: "Portfolio not found" });
		}

		const transactions = await PortfolioTransaction.find({
			portfolioId: portfolio._id,
		}).sort({ createdAt: -1 });

		res.json(transactions);
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

// Delete portfolio
router.delete("/:id", async (req: Request, res: Response) => {
	try {
		const portfolio = await Portfolio.findOneAndDelete({
			id: parseInt(req.params.id),
		});
		if (!portfolio)
			return res.status(404).json({ message: "Portfolio not found" });
		res.json({ message: "Portfolio deleted" });
	} catch (error: any) {
		res.status(500).json({ message: error.message });
	}
});

export default router;
