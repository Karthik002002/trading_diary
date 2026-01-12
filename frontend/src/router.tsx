import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Charts from "./pages/Charts";
import Integrations from "./pages/Integrations";

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
	portfolio_id: z.number().optional(),
	symbol: z.number().optional(),
	status: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: Dashboard,
	validateSearch: dashboardSearchSchema,
	// beforeLoad: ({ search }) => {
	// 	const { dataPreference } = preferenceStore.getState();

	// 	console.log(dataPreference)
	// 	if (!search.strategy_id) {
	// 		search.strategy_id = Number(dataPreference.strategy_id);
	// 	}


	// 	if (!search.port) {
	// 		search.strategy_id = Number(search.strategy_id);
	// 	}

	// 	return { search };
	// },
});

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings",
	component: Settings,

});

const chartsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/charts",
	component: Charts,
	validateSearch: dashboardSearchSchema,
});

const integrationsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/integrations",
	component: Integrations,
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, chartsRoute, integrationsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
