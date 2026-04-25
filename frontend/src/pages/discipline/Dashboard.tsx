import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import {
	getEnergyComplianceScatter,
	getRecentSessions,
	getSessionTypeBreakdown,
	getStreak,
	getTodaySession,
	getWeeklyCompliance,
	type RecentSession,
	type ScatterPoint,
	type SessionTypeBreakdown,
	type StreakData,
	type TodaySessionData,
	type WeeklyComplianceDay,
} from "../../api/client";

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
	const navigate = useNavigate();
	const [todaySession, setTodaySession] = useState<TodaySessionData | null>(
		null,
	);
	const [streak, setStreak] = useState<StreakData | null>(null);
	const [weeklyCompliance, setWeeklyCompliance] = useState<
		WeeklyComplianceDay[]
	>([]);
	const [sessionBreakdown, setSessionBreakdown] = useState<
		SessionTypeBreakdown[]
	>([]);
	const [scatterData, setScatterData] = useState<ScatterPoint[]>([]);
	const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const [today, streakData, weekly, breakdown, scatter, recent] =
					await Promise.all([
						getTodaySession(),
						getStreak(),
						getWeeklyCompliance(),
						getSessionTypeBreakdown(),
						getEnergyComplianceScatter(),
						getRecentSessions(),
					]);
				setTodaySession(today);
				setStreak(streakData);
				setWeeklyCompliance(weekly);
				setSessionBreakdown(breakdown);
				setScatterData(scatter);
				setRecentSessions(recent);
			} catch (error) {
				console.error("Failed to load dashboard:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	const worstTypeIndex = sessionBreakdown.reduce(
		(bestIdx, _, idx, arr) =>
			arr[idx].avg_compliance_30d < arr[bestIdx].avg_compliance_30d
				? idx
				: bestIdx,
		0,
	);

	if (isLoading) {
		return (
			<div className="p-4">
				<Text>Loading...</Text>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<Title level={2}>Discipline Dashboard</Title>

			<Card className="mb-4">
				{!todaySession ? (
					<div className="text-center py-8">
						<Text className="text-lg text-gray-400 block mb-4">
							No session logged today
						</Text>
						<Button
							type="primary"
							size="large"
							onClick={() => navigate({ to: "/discipline/checkin" })}
						>
							Start Check-in
						</Button>
					</div>
				) : (
					<div className="flex flex-wrap items-center gap-4">
						<Text className="text-5xl font-bold">
							{todaySession.energy_level}
							<Text type="secondary" className="text-lg">
								/10
							</Text>
						</Text>
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<span className="px-2 py-1 bg-blue-600 rounded text-xs text-white">
									{todaySession.session_type}
								</span>
								<span className="px-2 py-1 bg-green-600 rounded text-xs text-white">
									{todaySession.compliance_percent.toFixed(0)}%
								</span>
							</div>
							<div className="flex gap-1">
								{todaySession.mental_state_tags.map((tag) => (
									<span
										key={tag}
										className="px-2 py-0.5 bg-gray-700 rounded text-xs"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					</div>
				)}
			</Card>

			<Card className="mb-4">
				<Text strong className="block mb-1">
					Discipline Streak
				</Text>
				<Text className="text-4xl font-bold block">
					{streak?.current_streak ?? 0}
				</Text>
				<Text type="secondary" className="block">
					{streak?.current_streak
						? "consecutive sessions with 100% rule compliance"
						: "Start your streak today"}
				</Text>
				<Text type="secondary" className="text-sm block mt-2">
					Personal best: {streak?.best_streak ?? 0} sessions
				</Text>
			</Card>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
				<Card>
					<Text strong className="block mb-4">
						Weekly Compliance
					</Text>
					<div className="flex justify-between items-end h-32 gap-1">
						{weeklyCompliance.map((day) => (
							<div key={day.day} className="flex-1 flex flex-col items-center">
								<Tooltip
									title={
										day.session_exists
											? `${day.compliance_percent.toFixed(0)}%`
											: "No session"
									}
								>
									<div
										className="w-full rounded-t"
										style={{
											height: day.session_exists
												? `${Math.max(day.compliance_percent, 5)}%`
												: "2px",
											backgroundColor: day.session_exists
												? day.compliance_percent >= 60
													? "#3b82f6"
													: "#6b7280"
												: "transparent",
											minHeight: day.session_exists ? "4px" : "2px",
										}}
									/>
								</Tooltip>
								<Text type="secondary" className="text-xs mt-1">
									{day.day}
								</Text>
							</div>
						))}
					</div>
				</Card>

				<Card>
					<Text strong className="block mb-4">
						Session Type Breakdown (30d)
					</Text>
					<div className="space-y-3">
						{sessionBreakdown.map((type, idx) => (
							<div
								key={type.session_type}
								className={
									idx === worstTypeIndex ? "p-2 rounded bg-orange-50/10" : ""
								}
							>
								<div className="flex justify-between mb-1">
									<Text className="capitalize">
										{type.session_type.replace("-", " ")}
									</Text>
									<Text>{type.avg_compliance_30d.toFixed(0)}%</Text>
								</div>
								<div className="h-2 bg-gray-700 rounded overflow-hidden">
									<div
										className="h-full bg-blue-500 rounded"
										style={{ width: `${type.avg_compliance_30d}%` }}
									/>
								</div>
								<Text type="secondary" className="text-xs">
									{type.session_count_30d} sessions
								</Text>
							</div>
						))}
					</div>
				</Card>
			</div>

			<Card className="mb-4">
				<Text strong className="block mb-4">
					Energy vs Compliance Scatter (60d)
				</Text>
				<div className="relative h-48">
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-full">
							<div className="flex justify-between px-6">
								{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
									<div key={level} className="flex-1 relative">
										{scatterData
											.filter((d) => d.energy_level === level)
											.map((d, idx) => (
												<Tooltip
													key={`${d.date}-${idx}`}
													title={`${d.date} ${d.session_type} - ${d.compliance_percent}%`}
												>
													<div
														className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2"
														style={{
															left: `${((level - 1) / 9) * 100}%`,
															top: `${100 - d.compliance_percent}%`,
															backgroundColor:
																d.compliance_percent >= 60
																	? "#3b82f6"
																	: "#ef4444",
														}}
													/>
												</Tooltip>
											))}
									</div>
								))}
							</div>
						</div>
					</div>
					<div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
						<Text type="secondary" className="text-xs">
							Energy 1
						</Text>
						<Text type="secondary" className="text-xs">
							Energy 10
						</Text>
					</div>
					<div className="absolute left-2 top-0 bottom-8 flex flex-col justify-between">
						<Text type="secondary" className="text-xs">
							100%
						</Text>
						<Text type="secondary" className="text-xs">
							0%
						</Text>
					</div>
				</div>
			</Card>

			<Card>
				<Text strong className="block mb-4">
					Last 5 Sessions
				</Text>
				<div className="space-y-2">
					{recentSessions.length === 0 ? (
						<Text type="secondary">No sessions yet</Text>
					) : (
						recentSessions.map((session, idx) => (
							<div
								key={`${session.date}-${idx}`}
								className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
							>
								<div>
									<Text>{session.date}</Text>
									<Text type="secondary" className="ml-2 capitalize">
										{session.session_type.replace("-", " ")}
									</Text>
								</div>
								<div className="flex items-center gap-4">
									<Text>{session.energy_level}</Text>
									<Text
										className={
											session.compliance_percent >= 60
												? "text-blue-400"
												: "text-red-400"
										}
									>
										{session.compliance_percent}%
									</Text>
								</div>
							</div>
						))
					)}
				</div>
			</Card>
		</div>
	);
};

export default Dashboard;
