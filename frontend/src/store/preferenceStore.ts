import { message } from "antd";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
export type TDashboardDisplayState =
	| "winRate"
	| "avgRR"
	| "expectancy"
	| "consistencyScore"
	| "maxDrawdown"
	| "totalPnl"
	| "totalReturns"
	| "avgConfidence"
	| "bestTrade"
	| "worstTrade"
	| "maxPnl"
	| "minPnl";
export type TPreferenceStore = {
	defaultQuantity: string;
	setDefaultQuantity: (quantity: string) => void;
	dashboardDisplayState: Record<TDashboardDisplayState, boolean>;
	isMaxedOut: boolean;
	updateDashboardDisplayState: (
		state: TDashboardDisplayState,
		value: boolean,
	) => void;
	maxLoss: string;
	setMaxLoss: (maxLoss: string) => void;
};

const preferenceStore = create<TPreferenceStore>()(
	persist(
		(set) => ({
			defaultQuantity: localStorage.getItem("defaultQuantity") || "",
			setDefaultQuantity: (quantity: string) =>
				set({ defaultQuantity: quantity }),
			dashboardDisplayState: {
				// max 5 only
				winRate: true,
				avgRR: true,
				expectancy: true,
				consistencyScore: true,
				maxDrawdown: true,
				totalPnl: true,
				totalReturns: false,
				avgConfidence: false,
				bestTrade: false,
				worstTrade: false,
				maxPnl: false,
				minPnl: false,
			},
			isMaxedOut: false,
			updateDashboardDisplayState: (
				state: TDashboardDisplayState,
				value: boolean,
			) =>
				set((prev) => {
					const isMaxedOut =
						Object.values(prev.dashboardDisplayState).filter((v) => v).length >=
						7;
					if (isMaxedOut && value) {
						message.success("Max 7 metrics can be displayed at a time");
						set({ isMaxedOut: true });
						return {
							dashboardDisplayState: {
								...prev.dashboardDisplayState,
								[state]: false,
							},
						};
					}
					set({ isMaxedOut: false });
					return {
						dashboardDisplayState: {
							...prev.dashboardDisplayState,
							[state]: value,
						},
					};
				}),
			maxLoss: "",
			setMaxLoss: (maxLoss: string) => set({ maxLoss: maxLoss }),
		}),

		{
			name: "preferenceStore",
			version: 1.03,
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const usePreferenceStore = () => {
	return preferenceStore();
};
