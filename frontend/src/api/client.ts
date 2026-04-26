import { QueryCache, QueryClient } from "@tanstack/react-query";
import { message } from "antd";
import type {
	Goal,
	MarketType,
	PerformanceMetric,
	PnlCalendarDay,
	Strategy,
	TDhanStatus,
	TFilters,
	TimeseriesResponse,
	TradeResponse,
	TSymbol,
} from "../types/api";

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

const BASE_URL = `${process.env.BASE_URL || "http://localhost:5000"}/api`;
export const BACKEND_URL = process.env.BASE_URL || "http://localhost:5000";
export const fetchTrades = async (
	page = 1,
	limit = 20,
	filters?: TFilters,
): Promise<TradeResponse> => {
	const isForex = filters?.trade_type === "forex";
	const endpoint = isForex ? "forex/trades" : "trades";

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

	const response = await fetch(`${BASE_URL}/${endpoint}?${params.toString()}`);
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
};

export const updateTrade = async (
	id: string,
	tradeData: FormData,
	tradeType: string,
): Promise<any> => {
	const isForex = tradeType === "forex";
	const endpoint = isForex ? "forex/trades" : "trades";

	const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
		method: "PUT",
		body: tradeData,
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to update trade");
	}
	return response.json();
};

export const deleteTrade = async (
	id: string,
	tradeType?: string,
): Promise<any> => {
	const isForex = tradeType === "forex";
	const endpoint = isForex ? "forex/trades" : "trades";

	const response = await fetch(`${BASE_URL}/${endpoint}/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error("Failed to delete trade");
	return response.json();
};

export const createTrade = async (
	tradeData: FormData,
	tradeType?: string,
): Promise<any> => {
	const isForex = tradeType === "forex";
	const endpoint = isForex ? "forex/trades" : "trades";

	const response = await fetch(`${BASE_URL}/${endpoint}`, {
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

export const fetchStrategiesByMarket = async (
	marketType?: MarketType,
): Promise<Strategy[]> => {
	const params = new URLSearchParams();
	if (marketType) params.append("market_type", marketType);
	const response = await fetch(`${BASE_URL}/strategies?${params.toString()}`);
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

export const fetchSymbols = async (
	marketType?: MarketType,
): Promise<TSymbol[]> => {
	const params = new URLSearchParams();
	if (marketType) params.append("market_type", marketType);
	const response = await fetch(`${BASE_URL}/symbols?${params.toString()}`);
	if (!response.ok) throw new Error("Failed to fetch symbols");
	return response.json();
};

export const fetchPnlCalendar = async (
	month: number,
	year: number,
	filters?: TFilters,
): Promise<PnlCalendarDay[]> => {
	const isForex = filters?.trade_type === "forex";
	const endpoint = isForex
		? "forex/trades/pnl/calendar"
		: "trades/pnl/calendar";

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

	const response = await fetch(`${BASE_URL}/${endpoint}?${params}`);
	if (!response.ok) {
		throw new Error("Failed to fetch PnL calendar data");
	}
	return response.json();
};

export const fetchPerformanceMetric = async (
	filters: TFilters,
): Promise<PerformanceMetric> => {
	const isForex = filters?.trade_type === "forex";
	const endpoint = isForex
		? "forex/trades/stats/performance-metric"
		: "trades/stats/performance-metric";

	const params = new URLSearchParams();
	if (filters.strategy_id) params.append("strategy_id", filters.strategy_id);
	if (filters.outcome) params.append("outcome", filters.outcome);
	if (filters.search) params.append("search", filters.search);
	if (filters.symbol) params.append("symbol", filters.symbol);
	if (filters.portfolio_id) params.append("portfolio_id", filters.portfolio_id);
	if (filters.status) params.append("status", filters.status);
	if (filters.from) params.append("from", filters.from);
	if (filters.to) params.append("to", filters.to);
	if (filters.tags && filters.tags.length > 0)
		params.append("tags", filters.tags.join(","));

	const response = await fetch(`${BASE_URL}/${endpoint}?${params.toString()}`);
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

export type AiReferenceTradeData = {
	stock_name: string | null;
	timeframe: string | null;
	entry: number | null;
	exit: number | null;
	target: number | null;
	stop_loss: number | null;
};

export const fetchClipboardData = async (): Promise<ClipboardData> => {
	const response = await fetch(`${BASE_URL}/clipboard/latest`);
	if (!response.ok) throw new Error("Failed to fetch clipboard data");
	const data = await response.json();
	return data.data;
};

export const fetchExternalAiReferenceTrade = async (
	image: File | Blob,
): Promise<AiReferenceTradeData> => {
	const formData = new FormData();
	formData.append(
		"image",
		image,
		image instanceof File ? image.name : "reference-image.png",
	);

	const response = await fetch(`${BASE_URL}/ai/external-reference-trade`, {
		method: "POST",
		body: formData,
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || "Failed to fetch AI reference data");
	}
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
export const fetchDeepDiveAnalysis = async (
	filters: any[],
	tradeType?: string,
): Promise<{ trades: any[]; stats: any; equityCurve: any[] }> => {
	const isForex = tradeType === "forex";
	const endpoint = isForex ? "forex/trades/deep-dive" : "trades/deep-dive";

	const response = await fetch(`${BASE_URL}/${endpoint}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters }),
	});
	if (!response.ok) throw new Error("Failed to fetch deep dive analysis");
	return response.json();
};

