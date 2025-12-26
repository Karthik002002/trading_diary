import { QueryClient } from "@tanstack/react-query";
import type {
	TradeResponse,
	Strategy,
	Symbol,
	PnlCalendarDay,
	PerformanceMetric,
} from "../types/api";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
});

const BASE_URL = "http://localhost:5000/api";
export const BACKEND_URL = "http://localhost:5000";
export const fetchTrades = async (
	page = 1,
	limit = 20,
	filters?: {
		strategy_id?: string;
		outcome?: string;
		search?: string;
		symbol?: string;
		portfolio_id?: string;
		status?: string;
		tags?: string[];
	},
): Promise<TradeResponse> => {
	const params = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString(),
	});

	if (filters?.strategy_id) params.append("strategy_id", filters.strategy_id);
	if (filters?.outcome) params.append("outcome", filters.outcome);
	if (filters?.search) params.append("search", filters.search);
	if (filters?.symbol) params.append("symbol", filters.symbol);
	if (filters?.portfolio_id)
		params.append("portfolio_id", filters.portfolio_id);
	if (filters?.status) params.append("status", filters.status);
	if (filters?.tags && filters.tags.length > 0)
		params.append("tags", filters.tags.join(","));

	const response = await fetch(`${BASE_URL}/trades?${params.toString()}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

export const updateTrade = async (
	id: string,
	tradeData: FormData,
): Promise<any> => {
	const response = await fetch(`${BASE_URL}/trades/${id}`, {
		method: "PUT",
		body: tradeData,
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to update trade");
	}
	return response.json();
};

export const deleteTrade = async (id: string): Promise<any> => {
	const response = await fetch(`${BASE_URL}/trades/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error("Failed to delete trade");
	return response.json();
};

export const createTrade = async (tradeData: FormData): Promise<any> => {
	const response = await fetch(`${BASE_URL}/trades`, {
		method: "POST",
		body: tradeData,
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to create trade");
	}
	return response.json();
};

export const fetchStrategies = async (): Promise<Strategy[]> => {
	const response = await fetch(`${BASE_URL}/strategies`);
	if (!response.ok) throw new Error("Failed to fetch strategies");
	return response.json();
};

export const fetchTags = async (
	search?: string,
): Promise<{ _id: string; name: string }[]> => {
	const params = new URLSearchParams();
	if (search) params.append("search", search);

	const response = await fetch(`${BASE_URL}/tags?${params.toString()}`);
	if (!response.ok) throw new Error("Failed to fetch tags");
	return response.json();
};

export const fetchSymbols = async (): Promise<Symbol[]> => {
	const response = await fetch(`${BASE_URL}/symbols`);
	if (!response.ok) throw new Error("Failed to fetch symbols");
	return response.json();
};

export const fetchPnlCalendar = async (
	month: number,
	year: number,
): Promise<PnlCalendarDay[]> => {
	const response = await fetch(
		`${BASE_URL}/trades/pnl/calendar?month=${month}&year=${year}`,
	);
	if (!response.ok) {
		throw new Error("Failed to fetch PnL calendar data");
	}
	return response.json();
};

export const fetchPerformanceMetric = async (
	filters: Record<string, string>,
): Promise<PerformanceMetric> => {
	const response = await fetch(
		`${BASE_URL}/trades/stats/performance-metric?${new URLSearchParams(
			Object.entries(filters).filter(([_, value]) => value !== undefined),
		).toString()}`,
	);
	if (!response.ok) throw new Error("Failed to fetch performance metric data");
	return response.json();
};
