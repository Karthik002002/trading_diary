import { QueryCache, QueryClient } from "@tanstack/react-query";
import type {
	PerformanceMetric,
	PnlCalendarDay,
	Strategy,
	TSymbol,
	TDhanStatus,
	TFilters,
	TimeseriesResponse,
	TradeResponse,
	Goal,
} from "../types/api";
import { message } from "antd";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			retry: 1,
		},
	},
	queryCache: new QueryCache({
		onError: (error) => {
			message.error(error.message ?? JSON.stringify(error));
		},
	}),
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

export const updateStrategy = async (
	id: number,
	strategyData: Partial<Strategy>,
): Promise<Strategy> => {
	const response = await fetch(`${BASE_URL}/strategies/${id}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(strategyData),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to update strategy");
	}
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

export const fetchSymbols = async (): Promise<TSymbol[]> => {
	const response = await fetch(`${BASE_URL}/symbols`);
	if (!response.ok) throw new Error("Failed to fetch symbols");
	return response.json();
};

export const fetchPnlCalendar = async (
	month: number,
	year: number,
	filters?: TFilters,
): Promise<PnlCalendarDay[]> => {
	const params = new URLSearchParams({
		month: month.toString(),
		year: year.toString(),
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
	const response = await fetch(`${BASE_URL}/trades/pnl/calendar?${params}`);
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

export const fetchTimeseries = async (
	filters?: TFilters,
): Promise<TimeseriesResponse> => {
	const response = await fetch(`${BASE_URL}/graph/timeseries`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch timeseries data");
	const data = await response.json();
	// The backend returns an array with a facet, extract the timeseries
	return { timeseries: data[0]?.timeseries || [] };
};

export const fetchTradeHeatmap = async (filters?: TFilters): Promise<any[]> => {
	const response = await fetch(`${BASE_URL}/graph/heatmap`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch heatmap data");
	return response.json();
};

export const fetchEmotionalTreemap = async (
	filters?: TFilters,
): Promise<any[]> => {
	const response = await fetch(`${BASE_URL}/graph/treemap`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch treemap data");
	return response.json();
};

export const fetchWinLossPieChart = async (
	filters?: TFilters,
): Promise<any[]> => {
	const response = await fetch(`${BASE_URL}/graph/winlosspiechart`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch win loss pie chart data");
	return response.json();
};

export const connectDhan = async (
	clientId: string,
	accessToken: string,
): Promise<{ message: string; status: string }> => {
	const response = await fetch(`${BASE_URL}/integrations/dhan/connect`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ clientId, accessToken }),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to connect to Dhan");
	}
	return response.json();
};

export const getIntegrationStatus = async (): Promise<TDhanStatus> => {
	const response = await fetch(`${BASE_URL}/integrations/dhan/status`);
	if (!response.ok) {
		throw new Error("Failed to fetch integration status");
	}
	return response.json();
};

export type ClipboardData = {
	stoploss: string | null;
	target: string | null;
	entry: string | null;
	images: { image: string; type: string }[];
};

export const fetchClipboardData = async (): Promise<ClipboardData> => {
	const response = await fetch(`${BASE_URL}/clipboard/latest`);
	if (!response.ok) throw new Error("Failed to fetch clipboard data");
	const data = await response.json();
	return data.data;
};

export const fetchGoals = async (type?: string): Promise<Goal[]> => {
	const params = new URLSearchParams();
	if (type) params.append("type", type);

	const response = await fetch(`${BASE_URL}/goals?${params.toString()}`);
	if (!response.ok) throw new Error("Failed to fetch goals");
	return response.json();
};

export const createGoal = async (goalData: Partial<Goal>): Promise<Goal> => {
	const response = await fetch(`${BASE_URL}/goals`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(goalData),
	});
	if (!response.ok) throw new Error("Failed to create goal");
	return response.json();
};

export const updateGoal = async (
	id: number,
	goalData: Partial<Goal>,
): Promise<Goal> => {
	const response = await fetch(`${BASE_URL}/goals/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(goalData),
	});
	if (!response.ok) throw new Error("Failed to update goal");
	return response.json();
};

export const deleteGoal = async (id: number): Promise<void> => {
	const response = await fetch(`${BASE_URL}/goals/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error("Failed to delete goal");
};
export const fetchDeepDiveAnalysis = async (filters: any[]): Promise<{ trades: any[], stats: any, equityCurve: any[] }> => {
	const response = await fetch(`${BASE_URL}/trades/deep-dive`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch deep dive analysis");
	return response.json();
};