export type SessionData = {
	session_id: string;
	date: Date;
	time_of_day: "morning" | "post-work" | "post-gym";
	energy_level: number;
	mental_state_tags: string[];
	trades: string[];
	is_active: boolean;
	compliance_score: number | null;
	week_start: Date;
};

export type DisciplineTradeData = {
	_id?: string;
	session_id: string;
	instrument: string;
	timeframe: string;
	entry_reason: string;
	rule_id?: string;
	plan_match: boolean;
	outcome: "win" | "loss" | "breakeven";
	note?: string;
	trade_timestamp: Date;
	strategy_id: number;
};

export type TradingRuleData = {
	rule_id: string;
	name: string;
	description: string;
	strategy_id: number;
	is_active: boolean;
};

export type WeeklyDashboardData = {
	weeklyCompliance: number;
	totalTrades: number;
	planMatched: number;
	complianceByTimeOfDay: Record<string, number>;
	winRateByEnergyBracket: Record<string, { wins: number; total: number }>;
	streak: number;
	sessions: SessionData[];
};

export type WarningData = {
	shouldWarn: boolean;
	compliance: number;
	sessions: SessionData[];
};

export type WeeklyReviewData = {
	bestSessionType: string;
	worstSessionType: string;
	patternCallout: string | null;
	totalSessions: number;
	totalTrades: number;
	violations: number;
};

