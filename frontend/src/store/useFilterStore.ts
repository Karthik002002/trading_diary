import { create } from "zustand";
import type { TFilters } from "../types/api";

interface FilterState extends TFilters {
	setFilters: (filters: Partial<TFilters>) => void;
	resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
	strategy_id: undefined,
	outcome: undefined,
	search: undefined,
	symbol: undefined,
	portfolio_id: undefined,
	status: undefined,
	tags: undefined,
	from: undefined,
	to: undefined,
	setFilters: (filters) => set((state) => ({ ...state, ...filters })),
	resetFilters: () =>
		set({
			strategy_id: undefined,
			outcome: undefined,
			search: undefined,
			symbol: undefined,
			portfolio_id: undefined,
			status: undefined,
			tags: undefined,
			from: undefined,
			to: undefined,
		}),
}));
