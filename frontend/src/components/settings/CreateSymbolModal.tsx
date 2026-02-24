import { Button, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { useCreateSymbol } from "../../hooks/useResources";
import type { MarketType } from "../../types/api";

interface CreateSymbolModalProps {
	isOpen: boolean;
	onClose: () => void;
	marketType?: MarketType;
	onSuccess?: (newSymbol: { id: number; symbol: string; name: string }) => void;
}

export const CreateSymbolModal: React.FC<CreateSymbolModalProps> = ({
	isOpen,
	onClose,
	marketType = "equity",
	onSuccess,
}) => {
	const createMutation = useCreateSymbol();
	const [formData, setFormData] = useState({
		symbol: "",
		name: "",
		market_type: marketType,
	});

	useEffect(() => {
		setFormData((prev) => ({ ...prev, market_type: marketType }));
	}, [marketType]);

	const handleClose = () => {
		setFormData({ symbol: "", name: "", market_type: marketType });
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
				<Form.Item label="Market Type" required>
					<Select
						value={formData.market_type}
						onChange={(value) =>
							setFormData({
								...formData,
								market_type: value as MarketType,
							})
						}
						options={[
							{ label: "Equity", value: "equity" },
							{ label: "Forex", value: "forex" },
						]}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};

export default CreateSymbolModal;
