import {
	createRootRoute,
	createRoute,
	createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import AccountabilityFeed from "./pages/accountability/Feed";
import Onboarding from "./pages/accountability/Onboarding";
import WeeklySummaryPage from "./pages/accountability/WeeklySummary";
import Charts from "./pages/Charts";
import Dashboard from "./pages/Dashboard";
import DeepDive from "./pages/DeepDive";
import CheckIn from "./pages/discipline/CheckIn";
import DisciplineDashboard from "./pages/discipline/Dashboard";
import TradeLog from "./pages/discipline/TradeLog";
import WeeklyReview from "./pages/discipline/WeeklyReview";
import Goals from "./pages/Goals";
import Integrations from "./pages/Integrations";
import LivePositions from "./pages/LivePositions";
import Settings from "./pages/Settings";

const rootRoute = createRootRoute({
	component: Layout,
});

import { Navigate } from "@tanstack/react-router";
import { z } from "zod";
import { DhanIntegrationPage } from "./pages/Dhan";
import { DhanPortfolio } from "./pages/dhan/Portfolio";
import { DhanPositions } from "./pages/dhan/Positions";
import { DhanTrades } from "./pages/dhan/Trades";

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
	trade_type: z.string().optional(),
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

const goalsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/goals",
	component: Goals,
});

const deepDiveRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/deep-dive",
	component: DeepDive,
});

const livePositionsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/live-positions",
	component: LivePositions,
});

const disciplineRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/discipline",
	component: DisciplineDashboard,
});

const disciplineDashboardRoute = createRoute({
	getParentRoute: () => disciplineRoute,
	path: "checkin",
	component: CheckIn,
});

const disciplineLogRoute = createRoute({
	getParentRoute: () => disciplineRoute,
	path: "log/$sessionId",
	component: TradeLog,
});

const disciplineReviewRoute = createRoute({
	getParentRoute: () => disciplineRoute,
	path: "review",
	component: WeeklyReview,
});

const disciplineRouteWithChildren = disciplineRoute.addChildren([
	disciplineDashboardRoute,
	disciplineLogRoute,
	disciplineReviewRoute,
]);

const accountabilityRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/accountability",
	component: Onboarding,
});

const accountabilityOnboardingRoute = createRoute({
	getParentRoute: () => accountabilityRoute,
	path: "onboarding",
	component: Onboarding,
});

const accountabilityFeedRoute = createRoute({
	getParentRoute: () => accountabilityRoute,
	path: "feed",
	component: AccountabilityFeed,
});

const accountabilitySummaryRoute = createRoute({
	getParentRoute: () => accountabilityRoute,
	path: "weekly-summary",
	component: WeeklySummaryPage,
});

const accountabilityRouteWithChildren = accountabilityRoute.addChildren([
	accountabilityOnboardingRoute,
	accountabilityFeedRoute,
	accountabilitySummaryRoute,
]);

const dhanRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/dhan",
	component: DhanIntegrationPage,
});

const dhanPortfolioRoute = createRoute({
	getParentRoute: () => dhanRoute,
	path: "portfolio",
	component: DhanPortfolio,
});

const dhanTradesRoute = createRoute({
	getParentRoute: () => dhanRoute,
	path: "trades",
	component: DhanTrades,
});

const dhanPositionsRoute = createRoute({
	getParentRoute: () => dhanRoute,
	path: "positions",
	component: DhanPositions,
});

const dhanIndexRoute = createRoute({
	getParentRoute: () => dhanRoute,
	path: "/",
	component: () => <Navigate to="/dhan/portfolio" />,
});

const dhanRouteWithChildren = dhanRoute.addChildren([
	dhanIndexRoute,
	dhanPortfolioRoute,
	dhanTradesRoute,
	dhanPositionsRoute,
]);

const routeTree = rootRoute.addChildren([
	indexRoute,
	settingsRoute,
	chartsRoute,
	integrationsRoute,
	goalsRoute,
	livePositionsRoute,
	deepDiveRoute,
	disciplineRouteWithChildren,
	accountabilityRouteWithChildren,
	dhanRouteWithChildren,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
