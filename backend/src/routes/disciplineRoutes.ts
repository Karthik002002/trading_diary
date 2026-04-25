import { Router } from "express";
import mongoose from "mongoose";
import DisciplineTrade from "../models/disciplineTrade";
import Session from "../models/session";
import TradingRule from "../models/tradingRule";

const router = Router();

const getWeekStart = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

const generateSessionId = (): string => {
	return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

router.post("/sessions", async (req, res) => {
	try {
		const { time_of_day, energy_level, mental_state_tags } = req.body;

		if (!time_of_day || !energy_level || !mental_state_tags) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const week_start = getWeekStart(new Date());
		const session_id = generateSessionId();

		const session = new Session({
			session_id,
			date: new Date(),
			time_of_day,
			energy_level,
			mental_state_tags,
			trades: [],
			is_active: true,
			week_start,
		});

		await session.save();
		res.status(201).json(session);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/sessions/active", async (req, res) => {
	try {
		const session = await Session.findOne({ is_active: true }).sort({
			createdAt: -1,
		});
		if (!session) {
			res.status(404).json({ error: "No active session" });
			return;
		}
		res.json(session);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/sessions/:sessionId/end", async (req, res) => {
	try {
		const { sessionId } = req.params;

		const session = await Session.findOne({ session_id: sessionId });
		if (!session) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		const trades = await DisciplineTrade.find({ session_id: sessionId });
		const planMatched = trades.filter((t) => t.plan_match).length;
		const compliance_score =
			trades.length > 0 ? (planMatched / trades.length) * 100 : 0;

		session.is_active = false;
		session.compliance_score = compliance_score;
		await session.save();

		res.json({ session, compliance_score });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/trades", async (req, res) => {
	try {
		const {
			session_id,
			instrument,
			timeframe,
			entry_reason,
			rule_id,
			plan_match,
			outcome,
			note,
			strategy_id,
		} = req.body;

		if (
			!session_id ||
			!instrument ||
			!timeframe ||
			!entry_reason ||
			!outcome ||
			!strategy_id
		) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const trade = new DisciplineTrade({
			session_id,
			instrument,
			timeframe,
			entry_reason,
			rule_id: rule_id || null,
			plan_match: plan_match || false,
			outcome,
			note: note || null,
			trade_timestamp: new Date(),
			strategy_id,
		});

		await trade.save();

		await Session.findOneAndUpdate(
			{ session_id },
			{ $push: { trades: trade._id } },
		);

		res.status(201).json(trade);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/trades/:sessionId", async (req, res) => {
	try {
		const { sessionId } = req.params;
		const trades = await DisciplineTrade.find({ session_id: sessionId });
		res.json(trades);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/rules", async (req, res) => {
	try {
		const { name, description, strategy_id } = req.body;

		if (!name || !description || !strategy_id) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const rule_id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const rule = new TradingRule({
			rule_id,
			name,
			description,
			strategy_id,
			is_active: true,
		});

		await rule.save();
		res.status(201).json(rule);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/rules/:strategyId", async (req, res) => {
	try {
		const { strategyId } = req.params;
		const rules = await TradingRule.find({
			strategy_id: Number(strategyId),
			is_active: true,
		});
		res.json(rules);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/weekly", async (req, res) => {
	try {
		const week_start = getWeekStart(new Date());

		const sessions = await Session.find({ week_start });
		const sessionIds = sessions.map((s) => s.session_id);

		const trades = await DisciplineTrade.find({
			session_id: { $in: sessionIds },
		});

		const totalTrades = trades.length;
		const planMatched = trades.filter((t) => t.plan_match).length;
		const weeklyCompliance =
			totalTrades > 0 ? (planMatched / totalTrades) * 100 : 0;

		const complianceByTimeOfDay: Record<string, number> = {};
		const winRateByEnergyBracket: Record<
			string,
			{ wins: number; total: number }
		> = {};

		for (const session of sessions) {
			const sessionTrades = trades.filter(
				(t) => t.session_id === session.session_id,
			);
			const matched = sessionTrades.filter((t) => t.plan_match).length;
			const compliance =
				sessionTrades.length > 0 ? (matched / sessionTrades.length) * 100 : 0;

			complianceByTimeOfDay[session.time_of_day] =
				(complianceByTimeOfDay[session.time_of_day] || 0) + compliance;

			const energyBracket =
				session.energy_level <= 4
					? "1-4"
					: session.energy_level <= 7
						? "5-7"
						: "8-10";

			if (!winRateByEnergyBracket[energyBracket]) {
				winRateByEnergyBracket[energyBracket] = { wins: 0, total: 0 };
			}

			for (const trade of sessionTrades) {
				winRateByEnergyBracket[energyBracket].total += 1;
				if (trade.outcome === "win") {
					winRateByEnergyBracket[energyBracket].wins += 1;
				}
			}
		}

		const avgComplianceByTimeOfDay: Record<string, number> = {};
		const timeOfDayCounts: Record<string, number> = {};
		for (const [time, compliance] of Object.entries(complianceByTimeOfDay)) {
			timeOfDayCounts[time] = (timeOfDayCounts[time] || 0) + 1;
			avgComplianceByTimeOfDay[time] =
				((avgComplianceByTimeOfDay[time] || 0) + compliance) /
				timeOfDayCounts[time];
		}

		const streak = await calculateStreak(sessions);

		res.json({
			weeklyCompliance,
			totalTrades,
			planMatched,
			complianceByTimeOfDay: avgComplianceByTimeOfDay,
			winRateByEnergyBracket,
			streak,
			sessions,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

async function calculateStreak(sessions: any[]): Promise<number> {
	let streak = 0;
	const sortedSessions = [...sessions].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	for (const session of sortedSessions) {
		if (session.compliance_score === 100) {
			streak += 1;
		} else {
			break;
		}
	}

	return streak;
}

router.get("/warnings/block/:sessionType", async (req, res) => {
	try {
		const { sessionType } = req.params;

		const fiveWeeksAgo = new Date();
		fiveWeeksAgo.setDate(fiveWeeksAgo.getDate() - 35);

		const sessions = await Session.find({
			time_of_day: sessionType,
			createdAt: { $gte: fiveWeeksAgo },
		})
			.sort({ createdAt: -1 })
			.limit(5);

		if (sessions.length < 5) {
			res.json({ shouldWarn: false, sessions: [] });
			return;
		}

		const recentFive = sessions.slice(0, 5);
		const avgCompliance =
			recentFive.reduce((sum, s) => sum + (s.compliance_score || 0), 0) / 5;

		res.json({
			shouldWarn: avgCompliance < 60,
			compliance: avgCompliance,
			sessions: recentFive,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/weekly-review", async (req, res) => {
	try {
		const now = new Date();
		const weekStart = getWeekStart(now);
		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);

		const sessions = await Session.find({
			createdAt: { $gte: weekStart, $lt: weekEnd },
		});

		const sessionIds = sessions.map((s) => s.session_id);
		const trades = await DisciplineTrade.find({
			session_id: { $in: sessionIds },
		});

		const complianceByTimeOfDay: Record<
			string,
			{ total: number; matched: number }
		> = {};
		const energyData: Record<string, { wins: number; total: number }> = {};

		for (const session of sessions) {
			const sessionTrades = trades.filter(
				(t) => t.session_id === session.session_id,
			);

			if (!complianceByTimeOfDay[session.time_of_day]) {
				complianceByTimeOfDay[session.time_of_day] = { total: 0, matched: 0 };
			}

			for (const trade of sessionTrades) {
				complianceByTimeOfDay[session.time_of_day].total += 1;
				if (trade.plan_match) {
					complianceByTimeOfDay[session.time_of_day].matched += 1;
				}

				const bracket =
					session.energy_level <= 4
						? "1-4"
						: session.energy_level <= 7
							? "5-7"
							: "8-10";

				if (!energyData[bracket]) {
					energyData[bracket] = { wins: 0, total: 0 };
				}
				energyData[bracket].total += 1;
				if (trade.outcome === "win") {
					energyData[bracket].wins += 1;
				}
			}
		}

		let bestType = "";
		let worstType = "";
		let bestCompliance = 0;
		let worstCompliance = 101;

		for (const [type, data] of Object.entries(complianceByTimeOfDay)) {
			const compliance = data.total > 0 ? (data.matched / data.total) * 100 : 0;
			if (compliance > bestCompliance) {
				bestCompliance = compliance;
				bestType = type;
			}
			if (compliance < worstCompliance) {
				worstCompliance = compliance;
				worstType = type;
			}
		}

		const violations = trades.filter((t) => !t.plan_match);
		let patternCallout: string | null = null;

		const hourCounts: Record<number, number> = {};
		for (const trade of violations) {
			const hour = new Date(trade.trade_timestamp).getHours();
			hourCounts[hour] = (hourCounts[hour] || 0) + 1;
		}

		let maxHour = -1;
		let maxCount = 0;
		for (const [hour, count] of Object.entries(hourCounts)) {
			if (count > maxCount) {
				maxCount = count;
				maxHour = Number(hour);
			}
		}

		if (maxCount >= 2) {
			patternCallout = `${maxCount} of your ${violations.length} rule violations happened at ${maxHour}:00`;
		}

		res.json({
			bestSessionType: bestType,
			worstSessionType: worstType,
			patternCallout,
			totalSessions: sessions.length,
			totalTrades: trades.length,
			violations: violations.length,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/today", async (req, res) => {
	try {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		const session = await Session.findOne({
			createdAt: { $gte: today, $lt: tomorrow },
		}).sort({ createdAt: -1 });

		if (!session) {
			res.json(null);
			return;
		}

		const trades = await DisciplineTrade.find({
			session_id: session.session_id,
		});
		const planMatched = trades.filter((t) => t.plan_match).length;
		const compliance =
			trades.length > 0 ? (planMatched / trades.length) * 100 : 0;

		res.json({
			session_id: session.session_id,
			energy_level: session.energy_level,
			session_type: session.time_of_day,
			mental_state_tags: session.mental_state_tags,
			compliance_percent: compliance,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/streak", async (req, res) => {
	try {
		const sessions = await Session.find({ is_active: false })
			.sort({ createdAt: -1 })
			.limit(100);

		let currentStreak = 0;
		let bestStreak = 0;
		let tempStreak = 0;

		for (const session of sessions) {
			if (session.compliance_score === 100) {
				tempStreak += 1;
				if (currentStreak === 0) {
					currentStreak = tempStreak;
				}
			} else {
				if (tempStreak > bestStreak) {
					bestStreak = tempStreak;
				}
				tempStreak = 0;
				if (currentStreak > 0) {
					break;
				}
			}
		}

		if (tempStreak > bestStreak) {
			bestStreak = tempStreak;
		}

		res.json({
			current_streak: currentStreak,
			best_streak: bestStreak,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/weekly-compliance", async (req, res) => {
	try {
		const today = new Date();
		const day = today.getDay();
		const diff = today.getDate() - day + (day === 0 ? -6 : 1);
		const weekStart = new Date(today);
		weekStart.setDate(diff);
		weekStart.setHours(0, 0, 0, 0);

		const weekEnd = new Date(weekStart);
		weekEnd.setDate(weekEnd.getDate() + 7);

		const sessions = await Session.find({
			createdAt: { $gte: weekStart, $lt: weekEnd },
		});

		const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
		const result = [];

		for (let i = 0; i < 7; i++) {
			const dayStart = new Date(weekStart);
			dayStart.setDate(dayStart.getDate() + i);
			const dayEnd = new Date(dayStart);
			dayEnd.setDate(dayEnd.getDate() + 1);

			const daySession = sessions.find((s) => {
				const sessionDate = new Date(s.createdAt);
				return sessionDate >= dayStart && sessionDate < dayEnd;
			});

			if (daySession) {
				result.push({
					day: days[i],
					compliance_percent: daySession.compliance_score || 0,
					session_exists: true,
				});
			} else {
				result.push({
					day: days[i],
					compliance_percent: 0,
					session_exists: false,
				});
			}
		}

		res.json(result);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/session-type-breakdown", async (req, res) => {
	try {
		const ThirtyDaysAgo = new Date();
		ThirtyDaysAgo.setDate(ThirtyDaysAgo.getDate() - 30);

		const sessions = await Session.find({
			createdAt: { $gte: ThirtyDaysAgo },
		});

		const typeData: Record<
			string,
			{ total: number; matched: number; count: number }
		> = {};

		for (const session of sessions) {
			const type = session.time_of_day;
			if (!typeData[type]) {
				typeData[type] = { total: 0, matched: 0, count: 0 };
			}

			const trades = await DisciplineTrade.find({
				session_id: session.session_id,
			});

			typeData[type].count += 1;
			for (const trade of trades) {
				typeData[type].total += 1;
				if (trade.plan_match) {
					typeData[type].matched += 1;
				}
			}
		}

		const result = [];
		const types = ["morning", "post-work", "post-gym"];

		for (const type of types) {
			const data = typeData[type];
			const avg_compliance =
				data && data.total > 0 ? (data.matched / data.total) * 100 : 0;

			result.push({
				session_type: type,
				avg_compliance_30d: Math.round(avg_compliance * 10) / 10,
				session_count_30d: data?.count || 0,
			});
		}

		res.json(result);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/energy-compliance-scatter", async (req, res) => {
	try {
		const sixtyDaysAgo = new Date();
		sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

		const sessions = await Session.find({
			createdAt: { $gte: sixtyDaysAgo },
		}).sort({ createdAt: 1 });

		const result = [];

		for (const session of sessions) {
			const trades = await DisciplineTrade.find({
				session_id: session.session_id,
			});

			const planMatched = trades.filter((t) => t.plan_match).length;
			const compliance =
				trades.length > 0 ? (planMatched / trades.length) * 100 : 0;

			result.push({
				date: session.createdAt.toISOString().split("T")[0],
				session_type: session.time_of_day,
				energy_level: session.energy_level,
				compliance_percent: Math.round(compliance),
			});
		}

		res.json(result);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/dashboard/recent-sessions", async (req, res) => {
	try {
		const sessions = await Session.find({ is_active: false })
			.sort({ createdAt: -1 })
			.limit(5);

		const result = [];

		for (const session of sessions) {
			const trades = await DisciplineTrade.find({
				session_id: session.session_id,
			});

			const planMatched = trades.filter((t) => t.plan_match).length;
			const compliance =
				trades.length > 0 ? (planMatched / trades.length) * 100 : 0;

			result.push({
				date: session.createdAt.toISOString().split("T")[0],
				session_type: session.time_of_day,
				energy_level: session.energy_level,
				compliance_percent: Math.round(compliance),
			});
		}

		res.json(result);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

export default router;
