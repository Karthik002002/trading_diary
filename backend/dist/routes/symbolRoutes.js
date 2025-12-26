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
const symbol_1 = __importDefault(require("../models/symbol"));
const symbolValidators_1 = require("../validators/symbolValidators");
const validateRequest_1 = require("../middleware/validateRequest");
const router = express_1.default.Router();
// Get all symbols
router.get("/", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		try {
			const symbols = yield symbol_1.default.find().sort({ id: 1 });
			res.json(symbols);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
// Get symbol by ID
router.get("/:id", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		try {
			const symbol = yield symbol_1.default.findOne({
				id: parseInt(req.params.id),
			});
			if (!symbol) return res.status(404).json({ message: "Symbol not found" });
			res.json(symbol);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
// Create symbol
router.post(
	"/",
	symbolValidators_1.createSymbolValidator,
	validateRequest_1.validateRequest,
	(req, res) =>
		__awaiter(void 0, void 0, void 0, function* () {
			try {
				const symbol = new symbol_1.default(req.body);
				const savedSymbol = yield symbol.save();
				res.status(201).json(savedSymbol);
			} catch (error) {
				res.status(400).json({ message: error.message });
			}
		}),
);
// Update symbol
router.put(
	"/:id",
	symbolValidators_1.updateSymbolValidator,
	validateRequest_1.validateRequest,
	(req, res) =>
		__awaiter(void 0, void 0, void 0, function* () {
			try {
				const symbol = yield symbol_1.default.findOne({
					id: parseInt(req.params.id),
				});
				if (!symbol)
					return res.status(404).json({ message: "Symbol not found" });
				Object.assign(symbol, req.body);
				const updatedSymbol = yield symbol.save();
				res.json(updatedSymbol);
			} catch (error) {
				res.status(400).json({ message: error.message });
			}
		}),
);
// Delete symbol
router.delete("/:id", (req, res) =>
	__awaiter(void 0, void 0, void 0, function* () {
		try {
			const symbol = yield symbol_1.default.findOneAndDelete({
				id: parseInt(req.params.id),
			});
			if (!symbol) return res.status(404).json({ message: "Symbol not found" });
			res.json({ message: "Symbol deleted successfully" });
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}),
);
exports.default = router;
