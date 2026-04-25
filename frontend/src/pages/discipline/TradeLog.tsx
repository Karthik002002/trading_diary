import { useNavigate, useParams } from "@tanstack/react-router";
import { Button, Card, Input, message, Radio, Select, Typography } from "antd";
import { useEffect, useState } from "react";
import {
	createDisciplineTrade,
	type DisciplineTradeData,
	endSession,
	getActiveSession,
	getSessionTrades,
	getTradingRules,
	type SessionData,
	type TradingRuleData,
} from "@/api/client";

const { Title, Text } = Typography;
const { TextArea } = Input;

const TIMEFRAME_OPTIONS = [
	"1m",
	"5m",
	"15m",
	"30m",
	"1h",
	"4h",
	"1D",
	"1W",
] as const;

const OUTCOME_OPTIONS = [
	{ label: "Win", value: "win" },
	{ label: "Loss", value: "loss" },
	{ label: "Breakeven", value: "breakeven" },
] as const;

const TradeLog: React.FC = () => {
	const navigate = useNavigate();
	const { sessionId } = useParams({ from: "/discipline/log/$sessionId" });
	const [session, setSession] = useState<SessionData | null>(null);
	const [trades, setTrades] = useState<DisciplineTradeData[]>([]);
	const [rules, setRules] = useState<TradingRuleData[]>([]);
	const [selectedStrategyId, setSelectedStrategyId] = useState<number>(1);

	const [instrument, setInstrument] = useState("");
	const [timeframe, setTimeframe] = useState("15m");
	const [entryReason, setEntryReason] = useState("");
	const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
	const [planMatch, setPlanMatch] = useState<boolean>(true);
	const [outcome, setOutcome] = useState<"win" | "loss" | "breakeven">("win");
	const [note, setNote] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isEnding, setIsEnding] = useState(false);

	useEffect(() => {
		const loadSessionData = async () => {
			const activeSession = await getActiveSession();
			if (activeSession) {
				setSession(activeSession);
				const sessionTrades = await getSessionTrades(activeSession.session_id);
				setTrades(sessionTrades);
			}
			const fetchedRules = await getTradingRules(selectedStrategyId);
			setRules(fetchedRules);
		};
		loadSessionData();
	}, [selectedStrategyId]);

	const handleAddTrade = async () => {
		if (!instrument || !entryReason || !outcome) {
			message.error("Please fill in required fields");
			return;
		}

		setIsLoading(true);
		try {
			const currentSessionId = session?.session_id || sessionId;
			const newTrade = await createDisciplineTrade({
				session_id: currentSessionId,
				instrument,
				timeframe,
				entry_reason: entryReason,
				rule_id: selectedRuleId || undefined,
				plan_match: planMatch,
				outcome,
				note: note || undefined,
				strategy_id: selectedStrategyId,
			});
			setTrades((prev) => [...prev, newTrade]);
			setInstrument("");
			setEntryReason("");
			setNote("");
			setPlanMatch(true);
			message.success("Trade logged");
		} catch (error) {
			console.error("Failed to log trade:", error);
			message.error("Failed to log trade");
		} finally {
			setIsLoading(false);
		}
	};

	const handleEndSession = async () => {
		setIsEnding(true);
		try {
			const currentSessionId = session?.session_id || sessionId;
			await endSession(currentSessionId);
			navigate({ to: "/discipline/dashboard" });
		} catch (error) {
			console.error("Failed to end session:", error);
			message.error("Failed to end session");
		} finally {
			setIsEnding(false);
		}
	};

	const matchCount = trades.filter((t) => t.plan_match).length;
	const compliance =
		trades.length > 0 ? Math.round((matchCount / trades.length) * 100) : 0;

	return (
		<div className="p-4 max-w-lg mx-auto">
			<div className="flex justify-between items-center mb-4">
				<Title level={3}>Trade Log</Title>
				<Button danger onClick={handleEndSession} loading={isEnding}>
					End Session
				</Button>
			</div>

			{session && (
				<Card size="small" className="mb-4">
					<div className="flex justify-between text-sm">
						<Text type="secondary">
							{session.time_of_day} | Energy: {session.energy_level}/10
						</Text>
						<Text>
							Compliance: {compliance}% ({matchCount}/{trades.length})
						</Text>
					</div>
				</Card>
			)}

			<Card className="mb-4">
				<Text strong className="block mb-2">
					Instrument *
				</Text>
				<Input
					placeholder="e.g., NIFTY, BANKNIFTY, EURUSD"
					value={instrument}
					onChange={(e) => setInstrument(e.target.value)}
					className="mb-3"
				/>

				<Text strong className="block mb-2">
					Timeframe *
				</Text>
				<Select
					value={timeframe}
					onChange={setTimeframe}
					options={TIMEFRAME_OPTIONS.map((t) => ({
						label: t,
						value: t,
					}))}
					className="w-full mb-3"
				/>

				<Text strong className="block mb-2">
					Entry Reason / Rule *
				</Text>
				<TextArea
					placeholder="Describe your setup..."
					value={entryReason}
					onChange={(e) => setEntryReason(e.target.value)}
					className="mb-3"
					rows={2}
				/>

				<Text strong className="block mb-2">
					Mapped Rule
				</Text>
				<Select
					value={selectedRuleId}
					onChange={setSelectedRuleId}
					allowClear
					options={rules.map((r) => ({
						label: r.name,
						value: r.rule_id,
					}))}
					placeholder="Select rule (optional)"
					className="w-full mb-3"
				/>

				<Text strong className="block mb-2">
					Did this match your plan? *
				</Text>
				<Radio.Group
					value={planMatch}
					onChange={(e) => setPlanMatch(e.target.value)}
					className="block mb-3"
				>
					<Radio value={true}>Yes</Radio>
					<Radio value={false}>No</Radio>
				</Radio.Group>

				<Text strong className="block mb-2">
					Outcome *
				</Text>
				<Radio.Group
					value={outcome}
					onChange={(e) => setOutcome(e.target.value)}
					className="block mb-3"
				>
					{OUTCOME_OPTIONS.map((opt) => (
						<Radio key={opt.value} value={opt.value}>
							{opt.label}
						</Radio>
					))}
				</Radio.Group>

				<Text strong className="block mb-2">
					Note (optional, max 100 chars)
				</Text>
				<TextArea
					placeholder="One-line note..."
					value={note}
					onChange={(e) => setNote(e.target.value.slice(0, 100))}
					maxLength={100}
					rows={2}
					className="mb-3"
				/>

				<Button
					type="primary"
					block
					loading={isLoading}
					onClick={handleAddTrade}
					disabled={!instrument || !entryReason}
				>
					Log Trade
				</Button>
			</Card>

			<Card title="Recent Trades">
				{trades.length === 0 ? (
					<Text type="secondary">No trades logged yet</Text>
				) : (
					trades
						.slice(-5)
						.reverse()
						.map((trade) => (
							<div
								key={trade._id}
								className="flex justify-between items-center py-2 border-b"
							>
								<div>
									<Text strong>
										{trade.instrument} {trade.timeframe}
									</Text>
									<Text type="secondary" className="block text-xs">
										{trade.plan_match ? "✅ Plan" : "❌ Violation"} |{" "}
										{trade.outcome}
									</Text>
								</div>
								<Text type="secondary" className="text-xs">
									{new Date(trade.trade_timestamp).toLocaleTimeString()}
								</Text>
							</div>
						))
				)}
			</Card>
		</div>
	);
};

export default TradeLog;
