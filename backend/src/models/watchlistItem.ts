import mongoose, { type Document, Schema } from "mongoose";

export interface IWatchlistItem extends Document {
	symbol: string;
	exchange: "NSE" | "BSE";
	direction: "BUY" | "SELL";
	entry_price: number;
	quantity: number;
	stop_loss: number;
	take_profit: number;
	notes: string | null;
	added_at: Date;
}

const WatchlistItemSchema: Schema = new Schema(
	{
		symbol: { type: String, required: true, uppercase: true },
		exchange: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
		direction: { type: String, enum: ["BUY", "SELL"], required: true },
		entry_price: { type: Number, required: true },
		quantity: { type: Number, required: true },
		stop_loss: { type: Number, required: true },
		take_profit: { type: Number, required: true },
		notes: { type: String, required: false, default: null },
		added_at: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	},
);

export default mongoose.model<IWatchlistItem>(
	"WatchlistItem",
	WatchlistItemSchema,
);
