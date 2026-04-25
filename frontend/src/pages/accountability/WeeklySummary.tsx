import { useNavigate } from "@tanstack/react-router";
import { Button, Card, message, Typography } from "antd";
import { useEffect, useState } from "react";
import {
	getWeeklySummary,
	publishWeeklySummary,
	type WeeklySummary as WeeklySummaryType,
} from "../../api/accountabilityClient";

const { Title, Text } = Typography;

const FEED_USER_ID = "user_1";

const WeeklySummaryPage: React.FC = () => {
	const navigate = useNavigate();
	const [summary, setSummary] = useState<WeeklySummaryType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPublishing, setIsPublishing] = useState(false);
	const today = new Date().getDay();
	const isSunday = today === 0;

	useEffect(() => {
		const loadSummary = async () => {
			try {
				const data = await getWeeklySummary(FEED_USER_ID);
				setSummary(data);
			} catch (error) {
				console.error("Failed to load summary:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadSummary();
	}, []);

	const handlePublish = async () => {
		if (!summary?.generated_summary_text) return;

		setIsPublishing(true);
		try {
			await publishWeeklySummary({
				user_id: FEED_USER_ID,
				summary_text: summary.generated_summary_text,
			});
			message.success("Weekly summary published!");
			navigate({ to: "/accountability/feed" });
		} catch (error) {
			console.error("Failed to publish:", error);
			message.error("Failed to publish");
		} finally {
			setIsPublishing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="p-4">
				<Text>Loading...</Text>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-md mx-auto">
			<Title level={2}>Weekly Summary</Title>

			{!isSunday && (
				<Card className="mb-4" style={{ backgroundColor: "#fff7e6" }}>
					<Text>
						This screen is available on Sundays only. Come back then for your
						weekly summary.
					</Text>
				</Card>
			)}

			{summary && (
				<>
					<Card className="mb-4">
						<Text strong className="block mb-2">
							Week of {summary.week_start?.split("T")[0]} to{" "}
							{summary.week_end?.split("T")[0]}
						</Text>
					</Card>

					<Card className="mb-4">
						<Text strong className="block mb-2">
							Sessions
						</Text>
						<Text className="text-3xl font-bold">
							{summary.actual_sessions}
						</Text>
						<Text type="secondary"> / </Text>
						<Text className="text-3xl">
							{summary.declared_sessions} committed
						</Text>
					</Card>

					<Card className="mb-4">
						<Text strong className="block mb-2">
							Average Compliance
						</Text>
						<Text className="text-2xl">{summary.avg_compliance}%</Text>
					</Card>

					<Card className="mb-4">
						<Text strong className="block mb-2">
							Average Energy
						</Text>
						<Text className="text-2xl">{summary.avg_energy}/10</Text>
					</Card>

					<Card className="mb-4">
						<Text strong className="block mb-2">
							Honesty Score
						</Text>
						<Text className="text-2xl">{summary.honesty_score}%</Text>
						<Text type="secondary" className="block text-sm">
							% of sessions where self-report matched compliance within 15%
						</Text>
					</Card>

					{summary.generated_summary_text && (
						<Card className="mb-4">
							<Text strong className="block mb-2">
								Summary
							</Text>
							<Text>{summary.generated_summary_text}</Text>
						</Card>
					)}

					{isSunday && (
						<Button
							type="primary"
							size="large"
							block
							loading={isPublishing}
							onClick={handlePublish}
						>
							Publish Summary
						</Button>
					)}
				</>
			)}

			<div className="mt-4">
				<Button onClick={() => navigate({ to: "/accountability/feed" })}>
					Back to Feed
				</Button>
			</div>
		</div>
	);
};

export default WeeklySummaryPage;
