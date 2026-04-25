import mongoose, { type Document, Schema } from "mongoose";

export interface ITradingRule extends Document {
	rule_id: string;
	name: string;
	description: string;
	strategy_id: number;
	is_active: boolean;
}

const TradingRuleSchema: Schema = new Schema(
	{
		rule_id: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		description: { type: String, required: true },
		strategy_id: { type: Number, required: true },
		is_active: { type: Boolean, default: true },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<ITradingRule>("TradingRule", TradingRuleSchema);
