import mongoose, { type Document, Schema } from "mongoose";

export interface IDisciplineTrade extends Document {
	session_id: string;
	instrument: string;
	timeframe: string;
	entry_reason: string;
	rule_id: mongoose.Types.ObjectId | null;
	plan_match: boolean;
	outcome: "win" | "loss" | "breakeven";
	note: string | null;
	trade_timestamp: Date;
	strategy_id: number;
}

const DisciplineTradeSchema: Schema = new Schema(
	{
		session_id: { type: String, required: true },
		instrument: { type: String, required: true },
		timeframe: { type: String, required: true },
		entry_reason: { type: String, required: true },
		rule_id: { type: Schema.Types.ObjectId, ref: "TradingRule", default: null },
		plan_match: { type: Boolean, required: true, default: false },
		outcome: {
			type: String,
			enum: ["win", "loss", "breakeven"],
			required: true,
		},
		note: { type: String, default: null, maxlength: 100 },
		trade_timestamp: { type: Date, required: true, default: Date.now },
		strategy_id: { type: Number, required: true },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<IDisciplineTrade>(
	"DisciplineTrade",
	DisciplineTradeSchema,
);
