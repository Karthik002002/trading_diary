import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import portfolioRoutes from "./routes/portfolioRoutes";
import strategyRoutes from "./routes/strategyRoutes";
import symbolRoutes from "./routes/symbolRoutes";
import tagRoutes from "./routes/tagRoutes";
import tradeRoutes from "./routes/tradeRoutes";
import graphRouter from "./routes/graphRouter";
import integrationRoutes from "./routes/integrationRoutes";
import os from "node:os";
import customScript from "./customScripts";
import clipboardRoutes from "./routes/clipboardRoutes";
import { startClipboardMonitor } from "./clipboardStore";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tradingdiary";

app.use(express.json({ limit: "50mb" }));
app.use(cors());

const getLocalIPv4Address = () => {
	const nets = os.networkInterfaces();
	let localIpAddress = "";

	for (const name of Object.keys(nets)) {
		for (const net of nets[name] ?? []) {
			const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;

			if (net.family === familyV4Value && !net.internal) {
				localIpAddress = net.address;

				return localIpAddress;
			}
		}
	}
	return localIpAddress;
};

const myIPv4 = getLocalIPv4Address();

console.log("My local IPv4 address is:", myIPv4);
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.baseUrl}`);
	next();
});

app.use("/api/portfolios", portfolioRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/symbols", symbolRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/graph", graphRouter);
app.use("/api/integrations", integrationRoutes);
app.use("/api/clipboard", clipboardRoutes);

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
	console.log("Fetching root");
	res.send("API is running...");
});

mongoose
	.connect(MONGO_URI)
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.log(err));

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

customScript();
// startClipboardMonitor();
