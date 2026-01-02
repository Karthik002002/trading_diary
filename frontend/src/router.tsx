import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

const rootRoute = createRootRoute({
	component: Layout,
});

import { z } from "zod";

const dashboardSearchSchema = z.object({
	page: z.number().optional().default(1),
	limit: z.number().optional().default(20),
	strategy_id: z.number().optional(),
	outcome: z.string().optional(),
	search: z.string().optional(),
	from: z.string().optional(),
	to: z.string().optional(),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Dashboard,
	validateSearch: dashboardSearchSchema,
});

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings",
	component: Settings,
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
