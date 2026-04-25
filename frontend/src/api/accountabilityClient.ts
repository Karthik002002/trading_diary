import type {
	getEnergyComplianceScatter,
	getRecentSessions,
	getSessionTypeBreakdown,
	getStreak,
	getTodaySession,
	getWeeklyCompliance,
	RecentSession,
	ScatterPoint,
	SessionTypeBreakdown,
	StreakData,
	TodaySessionData,
	WeeklyComplianceDay,
} from "./client";

const BASE_URL = "http://localhost:5000/api";

export type OnboardingData = {
	name: string;
	weekly_session_target: number;
	accountability_destination: "in_app" | "telegram" | "twitter";
	destination_config?: Record<string, string>;
	witness_name?: string;
	witness_contact?: string;
};

export type OnboardingStatus = {
	onboarding_complete: boolean;
	weekly_session_target?: number;
	accountability_destination?: string;
	witness_name?: string | null;
};

export type SessionCheckinData = {
	session_id: string;
	date: Date;
	session_type: string;
	energy_level: number;
	compliance_percent: number;
	self_reported: boolean | null;
	honesty_delta: number | null;
	generated_content?: string;
	published: boolean;
	published_at: Date | null;
};

export type FeedItem = {
	session_id: string;
	date: Date;
	session_type: string;
	energy_level: number;
	compliance_percent: number | null;
	self_reported: boolean | null;
	honesty_flag: boolean;
	published_at: Date | null;
};

export type WeeklySummary = {
	week_start: string;
	week_end: string;
	declared_sessions: number;
	actual_sessions: number;
	avg_compliance: string;
	avg_energy: string;
	honesty_score: string;
	generated_summary_text: string;
};

export type WitnessFeed = {
	user_name: string;
	witness_name: string | null;
	feed: {
		session_id: string;
		date: Date;
		session_type: string;
		energy_level: number;
		compliance_percent: number | null;
	}[];
	declared_sessions: number;
	actual_sessions: number;
};

export type HonestyLogEntry = {
	date: Date;
	compliance_percent: number;
	self_reported: boolean;
	delta: number;
};

export const createOnboarding = async (
	data: OnboardingData,
): Promise<{ user_id: string; onboarding_complete: boolean }> => {
	const response = await fetch(
		`${BASE_URL}/accountability/onboarding/commitment`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		},
	);
	if (!response.ok) throw new Error("Failed to create onboarding");
	return response.json();
};

export const getOnboardingStatus = async (
	userId: string,
): Promise<OnboardingStatus> => {
	const response = await fetch(
		`${BASE_URL}/accountability/onboarding/status?user_id=${userId}`,
	);
	if (!response.ok) throw new Error("Failed to get onboarding status");
	return response.json();
};

export const createSession = async (data: {
	user_id: string;
	time_of_day: string;
	energy_level: number;
	mental_state_tags: string[];
	plan_followed_self_report?: boolean;
}): Promise<{ session_id: string }> => {
	const response = await fetch(`${BASE_URL}/accountability/sessions/checkin`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});
	if (!response.ok) throw new Error("Failed to create session");
	return response.json();
};

export const addTradeToSession = async (
	sessionId: string,
	data: {
		instrument: string;
		timeframe: string;
		entry_reason: string;
		plan_match: boolean;
		outcome: string;
		note?: string;
		strategy_id: number;
	},
) => {
	const response = await fetch(
		`${BASE_URL}/accountability/sessions/${sessionId}/trade`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		},
	);
	if (!response.ok) throw new Error("Failed to add trade");
	return response.json();
};

export const closeSession = async (
	sessionId: string,
	data: {
		plan_followed_self_report: boolean;
		user_id: string;
	},
): Promise<{ generated_content: string; compliance_score: number }> => {
	const response = await fetch(
		`${BASE_URL}/accountability/sessions/${sessionId}/close`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		},
	);
	if (!response.ok) throw new Error("Failed to close session");
	return response.json();
};

export const publishSession = async (
	sessionId: string,
	data: { user_id: string; destination?: string },
) => {
	const response = await fetch(
		`${BASE_URL}/accountability/sessions/${sessionId}/publish`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		},
	);
	if (!response.ok) throw new Error("Failed to publish session");
	return response.json();
};

export const getAccountabilityFeed = async (
	userId: string,
): Promise<FeedItem[]> => {
	const response = await fetch(
		`${BASE_URL}/accountability/feed?user_id=${userId}`,
	);
	if (!response.ok) throw new Error("Failed to get feed");
	return response.json();
};

export const getWeeklySummary = async (
	userId: string,
): Promise<WeeklySummary> => {
	const response = await fetch(
		`${BASE_URL}/accountability/weekly-summary?user_id=${userId}`,
	);
	if (!response.ok) throw new Error("Failed to get weekly summary");
	return response.json();
};

export const publishWeeklySummary = async (data: {
	user_id: string;
	summary_text: string;
}) => {
	const response = await fetch(
		`${BASE_URL}/accountability/weekly-summary/publish`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		},
	);
	if (!response.ok) throw new Error("Failed to publish weekly summary");
	return response.json();
};

export const getWitnessFeed = async (token: string): Promise<WitnessFeed> => {
	const response = await fetch(`${BASE_URL}/accountability/witness/${token}`);
	if (!response.ok) throw new Error("Failed to get witness feed");
	return response.json();
};

export const getHonestyMonthlyReport = async (
	userId: string,
): Promise<HonestyLogEntry[]> => {
	const response = await fetch(
		`${BASE_URL}/honesty/monthly-report?user_id=${userId}`,
	);
	if (!response.ok) throw new Error("Failed to get honesty report");
	return response.json();
};

export const getCurrentCommitment = async (userId: string) => {
	const response = await fetch(
		`${BASE_URL}/commitments/current?user_id=${userId}`,
	);
	if (!response.ok) throw new Error("Failed to get commitment");
	return response.json();
};

export type {
	getTodaySession,
	getStreak,
	getWeeklyCompliance,
	getSessionTypeBreakdown,
	getEnergyComplianceScatter,
	getRecentSessions,
};
export type {
	getTodaySession,
	getStreak,
	getWeeklyCompliance,
	getSessionTypeBreakdown,
	getEnergyComplianceScatter,
	getRecentSessions,
};
export type {
	TodaySessionData,
	WeeklyComplianceDay,
	SessionTypeBreakdown,
	ScatterPoint,
	RecentSession,
	StreakData,
};
