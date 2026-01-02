import { InfoCircleOutlined } from "@ant-design/icons";
import {
	Flex,
	Form,
	Input,
	InputNumber,
	message,
	Switch,
	Tabs,
	Tooltip,
} from "antd";
import { debounce } from "lodash";
import { useMemo, useState } from "react";
import PortfolioManager from "../components/settings/PortfolioManager";
import StrategyManager from "../components/settings/StrategyManager";
import SymbolManager from "../components/settings/SymbolManager";
import {
	type TDashboardDisplayState,
	usePreferenceStore,
} from "../store/preferenceStore";

const Settings = () => {
	const [activeKey, setActiveKey] = useState<string>("general");

	const items = [
		{
			key: "general",
			label: "General",
			children: (
				<div className="p-2 max-w-full flex flex-col gap-2">
					<DashboardPreference />
					<MaxLoss />
				</div>
			),
		},
		{
			key: "portfolios",
			label: "Portfolios",
			children: (
				<div className="p-2">
					<PortfolioManager />
				</div>
			),
		},
		{
			key: "strategies",
			label: "Strategies",
			children: (
				<div className="p-2">
					<StrategyManager />
				</div>
			),
		},
		{
			key: "symbols",
			label: "Symbols",
			children: (
				<div className="p-2">
					<SymbolManager />
				</div>
			),
		},
	];

	return (
		<div className="container mx-auto p-2">
			<div className="mb-8">
				<h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">
					Settings
				</h1>
				<p className="text-secondary">
					Manage your preferences and trading resources.
				</p>
			</div>

			<div className="bg-surface rounded-2xl p-2 pt-0 border border-gray-700 shadow-2xl">
				<Tabs
					activeKey={activeKey}
					onChange={setActiveKey}
					items={items}
					className="w-full"
				/>
			</div>
		</div>
	);
};

export default Settings;

const DashboardPreference = () => {
	const { dashboardDisplayState, updateDashboardDisplayState } =
		usePreferenceStore();
	const displayData = Object.entries(dashboardDisplayState).map((value) => ({
		label: value[0],
		value: value[1],
	}));
	return (
		<div className="p-2 w-full">
			<h2 className="text-xl font-semibold mb-4">Dashboard Preferences</h2>

			<Form layout="vertical" className="grid grid-cols-16 gap-4">
				{/* <Form.Item label="Dashboard Display State">
          <Checkbox
            options={displayData}
            value={Object.values(dashboardDisplayState)}
            onChange={(e) => updateDashboardDisplayState(e.target.value)}
          />
        </Form.Item> */}
				{displayData.map((item) => (
					<Form.Item
						key={item.label}
						className="capitalize"
						label={
							<Tooltip title={item.label} placement="top">
								{item.label}
							</Tooltip>
						}
					>
						<Switch
							checked={item.value}
							onChange={(e) =>
								updateDashboardDisplayState(
									item.label as TDashboardDisplayState,
									e,
								)
							}
						/>
					</Form.Item>
				))}
			</Form>
		</div>
	);
};

const MaxLoss = () => {
	const { maxLoss, setMaxLoss, defaultQuantity, setDefaultQuantity } =
		usePreferenceStore();
	const [maxLossValue, setMaxLossValue] = useState(maxLoss);

	const [defaultQty, setDefaultQty] = useState(defaultQuantity);
	const handleDebounce = useMemo(
		() =>
			debounce((value: string) => {
				message.success("Max loss updated");
				setMaxLoss(value);
			}, 500),
		[],
	);
	const handleDefaultQtyDebounce = useMemo(
		() =>
			debounce((value: string) => {
				message.success("Default quantity updated");
				setDefaultQuantity(value);
			}, 500),
		[],
	);

	return (
		<Flex gap={10} align="center" className="!pb-2">
			<div>
				Max Loss %{" "}
				<Tooltip title="Max loss percentage, this will be applied on the trade entry form.">
					<InfoCircleOutlined />
				</Tooltip>
			</div>
			<InputNumber
				value={maxLossValue}
				onChange={(e) => {
					if (e) {
						setMaxLossValue(e);
						handleDebounce(e);
					}
				}}
			/>
			<div className="flex flex-row items-center gap-4">
				Default Trade Quantity{" "}
				<Tooltip title="Default trade quantity, this will be applied on the trade entry form.">
					<InfoCircleOutlined />
				</Tooltip>
				<Input
					value={defaultQty}
					onChange={(e) => {
						setDefaultQty(e.target.value);
						handleDefaultQtyDebounce(e.target.value);
					}}
					type="number"
					className="max-w-[100px]"
					placeholder="Enter default quantity"
				/>
			</div>
		</Flex>
	);
};
