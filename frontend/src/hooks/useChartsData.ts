import { useQuery } from "@tanstack/react-query";
import { fetchEmotionalTreemap, fetchTradeHeatmap, fetchWinLossPieChart } from "../api/client";
import type { TFilters } from "../types/api";

export const useTradeHeatmap = (filters?: TFilters) => {
    return useQuery({
        queryKey: ["trade-heatmap", filters],
        queryFn: () => fetchTradeHeatmap(filters),
    });
};

export const useEmotionalTreemap = (filters?: TFilters) => {
    return useQuery({
        queryKey: ["emotional-treemap", filters],
        queryFn: () => fetchEmotionalTreemap(filters),
    });
};


export const useWinLossPieChart = (filters?: TFilters) => {
    return useQuery({
        queryKey: ["win-loss-pie-chart", filters],
        queryFn: () => fetchWinLossPieChart(filters),
    });
};