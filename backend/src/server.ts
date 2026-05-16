import { createServer } from "node:http";
import os from "node:os";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { Server } from "socket.io";
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
import ErrorHandler from "errorhandler";
import { MongoClient } from "mongodb";

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
console.log("MongoDB URI:", MONGO_URI);
console.log("Server Port:", PORT);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.baseUrl}`);
  next();
});
// app.use(ErrorHandler({ log:true }))

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

// app.get("*", (_req, res) => {
// 	res.sendFile(path.join(clientPath, "index.html"));
// });

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) =>
    console.error("MongoDB Connection Error:", err.message || err),
  );

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message || err);
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

startPriceBroadcast(io);

// Robust listen: if the requested port is already in use (EADDRINUSE),
// try the next port up to a limit instead of crashing.
const MAX_PORT_ATTEMPTS = 10;
let startingPort = Number(PORT) || 5000;

function listenWithRetry(port: number, attemptsLeft: number) {
  httpServer.once("error", (err: any) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} in use`);
      if (attemptsLeft > 0) {
        const nextPort = port + 1;
        console.log(`Trying port ${nextPort}...`);
        // Small delay before retrying
        setTimeout(() => listenWithRetry(nextPort, attemptsLeft - 1), 200);
      } else {
        console.error("No available ports found after retries. Exiting.");
        process.exit(1);
      }
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });

  httpServer.once("listening", () => {
    const addr = httpServer.address();
    const usedPort =
      typeof addr === "string"
        ? addr
        : addr && (addr as any).port
          ? (addr as any).port
          : port;
    console.log(`Server running on port ${usedPort}`);
  });

  httpServer.listen(port);
}

listenWithRetry(startingPort, MAX_PORT_ATTEMPTS);

customScript();
// customScript(); // disabled

// startClipboardMonitor();
