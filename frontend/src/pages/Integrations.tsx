import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Button,
	Card,
	Form,
	Input,
	Typography,
	message,
	Tag,
	Descriptions,
} from "antd";
import { connectDhan, getIntegrationStatus } from "../api/client";
import {
	CheckCircleOutlined,
	ApiOutlined,
	DisconnectOutlined,
} from "@ant-design/icons";
import { Icon } from "../components/ui/Icon";

const { Title, Text } = Typography;

const Integrations = () => {
	const [form] = Form.useForm();

	// Query for integration status
	const { data: statusData, refetch } = useQuery({
		queryKey: ["integrationStatus"],
		queryFn: getIntegrationStatus,
	});

	const isConnected = statusData?.enable;

	// Mutation for connecting
	const connectMutation = useMutation({
		mutationFn: (values: { clientId: string; accessToken: string }) =>
			connectDhan(values.clientId, values.accessToken),
		onSuccess: () => {
			message.success("Successfully connected to Dhan HQ!");
			refetch();
			form.resetFields();
		},
		onError: (error: Error) => {
			message.error(error.message);
		},
	});

	const onFinish = (values: any) => {
		connectMutation.mutate(values);
	};

	return (
		<div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
			<Title level={2}>Integrations</Title>
			<Text type="secondary" style={{ display: "block", marginBottom: "24px" }}>
				Manage your connections to external trading platforms and data feeds.
				<br /> After successfull connection the related page will be updated
				automatically.
			</Text>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
					gap: "24px",
				}}
			>
				{/* Dhan HQ Card */}
				<Card
					title={
						<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<Icon name="dhan" size={{ height: 20, width: 24 }} />
							<span>Dhan HQ</span>
						</div>
					}
					extra={
						isConnected ? (
							<Tag color="success" icon={<CheckCircleOutlined />}>
								Connected
							</Tag>
						) : (
							<Tag color="default" icon={<DisconnectOutlined />}>
								Disconnected
							</Tag>
						)
					}
					style={{ height: "100%", display: "flex", flexDirection: "column" }}
					bodyStyle={{ flex: 1, display: isConnected ? "none" : "block" }}
				>
					{!isConnected && (
						<div style={{ marginBottom: "20px" }}>
							<Text>
								Connect your Dhan account to automatically import trades and
								sync portfolio data.
							</Text>
						</div>
					)}

					{!isConnected && (
						<Form
							form={form}
							layout="vertical"
							onFinish={onFinish}
							disabled={connectMutation.isPending}
						>
							{/* <Form.Item
                                label="Client ID"
                                name="clientId"
                                rules={[{ required: true, message: 'Please enter your Client ID' }]}
                            >
                                <Input placeholder="Enter your Dhan Client ID" />
                            </Form.Item> */}

							<Form.Item
								label="Access Token"
								name="accessToken"
								rules={[
									{ required: true, message: "Please enter your Access Token" },
								]}
							>
								<Input.Password placeholder="Enter your Access Token" />
							</Form.Item>

							<Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
								<Button
									type="primary"
									htmlType="submit"
									block
									loading={connectMutation.isPending}
									icon={<ApiOutlined />}
								>
									{connectMutation.isPending ? "Connecting..." : "Connect Dhan"}
								</Button>
							</Form.Item>
						</Form>
					)}
				</Card>

				{/* Placeholder for future integrations */}
				{/*  <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderStyle: 'dashed' }}>
                    <Text type="secondary">More integrations coming soon...</Text>
                </Card> */}
			</div>
		</div>
	);
};

export default Integrations;
