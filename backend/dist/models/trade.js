"use strict";
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (
					!desc ||
					("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
				) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k];
						},
					};
				}
				Object.defineProperty(o, k2, desc);
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k;
				o[k2] = m[k];
			});
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v });
			}
		: function (o, v) {
				o["default"] = v;
			});
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = [];
					for (var k in o)
						if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
					return ar;
				};
			return ownKeys(o);
		};
		return function (mod) {
			if (mod && mod.__esModule) return mod;
			var result = {};
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i]);
			__setModuleDefault(result, mod);
			return result;
		};
	})();
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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TradeSchema = new mongoose_1.Schema(
	{
		portfolio_id: { type: Number, required: false, default: null },
		strategy_id: { type: Number, required: true },
		symbol_id: { type: Number, required: true },
		quantity: { type: Number, required: true },
		type: { type: String, enum: ["buy", "sell"], required: true },
		trade_date: { type: Date, required: true, default: Date.now },
		fees: { type: Number, required: false, default: 0 },
		confidence_level: {
			type: Number,
			min: 1,
			max: 10,
			required: false,
			default: null,
		},
		entry_reason: { type: String, required: true },
		photo: { type: String, required: false, default: null },
		notes: { type: String, required: false, default: null },
		exit_reason: { type: String, required: true },
		outcome: { type: String, enum: ["win", "loss", "neutral"], required: true },
		entry_price: { type: Number, required: true },
		exit_price: { type: Number, required: true },
		entry_id: { type: Number, required: false, default: null },
		pl: { type: Number, required: false },
	},
	{
		timestamps: true,
	},
);
TradeSchema.pre("save", function () {
	return __awaiter(this, void 0, void 0, function* () {
		const trade = this;
		const { entry_price, exit_price, quantity, type, fees } = trade;
		const feesVal = fees || 0;
		if (entry_price != null && exit_price != null && quantity != null) {
			let profit = 0;
			if (type === "buy") {
				profit = (exit_price - entry_price) * quantity;
			} else if (type === "sell") {
				profit = (entry_price - exit_price) * quantity;
			}
			trade.pl = profit - feesVal;
		}
	});
});
exports.default = mongoose_1.default.model("Trade", TradeSchema);
