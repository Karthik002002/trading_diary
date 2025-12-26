import { useEffect, useState } from "react";
import { Outlet } from "@tanstack/react-router";
import Sidebar from "./Sidebar";
import RefetchFloatingButton from "./RefetchFloatingButton";

const Layout = () => {
	const savedState = localStorage.getItem("isCollapsed");
	const [isCollapsed, setIsCollapsed] = useState(
		savedState ? JSON.parse(savedState) : false,
	);
	useEffect(() => {
		localStorage.setItem("isCollapsed", JSON.stringify(isCollapsed));
	}, [isCollapsed]);
	const toggleSidebar = () => {
		setIsCollapsed(!isCollapsed);
	};

	return (
		<div className="flex min-h-screen bg-gray-950 text-white">
			<Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
			<div
				className={`flex-1 p-8 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-50"}`}
			>
				<Outlet />
			</div>
			<RefetchFloatingButton />
		</div>
	);
};

export default Layout;
