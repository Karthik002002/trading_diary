import { Router } from "express";
import mongoose from "mongoose";
import AccountabilityPost from "../models/accountabilityPost";
import DisciplineTrade from "../models/disciplineTrade";
import HonestyLog from "../models/honestyLog";
import Session from "../models/session";
import User from "../models/user";
import WeeklyCommitment from "../models/weeklyCommitment";

const router = Router();

const getWeekStart = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
};

const generateId = (prefix: string): string => {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

router.post("/onboarding/commitment", async (req, res) => {
	try {
		const {
			name,
			weekly_session_target,
			accountability_destination,
			destination_config,
			witness_contact,
			witness_name,
		} = req.body;

		if (!name || !weekly_session_target || !accountability_destination) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const witness_token = witness_contact ? generateId("wit") : null;

		const user = new User({
			user_id: generateId("user"),
			name,
			weekly_session_target,
			accountability_destination,
			accountability_destination_config: destination_config || {},
			witness_user_id: witness_contact ? generateId("wit_user") : null,
			witness_name: witness_name || null,
			witness_token,
			onboarding_complete: true,
		});

		await user.save();

		const week_start = getWeekStart(new Date());
		const commitment = new WeeklyCommitment({
			commitment_id: generateId("commit"),
			user_id: user.user_id,
			week_start_date: week_start,
			declared_session_count: weekly_session_target,
			actual_session_count: 0,
		});

		await commitment.save();

		res.status(201).json({
			user_id: user.user_id,
			onboarding_complete: true,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/onboarding/status", async (req, res) => {
	try {
		const userId = req.query.user_id as string;

		if (!userId) {
			res.status(400).json({ error: "user_id required" });
			return;
		}

		const user = await User.findOne({ user_id: userId });

		if (!user) {
			res.json({ onboarding_complete: false });
			return;
		}

		res.json({
			onboarding_complete: user.onboarding_complete,
			weekly_session_target: user.weekly_session_target,
			accountability_destination: user.accountability_destination,
			witness_name: user.witness_name,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/sessions/checkin", async (req, res) => {
	try {
		const {
			user_id,
			time_of_day,
			energy_level,
			mental_state_tags,
			plan_followed_self_report,
		} = req.body;

		if (!user_id || !time_of_day || !energy_level || !mental_state_tags) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const week_start = getWeekStart(new Date());
		const session_id = generateId("session");

		const session = new Session({
			session_id,
			user_id,
			date: new Date(),
			time_of_day,
			energy_level,
			mental_state_tags,
			trades: [],
			is_active: true,
			compliance_score: null,
			week_start,
			plan_followed_self_report: plan_followed_self_report ?? null,
			honesty_delta: null,
		});

		await session.save();

		const user = await User.findOne({ user_id });
		if (user) {
			const commitment = await WeeklyCommitment.findOne({
				user_id,
				week_start_date: week_start,
			});
			if (commitment) {
				commitment.actual_session_count += 1;
				await commitment.save();
			}
		}

		res.status(201).json({
			session_id,
			session,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/sessions/:sessionId/trade", async (req, res) => {
	try {
		const { sessionId } = req.params;
		const {
			instrument,
			timeframe,
			entry_reason,
			plan_match,
			outcome,
			note,
			strategy_id,
		} = req.body;

		const trade = new DisciplineTrade({
			session_id: sessionId,
			instrument,
			timeframe,
			entry_reason,
			plan_match,
			outcome,
			note,
			strategy_id,
			trade_timestamp: new Date(),
		});

		await trade.save();

		await Session.findOneAndUpdate(
			{ session_id: sessionId },
			{ $push: { trades: trade._id } },
		);

		res.status(201).json(trade);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/sessions/:sessionId/close", async (req, res) => {
	try {
		const { sessionId } = req.params;
		const { plan_followed_self_report, user_id } = req.body;

		const session = await Session.findOne({ session_id: sessionId });
		if (!session) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		const trades = await DisciplineTrade.find({ session_id: sessionId });
		const planMatched = trades.filter((t) => t.plan_match).length;
		const compliance_score =
			trades.length > 0 ? (planMatched / trades.length) * 100 : 0;

		let honesty_delta: number | null = null;
		if (
			plan_followed_self_report !== null &&
			plan_followed_self_report !== undefined
		) {
			const selfReportValue = plan_followed_self_report ? 100 : 0;
			honesty_delta = Math.abs(compliance_score - selfReportValue);

			if (user_id) {
				const honestyLog = new HonestyLog({
					log_id: generateId("log"),
					user_id,
					session_id: sessionId,
					compliance_percent: compliance_score,
					self_reported: plan_followed_self_report,
					delta: honesty_delta,
				});
				await honestyLog.save();
			}
		}

		session.is_active = false;
		session.compliance_score = compliance_score;
		session.plan_followed_self_report = plan_followed_self_report;
		session.honesty_delta = honesty_delta;
		await session.save();

		const sessionType = session.time_of_day.replace("-", " ");
		const planFollowedText = plan_followed_self_report === true ? "Yes" : "No";

		const generatedContent = `Session — ${sessionType} | Energy: ${session.energy_level}/10 | Compliance: ${compliance_score.toFixed(0)}% | Plan followed: ${planFollowedText}`;

		res.json({
			session,
			generated_content: generatedContent,
			compliance_score,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/sessions/:sessionId/publish", async (req, res) => {
	try {
		const { sessionId } = req.params;
		const { user_id, destination } = req.body;

		const session = await Session.findOne({ session_id: sessionId });
		if (!session) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		const user = await User.findOne({ user_id });
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const sessionType = session.time_of_day.replace("-", " ");
		const planFollowedText =
			session.plan_followed_self_report === true ? "Yes" : "No";

		const generatedContent = `Session — ${sessionType} | Energy: ${session.energy_level}/10 | Compliance: ${session.compliance_score?.toFixed(0)}% | Plan followed: ${planFollowedText}`;

		const post = new AccountabilityPost({
			post_id: generateId("post"),
			user_id,
			session_id: sessionId,
			post_type: "session",
			generated_content: generatedContent,
			destination: destination || user.accountability_destination,
		});

		await post.save();

		session.published = true;
		session.published_at = new Date();
		await session.save();

		res.json({ post, published: true });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/accountability/feed", async (req, res) => {
	try {
		const userId = req.query.user_id as string;

		if (!userId) {
			res.status(400).json({ error: "user_id required" });
			return;
		}

		const posts = await AccountabilityPost.find({
			user_id: userId,
			post_type: "session",
		}).sort({ created_at: -1 });

		const sessions = await Session.find({
			user_id: userId,
			published: true,
		}).sort({ createdAt: -1 });

		const feed = sessions.map((session) => ({
			session_id: session.session_id,
			date: session.date,
			session_type: session.time_of_day,
			energy_level: session.energy_level,
			compliance_percent: session.compliance_score,
			self_reported: session.plan_followed_self_report,
			honesty_flag: (session.honesty_delta ?? 0) > 15,
			published_at: session.published_at,
		}));

		res.json(feed);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/accountability/weekly-summary", async (req, res) => {
	try {
		const userId = req.query.user_id as string;

		if (!userId) {
			res.status(400).json({ error: "user_id required" });
			return;
		}

		const week_start = getWeekStart(new Date());
		const weekEnd = new Date(week_start);
		weekEnd.setDate(weekEnd.getDate() + 7);

		const commitment = await WeeklyCommitment.findOne({
			user_id: userId,
			week_start_date: week_start,
		});

		const sessions = await Session.find({
			user_id: userId,
			createdAt: { $gte: week_start, $lt: weekEnd },
		});

		const totalSessions = sessions.length;
		const avgCompliance =
			sessions.reduce((sum, s) => sum + (s.compliance_score || 0), 0) /
				totalSessions || 0;

		const avgEnergy =
			sessions.reduce((sum, s) => sum + s.energy_level, 0) / totalSessions || 0;

		const honestyLogs = await HonestyLog.find({
			user_id: userId,
		});
		const matchedHonesty = honestyLogs.filter((l) => l.delta <= 15).length;
		const honestyScore =
			honestyLogs.length > 0
				? (matchedHonesty / honestyLogs.length) * 100
				: 100;

		let summaryText = "";
		const declared = commitment?.declared_session_count || 0;
		if (totalSessions >= declared) {
			const above70 = sessions.filter(
				(s) => (s.compliance_score || 0) >= 70,
			).length;
			summaryText = `${totalSessions} of ${declared} committed sessions done. Compliance held above 70% on ${above70} of them.`;
		} else {
			const byType: Record<string, number> = {};
			for (const s of sessions) {
				byType[s.time_of_day] = (byType[s.time_of_day] || 0) + 1;
			}
			const worstType = Object.entries(byType).sort(
				(a, b) => a[1] - b[1],
			)[0]?.[0];
			if (worstType) {
				summaryText = `Missed ${declared - totalSessions} sessions. ${worstType.replace("-", " ")} compliance dropped to ${avgCompliance.toFixed(0)}% this week.`;
			}
		}

		res.json({
			week_start: week_start.toISOString(),
			week_end: weekEnd.toISOString(),
			declared_sessions: declared,
			actual_sessions: totalSessions,
			avg_compliance: avgCompliance.toFixed(1),
			avg_energy: avgEnergy.toFixed(1),
			honesty_score: honestyScore.toFixed(1),
			generated_summary_text: summaryText,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.post("/accountability/weekly-summary/publish", async (req, res) => {
	try {
		const { user_id, summary_text } = req.body;

		if (!user_id || !summary_text) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const user = await User.findOne({ user_id });
		if (!user) {
			res.status(404).json({ error: "User not found" });
			return;
		}

		const week_start = getWeekStart(new Date());

		const post = new AccountabilityPost({
			post_id: generateId("post"),
			user_id,
			post_type: "weekly_summary",
			generated_content: summary_text,
			destination: user.accountability_destination,
		});

		await post.save();

		const commitment = await WeeklyCommitment.findOne({
			user_id,
			week_start_date: week_start,
		});
		if (commitment) {
			commitment.published = true;
			await commitment.save();
		}

		res.json({ post, published: true });
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/accountability/witness/:token", async (req, res) => {
	try {
		const { token } = req.params;

		const user = await User.findOne({ witness_token: token });
		if (!user) {
			res.status(404).json({ error: "Invalid witness token" });
			return;
		}

		const week_start = getWeekStart(new Date());

		const sessions = await Session.find({
			user_id: user.user_id,
			published: true,
		}).sort({ createdAt: -1 });

		const feed = sessions.map((session) => ({
			session_id: session.session_id,
			date: session.date,
			session_type: session.time_of_day,
			energy_level: session.energy_level,
			compliance_percent: session.compliance_score,
		}));

		const commitment = await WeeklyCommitment.findOne({
			user_id: user.user_id,
			week_start_date: week_start,
		});

		res.json({
			user_name: user.name,
			witness_name: user.witness_name,
			feed,
			declared_sessions: commitment?.declared_session_count || 0,
			actual_sessions: commitment?.actual_session_count || 0,
		});
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/honesty/monthly-report", async (req, res) => {
	try {
		const userId = req.query.user_id as string;

		if (!userId) {
			res.status(400).json({ error: "user_id required" });
			return;
		}

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const logs = await HonestyLog.find({
			user_id: userId,
			created_at: { $gte: thirtyDaysAgo },
		}).sort({ created_at: -1 });

		const report = logs.map((log) => ({
			date: log.created_at,
			compliance_percent: log.compliance_percent,
			self_reported: log.self_reported,
			delta: log.delta,
		}));

		res.json(report);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

router.get("/commitments/current", async (req, res) => {
	try {
		const userId = req.query.user_id as string;

		if (!userId) {
			res.status(400).json({ error: "user_id required" });
			return;
		}

		const week_start = getWeekStart(new Date());

		const commitment = await WeeklyCommitment.findOne({
			user_id: userId,
			week_start_date: week_start,
		});

		if (!commitment) {
			res.status(404).json({ error: "No commitment found for this week" });
			return;
		}

		res.json(commitment);
	} catch (error) {
		res.status(500).json({ error: (error as Error).message });
	}
});

export default router;
