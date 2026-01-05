import mongoose, { type Document, Schema } from "mongoose";

export interface IPortfolioTransaction extends Document {
    portfolioId: mongoose.Types.ObjectId;
    type: "PAYIN" | "PAYOUT";
    amount: number;
    before_open: boolean;
    tradeId?: mongoose.Types.ObjectId;
    note?: string;
}

const PortfolioTransactionSchema = new Schema(
    {
        portfolioId: {
            type: Schema.Types.ObjectId,
            ref: "Portfolio",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["PAYIN", "PAYOUT"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        before_open: {
            type: Boolean,
            default: false,
        },

        tradeId: {
            type: Schema.Types.ObjectId,
            ref: "Trade",
            required: false,
        },

        note: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IPortfolioTransaction>(
    "PortfolioTransaction",
    PortfolioTransactionSchema,
);
