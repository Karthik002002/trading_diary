import { create } from "zustand";

interface FilterState {
	strategy_id: string | undefined;
	outcome: string | undefined;
	search: string | undefined;
	setFilters: (filters: Partial<FilterState>) => void;
	resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
	strategy_id: undefined,
	outcome: undefined,
	search: undefined,
	setFilters: (filters) => set((state) => ({ ...state, ...filters })),
	resetFilters: () =>
		set({ strategy_id: undefined, outcome: undefined, search: undefined }),
}));
