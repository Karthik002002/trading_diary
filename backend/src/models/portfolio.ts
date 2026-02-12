import mongoose, { type Document, Schema } from "mongoose";

export interface IPortfolio extends Document {
	id: number;
	name: string;
	balance: number;
	is_testing: boolean;
}

const PortfolioSchema: Schema = new Schema(
	{
		id: { type: Number, unique: true },
		name: { type: String, required: true },
		balance: {
			type: Number,
			required: true,
			default: 0
		},
		is_testing: {
			type: Boolean,
			required: true,
			default: false
		}
	},
	{
		timestamps: true,
	},
);

PortfolioSchema.pre("save", async function () {
	const portfolio = this as unknown as IPortfolio;

	if (portfolio.isNew) {
		const lastPortfolio = await mongoose
			.model<IPortfolio>("Portfolio")
			.findOne()
			.sort({ id: -1 });
		portfolio.id = lastPortfolio && lastPortfolio.id ? lastPortfolio.id + 1 : 1;
	}
});

export default mongoose.model<IPortfolio>("Portfolio", PortfolioSchema);
