import { Button, Flex, Modal } from "antd";
import type React from "react";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<Props> = ({
	isOpen,
	onClose,
	onConfirm,
	isLoading,
}) => {
	return (
		<Modal
			open={isOpen}
			onCancel={onClose}
			closable
			title={"Confirm Deletion"}
			footer={
				<>
					{" "}
					<Button variant="link" onClick={onClose} className="mr-2">
						Cancel
					</Button>
					<Button onClick={onConfirm} loading={isLoading}>
						Delete
					</Button>
				</>
			}
		>
			<Flex>
				Are you sure you want to delete this trade? This action cannot be
				undone.
			</Flex>
		</Modal>
	);
};

export default DeleteConfirmationModal;
