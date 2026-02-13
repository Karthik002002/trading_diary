import { Link, useLocation } from "@tanstack/react-router";
import classNames from "classnames";
import { Icon } from "./ui/Icon";
import { getIntegrationStatus } from "../api/client";
import { useQuery } from "@tanstack/react-query";

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
			className={`fixed top-0 left-0 h-full bg-surface/95 backdrop-blur-sm border-r border-border text-white flex flex-col transition-all duration-300 z-50 shadow-xl ${isCollapsed ? "w-16" : "w-50"}`}
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
				<Link
					to="/"
					className="flex items-center space-x-3 py-3 px-2  rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary  group border border-transparent [&.active]:border-primary/20"
					title={isCollapsed ? "Dashboard" : ""}
				>
					<div className={classNames("min-w-5 flex ")}>
						<Icon
							name={activeLocation.pathname === "/" ? "home-active" : "home"}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/" ? "text-violet-800" : "text-white"}`}
						>
							Dashboard
						</span>
					)}
				</Link>
				<Link
					to="/charts"
					className="flex items-center space-x-3 py-3 px-2  rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary  group border border-transparent [&.active]:border-primary/20"
					title={isCollapsed ? "Charts" : ""}
				>
					<div className={classNames("min-w-5 flex justify-center")}>
						<Icon
							name={
								activeLocation.pathname === "/charts" ? "chart-active" : "chart"
							}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/charts" ? "text-violet-800" : "text-white"}`}
						>
							Charts
						</span>
					)}
				</Link>
				<Link
					to="/goals"
					className="flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20"
					title={isCollapsed ? "Goals" : ""}
				>
					<div className="min-w-5 flex justify-center">
						<Icon
							name={
								activeLocation.pathname === "/goals"
									? "list-checked"
									: "list-default"
							}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/goals" ? "text-violet-800" : "text-white"}`}
						>
							Goals
						</span>
					)}
				</Link>
				<Link
					to="/integrations"
					className={`flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20`}
					title={isCollapsed ? "Integrations" : ""}
				>
					<div className="min-w-5 flex justify-center">
						<Icon
							name={
								activeLocation.pathname === "/integrations"
									? "integration-active"
									: "integration"
							}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/integrations" ? "text-violet-800" : "text-white"}`}
						>
							Integrations
						</span>
					)}
				</Link>
				<Link
					to="/settings"
					className={`flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20`}
					title={isCollapsed ? "Settings" : ""}
				>
					<div className="min-w-5 flex justify-center">
						<Icon
							name={
								activeLocation.pathname === "/settings"
									? "settings-active"
									: "settings"
							}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/settings" ? "text-violet-800" : "text-white"}`}
						>
							Settings
						</span>
					)}
				</Link>
				<Link
					to="/deep-dive"
					className={`flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20`}
					title={isCollapsed ? "Deep Dive" : ""}
				>
					<div className="min-w-5 flex justify-center">
						<Icon
							name={
								activeLocation.pathname === "/deep-dive"
									? "deep-analyse-active"
									: "deep-analyse-default"
							}
							size={{ height: 20, width: 20 }}
						/>
					</div>
					{!isCollapsed && (
						<span
							className={`font-medium ${activeLocation.pathname === "/deep-dive" ? "text-violet-800" : "text-white"}`}
						>
							Deep Dive
						</span>
					)}
				</Link>
				{getIsDhanEnabled?.enable && (
					<Link
						to="/dhan"
						className={`flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20`}
						title={isCollapsed ? "Integrations" : ""}
					>
						<div className="min-w-5 flex justify-center">
							<Icon
								name={activeLocation.pathname === "/dhan" ? "dhan" : "dhan"}
								size={{ height: 20, width: 20 }}
							/>
						</div>
						{!isCollapsed && (
							<span
								className={`font-medium ${activeLocation.pathname === "/dhan" ? "text-violet-800" : "text-white"}`}
							>
								Dhan
							</span>
						)}
					</Link>
				)}
			</nav>
			<div className="p-4 border-t border-border text-xs text-secondary text-center truncate font-mono">
				{!isCollapsed ? "v1.0.0" : "v1"}
			</div>
		</div>
	);
};

export default Sidebar;
