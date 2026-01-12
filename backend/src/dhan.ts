export const DHAN_BASE_URL = "https://api.dhan.co/v2";

export const DHAN_ROUTES = {
	orders: "/orders",
	positions: "/positions",
	holdings: "/holdings",
	profile: "/profile",
	fundlimit: "/fundlimit",
} as const;

export const dhanUrl = (route: keyof typeof DHAN_ROUTES) =>
	`${DHAN_BASE_URL}${DHAN_ROUTES[route]}`;
