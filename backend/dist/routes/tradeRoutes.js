"use strict";
var __awaiter =
	(this && this.__awaiter) ||
	function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
				? value
				: new P(function (resolve) {
						resolve(value);
					});
		}
		return new (P || (P = Promise))(function (resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trade_1 = __importDefault(require("../models/trade"));
const validateRequest_1 = require("../middleware/validateRequest");
const tradeValidators_1 = require("../validators/tradeValidators");
const router = express_1.default.Router();
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
// Create new trade
router.post(
	"/",
	uploadMiddleware_1.upload.single("photo"),
	tradeValidators_1.createTradeValidator,
	validateRequest_1.validateRequest,
	(req, res) =>
		__awaiter(void 0, void 0, void 0, function* () {
			try {
				if (req.file) {
					req.body.photo = req.file.path;
				}
				const trade = new trade_1.default(req.body);
				const savedTrade = yield trade.save();
				res.status(201).json(savedTrade);
			} catch (error) {
				res.status(400).json({ message: error.message });
			}
		}),
);
// Get all trades
router.get("/", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const skip = (page - 1) * limit;
			console.log(`Fetching trades page ${page} with limit ${limit}`);
			const [trades, total] = yield Promise.all([
				trade_1.default
					.find({})
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				trade_1.default.countDocuments({}),
			]);
			res.json({
				trades,
				pagination: {
					total,
					page,
					limit,
					pages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
// Get single trade
router.get("/:id", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		// ... existing get id code ...
		try {
			const trade = yield trade_1.default.findById(req.params.id);
			if (!trade) return res.status(404).json({ message: "Trade not found" });
			res.json(trade);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
// Update trade
router.put(
	"/:id",
	uploadMiddleware_1.upload.single("photo"),
	tradeValidators_1.updateTradeValidator,
	validateRequest_1.validateRequest,
	(req, res) =>
		__awaiter(void 0, void 0, void 0, function* () {
			try {
				const trade = yield trade_1.default.findById(req.params.id);
				if (!trade) return res.status(404).json({ message: "Trade not found" });
				if (req.file) {
					req.body.photo = req.file.path;
				}
				Object.assign(trade, req.body);
				const updatedTrade = yield trade.save(); // save() triggers the pre-save hook for PL calc
				res.json(updatedTrade);
			} catch (error) {
				res.status(400).json({ message: error.message });
			}
		}),
);
// Delete trade
router.delete("/:id", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		try {
			const trade = yield trade_1.default.findByIdAndDelete(req.params.id);
			if (!trade) return res.status(404).json({ message: "Trade not found" });
			res.json({ message: "Trade deleted" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
exports.default = router;
