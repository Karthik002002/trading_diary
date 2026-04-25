import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Input, message, Radio, Typography } from "antd";
import { useState } from "react";
import {
	createOnboarding,
	getOnboardingStatus,
	type OnboardingStatus,
} from "../../api/accountabilityClient";

const { Title, Text } = Typography;

type Step = "commitment" | "destination" | "witness" | "confirm";

const Onboarding: React.FC = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>("commitment");
	const [name, setName] = useState("");
	const [weeklyTarget, setWeeklyTarget] = useState(5);
	const [destination, setDestination] = useState<
		"in_app" | "telegram" | "twitter"
	>("in_app");
	const [witnessName, setWitnessName] = useState("");
	const [witnessContact, setWitnessContact] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleCommitmentSubmit = () => {
		if (!name.trim()) {
			message.error("Please enter your name");
			return;
		}
		setStep("destination");
	};

	const handleDestinationSubmit = () => {
		setStep("witness");
	};

	const handleWitnessSubmit = () => {
		setStep("confirm");
	};

	const handleFinalSubmit = async () => {
		setIsLoading(true);
		try {
			await createOnboarding({
				name,
				weekly_session_target: weeklyTarget,
				accountability_destination: destination,
				witness_name: witnessName || undefined,
				witness_contact: witnessContact || undefined,
			});
			navigate({ to: "/discipline" });
		} catch (error) {
			console.error("Onboarding failed:", error);
			message.error("Failed to complete onboarding");
		} finally {
			setIsLoading(false);
		}
	};

	const destinationOptions = [
		{
			value: "in_app",
			label: "In-App Feed",
			desc: "Your sessions stay private in the app",
		},
		{
			value: "telegram",
			label: "Telegram",
			desc: "Posts go to your Telegram channel",
		},
		{
			value: "twitter",
			label: "X (Twitter)",
			desc: "Posts go to your X feed",
		},
	];

	return (
		<div className="p-4 max-w-md mx-auto">
			{step === "commitment" && (
				<>
					<Title level={2}>Weekly Commitment</Title>
					<Text type="secondary" className="block mb-6">
						How many sessions will you trade this week?
					</Text>

					<Card className="text-center mb-6">
						<Text className="text-6xl font-bold block">{weeklyTarget}</Text>
						<Text type="secondary">sessions per week</Text>
					</Card>

					<div className="flex justify-center gap-4 mb-6">
						{[1, 2, 3, 4, 5, 6, 7].map((num) => (
							<Button
								key={num}
								type={weeklyTarget === num ? "primary" : "default"}
								onClick={() => setWeeklyTarget(num)}
								className="w-12"
							>
								{num}
							</Button>
						))}
					</div>

					<Text type="secondary" className="block text-center mb-4">
						This will be published every Sunday. You cannot edit it after Sunday
						starts.
					</Text>

					<Input
						placeholder="Your name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="mb-4"
					/>

					<Button
						type="primary"
						size="large"
						block
						onClick={handleCommitmentSubmit}
						disabled={!name.trim()}
					>
						Confirm
					</Button>
				</>
			)}

			{step === "destination" && (
				<>
					<Title level={2}>Publish Destination</Title>
					<Text type="secondary" className="block mb-6">
						Where will your session posts go?
					</Text>

					<div className="space-y-3 mb-6">
						{destinationOptions.map((opt) => (
							<Card
								key={opt.value}
								hoverable
								onClick={() => setDestination(opt.value as any)}
								style={{
									borderColor:
										destination === opt.value ? "#1890ff" : undefined,
								}}
							>
								<Text strong className="block">
									{opt.label}
								</Text>
								<Text type="secondary">{opt.desc}</Text>
							</Card>
						))}
					</div>

					<Button
						type="primary"
						size="large"
						block
						onClick={handleDestinationSubmit}
					>
						Continue
					</Button>
				</>
			)}

			{step === "witness" && (
				<>
					<Title level={2}>Invite a Witness</Title>
					<Text type="secondary" className="block mb-6">
						Optional — someone who can see your posts in real time
					</Text>

					<Input
						placeholder="Witness name"
						value={witnessName}
						onChange={(e) => setWitnessName(e.target.value)}
						className="mb-3"
					/>

					<Input
						placeholder="Contact (email or username)"
						value={witnessContact}
						onChange={(e) => setWitnessContact(e.target.value)}
						className="mb-6"
					/>

					<Text type="secondary" className="block mb-4">
						They will see your session posts in real time. They cannot react or
						comment.
					</Text>

					<div className="flex gap-2">
						<Button size="large" onClick={() => setStep("confirm")}>
							Skip
						</Button>
						<Button type="primary" size="large" onClick={handleWitnessSubmit}>
							Continue
						</Button>
					</div>
				</>
			)}

			{step === "confirm" && (
				<>
					<Title level={2}>Confirm Your Commitment</Title>

					<Card className="mb-4">
						<Text strong className="block">
							Weekly Target
						</Text>
						<Text>{weeklyTarget} sessions</Text>
					</Card>

					<Card className="mb-4">
						<Text strong className="block">
							Publish Destination
						</Text>
						<Text className="capitalize">{destination.replace("_", "-")}</Text>
					</Card>

					{witnessName && (
						<Card className="mb-4">
							<Text strong className="block">
								Witness
							</Text>
							<Text>{witnessName}</Text>
						</Card>
					)}

					<Button
						type="primary"
						size="large"
						block
						loading={isLoading}
						onClick={handleFinalSubmit}
					>
						I'm committed.
					</Button>
				</>
			)}
		</div>
	);
};

export default Onboarding;
