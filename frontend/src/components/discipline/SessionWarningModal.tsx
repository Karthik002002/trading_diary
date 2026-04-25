import { Button, Modal, Typography } from "antd";

const { Title, Text } = Typography;

interface SessionWarningModalProps {
	sessionType: string;
	compliance: number;
	open: boolean;
	onTradeAnyway: () => void;
	onReviewOnly: () => void;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
	sessionType,
	compliance,
	open,
	onTradeAnyway,
	onReviewOnly,
}) => {
	return (
		<Modal
			open={open}
			closable={false}
			footer={null}
			width={400}
			className="text-center"
		>
			<Title level={4}>Session Block Warning</Title>
			<Text className="block mb-4">
				Your last 5 {sessionType} sessions: {compliance.toFixed(0)}% compliance
			</Text>
			<Text type="secondary" className="block mb-6">
				Do you want to trade or just review charts tonight?
			</Text>
			<div className="flex gap-2 justify-center">
				<Button size="large" onClick={onReviewOnly}>
					Review Only
				</Button>
				<Button type="primary" size="large" onClick={onTradeAnyway}>
					Trade Anyway
				</Button>
			</div>
		</Modal>
	);
};

export default SessionWarningModal;
