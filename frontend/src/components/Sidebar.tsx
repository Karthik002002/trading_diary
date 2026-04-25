import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import classNames from "classnames";
import { getIntegrationStatus } from "../api/client";
import SidebarNavItem from "./SidebarNavItem";
import { Icon } from "./ui/Icon";

interface SidebarProps {
	isCollapsed: boolean;
	toggleSidebar: () => void;
}

const Sidebar = ({ isCollapsed, toggleSidebar }: SidebarProps) => {
	const activeLocation = useLocation();
	const { data: statusData } = useQuery({
		queryKey: ["integrationStatus"],
		queryFn: getIntegrationStatus,
	});
	const getIsDhanEnabled = statusData;

	return (
		<div
			className={`fixed top-0 left-0 h-full bg-surface/95 backdrop-blur-sm border-r border-border border-r-gray-700 text-white flex flex-col transition-all duration-300 z-50 shadow-xl ${isCollapsed ? "w-16" : "w-50"}`}
		>
			<div
				className={classNames(
					"p-4  flex items-center",
					isCollapsed ? "justify-center" : "justify-end",
				)}
			>
				<button
					onClick={toggleSidebar}
					className={classNames(
						" rounded-md  hover:bg-surface-highlight text-secondary hover:text-white transition-colors cursor-pointer",
					)}
				>
					{isCollapsed ? (
						<Icon name="menu" size={{ height: 30, width: 30 }} />
					) : (
						<Icon name="close" size={{ height: 24, width: 24 }} />
					)}
				</button>
			</div>
			<nav className="flex-1 p-3 space-y-2">
				<SidebarNavItem
					to="/"
					label="Dashboard"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/"}
					activeIcon="home-active"
					defaultIcon="home"
				/>
				<SidebarNavItem
					to="/charts"
					label="Charts"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/charts"}
					activeIcon="chart-active"
					defaultIcon="chart"
				/>
				<SidebarNavItem
					to="/goals"
					label="Goals"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/goals"}
					activeIcon="list-checked"
					defaultIcon="list-default"
				/>
				<SidebarNavItem
					to="/integrations"
					label="Integrations"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/integrations"}
					activeIcon="integration-active"
					defaultIcon="integration"
				/>
				<SidebarNavItem
					to="/live-positions"
					label="Live Positions"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/live-positions"}
					activeIcon="live"
					defaultIcon="live"
				/>
				<SidebarNavItem
					to="/deep-dive"
					label="Deep Dive"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/deep-dive"}
					activeIcon="deep-analyse-active"
					defaultIcon="deep-analyse-default"
				/>
				<SidebarNavItem
					to="/discipline"
					label="Discipline"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/discipline"}
					activeIcon="discipline"
					defaultIcon="discipline"
				/>
				<SidebarNavItem
					to="/accountability/feed"
					label="Accountability"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/accountability"}
					activeIcon="accountability"
					defaultIcon="accountability"
				/>
				{getIsDhanEnabled?.enable && (
					<SidebarNavItem
						to="/dhan"
						label="Dhan"
						isCollapsed={isCollapsed}
						isActive={activeLocation.pathname === "/dhan"}
						activeIcon="dhan"
						defaultIcon="dhan"
					/>
				)}
				<SidebarNavItem
					to="/settings"
					label="Settings"
					isCollapsed={isCollapsed}
					isActive={activeLocation.pathname === "/settings"}
					activeIcon="settings-active"
					defaultIcon="settings"
				/>
			</nav>
			<div className="p-4 border-t border-border border-t-gray-700 text-xs text-secondary text-center truncate font-mono">
				{!isCollapsed ? "v1.0.0" : "v1"}
			</div>
		</div>
	);
};

export default Sidebar;
