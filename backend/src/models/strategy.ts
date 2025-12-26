import mongoose, { Schema, Document } from "mongoose";

export interface IStrategy extends Document {
	id: number;
	name: string;
	description: string | null;
}

const StrategySchema: Schema = new Schema(
	{
		id: { type: Number, unique: true },
		name: { type: String, required: true },
		description: { type: String, required: false, default: null },
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
