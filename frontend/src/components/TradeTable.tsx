import { LoadingOutlined } from "@ant-design/icons";
import { useSearch } from "@tanstack/react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Modal, Spin, Tooltip } from "antd";
import { Convert } from "easy-currencies";
import React, { useEffect, useRef, useState } from "react";
import { Circles } from "react-loader-spinner";
import { BACKEND_URL } from "../api/client";
import { usePortfolios } from "../hooks/useResources";
import {
	type Trade,
	useDeleteTrade,
	useInfiniteTrades,
	useStrategies,
	useSymbols,
} from "../hooks/useTrades";
import { useMarketTypeQueryParam } from "../hooks/useMarketTypeQueryParam";
import { usePreferenceStore } from "../store/preferenceStore";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import CreateTradeModal from "./dashboard/CreateTradeModal";
import ImageViewerModal from "./ImageViewerModal";
import { Icon } from "./ui/Icon";
import { VirtualTable } from "./VirtualTable";
import dayjs from "dayjs";

import type { TFilters } from "../types/api";

const columnHelper = createColumnHelper<Trade>();
const CURRENCY_SYMBOL_TO_CODE: Record<string, string> = {
	"₹": "INR",
	"$": "USD",
	"€": "EUR",
	"£": "GBP",
	"¥": "JPY",
};

const normalizeCurrencyCode = (currency?: string | null): string => {
	if (!currency) return "INR";
	const trimmed = currency.trim();
	if (!trimmed) return "INR";
	if (CURRENCY_SYMBOL_TO_CODE[trimmed]) return CURRENCY_SYMBOL_TO_CODE[trimmed];
	const upper = trimmed.toUpperCase();
	return upper.length === 3 ? upper : "INR";
};

