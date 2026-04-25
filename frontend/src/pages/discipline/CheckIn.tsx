import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Modal, message, Slider, Typography } from "antd";
import { useState } from "react";
import {
	closeSession,
	createSession,
	publishSession,
	type SessionCheckinData,
} from "../../api/accountabilityClient";

const { Title, Text } = Typography;

const TIME_OF_DAY_OPTIONS = [
	{ label: "Morning", value: "morning" },
	{ label: "Post-Work", value: "post-work" },
	{ label: "Post-Gym", value: "post-gym" },
] as const;

const MENTAL_STATE_TAGS = [
	"Focused",
	"Distracted",
	"Tired",
	"Sharp",
	"Anxious",
] as const;

const CHECKIN_USER_ID = "user_1";

const CheckIn: React.FC = () => {
	const navigate = useNavigate();
	const [energyLevel, setEnergyLevel] = useState(5);
	const [timeOfDay, setTimeOfDay] = useState<
		"morning" | "post-work" | "post-gym"
	>("morning");
	const [mentalStateTags, setMentalStateTags] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const [sessionData, setSessionData] = useState<{
		session_id: string;
	} | null>(null);

	const [showHonestyModal, setShowHonestyModal] = useState(false);
	const [showPublishPreview, setShowPublishPreview] = useState(false);
	const [honestyAnswer, setHonestyAnswer] = useState<boolean | null>(null);
	const [generatedContent, setGeneratedContent] = useState("");
	const [complianceScore, setComplianceScore] = useState(0);

	const toggleTag = (tag: string) => {
		setMentalStateTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		);
	};

	const handleStartSession = async () => {
		setIsLoading(true);
		try {
			const session = await createSession({
				user_id: CHECKIN_USER_ID,
				time_of_day: timeOfDay,
				energy_level: energyLevel,
				mental_state_tags: mentalStateTags,
			});
			setSessionData(session);
			navigate({
				to: "/discipline/log/$sessionId",
				params: { sessionId: session.session_id },
			});
		} catch (error) {
			console.error("Failed to start session:", error);
			message.error("Failed to start session");
		} finally {
			setIsLoading(false);
		}
	};

	const handleHonestyTap = async () => {
		if (!sessionData || honestyAnswer === null) return;

		setIsLoading(true);
		try {
			const result = await closeSession(sessionData.session_id, {
				plan_followed_self_report: honestyAnswer,
				user_id: CHECKIN_USER_ID,
			});
			setGeneratedContent(result.generated_content);
			setComplianceScore(result.compliance_score);
			setShowHonestyModal(false);
			setShowPublishPreview(true);
		} catch (error) {
			console.error("Failed to close session:", error);
			message.error("Failed to close session");
		} finally {
			setIsLoading(false);
		}
	};

	const handlePublish = async () => {
		if (!sessionData) return;

		setIsLoading(true);
		try {
			await publishSession(sessionData.session_id, {
				user_id: CHECKIN_USER_ID,
			});
			message.success("Session published!");
			navigate({ to: "/accountability/feed" });
		} catch (error) {
			console.error("Failed to publish:", error);
			message.error("Failed to publish");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSavePrivately = () => {
		message.info("Session saved privately");
		navigate({ to: "/discipline" });
	};

	return (
		<div className="p-6 max-w-md mx-auto">
			<Title level={2}>Daily Check-in</Title>
			<Text type="secondary" className="block mb-6">
				Rate your energy and select your mental state before trading
			</Text>

			<Card className="mb-6">
				<Text strong className="block mb-2">
					Energy Level: {energyLevel}/10
				</Text>
				<Slider
					min={1}
					max={10}
					value={energyLevel}
					onChange={setEnergyLevel}
					marks={{ 1: "1", 5: "5", 10: "10" }}
				/>
			</Card>

			<Card className="mb-6">
				<Text strong className="block mb-2">
					Time of Session
				</Text>
				<div className="flex gap-2">
					{TIME_OF_DAY_OPTIONS.map((option) => (
						<Button
							key={option.value}
							type={timeOfDay === option.value ? "primary" : "default"}
							onClick={() => setTimeOfDay(option.value)}
						>
							{option.label}
						</Button>
					))}
				</div>
			</Card>

			<Card className="mb-6">
				<Text strong className="block mb-2">
					Mental State
				</Text>
				<div className="flex flex-wrap gap-2">
					{MENTAL_STATE_TAGS.map((tag) => (
						<Button
							key={tag}
							type={mentalStateTags.includes(tag) ? "primary" : "default"}
							onClick={() => toggleTag(tag)}
						>
							{tag}
						</Button>
					))}
				</div>
			</Card>

			<Button
				type="primary"
				size="large"
				block
				loading={isLoading}
				onClick={handleStartSession}
				disabled={mentalStateTags.length === 0}
			>
				Start Trading Session
			</Button>

			<Modal
				open={showPublishPreview}
				closable={false}
				footer={null}
				width={400}
			>
				<Title level={4}>Publish Preview</Title>
				<Card className="mb-4">
					<Text>{generatedContent}</Text>
				</Card>
				<div className="flex gap-2 justify-center">
					<Button size="large" onClick={handleSavePrivately}>
						Save privately
					</Button>
					<Button
						type="primary"
						size="large"
						onClick={handlePublish}
						loading={isLoading}
					>
						Publish
					</Button>
				</div>
			</Modal>
		</div>
	);
};

export const HonestyModal: React.FC<{
	open: boolean;
	onAnswer: (answer: boolean) => void;
}> = ({ open, onAnswer }) => {
	return (
		<Modal open={open} closable={false} footer={null} width={400}>
			<Title level={4}>Did you follow your plan today?</Title>
			<div className="flex gap-2 justify-center mt-6">
				<Button size="large" onClick={() => onAnswer(false)}>
					No
				</Button>
				<Button type="primary" size="large" onClick={() => onAnswer(true)}>
					Yes
				</Button>
			</div>
		</Modal>
	);
};

export default CheckIn;
