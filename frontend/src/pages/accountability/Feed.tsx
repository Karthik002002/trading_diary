import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Empty, Typography } from "antd";
import { useEffect, useState } from "react";
import {
	type FeedItem,
	getAccountabilityFeed,
	getCurrentCommitment,
	getOnboardingStatus,
} from "../../api/accountabilityClient";

const { Title, Text } = Typography;

const FEED_USER_ID = "user_1";

const AccountabilityFeed: React.FC = () => {
	const navigate = useNavigate();
	const [feed, setFeed] = useState<FeedItem[]>([]);
	const [commitment, setCommitment] = useState<{
		declared_session_count: number;
		actual_session_count: number;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [onboardingComplete, setOnboardingComplete] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const status = await getOnboardingStatus(FEED_USER_ID);
				setOnboardingComplete(status.onboarding_complete ?? false);

				if (status.onboarding_complete) {
					const [feedData, commitmentData] = await Promise.all([
						getAccountabilityFeed(FEED_USER_ID),
						getCurrentCommitment(FEED_USER_ID),
					]);
					setFeed(feedData);
					setCommitment(commitmentData);
				}
			} catch (error) {
				console.error("Failed to load feed:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadData();
	}, []);

	if (!onboardingComplete) {
		return (
			<div className="p-4 max-w-md mx-auto text-center">
				<Title level={4}>Setup Required</Title>
				<Text type="secondary" className="block mb-4">
					Complete onboarding to access the accountability feed
				</Text>
				<Button
					type="primary"
					onClick={() => navigate({ to: "/accountability/onboarding" })}
				>
					Start Onboarding
				</Button>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="p-4">
				<Text>Loading...</Text>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			<Title level={2}>Accountability Feed</Title>

			{commitment && (
				<Card className="mb-4">
					<Text strong className="block mb-2">
						This Week's Commitment
					</Text>
					<div className="flex items-center gap-4">
						<Text className="text-3xl font-bold">
							{commitment.actual_session_count}
						</Text>
						<Text type="secondary">/</Text>
						<Text className="text-3xl">
							{commitment.declared_session_count}
						</Text>
						<Text type="secondary">sessions</Text>
					</div>
				</Card>
			)}

			{feed.length === 0 ? (
				<Empty description="No sessions logged yet" />
			) : (
				<div className="space-y-3">
					{feed.map((item, idx) => (
						<Card key={idx} size="small">
							<div className="flex justify-between items-start">
								<div>
									<Text>
										{item.date && new Date(item.date).toLocaleDateString()}
									</Text>
									<Text type="secondary" className="ml-2 capitalize">
										{item.session_type?.replace("_", " ")}
									</Text>
									<div className="flex gap-3 mt-1">
										<Text>Energy: {item.energy_level}/10</Text>
										<Text>
											Compliance: {item.compliance_percent?.toFixed(0)}%
										</Text>
									</div>
								</div>
								<div className="flex flex-col items-end gap-1">
									<span
										className={`px-2 py-0.5 rounded text-xs ${
											item.self_reported ? "bg-green-600" : "bg-red-600"
										} text-white`}
									>
										Plan: {item.self_reported ? "Yes" : "No"}
									</span>
									{item.honesty_flag && (
										<Text type="secondary" className="text-xs text-orange-500">
											Compliance and self-report don't match
										</Text>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			<div className="flex gap-2 mt-6">
				<Button onClick={() => navigate({ to: "/discipline" })}>
					Back to Dashboard
				</Button>
				<Button
					onClick={() => navigate({ to: "/accountability/weekly-summary" })}
				>
					Weekly Summary
				</Button>
			</div>
		</div>
	);
};

export default AccountabilityFeed;
