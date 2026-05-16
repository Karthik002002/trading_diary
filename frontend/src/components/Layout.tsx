import { Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import RefetchFloatingButton from "./RefetchFloatingButton";
import FloatingTradeTypeToggle from "./FloatingTradeTypeToggle";
import Sidebar from "./Sidebar";
import StrategyLimitMonitor from "./StrategyLimitMonitor";
import FloatingChatbot from "./FloatingChatbot";

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
        className={`flex-1 p-4 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-50"} z-0`}
      >
        <Outlet />
      </div>
      <RefetchFloatingButton />
      <FloatingTradeTypeToggle />
      <StrategyLimitMonitor />
      <FloatingChatbot />
    </div>
  );
};

export default Layout;
