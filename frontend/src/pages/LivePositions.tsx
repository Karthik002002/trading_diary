import { useQueryClient } from "@tanstack/react-query";
import {
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { InputNumber, Modal, message, Select, Spin } from "antd";
import {
	AlertTriangle,
	CheckCircle,
	Edit3,
	Loader2,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WatchlistItem as WatchlistItemType } from "../api/client";
import { usePriceSocket } from "../hooks/usePriceSocket";
import {
	useCreateWatchlistItem,
	useDeleteWatchlistItem,
	useSymbols,
	useUpdateWatchlistItem,
	useWatchlist,
} from "../hooks/useWatchlist";

const columnHelper = createColumnHelper<WatchlistItemType>();

interface PositionFormData {
	symbol: string;
	exchange: "NSE" | "BSE";
	direction: "BUY" | "SELL";
	entry_price: number;
	quantity: number;
	stop_loss: number;
	take_profit: number;
	notes: string;
}

interface PriceInfo {
	price: number | null;
	isLoading: boolean;
	error: boolean;
}

const WatchlistModal: React.FC<{
	isOpen: boolean;
	onClose: () => void;
	editItem?: WatchlistItemType | null;
}> = ({ isOpen, onClose, editItem }) => {
	const [formData, setFormData] = useState<PositionFormData>({
		symbol: "",
		exchange: "NSE",
		direction: "BUY",
		entry_price: 0,
		quantity: 0,
		stop_loss: 0,
		take_profit: 0,
		notes: "",
	});

	const { data: symbols, isLoading: symbolsLoading } = useSymbols();
	const symbolsOptions = (symbols || []).map((s) => ({ value: s, label: s }));

	useEffect(() => {
		if (editItem) {
			setFormData({
				symbol: editItem.symbol,
				exchange: editItem.exchange,
				direction: editItem.direction,
				entry_price: editItem.entry_price,
				quantity: editItem.quantity,
				stop_loss: editItem.stop_loss,
				take_profit: editItem.take_profit,
				notes: editItem.notes || "",
			});
		} else {
			setFormData({
				symbol: "",
				exchange: "NSE",
				direction: "BUY",
				entry_price: 0,
				quantity: 0,
				stop_loss: 0,
				take_profit: 0,
				notes: "",
			});
		}
	}, [editItem, isOpen]);

	const createMutation = useCreateWatchlistItem();
	const updateMutation = useUpdateWatchlistItem();
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		setLoading(true);
		try {
			if (editItem?._id) {
				await updateMutation.mutateAsync({ id: editItem._id, item: formData });
				message.success("Position updated");
			} else {
				await createMutation.mutateAsync(formData);
				message.success("Position added");
			}
			onClose();
		} catch (error) {
			message.error("Failed to save position");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Modal
			open={isOpen}
			title={editItem ? "Edit Position" : "Add Position"}
			onCancel={onClose}
			onOk={handleSubmit}
			centered
			okText={editItem ? "Update" : "Add"}
			confirmLoading={loading}
			width={480}
		>
			<div className="space-y-4">
				<div>
					<label className="block text-sm mb-1">Symbol</label>
					<Select
						showSearch
						value={formData.symbol || undefined}
						onChange={(value) =>
							setFormData({ ...formData, symbol: value || "" })
						}
						placeholder="Search symbol..."
						style={{ width: "100%" }}
						filterOption={(input, option) =>
							option?.label
								?.toString()
								.toLowerCase()
								.includes(input.toLowerCase())
						}
						options={symbolsOptions}
						loading={symbolsLoading}
						allowClear
					/>
				</div>
				<div>
					<label className="block text-sm mb-1">Exchange</label>
					<Select
						value={formData.exchange}
						onChange={(value) =>
							setFormData({ ...formData, exchange: value as "NSE" | "BSE" })
						}
						style={{ width: "100%" }}
						options={[
							{ value: "NSE", label: "NSE" },
							{ value: "BSE", label: "BSE" },
						]}
					/>
				</div>
				<div>
					<label className="block text-sm mb-1">Direction</label>
					<Select
						value={formData.direction}
						onChange={(value) =>
							setFormData({ ...formData, direction: value as "BUY" | "SELL" })
						}
						style={{ width: "100%" }}
						options={[
							{ value: "BUY", label: "BUY" },
							{ value: "SELL", label: "SELL" },
						]}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm mb-1">Entry Price</label>
						<InputNumber
							value={formData.entry_price}
							onChange={(value) =>
								setFormData({ ...formData, entry_price: value || 0 })
							}
							style={{ width: "100%" }}
							precision={2}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Quantity</label>
						<InputNumber
							value={formData.quantity}
							onChange={(value) =>
								setFormData({ ...formData, quantity: value || 0 })
							}
							style={{ width: "100%" }}
							placeholder="0"
						/>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm mb-1">Stop Loss</label>
						<InputNumber
							value={formData.stop_loss}
							onChange={(value) =>
								setFormData({ ...formData, stop_loss: value || 0 })
							}
							style={{ width: "100%" }}
							precision={2}
							placeholder="0.00"
						/>
					</div>
					<div>
						<label className="block text-sm mb-1">Take Profit</label>
						<InputNumber
							value={formData.take_profit}
							onChange={(value) =>
								setFormData({ ...formData, take_profit: value || 0 })
							}
							style={{ width: "100%" }}
							precision={2}
							placeholder="0.00"
						/>
					</div>
				</div>
				<div>
					<label className="block text-sm mb-1">Notes (optional)</label>
					<Select.TextArea
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
						placeholder="Optional notes..."
						rows={3}
					/>
				</div>
			</div>
		</Modal>
	);
};

const LivePositions: React.FC = () => {
	const queryClient = useQueryClient();
	const { data: watchlist, isLoading } = useWatchlist();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editItem, setEditItem] = useState<WatchlistItemType | null>(null);
	const [lastUpdated, setLastUpdated] = useState(0);
	const { prices, connected } = usePriceSocket();

	const deleteMutation = useDeleteWatchlistItem();

	const handleEdit = (item: WatchlistItemType) => {
		setEditItem(item);
		setIsModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		Modal.confirm({
			title: "Delete Position",
			content: "Are you sure you want to delete this position?",
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				await deleteMutation.mutateAsync(id);
				message.success("Position deleted");
			},
		});
	};

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["price"] });
		setLastUpdated(0);
	};

	useEffect(() => {
		const interval = setInterval(() => {
			setLastUpdated((prev) => prev + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleRefreshPrices = () => {
		queryClient.invalidateQueries({ queryKey: ["price"] });
		message.success("Prices refreshed");
		setLastUpdated(0);
	};

	const columns = useMemo(
		() => [
			columnHelper.accessor("symbol", {
				header: "Symbol",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<span className="font-semibold">{row.original.symbol}</span>
						<span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 text-xs rounded">
							{row.original.exchange}
						</span>
					</div>
				),
			}),
			columnHelper.accessor("direction", {
				header: "Direction",
				cell: ({ row }) => {
					const isBuy = row.original.direction === "BUY";
					return (
						<span
							className={`px-2 py-1 rounded text-xs font-medium ${
								isBuy
									? "bg-green-600/20 text-green-400"
									: "bg-red-600/20 text-red-400"
							}`}
						>
							{row.original.direction}
						</span>
					);
				},
			}),
			columnHelper.accessor("quantity", {
				header: "Qty",
				cell: ({ getValue }) => <span>{getValue()}</span>,
			}),
			columnHelper.accessor("entry_price", {
				header: "Entry",
				cell: ({ getValue }) => (
					<span className="font-mono">
						₹
						{getValue().toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				),
			}),
			columnHelper.display({
				id: "live_price",
				header: "Live Price",
				cell: ({ row }) => {
					const key = `${row.original.symbol}:${row.original.exchange}`;
					const livePrice = prices[key];
					if (livePrice === null || livePrice === undefined) {
						return <span className="text-gray-500 font-mono">--</span>;
					}
					return (
						<span className="font-mono font-semibold">
							₹
							{livePrice.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "current_value",
				header: "Value",
				cell: ({ row }) => {
					const key = `${row.original.symbol}:${row.original.exchange}`;
					const livePrice = prices[key];
					if (!livePrice) {
						return <span className="text-gray-500 font-mono">--</span>;
					}
					const value = livePrice * row.original.quantity;
					return (
						<span className="font-mono">
							₹
							{value.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</span>
					);
				},
			}),
			columnHelper.display({
				id: "pnl",
				header: "PnL",
				cell: ({ row }) => {
					const key = `${row.original.symbol}:${row.original.exchange}`;
					const livePrice = prices[key];
					if (!livePrice) {
						return <span className="text-gray-500 font-mono">--</span>;
					}
					const isBuy = row.original.direction === "BUY";
					const pnl = isBuy
						? (livePrice - row.original.entry_price) * row.original.quantity
						: (row.original.entry_price - livePrice) * row.original.quantity;
					const isProfit = pnl >= 0;
					return (
						<span
							className={`font-mono font-semibold ${
								isProfit ? "text-green-400" : "text-red-400"
							}`}
						>
							{pnl >= 0 ? "+" : ""}₹
							{pnl.toLocaleString("en-IN", {
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
							})}
						</span>
					);
				},
			}),
			columnHelper.accessor("stop_loss", {
				header: "SL",
				cell: ({ getValue }) => (
					<span className="text-red-400">
						₹
						{getValue().toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				),
			}),
			columnHelper.accessor("take_profit", {
				header: "TP",
				cell: ({ getValue }) => (
					<span className="text-green-400">
						₹
						{getValue().toLocaleString("en-IN", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				),
			}),
			columnHelper.display({
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div className="flex items-center gap-2">
							<button
								onClick={() => handleEdit(item)}
								className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
							>
								<Edit3 className="h-4 w-4" />
							</button>
							<button
								onClick={() => handleDelete(item._id!)}
								className="p-1 text-gray-500 hover:text-red-400 transition-colors"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					);
				},
			}),
		],
		[prices],
	);

	const table = useReactTable({
		data: watchlist || [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<Spin size="large" />
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold flex items-center gap-2">
						<span className="relative flex h-3 w-3">
							<span
								className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
									connected ? "bg-green-400" : "bg-gray-400"
								}`}
							></span>
							<span
								className={`relative inline-flex rounded-full h-3 w-3 ${
									connected ? "bg-green-500" : "bg-gray-500"
								}`}
							></span>
						</span>
						Live Positions
					</h1>
					<p className="text-gray-500 text-sm mt-1">
						Prices update every 60 seconds
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleRefreshPrices}
						className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded text-gray-400 hover:text-gray-200 transition-colors"
					>
						<Loader2 className="h-4 w-4" />
						Refresh
					</button>
					<button
						onClick={() => {
							setEditItem(null);
							setIsModalOpen(true);
						}}
						className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
					>
						+ Add Position
					</button>
				</div>
			</div>

			<div className="bg-surface border border-border rounded-lg overflow-hidden">
				<table className="w-full">
					<thead className="bg-surface-highlight border-b border-border">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="text-left px-4 py-3 text-sm font-medium text-gray-400"
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
								className="border-b border-border hover:bg-surface-highlight/50 transition-colors"
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id} className="px-4 py-3 text-sm">
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				{(!watchlist || watchlist.length === 0) && (
					<div className="text-center py-12 text-gray-500">
						No positions yet. Add your first position to start tracking.
					</div>
				)}
			</div>

			<WatchlistModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				editItem={editItem}
			/>
		</div>
	);
};

export default LivePositions;
