import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";


import { VirtualTable } from "./VirtualTable";
import type { DhanOrder } from "@/api/client";
import { Select, Tag } from "antd";

const orderColumnHelper = createColumnHelper<DhanOrder>();

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

	const formatINR = (value: number): string => {
	return `₹${value.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
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
			<VirtualTable data={filteredData} columns={columns} height="450px" />
		</div>
	);
};

export { OrdersTable };
