import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createWatchlistItem,
	deleteWatchlistItem,
	fetchNseSymbols,
	fetchPrice,
	fetchWatchlist,
	type PriceData,
	updateWatchlistItem,
	type WatchlistItem,
} from "../api/client";

export const useWatchlist = () => {
	return useQuery<WatchlistItem[]>({
		queryKey: ["watchlist"],
		queryFn: fetchWatchlist,
	});
};

export const useCreateWatchlistItem = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (item: Omit<WatchlistItem, "_id">) => createWatchlistItem(item),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["watchlist"] });
		},
	});
};

export const useUpdateWatchlistItem = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, item }: { id: string; item: Partial<WatchlistItem> }) =>
			updateWatchlistItem(id, item),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["watchlist"] });
		},
	});
};

export const useDeleteWatchlistItem = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteWatchlistItem(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["watchlist"] });
		},
	});
};

export const usePrice = (
	symbol: string,
	exchange: string,
	refetchInterval = 30000,
) => {
	return useQuery<PriceData>({
		queryKey: ["price", symbol, exchange],
		queryFn: () => fetchPrice(symbol, exchange),
		refetchInterval,
		enabled: !!symbol && !!exchange,
		retry: 1,
	});
};

export const useSymbols = () => {
	return useQuery<string[]>({
		queryKey: ["nseSymbols"],
		queryFn: fetchNseSymbols,
		staleTime: 1000 * 60 * 60,
	});
};
