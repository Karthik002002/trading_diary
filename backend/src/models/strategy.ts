import mongoose, { type Document, Schema } from "mongoose";

export interface IStrategy extends Document {
	id: number;
	name: string;
	market_type: "equity" | "forex";
	description: string | null;
	dailyLossLimit: number | null;
	monthlyLossLimit: number | null;
	weeklyLossLimit: number | null;
	consecutiveLossLimit: number | null;
	currentConsecutiveLosses: number;
}

const StrategySchema: Schema = new Schema(
	{
		id: { type: Number, unique: true },
		name: { type: String, required: true },
		market_type: {
			type: String,
			enum: ["equity", "forex"],
			default: "equity",
			required: true,
		},
		description: { type: String, required: false, default: null },
		dailyLossLimit: { type: Number, required: false, default: null },
		monthlyLossLimit: { type: Number, required: false, default: null },
		weeklyLossLimit: { type: Number, required: false, default: null },
		consecutiveLossLimit: { type: Number, required: false, default: null },
		currentConsecutiveLosses: { type: Number, required: false, default: 0 },
	},
	{
		timestamps: true,
	},
);

StrategySchema.pre("save", async function () {
	const strategy = this as unknown as IStrategy;

	if (strategy.isNew) {
		const lastStrategy = await mongoose
			.model<IStrategy>("Strategy")
			.findOne()
			.sort({ id: -1 });
		strategy.id = lastStrategy && lastStrategy.id ? lastStrategy.id + 1 : 1;
	}
});

export default mongoose.model<IStrategy>("Strategy", StrategySchema);
