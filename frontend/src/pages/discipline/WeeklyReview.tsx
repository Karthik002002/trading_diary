import { getWeeklyReview, type WeeklyReviewData } from "@/api/client";
import { useNavigate } from "@tanstack/react-router";
import { Button, Card, Radio, Typography } from "antd";
import { useEffect, useState } from "react";


const { Title, Text } = Typography;

const WeeklyReview: React.FC = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<WeeklyReviewData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [intention, setIntention] = useState<string | null>(null);
	const today = new Date().getDay();

	const isSunday = today === 0;

	useEffect(() => {
		const loadReview = async () => {
			try {
				const reviewData = await getWeeklyReview();
				setData(reviewData);
			} catch (error) {
				console.error("Failed to load review:", error);
			} finally {
				setIsLoading(false);
			}
		};
		loadReview();
	}, []);

	const handleSaveIntention = () => {
		console.log("Saving intention:", intention);
		navigate({ to: "/discipline/dashboard" });
	};

	if (isLoading) {
		return (
			<div className="p-6">
				<Text>Loading...</Text>
			</div>
		);
	}

	if (!isSunday) {
		return (
			<div className="p-6 max-w-md mx-auto text-center">
				<Title level={4}>Weekly Review</Title>
				<Text type="secondary">This screen is only available on Sundays</Text>
				<div className="mt-4">
					<Button onClick={() => navigate({ to: "/discipline/dashboard" })}>
						Back to Dashboard
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-md mx-auto">
			<Title level={2}>Weekly Review</Title>

			<Card className="mb-4">
				<Text strong className="block mb-2">
					Best Session Type This Week
				</Text>
				<Text className="text-xl capitalize">
					{data?.bestSessionType?.replace("-", " ") || "N/A"}
				</Text>
				<Text type="secondary" className="block">
					When you were sharpest
				</Text>
			</Card>

			<Card className="mb-4">
				<Text strong className="block mb-2">
					Worst Session Type
				</Text>
				<Text className="text-xl capitalize text-red-500">
					{data?.worstSessionType?.replace("-", " ") || "N/A"}
				</Text>
				<Text type="secondary" className="block">
					When rules broke down most
				</Text>
			</Card>

			{data?.patternCallout && (
				<Card className="mb-4" style={{ backgroundColor: "#fff7e6" }}>
					<Text strong className="block mb-2">
						Pattern Callout
					</Text>
					<Text>{data.patternCallout}</Text>
				</Card>
			)}

			<Card className="mb-4">
				<Text strong className="block mb-2">
					Summary
				</Text>
				<Text>
					{data?.totalSessions} sessions | {data?.totalTrades} trades |{" "}
					{data?.violations} rule violations
				</Text>
			</Card>

			<Card>
				<Text strong className="block mb-2">
					Next Week Intention
				</Text>
				<Radio.Group
					value={intention}
					onChange={(e) => setIntention(e.target.value)}
					className="block"
				>
					<Radio value="reduce" className="block">
						Reduce sessions
					</Radio>
					<Radio value="maintain" className="block">
						Maintain
					</Radio>
					<Radio value="increase" className="block">
						Increase sessions
					</Radio>
				</Radio.Group>
			</Card>

			<div className="flex gap-2 mt-6">
				<Button onClick={() => navigate({ to: "/discipline/dashboard" })}>
					Cancel
				</Button>
				<Button
					type="primary"
					disabled={!intention}
					onClick={handleSaveIntention}
				>
					Save & Exit
				</Button>
			</div>
		</div>
	);
};

export default WeeklyReview;
