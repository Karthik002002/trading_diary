import axios from "axios";
import type { Server } from "socket.io";
import { NseIndia } from "stock-nse-india";
import WatchlistItem from "../models/watchlistItem";

const nseIndia = new NseIndia();

interface PriceUpdate {
	symbol: string;
	exchange: string;
	price: number | null;
	timestamp: string;
}

async function fetchPrice(
	symbol: string,
	exchange: string,
): Promise<PriceUpdate> {
	try {
		if (exchange.toUpperCase() === "NSE") {
			const data = await nseIndia.getEquityIntradayData(symbol.toUpperCase());
			return {
				symbol: symbol.toUpperCase(),
				exchange: exchange.toUpperCase(),
				price: data.closePrice || null,
				timestamp: new Date().toISOString(),
			};
		}
		return {
			symbol: symbol.toUpperCase(),
			exchange: exchange.toUpperCase(),
			price: null,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error(`Error fetching price for ${symbol}:`, error);
		return {
			symbol: symbol.toUpperCase(),
			exchange: exchange.toUpperCase(),
			price: null,
			timestamp: new Date().toISOString(),
		};
	}
}

export function startPriceBroadcast(io: Server) {
	async function broadcastPrices() {
		try {
			const items = await WatchlistItem.find().lean();
			if (items.length === 0) return;

			const pricePromises = items.map((item) =>
				fetchPrice(item.symbol, item.exchange),
			);
			const prices = await Promise.all(pricePromises);

			const priceMap: Record<string, number | null> = {};
			prices.forEach((p) => {
				priceMap[`${p.symbol}:${p.exchange}`] = p.price;
			});

			io.emit("price-update", priceMap);
		} catch (error) {
			console.error("Error broadcasting prices:", error);
		}
	}

	broadcastPrices();

	setInterval(broadcastPrices, 60000);
}