const formatCurrencyValue = (amount: number, currencyCode: string): string => {
	try {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: currencyCode,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${currencyCode} ${amount.toFixed(2)}`;
	}
};

interface TradeTableProps {
	filters?: TFilters;
	limit?: number;
	externalTrades?: Trade[];
	useInfiniteScroll?: boolean;
}

// Safe hook wrapper that handles missing route context
function useSafeSearch() {
	try {
		return useSearch({ from: "/" });
	} catch {
		return {};
	}
}

const TradeTable: React.FC<TradeTableProps> = ({
	filters: externalFilters,
	limit: externalLimit,
	externalTrades,
	useInfiniteScroll = true
}) => {
	// Only use search params if we don't have external trades
	// This prevents errors when component is used outside the "/" route
	// Use safe search hook - returns empty object if not available
	const search: any = useSafeSearch();
	const [isViewModalOpen, setIsViewModalOpen] = useState(false);
	const hasScrolledTableRef = useRef(false);

	const { marketType } = useMarketTypeQueryParam();

	// Use external props or fall back to URL search params
	const limit = externalLimit || search?.limit || 20;
	const filters: TFilters = externalFilters || {
		strategy_id: search?.strategy_id,
		outcome: search?.outcome,
		search: search?.search,
		symbol: search?.symbol,
		portfolio_id: search?.portfolio_id,
		status: search?.status,
		trade_type: search?.trade_type || marketType,
		tags: search?.tags,
	};
	const { data: strategies } = useStrategies();
	const { data: symbols } = useSymbols();
	const { data: portfolios } = usePortfolios();
	const { portfolioCurrencyById } = usePreferenceStore();
	const strategyMapped = React.useMemo(() => {
		const map: Record<number, string> = {};
		(strategies || []).forEach((strategy) => {
			map[strategy.id] = strategy.name;
		});
		return map;
	}, [strategies]);
	const symbolMapped = React.useMemo(() => {
		const map: Record<number, string> = {};
		(symbols || []).forEach((symbol) => {
			map[symbol.id] = symbol.symbol;
		});
		return map;
	}, [symbols]);
	const portfolioCurrencyMap = React.useMemo(() => {
		const map: Record<number, string> = {};
		(portfolios || []).forEach((portfolio) => {
			map[portfolio.id] = normalizeCurrencyCode(
				portfolioCurrencyById[portfolio.id] || portfolio.currency,
			);
		});
		return map;
	}, [portfolios, portfolioCurrencyById]);

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteTrades(limit, filters);

	const deleteMutation = useDeleteTrade();

	const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
	const [isImageModalOpen, setIsImageModalOpen] = useState(false);
	const [selectedImageUrl, setSelectedImageUrl] = useState<Trade | null>(null);
	const [inrRatesByCurrency, setInrRatesByCurrency] = useState<Record<string, number>>({});

	const handleTableScrollProgress = React.useCallback(
		(progress: number) => {
			if (!useInfiniteScroll || externalTrades) return;
			if (progress > 0) {
				hasScrolledTableRef.current = true;
			}
			if (!hasScrolledTableRef.current) return;
			if (progress >= 0.8 && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		},
		[
			useInfiniteScroll,
			externalTrades,
			hasNextPage,
			isFetchingNextPage,
			fetchNextPage,
		],
	);

	const handleDeleteClick = (trade: Trade) => {
		setTradeToDelete(trade);
		setIsDeleteModalOpen(true);
	};

	const handleViewPhoto = (trade: Trade) => {
		setSelectedImageUrl(trade);
		setIsImageModalOpen(true);
	};

	const handleViewClick = (trade: Trade) => {
		setSelectedTrade(trade);
		setIsViewModalOpen(true);
	};

	const handleEditClick = (trade: Trade) => {
		setSelectedTrade(trade);
		setIsEditModalOpen(true);
	};

	const confirmDelete = () => {
		if (tradeToDelete) {
			deleteMutation.mutate(
				{
					id: tradeToDelete._id,
					tradeType:
						(tradeToDelete.trade_type as "equity" | "forex" | undefined) ||
						(marketType as "equity" | "forex" | undefined) ||
						"equity",
				},
				{
					onSuccess: () => {
						setIsDeleteModalOpen(false);
						setTradeToDelete(null);
					},
				},
			);
		}
	};

	const getTradeCurrencyCode = React.useCallback(
		(trade: Trade) => {
			const tradeCurrencyRaw = (trade as Trade & { currency?: string }).currency;
			if (tradeCurrencyRaw && tradeCurrencyRaw.trim()) {
				return normalizeCurrencyCode(tradeCurrencyRaw);
			}
			if (!trade.portfolio_id) return "INR";
			return portfolioCurrencyMap[trade.portfolio_id] || "INR";
		},
		[portfolioCurrencyMap],
	);

	// Use external trades if provided, otherwise flatten all pages into a single array
	const trades = React.useMemo(
		() => externalTrades || data?.pages.flatMap((page) => page.trades) || [],
		[externalTrades, data],
	);

	useEffect(() => {
		const uniqueNonInrCurrencies = Array.from(
			new Set(trades.map((trade) => getTradeCurrencyCode(trade)).filter((currency) => currency !== "INR")),
		);

		if (!uniqueNonInrCurrencies.length) {
			setInrRatesByCurrency({});
			return;
		}

		let isMounted = true;
		(async () => {
			const entries = await Promise.all(
				uniqueNonInrCurrencies.map(async (currencyCode) => {
					try {
						const rate = await Convert(1).from(currencyCode).to("INR");
						return [currencyCode, rate] as const;
					} catch {
						return [currencyCode, NaN] as const;
					}
				}),
			);

			if (!isMounted) return;
			const nextRates = Object.fromEntries(entries.filter(([, rate]) => Number.isFinite(rate)));
			setInrRatesByCurrency(nextRates);
		})();

		return () => {
			isMounted = false;
		};
	}, [trades, getTradeCurrencyCode]);

	const columns = React.useMemo(
		() => [
			// ... existing columns ...
			columnHelper.accessor(
				(row) => dayjs(row.trade_date).format("DD/MM/YYYY"),
				{
					id: "date",
					header: "Date",
				},
			),
			columnHelper.accessor("strategy_id", {
				header: "Strategy",
				cell: (info) => strategyMapped[info.getValue()] ?? "-",
			}),
			columnHelper.accessor("symbol_id", {
				header: "Symbol",
				cell: (info) => symbolMapped[info.getValue()] ?? "-",
			}),
			columnHelper.accessor("status", {
				header: "Status",
				cell: (info) => {
					const row = info.row.original.status;
					return (
						<div>
							{row === "IN"
								? "In-Progress"
								: row === "NIN"
									? "Completed"
									: (row ?? "-")}
						</div>
					);
				},
			}),
			columnHelper.accessor("type", {
				header: "Type",
				cell: (info) => info.getValue().toUpperCase(),
			}),
			columnHelper.accessor("quantity", {
				header: "Qty",
			}),
			columnHelper.display({
				id: "currency",
				header: "Currency",
				cell: (info) => getTradeCurrencyCode(info.row.original),
			}),
			// columnHelper.accessor("entry_price", {
			// 	header: "Entry",
			// }),
			// columnHelper.accessor("exit_price", {
			// 	header: "Exit",
			// }),
			columnHelper.accessor("pl", {
				id: "pl",
				header: "P/L",
				cell: (info) => {
					const plValue = info.row.original.pl;
					if (plValue === null || plValue === undefined) return "-";

					const currencyCode = getTradeCurrencyCode(info.row.original);
					const formatted = formatCurrencyValue(plValue, currencyCode);
					const className =
						plValue > 0 ? "text-green-500" : plValue < 0 ? "text-red-500" : "text-gray-300";

					if (currencyCode === "INR") {
						return <span className={className}>{formatted}</span>;
					}

					const rate = inrRatesByCurrency[currencyCode];
					const tooltipTitle = Number.isFinite(rate)
						? formatCurrencyValue(plValue * rate, "INR")
						: "INR conversion unavailable";

					return (
						<Tooltip title={tooltipTitle}>
							<span className={className}>{formatted}</span>
						</Tooltip>
					);
				},
			}),
			columnHelper.accessor("outcome", {
				header: "Outcome",
				cell: (info) => info.getValue().toUpperCase(),
			}),
			columnHelper.accessor("photo", {
				header: "Photo",
				cell: (info) => {
					const photoValue = info.getValue();
					return photoValue ? (
						<button
							onClick={() => handleViewPhoto(info.row.original)}
							className="text-blue-400 underline hover:text-blue-300 transition-colors"
						>
							View
						</button>
					) : (
						"N/A"
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (props) => (
					<div className="flex space-x-2">
						<Button
							onClick={() => handleViewClick(props.row.original)}
							variant="outlined"
							className=" !p-1 !min-h-[10px] !h-[26px]"
							title="View"
						>
							<Icon name="eye" size={{ width: 16, height: 16 }} />
						</Button>
						<Button
							onClick={() => handleEditClick(props.row.original)}
							className="!p-1 !min-h-[10px] !h-[26px] hover:text-blue-400 transition-colors"
							title="Edit"
						>
							<Icon name="edit" size={{ width: 16, height: 16 }} />
						</Button>
						<Button
							onClick={() => handleDeleteClick(props.row.original)}
							className="!p-1 !min-h-[10px] !h-[26px] hover:text-red-400 transition-colors"
							title="Delete"
						>
							<Icon name="delete" size={{ width: 16, height: 16 }} />
						</Button>
					</div>
				),
				size: 100,
			}),
		],
		[strategyMapped, symbolMapped, getTradeCurrencyCode, inrRatesByCurrency],
	);

	if (isLoading && !externalTrades) {
		return (
			<div className="min-h-[300px] flex items-center justify-center">
				<Spin indicator={<LoadingOutlined />} size="large" />
			</div>
		);
	}
	if (error && !externalTrades) return <div className="text-red-500">Error loading trades</div>;

	return (
		<div className="">
			<VirtualTable
				data={trades}
				columns={columns}
				height="450px"
				onScrollProgress={handleTableScrollProgress}
			/>

			{useInfiniteScroll && !externalTrades && isFetchingNextPage && (
				<div className="flex justify-center py-4">
					<Circles height={20} />
				</div>
			)}

			{isEditModalOpen && (
				<CreateTradeModal
					isOpen={isEditModalOpen}
					onClose={() => {
						setIsEditModalOpen(false);
						setSelectedTrade(null);
					}}
					tradeToEdit={selectedTrade}
				/>
			)}

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={confirmDelete}
				isLoading={deleteMutation.isPending}
			/>

			{selectedImageUrl && selectedImageUrl.photo && (
				<ImageViewerModal
					isOpen={isImageModalOpen}
					onClose={() => setIsImageModalOpen(false)}
					imageUrl={selectedImageUrl?.photo}
					instance={selectedImageUrl}
				/>
			)}

			<ViewTradeModal
				trade={selectedTrade}
				portfolioCurrencyMap={portfolioCurrencyMap}
				open={isViewModalOpen}
				onClose={() => setIsViewModalOpen(false)}
			/>
		</div>
	);
};

export default TradeTable;
const ViewTradeModal = ({
	trade,
	portfolioCurrencyMap,
	open,
	onClose,
}: {
	trade: Trade | null;
	portfolioCurrencyMap: Record<number, string>;
	open: boolean;
	onClose: () => void;
}) => {
	const [fullscreenImage, setFullscreenImage] = React.useState<string | null>(null);

	if (!trade) return null;
	const tradeCurrencyRaw = (trade as Trade & { currency?: string }).currency;
	const tradeCurrencyCode = normalizeCurrencyCode(
		tradeCurrencyRaw ||
		(trade.portfolio_id ? portfolioCurrencyMap[trade.portfolio_id] : "INR"),
	);

	const formatValue = (value: any): string => {
		if (value === null || value === undefined) return "-";
		if (typeof value === "boolean") return value ? "Yes" : "No";
		if (Array.isArray(value)) {
			if (value.length === 0) return "-";
			return value.join(", ");
		}
		return String(value);
	};

	const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
		<div className="mb-4">
			<h3 className="text-base font-semibold text-white mb-2 pb-1 border-b border-gray-700">
				{title}
			</h3>
			{children}
		</div>
	);

	const DetailRow = ({ label, value }: { label: string; value: any }) => (
		<div className="flex py-1.5 border-b border-gray-800 last:border-0">
			<div className="w-1/3 text-gray-400 font-medium text-sm">{label}</div>
			<div className="w-2/3 text-white text-sm">{formatValue(value)}</div>
		</div>
	);

	return (
		<>
			<Modal
				title={
					<div className="text-xl font-semibold">
						Trade Details - {dayjs(trade.trade_date).format("DD MMM YYYY")}
					</div>
				}
				open={open}
				onCancel={onClose}
				footer={null}
				width="95%"
				styles={{
					body: {
						maxHeight: "85vh",
						padding: "0",
					},
				}}
			>
				{/* Grid Layout: Left column for images, Right column for all details */}
				<div className="grid grid-cols-2 gap-4 p-4" style={{ height: "85vh" }}>
					{/* Left Column: Images */}
					<div className="flex flex-col gap-4">
						{/* Position 1 - Top Left: Main Photo */}
						<div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
							<div className="bg-gray-800 px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
								Trade Screenshot
							</div>
							<div className="overflow-y-auto" style={{ height: "calc(42.5vh - 42px)" }}>
								{trade.photo ? (
									<img
										src={`${BACKEND_URL}/${trade.photo}`}
										alt="trade screenshot"
										className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
										onClick={() => setFullscreenImage(`${BACKEND_URL}/${trade.photo}`)}
									/>
								) : (
									<div className="flex items-center justify-center h-full text-gray-500">
										No screenshot available
									</div>
								)}
							</div>
						</div>

						{/* Position 3 - Bottom Left: Timeframe Photos */}
						<div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
							<div className="bg-gray-800 px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
								Timeframe Analysis
							</div>
							<div className="overflow-y-auto p-4" style={{ height: "calc(42.5vh - 42px)" }}>
								{trade.timeframe_photos && trade.timeframe_photos.length > 0 ? (
									<div className="grid grid-cols-1 gap-3">
										{trade.timeframe_photos.map((tf, index) => (
											<div key={index} className="rounded-lg overflow-hidden border border-gray-700">
												<div className="bg-gray-800 px-3 py-1.5 text-xs font-medium text-white">
													{tf.type}
												</div>
												<img
													src={`${BACKEND_URL}/${tf.photo}`}
													alt={`${tf.type} timeframe`}
													className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
													onClick={() => setFullscreenImage(`${BACKEND_URL}/${tf.photo}`)}
												/>
											</div>
										))}
									</div>
								) : (
									<div className="flex items-center justify-center h-full text-gray-500">
										No timeframe photos available
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Right Column: All Trade Details (Single Scrollable Container) */}
					<div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
						<div className="bg-gray-800 px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
							Trade Details
						</div>
						<div className="overflow-y-auto p-4" style={{ height: "calc(85vh - 42px)" }}>
							{/* Basic Trade Information */}
							<Section title="Trade Information">
								<div className="bg-gray-800 rounded-lg p-3">
									<DetailRow label="Date" value={dayjs(trade.trade_date).format("DD/MM/YYYY")} />
									<DetailRow label="Strategy ID" value={trade.strategy_id} />
									<DetailRow label="Symbol ID" value={trade.symbol_id} />
									<DetailRow label="Portfolio ID" value={trade.portfolio_id} />
									<DetailRow label="Type" value={trade.type?.toUpperCase()} />
									<DetailRow label="Status" value={trade.status === "IN" ? "In-Progress" : trade.status === "NIN" ? "Completed" : trade.status} />
									<DetailRow label="Outcome" value={trade.outcome?.toUpperCase()} />
								</div>
							</Section>

							{/* Price & Quantity Details */}
							<Section title="Price & Quantity">
								<div className="bg-gray-800 rounded-lg p-3">
									<DetailRow label="Quantity" value={trade.quantity} />
									<DetailRow label="Entry Price" value={trade.entry_price?.toFixed(2)} />
									<DetailRow label="Exit Price" value={trade.exit_price?.toFixed(2)} />
									<DetailRow label="Stop Loss" value={trade.stop_loss?.toFixed(2)} />
									<DetailRow label="Take Profit" value={trade.take_profit?.toFixed(2)} />
									<DetailRow label="Fees" value={trade.fees?.toFixed(2)} />
									<DetailRow
										label="P/L"
										value={
											<span className={trade.pl && trade.pl > 0 ? "text-green-500" : trade.pl && trade.pl < 0 ? "text-red-500" : ""}>
												{trade.pl === null || trade.pl === undefined
													? "-"
													: formatCurrencyValue(trade.pl, tradeCurrencyCode)}
											</span>
										}
									/>
								</div>
							</Section>

							{/* Multi-Exit Details */}
							{trade.exits && trade.exits.length > 0 && (
								<Section title="Partial Exits">
									<div className="bg-gray-800 rounded-lg p-3">
										<div className="space-y-2">
											{trade.exits.map((exit, index) => (
												<div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-700 last:border-0">
													<span className="text-gray-400 text-sm">Exit {index + 1}</span>
													<div className="text-white text-sm">
														<span className="mr-3">Qty: {exit.quantity}</span>
														<span>Price: {exit.price?.toFixed(2)}</span>
													</div>
												</div>
											))}
										</div>
									</div>
								</Section>
							)}

							{/* Psychological Factors */}
							<Section title="Psychological Factors">
								<div className="bg-gray-800 rounded-lg p-3">
									<DetailRow label="Confidence Level" value={trade.confidence_level} />
									<DetailRow label="Emotional State" value={trade.emotional_state} />
									<DetailRow label="FOMO Trade" value={trade.is_fomo} />
									<DetailRow label="Greed Trade" value={trade.is_greed} />
								</div>
							</Section>

							{/* Execution Details */}
							<Section title="Execution Details">
								<div className="bg-gray-800 rounded-lg p-3">
									<DetailRow label="Market Condition" value={trade.market_condition} />
									<DetailRow label="Entry Execution" value={trade.entry_execution} />
									<DetailRow label="Exit Execution" value={trade.exit_execution} />
									<DetailRow label="Entry ID" value={trade.entry_id} />
								</div>
							</Section>

							{/* Trade Rationale */}
							<Section title="Trade Rationale">
								<div className="bg-gray-800 rounded-lg p-3">
									<DetailRow label="Entry Reason" value={trade.entry_reason} />
									<DetailRow label="Exit Reason" value={trade.exit_reason} />
								</div>
							</Section>

							{/* Post-Trade Analysis */}
							{(trade.post_trade_thoughts || (trade.rule_violations && trade.rule_violations.length > 0) || trade.notes) && (
								<Section title="Post-Trade Analysis">
									<div className="bg-gray-800 rounded-lg p-3">
										{trade.post_trade_thoughts && (
											<DetailRow label="Post Trade Thoughts" value={trade.post_trade_thoughts} />
										)}
										{trade.rule_violations && trade.rule_violations.length > 0 && (
											<DetailRow label="Rule Violations" value={trade.rule_violations} />
										)}
										{trade.notes && (
											<DetailRow label="Notes" value={trade.notes} />
										)}
									</div>
								</Section>
							)}

							{/* Tags */}
							{trade.tags && trade.tags.length > 0 && (
								<Section title="Tags">
									<div className="flex flex-wrap gap-2">
										{trade.tags.map((tag, index) => (
											<span
												key={index}
												className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full"
											>
												{tag.name}
											</span>
										))}
									</div>
								</Section>
							)}

							{/* Metadata */}
							{(trade.createdAt || trade.updatedAt) && (
								<Section title="Metadata">
									<div className="bg-gray-800 rounded-lg p-3 text-xs">
										{trade.createdAt && (
											<DetailRow
												label="Created At"
												value={dayjs(trade.createdAt).format("DD/MM/YYYY HH:mm:ss")}
											/>
										)}
										{trade.updatedAt && (
											<DetailRow
												label="Updated At"
												value={dayjs(trade.updatedAt).format("DD/MM/YYYY HH:mm:ss")}
											/>
										)}
									</div>
								</Section>
							)}
						</div>
					</div>
				</div>
			</Modal>

			{/* Fullscreen Image Modal */}
			{fullscreenImage && (
				<Modal
					open={!!fullscreenImage}
					onCancel={() => setFullscreenImage(null)}
					footer={null}
					width="95%"
					styles={{
						body: {
							padding: "0",
							background: "#000",
						},
					}}
					centered
				>
					<div className="flex items-center justify-center" style={{ minHeight: "80vh" }}>
						<img
							src={fullscreenImage}
							alt="Fullscreen view"
							className="max-w-full max-h-[90vh] object-contain"
						/>
					</div>
				</Modal>
			)}
		</>
	);
};
