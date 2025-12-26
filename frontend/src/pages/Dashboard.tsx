import React, { useEffect, useRef, useState } from "react";

import TradeTable from "../components/TradeTable";
import CreateTradeModal from "../components/dashboard/CreateTradeModal";
import { useHotkeys } from "react-hotkeys-hook";
import PnlCalendar from "../components/PnlCalendar";
import { Button, Card, Input, Row, Select, Tooltip, Typography } from "antd";
import {
	usePerformanceMetrics,
	useStrategies,
	useSymbols,
} from "../hooks/useTrades";
import { usePortfolios, useTags } from "../hooks/useResources";
import { useSearch } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useFilterStore } from "../store/useFilterStore";
import { FaPlus } from "react-icons/fa";
import SpeedoGauge from "../components/ui/resuable/chart/GaugeChart";

const Dashboard: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [pastedFile, setPastedFile] = useState<File | null>(null);
	const search: any = useSearch({ from: "/" });
	const navigate = useNavigate();
	const setStoreFilters = useFilterStore((state) => state.setFilters);

	const filters = {
		strategy_id: search.strategy_id,
		outcome: search.outcome,
		symbol: search.symbol,
		search: search.search,
		portfolio_id: search.portfolio_id,
		status: search.status,
		tags: search.tags,
	};

	// Sync Zustand store with URL
	useEffect(() => {
		setStoreFilters(filters);
	}, [
		filters.strategy_id,
		filters.outcome,
		filters.symbol,
		filters.search,
		filters.portfolio_id,
		filters.status,
		filters.tags,
		setStoreFilters,
	]);

	const handleFilterChange = (key: string, value: any) => {
		navigate({
			search: {
				...search,
				[key]: value,
			},
		});
	};

	const { data: strategies, isLoading: strategiesLoading } = useStrategies();
	const { data: symbols, isLoading: symbolsLoading } = useSymbols();
	const { data: portfolios, isLoading: portfoliosLoading } = usePortfolios();
	const { data: tagsData } = useTags();
	const updated = useRef(true);
	const { data: performanceMetric, isLoading: performanceMetricLoading } =
		usePerformanceMetrics({ filters });

	useEffect(() => {
		if (updated.current) {
			const firstStrategy = strategies?.[0].id;
			const firstPortfolio = portfolios?.[0].id;
			if (firstStrategy && firstPortfolio) {
				navigate({
					search: {
						...search,
						strategy_id: firstStrategy,
						portfolio_id: firstPortfolio,
					},
				});
				updated.current = false;
			}
		}
	}, [strategies, performanceMetric, portfolios]);
	useHotkeys("ctrl+m", (e) => {
		e.preventDefault();
		setIsOpen(true);
	});

	React.useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (items) {
				for (let i = 0; i < items.length; i++) {
					if (items[i].type.indexOf("image") !== -1) {
						const blob = items[i].getAsFile();
						if (blob) {
							setPastedFile(blob);
							setIsOpen(true);
						}
					}
				}
			}
		};

		window.addEventListener("paste", handlePaste);
		return () => {
			window.removeEventListener("paste", handlePaste);
		};
	}, []);

	return (
		<div className="container mx-auto p-0">
			<div className=" sticky top-2  z-[1000] grid grid-cols-16 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-16  xs:grid-cols-4  gap-4 p-4 rounded-lg items-end bg-slate-800">
				<div className="col-span-2">
					<Select
						loading={portfoliosLoading}
						allowClear
						options={
							portfolios?.map((p: any) => ({ value: p.id, label: p.name })) ||
							[]
						}
						value={
							filters.portfolio_id ? [{ value: filters.portfolio_id }] : []
						}
						onChange={(params) => handleFilterChange("portfolio_id", params)}
						style={{ width: "100%" }}
						placeholder="Portfolios"
					/>
				</div>
				<div className="col-span-2">
					<Select
						loading={strategiesLoading}
						allowClear
						options={
							strategies?.map((s: any) => ({ value: s.id, label: s.name })) ||
							[]
						}
						value={filters.strategy_id ? [{ value: filters.strategy_id }] : []}
						onChange={(params) => handleFilterChange("strategy_id", params)}
						style={{ width: "100%" }}
						placeholder="All Strategies"
					/>
				</div>
				<div className="col-span-2">
					<Select
						options={[
							{ id: "win", label: "Win", value: "win" },
							{ id: "loss", label: "Loss", value: "loss" },
							{ id: "neutral", label: "Neutral", value: "neutral" },
						]}
						value={filters.outcome ? [{ value: filters.outcome }] : []}
						allowClear
						onChange={(params) => {
							handleFilterChange("outcome", params);
						}}
						style={{ width: "100%" }}
						placeholder=" Outcomes"
					/>
				</div>
				<div className="col-span-2">
					<Select
						loading={symbolsLoading}
						allowClear
						options={
							symbols?.map((s: any) => ({ value: s.id, label: s.name })) || []
						}
						value={filters.symbol ? [{ value: filters.symbol }] : []}
						onChange={(params) => {
							handleFilterChange("symbol", params);
						}}
						style={{ width: "100%" }}
						placeholder="Symbols"
					/>
				</div>

				<div className="col-span-2">
					<Select
						allowClear
						options={[
							{ value: "IN", label: "Ongoing (IN)" },
							{ value: "NIN", label: "Completed (NIN)" },
						]}
						value={filters.status ? [{ value: filters.status }] : []}
						onChange={(params) => handleFilterChange("status", params)}
						style={{ width: "100%" }}
						placeholder="Status"
					/>
				</div>
				<div className="col-span-2">
					<Select
						mode="multiple"
						allowClear
						options={
							tagsData?.map((t: any) => ({ value: t._id, label: t.name })) || []
						}
						value={
							Array.isArray(filters.tags)
								? filters.tags
								: typeof filters.tags === "string"
									? filters.tags.split(",")
									: []
						}
						onChange={(values) => handleFilterChange("tags", values)}
						style={{ width: "100%" }}
						placeholder="Tags"
						maxTagCount="responsive"
					/>
				</div>
				<div className="col-span-3">
					<Input
						value={filters.search || ""}
						onChange={(e) =>
							handleFilterChange("search", (e.target as HTMLInputElement).value)
						}
						placeholder="Search reasons, notes..."
					/>
				</div>
				<Button
					onClick={() => setIsOpen(true)}
					variant="solid"
					className="col-span-1"
				>
					<FaPlus />
				</Button>
			</div>
			<Row>
				<Card
					style={{ height: "100px", width: "180px", background: "transparent" }}
					className=" !border-none flex flex-col justify-center items-center"
					styles={{
						body: {
							padding: "0px",
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
						},
					}}
				>
					<Tooltip
						title={`Win Rate - ${performanceMetric?.totalTrades ?? 0} Trades`}
					>
						<Typography.Text>Win Rate</Typography.Text>
					</Tooltip>
					<SpeedoGauge
						value={performanceMetric?.winRate ?? 0}
						height={90}
						width={100}
					/>
				</Card>
				<Card
					style={{ height: "100px", width: "180px", background: "transparent" }}
					className=" !border-none flex flex-col justify-center items-center"
					styles={{
						body: {
							padding: "0px",
							display: "flex",
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "center",
						},
					}}
				>
					<Tooltip
						title={`Average Risk Reward - ${performanceMetric?.totalTrades ?? 0} Trades`}
					>
						<Typography.Text>Avg RR</Typography.Text>
					</Tooltip>
					<div className="font-bold ml-4 text-xl">
						{performanceMetric?.avgRr ?? 0}
					</div>
				</Card>
			</Row>
			<div className="bg-surface rounded-2xl p-1  shadow-2xl overflow-hidden relative">
				<TradeTable />
			</div>

			<PnlCalendar />

			<CreateTradeModal
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setPastedFile(null);
				}}
				initialFile={pastedFile}
			/>
		</div>
	);
};

export default Dashboard;
