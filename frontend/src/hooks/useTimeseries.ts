import { useQuery } from "@tanstack/react-query";
import { fetchTimeseries } from "../api/client";
import type { TFilters } from "../types/api";

export const useTimeseries = (filters?: TFilters) => {
    return useQuery({
        queryKey: ["timeseries", filters],
        queryFn: () => fetchTimeseries(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
