"use strict";
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGO_URI =
	process.env.MONGO_URI || "mongodb://localhost:27017/tradingdiary";
const tradeRoutes_1 = __importDefault(require("./routes/tradeRoutes"));
const strategyRoutes_1 = __importDefault(require("./routes/strategyRoutes"));
const portfolioRoutes_1 = __importDefault(require("./routes/portfolioRoutes"));
const symbolRoutes_1 = __importDefault(require("./routes/symbolRoutes"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.baseUrl}`);
	next();
});
app.use("/api/trades", tradeRoutes_1.default);
app.use("/api/strategies", strategyRoutes_1.default);
app.use("/api/portfolios", portfolioRoutes_1.default);
app.use("/api/symbols", symbolRoutes_1.default);
app.use("/uploads", express_1.default.static("uploads"));
app.get("/", (req, res) => {
	console.log("Fetching root");
	res.send("API is running...");
});
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
mongoose_1.default
	.connect(MONGO_URI)
	.then(() => {
		console.log("Connected to MongoDB");
	})
	.catch((err) => {
		console.error("Error connecting to MongoDB:", err);
	});
