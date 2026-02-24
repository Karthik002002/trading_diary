import mongoose from "mongoose";
import dotenv from "dotenv";
import Trade from "../models/trade";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/tradingdiary";

(async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        console.log("Updating trades to equity...");
        const result = await Trade.updateMany(
            {}, // Update all trades
            { $set: { trade_type: "equity" } }
        );

        console.log(`Successfully updated ${result.modifiedCount} trades to equity.`);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error updating trades:", error);
        process.exit(1);
    }
})();
