import { createColumnHelper } from "@tanstack/react-table";
import { Button, Input, InputNumber, Modal, Select } from "antd";
import { useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import {
	useCreateStrategy,
	useDeleteStrategy,
	useStrategies,
	useUpdateStrategy,
} from "../../hooks/useResources";
import { VirtualTable } from "../VirtualTable";
import StrategyEditor from "../../editor";
import { usePreferenceStore } from "../../store/preferenceStore";

const StrategyManager = () => {
	const { currency } = usePreferenceStore();
	const { data: strategies, isLoading } = useStrategies();
	const createMutation = useCreateStrategy();
	const updateMutation = useUpdateStrategy();
	const deleteMutation = useDeleteStrategy();

	const [isOpen, setIsOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		market_type: "equity" as "equity" | "forex",
		dailyLossLimit: null as number | null,
		monthlyLossLimit: null as number | null,
		weeklyLossLimit: null as number | null,
		consecutiveLossLimit: null as number | null,
	});

	const handleOpen = (strategy?: any) => {
		if (strategy) {
			setEditingId(strategy.id);
			setFormData({
				name: strategy.name,
				description: strategy.description || "",
				market_type: strategy.market_type || "equity",
				dailyLossLimit: strategy.dailyLossLimit || null,
				monthlyLossLimit: strategy.monthlyLossLimit || null,
				weeklyLossLimit: strategy.weeklyLossLimit || null,
				consecutiveLossLimit: strategy.consecutiveLossLimit || null,
			});
		} else {
			setEditingId(null);
			setFormData({
				name: "",
				description: "",
				market_type: "equity",
				dailyLossLimit: null,
				monthlyLossLimit: null,
				weeklyLossLimit: null,
				consecutiveLossLimit: null,
			});
		}
		setIsOpen(true);
	};

	const handleClose = () => setIsOpen(false);

	const handleSubmit = () => {
		if (editingId) {
			updateMutation.mutate(
				{ id: editingId, data: formData },
				{ onSuccess: handleClose },
			);
		} else {
			createMutation.mutate(formData, { onSuccess: handleClose });
		}
	};

	const handleDelete = (id: number) => {
		if (confirm("Are you sure you want to delete this strategy?")) {
			deleteMutation.mutate(id);
		}
	};

	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<any>();
		return [
			columnHelper.accessor("id", { header: "ID", size: 60 }),
			columnHelper.accessor("name", { header: "Name" }),
			columnHelper.accessor("market_type", {
				header: "Market",
				cell: (info) => info.getValue()?.toUpperCase?.() || "EQUITY",
				size: 90,
			}),
			columnHelper.accessor("dailyLossLimit", {
				header: "D. Limit",
				cell: (info) =>
					info.getValue() ? (
						<span className="text-red-300">{currency}{info.getValue()}</span>
					) : (
						"-"
					),
				size: 100,
			}),
			columnHelper.accessor("weeklyLossLimit", {
				header: "W. Limit",
				cell: (info) =>
					info.getValue() ? (
						<span className="text-red-400">{currency}{info.getValue()}</span>
					) : (
						"-"
					),
				size: 100,
			}),
			columnHelper.accessor("monthlyLossLimit", {
				header: "M. Limit",
				cell: (info) =>
					info.getValue() ? (
						<span className="text-red-500 font-bold">{currency}{info.getValue()}</span>
					) : (
						"-"
					),
				size: 100,
			}),
			columnHelper.accessor("consecutiveLossLimit", {
				header: "Loss Streak Limit",
				cell: (info) =>
					info.getValue() ? (
						<span className="text-orange-400 font-bold">{info.getValue()}</span>
					) : (
						"-"
					),
				size: 120,
			}),
			columnHelper.accessor("description", {
				header: "Description",
				cell: (info) => {
					const val = info.getValue();
					if (!val) return "-";
					if (val.startsWith("{")) {
						return (
							<span className="text-gray-400 italic">Rich text content</span>
						);
					}
					return val.length > 50 ? `${val.substring(0, 50)}...` : val;
				},
			}),
			columnHelper.display({
				id: "actions",
				header: "Actions",
				cell: (props) => (
					<div className="flex space-x-2">
						<button
							onClick={() => handleOpen(props.row.original)}
							className="text-blue-400 hover:text-blue-300"
						>
							<FaEdit />
						</button>
						<button
							onClick={() => handleDelete(props.row.original.id)}
							className="text-red-400 hover:text-red-300"
						>
							<FaTrash />
						</button>
					</div>
				),
				size: 100,
			}),
		];
	}, []);

	if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Manage Strategies</h2>
				<Button onClick={() => handleOpen()}>Add Strategy</Button>
			</div>

			<VirtualTable data={strategies || []} columns={columns} height="400px" />

			<Modal
				open={isOpen}
				onCancel={handleClose}
				closable
				width={"80vw"}
				title={editingId ? "Edit Strategy" : "New Strategy"}
				footer={
					<>
						{" "}
						<Button variant="link" onClick={handleClose}>
							Cancel
						</Button>
						<Button
							onClick={handleSubmit}
							loading={createMutation.isPending || updateMutation.isPending}
						>
							Save
						</Button>
					</>
				}
			>
				<div className="grid grid-cols-6 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Strategy Name
						</label>
						<Input
							placeholder="Enter name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.currentTarget.value })
							}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Market Type</label>
						<Select
							value={formData.market_type}
							onChange={(value) =>
								setFormData({
									...formData,
									market_type: value as "equity" | "forex",
								})
							}
							options={[
								{ label: "Equity", value: "equity" },
								{ label: "Forex", value: "forex" },
							]}
							style={{width:"100%"}}
						/>
					</div>

				
					<div className="col-span-1">
						<label className="block text-sm font-medium mb-1">
							Daily Loss Limit
						</label>
						<InputNumber
							className="w-full"
							placeholder="Daily Limit"
							value={formData.dailyLossLimit}
							onChange={(val) =>
								setFormData({ ...formData, dailyLossLimit: val })
							}
							style={{ width: "90%" }}
						/>
					</div>
					<div className="col-span-1">
						<label className="block text-sm font-medium mb-1">
							Weekly Loss Limit
						</label>
						<InputNumber
							className="w-full"
							placeholder="Weekly Limit"
							value={formData.weeklyLossLimit}
							onChange={(val) =>
								setFormData({ ...formData, weeklyLossLimit: val })
							}
							style={{ width: "90%" }}
						/>
					</div>
					<div className="col-span-1">
						<label className="block text-sm font-medium mb-1">
							Monthly Loss Limit
						</label>
						<InputNumber
							className="w-full"
							placeholder="Monthly Limit"
							value={formData.monthlyLossLimit}
							style={{ width: "90%" }}
							onChange={(val) =>
								setFormData({ ...formData, monthlyLossLimit: val })
							}
						/>
					</div>
					<div className="col-span-1">
						<label className="block text-sm font-medium mb-1">
							Loss Streak Alert
						</label>
						<InputNumber
							className="w-full"
							placeholder="Streak Limit"
							value={formData.consecutiveLossLimit}
							style={{ width: "90%" }}
							onChange={(val) =>
								setFormData({ ...formData, consecutiveLossLimit: val })
							}
						/>
					</div>
				</div>

				<div className="mt-4">
					<StrategyEditor
						key={isOpen ? (editingId ?? "new") : "closed"}
						initialContent={formData.description}
						onSave={(content) =>
							setFormData((prev) => ({ ...prev, description: content }))
						}
					/>
				</div>
			</Modal>
		</div>
	);
};

export default StrategyManager;
