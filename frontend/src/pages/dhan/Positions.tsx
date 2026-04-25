import { ReloadOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	Alert,
	Button,
	ConfigProvider,
	Select,
	Skeleton,
	Tag,
	type ThemeConfig,
	theme,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import type { DhanHolding, DhanOrder, DhanPosition } from "../../api/client";
import {
	useDhanHoldings,
	useDhanOrders,
	useDhanPositions,
} from "../../hooks/useDhanData";

const columnHelper = createColumnHelper<DhanHolding>();
const posColumnHelper = createColumnHelper<DhanPosition>();
const orderColumnHelper = createColumnHelper<DhanOrder>();

const darkTheme: ThemeConfig = {
	algorithm: theme.darkAlgorithm,
	components: {
		Table: {
			headerBg: "#1f1f1f",
			rowHoverBg: "#2a2a2a",
		},
	},
};

const formatINR = (value: number): string => {
	return `₹${value.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};

const HoldingsTable: React.FC<{ data: DhanHolding[] }> = ({ data }) => {
	const columns = useMemo(
		() => [
			columnHelper.accessor("tradingSymbol", {
				header: "Symbol",
				cell: ({ getValue }) => (
					<span className="font-semibold">{getValue()}</span>
				),
			}),
			columnHelper.accessor("exchange", {
				header: "Exchange",
				cell: ({ getValue }) => <Tag color="blue">{getValue()}</Tag>,
			}),
			columnHelper.accessor("totalQty", {
				header: "Total Qty",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			columnHelper.accessor("avgCostPrice", {
				header: "Avg Cost",
				cell: ({ getValue }) => (
					<span className="font-mono">{formatINR(getValue())}</span>
				),
			}),
			columnHelper.accessor("lastTradedPrice", {
				header: "Current Price",
				cell: ({ getValue }) => (
					<span className="font-mono">{formatINR(getValue() || 0)}</span>
				),
			}),
			columnHelper.display({
				id: "currentValue",
				header: "Current Value",
				cell: ({ row }) => {
					const totalQty = row.original.totalQty;
					const ltp = row.original.lastTradedPrice || 0;
					const value = totalQty * ltp;
					return <span className="font-mono">{formatINR(value)}</span>;
				},
			}),
			columnHelper.display({
				id: "pnl",
				header: "P&L",
				cell: ({ row }) => {
					const totalQty = row.original.totalQty;
					const avgCost = row.original.avgCostPrice || 0;
					const ltp = row.original.lastTradedPrice || 0;
					const pnl = (ltp - avgCost) * totalQty;
					const isProfit = pnl > 0;
					return (
						<span
							className={`font-mono font-semibold ${
								isProfit ? "text-green-400" : pnl < 0 ? "text-red-400" : ""
							}`}
						>
							{isProfit ? "+" : ""}
							{formatINR(pnl)}
						</span>
					);
				},
			}),
			columnHelper.accessor("availableQty", {
				header: "Available Qty",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			columnHelper.accessor("t1Qty", {
				header: "T1 Qty",
				cell: ({ getValue }) => (
					<span className={getValue() === 0 ? "text-gray-500" : ""}>
						{getValue()}
					</span>
				),
			}),
			columnHelper.accessor("isin", {
				header: "ISIN",
				cell: ({ getValue }) => (
					<span className="font-mono text-xs">{getValue()}</span>
				),
			}),
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead className="bg-surface-highlight border-b border-border">
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className="text-left px-3 py-2 text-sm font-medium text-gray-400"
								>
									{flexRender(
										header.column.columnDef.header,
										header.getContext(),
									)}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{table.getRowModel().rows.map((row) => (
						<tr
							key={row.id}
							className="border-b border-border hover:bg-surface-highlight/50"
						>
							{row.getVisibleCells().map((cell) => (
								<td key={cell.id} className="px-3 py-2 text-sm">
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

const PositionsTable: React.FC<{ data: DhanPosition[] }> = ({ data }) => {
	const openPositions = useMemo(
		() => data.filter((p) => p.positionType !== "CLOSED"),
		[data],
	);

	const totalUnrealized = useMemo(
		() => openPositions.reduce((sum, p) => sum + (p.unrealizedProfit || 0), 0),
		[openPositions],
	);

	const totalRealized = useMemo(
		() => openPositions.reduce((sum, p) => sum + (p.realizedProfit || 0), 0),
		[openPositions],
	);

	const columns = useMemo(
		() => [
			posColumnHelper.accessor("tradingSymbol", {
				header: "Symbol",
				cell: ({ getValue }) => (
					<span className="font-semibold">{getValue()}</span>
				),
			}),
			posColumnHelper.accessor("exchange", {
				header: "Segment",
				cell: ({ getValue }) => <Tag color="blue">{getValue()}</Tag>,
			}),
			posColumnHelper.accessor("productType", {
				header: "Product",
				cell: ({ getValue }) => <Tag>{getValue()}</Tag>,
			}),
			posColumnHelper.accessor("positionType", {
				header: "Position",
				cell: ({ getValue }) => {
					const isLong = getValue() === "LONG";
					return <Tag color={isLong ? "green" : "red"}>{getValue()}</Tag>;
				},
			}),
			posColumnHelper.accessor("buyAvg", {
				header: "Buy Avg",
				cell: ({ getValue }) => (
					<span className="font-mono">{formatINR(getValue())}</span>
				),
			}),
			posColumnHelper.accessor("sellAvg", {
				header: "Sell Avg",
				cell: ({ getValue }) => (
					<span
						className={
							getValue() === 0 ? "font-mono text-gray-500" : "font-mono"
						}
					>
						{formatINR(getValue())}
					</span>
				),
			}),
			posColumnHelper.accessor("netQty", {
				header: "Net Qty",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			posColumnHelper.accessor("unrealizedProfit", {
				header: "Unrealized P&L",
				cell: ({ getValue }) => {
					const val = getValue() || 0;
					return (
						<span
							className={`font-mono font-semibold ${
								val > 0 ? "text-green-400" : val < 0 ? "text-red-400" : ""
							}`}
						>
							{val > 0 ? "+" : ""}
							{formatINR(val)}
						</span>
					);
				},
			}),
			posColumnHelper.accessor("realizedProfit", {
				header: "Realized P&L",
				cell: ({ getValue }) => {
					const val = getValue() || 0;
					return (
						<span
							className={`font-mono ${
								val > 0 ? "text-green-400" : val < 0 ? "text-red-400" : ""
							}`}
						>
							{val > 0 ? "+" : ""}
							{formatINR(val)}
						</span>
					);
				},
			}),
			posColumnHelper.accessor("dayBuyValue", {
				header: "Day Buy Value",
				cell: ({ getValue }) => (
					<span className="font-mono">{formatINR(getValue() || 0)}</span>
				),
			}),
			posColumnHelper.accessor("daySellValue", {
				header: "Day Sell Value",
				cell: ({ getValue }) => (
					<span className="font-mono">{formatINR(getValue() || 0)}</span>
				),
			}),
		],
		[],
	);

	const table = useReactTable({
		data: openPositions,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const isProfit = (val: number) => val > 0;

	return (
		<div>
			<div className="flex gap-8 mb-4 p-4 bg-surface border border-border rounded">
				<div>
					<div className="text-gray-400 text-sm">Total Unrealized P&L</div>
					<div
						className={`text-2xl font-bold ${
							isProfit(totalUnrealized) ? "text-green-400" : "text-red-400"
						}`}
					>
						{isProfit(totalUnrealized) ? "+" : ""}
						{formatINR(totalUnrealized)}
					</div>
				</div>
				<div>
					<div className="text-gray-400 text-sm">Total Realized P&L</div>
					<div
						className={`text-2xl font-bold ${
							isProfit(totalRealized) ? "text-green-400" : "text-red-400"
						}`}
					>
						{isProfit(totalRealized) ? "+" : ""}
						{formatINR(totalRealized)}
					</div>
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-surface-highlight border-b border-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="text-left px-3 py-2 text-sm font-medium text-gray-400"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-b border-border hover:bg-surface-highlight/50"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-3 py-2 text-sm">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const OrdersTable: React.FC<{
	data: DhanOrder[];
	statusFilter: string;
	onFilterChange: (v: string) => void;
}> = ({ data, statusFilter, onFilterChange }) => {
	const filteredData = useMemo(() => {
		if (!statusFilter || statusFilter === "all") return data;
		return data.filter((o) => o.orderStatus === statusFilter);
	}, [data, statusFilter]);

	const getStatusColor = (status: string): string => {
		switch (status) {
			case "TRADED":
				return "green";
			case "PENDING":
				return "orange";
			case "CANCELLED":
				return "default";
			case "REJECTED":
				return "red";
			case "TRANSIT":
				return "blue";
			case "PART_TRADED":
				return "gold";
			default:
				return "default";
		}
	};

	const columns = useMemo(
		() => [
			orderColumnHelper.accessor("orderId", {
				header: "Order ID",
				cell: ({ getValue }) => (
					<span className="font-mono text-xs truncate block max-w-[100px]">
						{getValue()?.slice(-8)}
					</span>
				),
			}),
			orderColumnHelper.accessor("tradingSymbol", {
				header: "Symbol",
				cell: ({ getValue }) => (
					<span className="font-semibold">{getValue()}</span>
				),
			}),
			orderColumnHelper.accessor("transactionType", {
				header: "Side",
				cell: ({ getValue }) => {
					const isBuy = getValue() === "BUY";
					return <Tag color={isBuy ? "green" : "red"}>{getValue()}</Tag>;
				},
			}),
			orderColumnHelper.accessor("orderStatus", {
				header: "Status",
				cell: ({ getValue }) => (
					<Tag color={getStatusColor(getValue() || "")}>{getValue()}</Tag>
				),
			}),
			orderColumnHelper.accessor("orderType", {
				header: "Type",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			orderColumnHelper.accessor("productType", {
				header: "Product",
				cell: ({ getValue }) => <Tag>{getValue()}</Tag>,
			}),
			orderColumnHelper.accessor("quantity", {
				header: "Qty",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			orderColumnHelper.accessor("filledQty", {
				header: "Filled",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			orderColumnHelper.accessor("price", {
				header: "Price",
				cell: ({ getValue }) => (
					<span className="font-mono">
						{getValue() === 0 ? "MARKET" : formatINR(getValue())}
					</span>
				),
			}),
			orderColumnHelper.accessor("averageTradedPrice", {
				header: "Avg Traded",
				cell: ({ getValue }) => (
					<span
						className={
							getValue() === 0 ? "font-mono text-gray-500" : "font-mono"
						}
					>
						{getValue() === 0 ? "--" : formatINR(getValue())}
					</span>
				),
			}),
			orderColumnHelper.accessor("updateTime", {
				header: "Time",
				cell: ({ getValue }) => {
					const time = getValue();
					if (!time) return <span>--</span>;
					const date = new Date(time);
					return (
						<span className="font-mono">
							{date.toLocaleTimeString("en-IN", {
								hour: "2-digit",
								minute: "2-digit",
								second: "2-digit",
							})}
						</span>
					);
				},
			}),
		],
		[],
	);

	const table = useReactTable({
		data: filteredData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div>
			<div className="mb-4 flex items-center gap-3">
				<span className="text-gray-400 text-sm">Filter by Status:</span>
				<Select
					value={statusFilter}
					onChange={onFilterChange}
					style={{ width: 150 }}
					options={[
						{ value: "all", label: "All" },
						{ value: "TRADED", label: "Traded" },
						{ value: "PENDING", label: "Pending" },
						{ value: "CANCELLED", label: "Cancelled" },
						{ value: "REJECTED", label: "Rejected" },
						{ value: "TRANSIT", label: "Transit" },
						{ value: "PART_TRADED", label: "Part Traded" },
					]}
				/>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-surface-highlight border-b border-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="text-left px-3 py-2 text-sm font-medium text-gray-400"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className="border-b border-border hover:bg-surface-highlight/50"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-3 py-2 text-sm">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export const DhanPositions: React.FC = () => {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<
		"holdings" | "positions" | "orders"
	>("positions");
	const [lastUpdated, setLastUpdated] = useState(0);
	const [orderStatusFilter, setOrderStatusFilter] = useState("all");

	const {
		data: holdings,
		isLoading: holdingsLoading,
		error: holdingsError,
	} = useDhanHoldings();
	const {
		data: positions,
		isLoading: positionsLoading,
		error: positionsError,
	} = useDhanPositions();
	const {
		data: orders,
		isLoading: ordersLoading,
		error: ordersError,
	} = useDhanOrders();

	useEffect(() => {
		const interval = setInterval(() => {
			setLastUpdated((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["dhan"] });
		setLastUpdated(0);
	};

	const renderContent = () => {
		switch (activeTab) {
			case "holdings":
				if (holdingsLoading) {
					return (
						<div className="space-y-2">
							<Skeleton active paragraph={{ rows: 8 }} />
						</div>
					);
				}
				if (holdingsError) {
					return (
						<Alert
							type="error"
							message="Failed to load holdings"
							description={holdingsError.message}
						/>
					);
				}
				if (!holdings || holdings.length === 0) {
					return <Alert type="info" message="No holdings found" />;
				}
				return <HoldingsTable data={holdings} />;
			case "positions":
				if (positionsLoading) {
					return (
						<div className="space-y-2">
							<Skeleton active paragraph={{ rows: 8 }} />
						</div>
					);
				}
				if (positionsError) {
					return (
						<Alert
							type="error"
							message="Failed to load positions"
							description={positionsError.message}
						/>
					);
				}
				if (!positions || positions.length === 0) {
					return <Alert type="info" message="No open positions" />;
				}
				return <PositionsTable data={positions} />;
			case "orders":
				if (ordersLoading) {
					return (
						<div className="space-y-2">
							<Skeleton active paragraph={{ rows: 8 }} />
						</div>
					);
				}
				if (ordersError) {
					return (
						<Alert
							type="error"
							message="Failed to load orders"
							description={ordersError.message}
						/>
					);
				}
				if (!orders || orders.length === 0) {
					return <Alert type="info" message="No orders found" />;
				}
				return (
					<OrdersTable
						data={orders}
						statusFilter={orderStatusFilter}
						onFilterChange={setOrderStatusFilter}
					/>
				);
		}
	};

	return (
		<ConfigProvider theme={darkTheme}>
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">Dhan Portfolio</h1>
					<div className="flex items-center gap-3">
						<span className="text-gray-500 text-sm">
							Last updated: {lastUpdated} seconds ago
						</span>
						<Button
							type="primary"
							icon={<ReloadOutlined />}
							onClick={handleRefresh}
						>
							Refresh All
						</Button>
					</div>
				</div>

				<div className="flex gap-2 mb-4">
					<Button
						type={activeTab === "holdings" ? "primary" : "default"}
						onClick={() => setActiveTab("holdings")}
					>
						Holdings
					</Button>
					<Button
						type={activeTab === "positions" ? "primary" : "default"}
						onClick={() => setActiveTab("positions")}
					>
						Open Positions
					</Button>
					<Button
						type={activeTab === "orders" ? "primary" : "default"}
						onClick={() => setActiveTab("orders")}
					>
						Order Book
					</Button>
				</div>

				<div className="bg-surface border border-border rounded-lg p-4">
					{renderContent()}
				</div>
			</div>
		</ConfigProvider>
	);
};

export default DhanPositions;
