import { useState } from "react";
import { Button, Input, Modal, Form } from "antd";
import { useCreateSymbol } from "../../hooks/useResources";

interface CreateSymbolModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (newSymbol: { id: number; symbol: string; name: string }) => void;
}

export const CreateSymbolModal: React.FC<CreateSymbolModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const createMutation = useCreateSymbol();
	const [formData, setFormData] = useState({ symbol: "", name: "" });

	const handleClose = () => {
		setFormData({ symbol: "", name: "" });
		onClose();
	};

	const handleSubmit = () => {
		if (!formData.symbol.trim()) return;

		createMutation.mutate(formData, {
			onSuccess: (data) => {
				onSuccess?.(data);
				handleClose();
			},
		});
	};

	return (
		<Modal
			open={isOpen}
			onCancel={handleClose}
			closable
			title="Create New Symbol"
			footer={
				<>
					<Button onClick={handleClose}>Cancel</Button>
					<Button
						type="primary"
						onClick={handleSubmit}
						loading={createMutation.isPending}
						disabled={!formData.symbol.trim()}
					>
						Create Symbol
					</Button>
				</>
			}
		>
			<Form layout="vertical">
				<Form.Item label="Symbol" required>
					<Input
						value={formData.symbol}
						placeholder="Enter symbol (e.g. AAPL)"
						onChange={(e) =>
							setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
						}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSubmit();
							}
						}}
						autoFocus
					/>
				</Form.Item>
				<Form.Item label="Name">
					<Input
						value={formData.name}
						placeholder="Enter full name (e.g. Apple Inc.)"
						onChange={(e) => setFormData({ ...formData, name: e.target.value })}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateSymbolModal;
