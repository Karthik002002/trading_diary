import { Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { Tabs, Layout, Typography } from "antd";
import {
	PieChartOutlined,
	UnorderedListOutlined,
	RiseOutlined
} from "@ant-design/icons";

const { Content } = Layout;
const { Title } = Typography;

export const DhanIntegrationPage = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// Determine active tab based on current path
	const getActiveKey = () => {
		const path = location.pathname;
		if (path.includes("/dhan/trades")) return "trades";
		if (path.includes("/dhan/positions")) return "positions";
		return "portfolio"; // default
	};

	const handleTabChange = (key: string) => {
		switch (key) {
			case "portfolio":
				navigate({ to: "/dhan/portfolio" });
				break;
			case "trades":
				navigate({ to: "/dhan/trades" });
				break;
			case "positions":
				navigate({ to: "/dhan/positions" });
				break;
		}
	};

	const items = [
		{
			key: 'portfolio',
			label: (
				<span>
					Portfolio
				</span>
			),
		},
		{
			key: 'trades',
			label: (
				<span>
					Trades
				</span>
			),
		},
		{
			key: 'positions',
			label: (
				<span>
					Positions
				</span>
			),
		},
	];

	return (
		<Layout className="min-h-full ">
			<div className="px-6 pt-6">
				<Title level={2} className="">Dhan Integration</Title>
				<Tabs
					activeKey={getActiveKey()}
					onChange={handleTabChange}
					items={items}
					size="large"
					type="line"
					className="mb-0"
				/>
			</div>
			<Content className="p-6 ">
				<Outlet />
			</Content>
		</Layout>
	);
};
