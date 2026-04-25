import { createServer } from "node:http";
import os from "node:os";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";
import { startClipboardMonitor } from "./clipboardStore";
import customScript from "./customScripts";
import accountabilityRoutes from "./routes/accountabilityRoutes";
import aiRoutes from "./routes/aiRoutes";
import clipboardRoutes from "./routes/clipboardRoutes";
import dhanRoutes from "./routes/dhanRoutes";
import disciplineRoutes from "./routes/disciplineRoutes";
import forexTradeRoutes from "./routes/forexTradeRoutes";
import goalRoutes from "./routes/goalRoutes";
import graphRouter from "./routes/graphRouter";
import integrationRoutes from "./routes/integrationRoutes";
import portfolioRoutes from "./routes/portfolioRoutes";
import strategyRoutes from "./routes/strategyRoutes";
import symbolRoutes from "./routes/symbolRoutes";
import tagRoutes from "./routes/tagRoutes";
import tradeRoutes from "./routes/tradeRoutes";
import watchlistRoutes from "./routes/watchlist";
import { startPriceBroadcast } from "./services/priceService";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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
app.use("/api/forex/trades", forexTradeRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/symbols", symbolRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/graph", graphRouter);
app.use("/api/integrations", integrationRoutes);
app.use("/api/clipboard", clipboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/discipline", disciplineRoutes);
app.use("/api/dhan", dhanRoutes);
app.use("/api/accountability", accountabilityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/watchlist", watchlistRoutes);

app.use("/uploads", express.static("uploads"));

const clientPath = path.join(__dirname, "../dist/client");
app.use(express.static(clientPath));

app.get("/api/health", (_req, res) => {
	const mongoState = mongoose.connection.readyState;
	const mongoStatus =
		mongoState === 1
			? "connected"
			: mongoState === 2
				? "connecting"
				: "disconnected";

	res.json({
		status: "ok",
		mongodb: mongoStatus,
		timestamp: new Date().toISOString(),
	});
});

app.use("/api/portfolios", portfolioRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/forex/trades", forexTradeRoutes);
app.use("/api/strategies", strategyRoutes);
app.use("/api/symbols", symbolRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/graph", graphRouter);
app.use("/api/integrations", integrationRoutes);
app.use("/api/clipboard", clipboardRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/discipline", disciplineRoutes);
app.use("/api/dhan", dhanRoutes);
app.use("/api/accountability", accountabilityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/watchlist", watchlistRoutes);

app.get("*", (_req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

mongoose
	.connect(MONGO_URI)
	.then(() => console.log("MongoDB Connected"))
	.catch((err) => console.log(err));

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

startPriceBroadcast(io);

httpServer.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

customScript();
// startClipboardMonitor();
