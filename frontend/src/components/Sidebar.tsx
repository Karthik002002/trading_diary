import { Link, useLocation } from '@tanstack/react-router';
import { Icon } from './ui/Icon';
import classNames from 'classnames';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar = ({ isCollapsed, toggleSidebar }: SidebarProps) => {
    const activeLocation = useLocation();
    return (
        <div
            className={`fixed top-0 left-0 h-full bg-surface/95 backdrop-blur-sm border-r border-border border-gray-700 text-white flex flex-col transition-all duration-300 z-50 shadow-xl ${isCollapsed ? 'w-16' : 'w-50'}`}
        >
            <div className={classNames("p-4  flex items-center", isCollapsed ? "justify-center" : "justify-end")}>
                <button onClick={toggleSidebar} className={classNames(" rounded-md  hover:bg-surface-highlight text-secondary hover:text-white transition-colors cursor-pointer")}>
                    {isCollapsed ? <Icon name="menu" size={{ height: 30, width: 30 }} /> : <Icon name="close" size={{ height: 24, width: 24 }} />}
                </button>
            </div>
            <nav className="flex-1 p-3 space-y-2">
                <Link
                    to="/"
                    className="flex items-center space-x-3 p-3 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary  group border border-transparent [&.active]:border-primary/20"
                    title={isCollapsed ? "Dashboard" : ""}
                >
                    <div className={classNames("min-w-[20px] flex ")}>
                        <Icon name={activeLocation.pathname === "/" ? "home-active" : "home"} size={{ height: 20, width: 20 }} />
                    </div>
                    {!isCollapsed && <span className="font-medium">Dashboard</span>}
                </Link>
                <Link
                    to="/settings"
                    className="flex items-center space-x-3 p-3 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20"
                    title={isCollapsed ? "Settings" : ""}
                >
                    <div className="min-w-[20px] flex justify-center">
                        <Icon name={activeLocation.pathname === "/settings" ? "settings-active" : "settings"} size={{ height: 20, width: 20 }} />
                    </div>
                    {!isCollapsed && <span className="font-medium">Settings</span>}
                </Link>
            </nav>
            <div className="p-4 border-t border-border border-gray-700 text-xs text-secondary text-center truncate font-mono">
                {!isCollapsed ? 'v1.0.0' : 'v1'}
            </div>
        </div>
    );
};

export default Sidebar;
