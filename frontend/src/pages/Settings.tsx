import {
	Button,
	Checkbox,
	Form,
	Input,
	message,
	Switch,
	Tabs,
	Tooltip,
} from "antd";
import { useState } from "react";

import PortfolioManager from "../components/settings/PortfolioManager";
import StrategyManager from "../components/settings/StrategyManager";
import SymbolManager from "../components/settings/SymbolManager";
import {
	usePreferenceStore,
	type TDashboardDisplayState,
} from "../store/preferenceStore";

const Settings = () => {
	const [activeKey, setActiveKey] = useState<string>("general");
	const { defaultQuantity, setDefaultQuantity } = usePreferenceStore();
	const [defaultQty, setDefaultQty] = useState(defaultQuantity);

	const handleSavePreferences = () => {
		setDefaultQuantity(defaultQty);
		message.success("Preferences saved!");
	};

	const items = [
		{
			key: "general",
			label: "General",
			children: (
				<div className="p-2 max-w-full">
					<DashboardPreference />
					<Form layout="vertical">
						<Form.Item label="Default Trade Quantity">
							<Input
								value={defaultQty}
								onChange={(e) => setDefaultQty(e.target.value)}
								type="number"
								className="max-w-[200px]"
								placeholder="Enter default quantity"
							/>
						</Form.Item>

						<Button
							type="primary"
							disabled={defaultQty === defaultQuantity}
							onClick={handleSavePreferences}
						>
							Save Preferences
						</Button>
					</Form>
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
