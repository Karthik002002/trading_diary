import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createTrade,
	deleteTrade,
	fetchPerformanceMetric,
	fetchPnlCalendar,
	fetchStrategies,
	fetchSymbols,
	fetchTrades,
	updateTrade,
	updateStrategy,
} from "../api/client";
import type {
	PnlCalendarDay,
	Strategy,
	Symbol,
	TFilters,
	Trade,
	TradeResponse,
} from "../types/api";

// Re-export types for convenience
export type { Trade, TradeResponse, Strategy, Symbol };

export const useTrades = (page: number, limit: number, filters?: TFilters) => {
	return useQuery<TradeResponse>({
		queryKey: ["trades", page, limit, filters],
		queryFn: () => fetchTrades(page, limit, filters),
		placeholderData: (previousData) => previousData,
	});
};

export const useInfiniteTrades = (limit: number, filters?: TFilters) => {
	return useInfiniteQuery<TradeResponse>({
		queryKey: ["trades", "infinite", limit, filters],
		queryFn: ({ pageParam = 1 }) =>
			fetchTrades(pageParam as number, limit, filters),
		getNextPageParam: (lastPage) => {
			const { page, pages } = lastPage.pagination;
			return page < pages ? page + 1 : undefined;
		},
		initialPageParam: 1,
	});
};

export const useCreateTrade = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTrade,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trades"] });
			queryClient.invalidateQueries({ queryKey: ["pnlCalendar"] });
		},
	});
};

export const useUpdateTrade = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: FormData }) =>
			updateTrade(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trades"] });
			queryClient.invalidateQueries({ queryKey: ["pnlCalendar"] });
		},
	});
};

export const useDeleteTrade = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteTrade,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["trades"] });
			queryClient.invalidateQueries({ queryKey: ["pnlCalendar"] });
		},
	});
};

export const useStrategies = () => {
	return useQuery<Strategy[]>({
		queryKey: ["strategies"],
		queryFn: fetchStrategies,
	});
};

export const useSymbols = () => {
	return useQuery<Symbol[]>({
		queryKey: ["symbols"],
		queryFn: fetchSymbols,
	});
};

export const usePnlCalendar = (
	month: number,
	year: number,
	filters?: TFilters,
) => {
	return useQuery<PnlCalendarDay[]>({
		queryKey: ["pnlCalendar", month, year, filters],
		queryFn: () => fetchPnlCalendar(month, year, filters),
	});
};

export const usePerformanceMetrics = ({
	filters,
}: {
	filters: Record<string, string>;
}) => {
	return useQuery({
		queryKey: ["performance-metric", filters],
		queryFn: () => fetchPerformanceMetric(filters),
	});
};

export const useUpdateStrategy = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }: { id: number; data: Partial<Strategy> }) =>
			updateStrategy(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["strategies"] });
		},
	});
};
