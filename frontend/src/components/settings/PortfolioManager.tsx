import { createColumnHelper } from "@tanstack/react-table";
import { Button, Input, InputNumber, Modal, Select, Tabs, Tag, Table, message, Flex } from "antd";
import React, { useMemo, useState } from "react";
import { FaTrash, FaWallet } from "react-icons/fa";
import {
	useCreatePortfolio,
	useDeletePortfolio,
	usePortfolios,
	useUpdatePortfolio,
	usePortfolioTransactions,
	usePortfolioPayin,
	usePortfolioPayout,
} from "../../hooks/useResources";
import { Icon } from "../ui/Icon";
import { VirtualTable } from "../VirtualTable";

const PortfolioManager = () => {
	const { data: portfolios, isLoading } = usePortfolios();
	const createMutation = useCreatePortfolio();
	const updateMutation = useUpdatePortfolio();
	const deleteMutation = useDeletePortfolio();
	const payinMutation = usePortfolioPayin();
	const payoutMutation = usePortfolioPayout();

	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("1");
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({ name: "", description: "" });
	const [transactionForm, setTransactionForm] = useState({
		amount: 0,
		type: "PAYIN",
		note: "",
	});

	// Fetch transactions for the editing portfolio
	const { data: transactions, isLoading: isLoadingTransactions } =
		usePortfolioTransactions(editingId);

	const handleOpen = (item?: any) => {
		if (item) {
			setEditingId(item.id);
			setFormData({ name: item.name, description: item.description || "" });
		} else {
			setEditingId(null);
			setFormData({ name: "", description: "" });
		}
		setIsOpen(true);
		setActiveTab("1");
	};

	const handleClose = () => {
		setIsOpen(false);
		setTransactionForm({ amount: 0, type: "PAYIN", note: "" });
	};

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

	const handleAddTransaction = () => {
		if (!editingId) return;
		const mutation =
			transactionForm.type === "PAYIN" ? payinMutation : payoutMutation;

		mutation.mutate(
			{
				id: editingId,
				data: {
					amount: transactionForm.amount,
					note: transactionForm.note,
				},
			},
			{
				onSuccess: () => {
					setTransactionForm({ amount: 0, type: "PAYIN", note: "" });
					message.success("Transaction added successfully");
				},
			},
		);
	};

	const handleDelete = (id: number) => {
		if (confirm("Are you sure you want to delete this portfolio?")) {
			deleteMutation.mutate(id);
		}
	};

	const columns = useMemo(() => {
		const columnHelper = createColumnHelper<any>();
		return [
			columnHelper.accessor("id", { header: "ID", size: 60 }),
			columnHelper.accessor("name", { header: "Name" }),
			columnHelper.accessor("balance", {
				header: "Balance",
				cell: (info) => (
					<span
						className={`font-semibold ${info.getValue() >= 0 ? "text-green-500" : "text-red-500"
							}`}
					>
						₹ {Number(info.getValue() || 0).toFixed(2).toLocaleString()}
					</span>
				),
			}),
			columnHelper.accessor("description", {
				header: "Description",
				cell: (info) => info.getValue() || "-",
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
							<Icon name="edit" size={{ height: 14, width: 14 }} />
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

	const transactionColumns = [
		{
			title: "Type",
			dataIndex: "type",
			key: "type",
			render: (type: string) => (
				<Tag color={type === "PAYIN" ? "green" : "volcano"}>{type}</Tag>
			),
		},
		{
			title: "Amount",
			dataIndex: "amount",
			key: "amount",
			render: (amount: number) => `₹ ${amount.toFixed(2).toLocaleString()}`,
		},
		{
			title: "Note",
			dataIndex: "note",
			key: "note",
		},
		{
			title: "Date",
			dataIndex: "createdAt",
			key: "createdAt",
			render: (date: string) => new Date(date).toLocaleDateString(),
		},
	];

	if (isLoading) return <div>Loading...</div>;

	return (
		<div>
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Manage Portfolios</h2>
				<Button onClick={() => handleOpen()}>Add Portfolio</Button>
			</div>

			<VirtualTable data={portfolios || []} columns={columns} height="400px" />

			<Modal
				open={isOpen}
				onCancel={handleClose}
				closable
				centered
				width={700}
				footer={
					activeTab === "1" ? (
						<>
						</>
					) : (
						<Button onClick={handleClose}>Close</Button>
					)
				}
				title={editingId ? "Portfolio Details" : "New Portfolio"}
			>
				<Tabs activeKey={activeTab} onChange={setActiveTab}>
					<Tabs.TabPane tab="General" key="1">
						<div className="space-y-4 pt-4">
							<Flex vertical gap={8}>
								<div>
									<label className="block text-sm font-medium mb-1">Name</label>
									<Input
										value={formData.name}
										placeholder="Enter Name"
										onChange={(e) =>
											setFormData({ ...formData, name: e.currentTarget.value })
										}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Description
									</label>
									<Input
										value={formData.description}
										placeholder="Enter description"
										onChange={(e) =>
											setFormData({
												...formData,
												description: e.currentTarget.value,
											})
										}
									/>
								</div>
								<Flex justify="end" className="mt-2" gap={8}>
									<Button variant="link" onClick={handleClose}>
										Cancel
									</Button>
									<Button
										type="primary"
										onClick={handleSubmit}
										loading={createMutation.isPending || updateMutation.isPending}
									>
										Save Changes
									</Button>
								</Flex>
							</Flex>



							{editingId && (
								<div className="border-t border-t-gray-200 pt-4 mt-6">
									<h3 className="text-lg font-medium mb-4 flex items-center">
										<FaWallet className="mr-2" /> Add Funds / Withdraw
									</h3>
									<div className="flex space-x-4 justify-evenly items-end">
										<div className="w-fit">
											<label className="block text-sm font-medium mb-1">
												Amount
											</label>
											<InputNumber
												className="w-full"
												value={transactionForm.amount}
												onChange={(val) =>
													setTransactionForm({
														...transactionForm,
														amount: val || 0,
													})
												}
												style={{ width: "120px" }}
											/>
										</div>
										<div>
											<label className="block text-sm font-medium mb-1">
												Type
											</label>
											<Select
												className="w-32"
												value={transactionForm.type}
												onChange={(val) =>
													setTransactionForm({ ...transactionForm, type: val })
												}
											>
												<Select.Option value="PAYIN">PAYIN</Select.Option>
												<Select.Option value="PAYOUT">PAYOUT</Select.Option>
											</Select>
										</div>
										<div className="mt-4">
											<label className="block text-sm font-medium mb-1">
												Note
											</label>
											<Input
												placeholder="Transaction note"
												value={transactionForm.note}
												onChange={(e) =>
													setTransactionForm({
														...transactionForm,
														note: e.target.value,
													})
												}
											/>
										</div>
										<Button
											type="primary"
											onClick={handleAddTransaction}
											loading={payinMutation.isPending || payoutMutation.isPending}
										>
											Add
										</Button>
									</div>

								</div>
							)}
						</div>
					</Tabs.TabPane>

					{editingId && (
						<Tabs.TabPane tab="Transaction History" key="2">
							<div className="pt-4">
								<Table
									dataSource={transactions}
									columns={transactionColumns}
									loading={isLoadingTransactions}
									pagination={{ pageSize: 5 }}
									size="small"
									rowKey="_id"
								/>
							</div>
						</Tabs.TabPane>
					)}
				</Tabs>
			</Modal>
		</div>
	);
};

export default PortfolioManager;