export const createSession = async (
	data: Partial<SessionData>,
): Promise<SessionData> => {
	const response = await fetch(`${BASE_URL}/discipline/sessions`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to create session");
	return response.json();
};

export const getActiveSession = async (): Promise<SessionData | null> => {
	const response = await fetch(`${BASE_URL}/discipline/sessions/active`);
	if (!response.ok) {
		if (response.status === 404) return null;
		throw new Error("Failed to fetch active session");
	}
	return response.json();
};

export const endSession = async (
	sessionId: string,
): Promise<{ session: SessionData; compliance_score: number }> => {
	const response = await fetch(
		`${BASE_URL}/discipline/sessions/${sessionId}/end`,
		{
			method: "POST",
		},
	);
	if (!response.ok) throw new Error("Failed to end session");
	return response.json();
};

export const createDisciplineTrade = async (
	data: Partial<DisciplineTradeData>,
): Promise<DisciplineTradeData> => {
	const response = await fetch(`${BASE_URL}/discipline/trades`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to create trade");
	return response.json();
};

export const getSessionTrades = async (
	sessionId: string,
): Promise<DisciplineTradeData[]> => {
	const response = await fetch(`${BASE_URL}/discipline/trades/${sessionId}`);
	if (!response.ok) throw new Error("Failed to fetch trades");
	return response.json();
};

export const createTradingRule = async (
	data: Partial<TradingRuleData>,
): Promise<TradingRuleData> => {
	const response = await fetch(`${BASE_URL}/discipline/rules`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to create rule");
	return response.json();
};

export const getTradingRules = async (
	strategyId: number,
): Promise<TradingRuleData[]> => {
	const response = await fetch(`${BASE_URL}/discipline/rules/${strategyId}`);
	if (!response.ok) throw new Error("Failed to fetch rules");
	return response.json();
};

export const getWeeklyDashboard = async (): Promise<WeeklyDashboardData> => {
	const response = await fetch(`${BASE_URL}/discipline/dashboard/weekly`);
	if (!response.ok) throw new Error("Failed to fetch dashboard data");
	return response.json();
};

export const getSessionWarning = async (
	sessionType: string,
): Promise<WarningData> => {
	const response = await fetch(
		`${BASE_URL}/discipline/warnings/block/${sessionType}`,
	);
	if (!response.ok) throw new Error("Failed to fetch warning data");
	return response.json();
};

export const getWeeklyReview = async (): Promise<WeeklyReviewData> => {
	const response = await fetch(`${BASE_URL}/discipline/weekly-review`);
	if (!response.ok) throw new Error("Failed to fetch weekly review data");
	return response.json();
};

export type TodaySessionData = {
	session_id: string;
	energy_level: number;
	session_type: string;
	mental_state_tags: string[];
	compliance_percent: number;
} | null;

export type StreakData = {
	current_streak: number;
	best_streak: number;
};

export type WeeklyComplianceDay = {
	day: string;
	compliance_percent: number;
	session_exists: boolean;
};

export type SessionTypeBreakdown = {
	session_type: string;
	avg_compliance_30d: number;
	session_count_30d: number;
};

export type ScatterPoint = {
	date: string;
	session_type: string;
	energy_level: number;
	compliance_percent: number;
};

export type RecentSession = {
	date: string;
	session_type: string;
	energy_level: number;
	compliance_percent: number;
};

export const getTodaySession = async (): Promise<TodaySessionData> => {
	const response = await fetch(`${BASE_URL}/discipline/dashboard/today`);
	if (!response.ok) throw new Error("Failed to fetch today's session");
	return response.json();
};

export const getStreak = async (): Promise<StreakData> => {
	const response = await fetch(`${BASE_URL}/discipline/dashboard/streak`);
	if (!response.ok) throw new Error("Failed to fetch streak data");
	return response.json();
};

export const getWeeklyCompliance = async (): Promise<WeeklyComplianceDay[]> => {
	const response = await fetch(
		`${BASE_URL}/discipline/dashboard/weekly-compliance`,
	);
	if (!response.ok) throw new Error("Failed to fetch weekly compliance");
	return response.json();
};

export const getSessionTypeBreakdown = async (): Promise<
	SessionTypeBreakdown[]
> => {
	const response = await fetch(
		`${BASE_URL}/discipline/dashboard/session-type-breakdown`,
	);
	if (!response.ok) throw new Error("Failed to fetch session type breakdown");
	return response.json();
};

export const getEnergyComplianceScatter = async (): Promise<ScatterPoint[]> => {
	const response = await fetch(
		`${BASE_URL}/discipline/dashboard/energy-compliance-scatter`,
	);
	if (!response.ok) throw new Error("Failed to fetch scatter data");
	return response.json();
};

export const getRecentSessions = async (): Promise<RecentSession[]> => {
	const response = await fetch(
		`${BASE_URL}/discipline/dashboard/recent-sessions`,
	);
	if (!response.ok) throw new Error("Failed to fetch recent sessions");
	return response.json();
};

export interface WatchlistItem {
	_id?: string;
	symbol: string;
	exchange: "NSE" | "BSE";
	direction: "BUY" | "SELL";
	entry_price: number;
	quantity: number;
	stop_loss: number;
	take_profit: number;
	notes?: string | null;
	added_at?: Date;
}

export interface PriceData {
	symbol: string;
	exchange: string;
	price: number | null;
	timestamp: string;
	error?: string;
}

export const fetchWatchlist = async (): Promise<WatchlistItem[]> => {
	const response = await fetch(`${BASE_URL}/watchlist`);
	if (!response.ok) throw new Error("Failed to fetch watchlist");
	return response.json();
};

export const createWatchlistItem = async (
	item: Omit<WatchlistItem, "_id">,
): Promise<WatchlistItem> => {
	const response = await fetch(`${BASE_URL}/watchlist`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(item),
	});
	if (!response.ok) throw new Error("Failed to create watchlist item");
	return response.json();
};

export const updateWatchlistItem = async (
	id: string,
	item: Partial<WatchlistItem>,
): Promise<WatchlistItem> => {
	const response = await fetch(`${BASE_URL}/watchlist/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(item),
	});
	if (!response.ok) throw new Error("Failed to update watchlist item");
	return response.json();
};

export const deleteWatchlistItem = async (id: string): Promise<void> => {
	const response = await fetch(`${BASE_URL}/watchlist/${id}`, {
		method: "DELETE",
	});
	if (!response.ok) throw new Error("Failed to delete watchlist item");
};

export const fetchPrice = async (
	symbol: string,
	exchange: string,
): Promise<PriceData> => {
	const response = await fetch(
		`${BASE_URL}/watchlist/price?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`,
	);
	if (!response.ok) throw new Error("Failed to fetch price");
	return response.json();
};

export const fetchNseSymbols = async (): Promise<string[]> => {
	const response = await fetch(`${BASE_URL}/watchlist/symbols`);
	if (!response.ok) throw new Error("Failed to fetch symbols");
	return response.json();
};

export interface DhanHolding {
	tradingSymbol: string;
	exchange: string;
	securityId: string;
	isin: string;
	totalQty: number;
	dpQty: number;
	t1Qty: number;
	mtf_t1_qty: number;
	mtf_qty: number;
	availableQty: number;
	collateralQty: number;
	avgCostPrice: number;
	lastTradedPrice: number;
}

export const fetchDhanHoldings = async (): Promise<DhanHolding[]> => {
	const response = await fetch(`${BASE_URL}/dhan/holdings`);
	if (!response.ok) throw new Error("Failed to fetch Dhan holdings");
	const data = await response.json();
	if (data.error) throw new Error(data.error);
	return Array.isArray(data) ? data : [];
};

export interface DhanPosition {
	tradingSymbol: string;
	exchange: string;
	productType: string;
	positionType: string;
	buyAvg: number;
	sellAvg: number;
	netQty: number;
	unrealizedProfit: number;
	realizedProfit: number;
	dayBuyValue: number;
	daySellValue: number;
}

export const fetchDhanPositions = async (): Promise<DhanPosition[]> => {
	const response = await fetch(`${BASE_URL}/dhan/positions`);
	if (!response.ok) throw new Error("Failed to fetch Dhan positions");
	const data = await response.json();
	if (data.error) throw new Error(data.error);
	return Array.isArray(data) ? data : [];
};

export interface DhanOrder {
	orderId: string;
	tradingSymbol: string;
	transactionType: string;
	orderStatus: string;
	orderType: string;
	productType: string;
	quantity: number;
	filledQty: number;
	price: number;
	averageTradedPrice: number;
	updateTime: string;
}

export const fetchDhanOrders = async (): Promise<DhanOrder[]> => {
	const response = await fetch(`${BASE_URL}/dhan/orders`);
	if (!response.ok) throw new Error("Failed to fetch Dhan orders");
	const data = await response.json();
	if (data.error) throw new Error(data.error);
	return Array.isArray(data) ? data : [];
};

export interface DhanOrderRequest {
	dhanClientId: string;
	correlationId?: string;
	transactionType: "BUY" | "SELL";
	exchangeSegment: "NSE_EQ" | "BSE_EQ" | "NSE_FNO" | "BSE_FNO" | "MCX_COMM";
	productType: "INTRADAY" | "CNC";
	orderType: "LIMIT" | "MARKET" | "STOP_LOSS" | "STOP_LOSS_MARKET";
	validity?: "DAY" | "IOC";
	securityId: string;
	quantity: number;
	disclosedQuantity?: number;
	price?: number;
	triggerPrice?: number;
	afterMarketOrder?: boolean;
	amoTime?: "PRE_OPEN" | "OPEN" | "OPEN_30" | "OPEN_60";
	targetPrice?: number;
	stopLossPrice?: number;
	trailingJump?: number;
}

export interface DhanOrderResponse {
	orderId: string;
	status: string;
	orderStatus: string;
}

export const placeDhanOrder = async (
	order: DhanOrderRequest,
	isSuperOrder: boolean,
): Promise<DhanOrderResponse> => {
	const response = await fetch(`${BASE_URL}/dhan/order`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ ...order, isSuperOrder }),
	});
	if (!response.ok) {
		const data = await response.json();
		throw new Error(data.error || "Failed to place order");
	}
	return response.json();
};

export interface DhanInstrument {
	securityId: string;
	tradingSymbol: string;
	companyName?: string;
	exchange: string;
	instrumentType: string;
}

export const fetchDhanInstruments = async (
	search?: string,
): Promise<DhanInstrument[]> => {
	if (!search) return [];
	const params = new URLSearchParams({ q: search });
	const response = await fetch(`${BASE_URL}/dhan/instruments/search?${params}`);
	if (!response.ok) throw new Error("Failed to search instruments");
	const data = await response.json();
	if (data.error) throw new Error(data.error);
	return Array.isArray(data) ? data : [];
};
