export const DHAN_BASE_URL = "https://api.dhan.co/v2";

export const DHAN_ROUTES = {
	orders: "/orders",
	positions: "/positions",
	holdings: "/holdings",
	profile: "/profile",
	fundlimit: "/fundlimit",
	renewToken: "/RenewToken",
	trades: "/trades",
} as const;

export const dhanUrl = (route: keyof typeof DHAN_ROUTES) =>
	`${DHAN_BASE_URL}${DHAN_ROUTES[route]}`;

export type TDhanProfile = {
	dhanClientId: string;
	tokenValidity: string;
	activeSegment: string;
	ddpi: string;
	mtf: string;
	dataPlan: string;
	dataValidity: string;
};
