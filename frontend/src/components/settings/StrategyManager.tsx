import { createColumnHelper } from "@tanstack/react-table";
import { Button, Input, Modal } from "antd";
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

const StrategyManager = () => {
	const { data: strategies, isLoading } = useStrategies();
	const createMutation = useCreateStrategy();
	const updateMutation = useUpdateStrategy();
	const deleteMutation = useDeleteStrategy();

	const [isOpen, setIsOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({ name: "", description: "" });

	const handleOpen = (strategy?: any) => {
		if (strategy) {
			setEditingId(strategy.id);
			setFormData({
				name: strategy.name,
				description: strategy.description || "",
			});
		} else {
			setEditingId(null);
			setFormData({ name: "", description: "" });
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
				width={800}
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
				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Strategy Name</label>
					<Input
						placeholder="Enter name"
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.currentTarget.value })
						}
					/>
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
