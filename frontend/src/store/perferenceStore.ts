import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TPreferenceStore = {
	defaultQuantity: string;
	setDefaultQuantity: (quantity: string) => void;
};

const preferenceStore = create<TPreferenceStore>()(
	persist(
		(set) => ({
			defaultQuantity: localStorage.getItem("defaultQuantity") || "",
			setDefaultQuantity: (quantity: string) =>
				set({ defaultQuantity: quantity }),
		}),
		{ name: "preferenceStore", storage: createJSONStorage(() => localStorage) },
	),
);

export const usePreferenceStore = () => {
	return preferenceStore();
};
