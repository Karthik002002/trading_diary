import { Link } from "@tanstack/react-router";
import { Icon } from "./ui/Icon";

interface SidebarNavItemProps {
  to: any;
  label: string;
  isCollapsed: boolean;
  isActive: boolean;
  activeIcon?: string;
  defaultIcon?: string;
  title?: string;
  customIcon?: React.ReactNode;
}

const SidebarNavItem = ({
  to,
  label,
  isCollapsed,
  isActive,
  activeIcon,
  defaultIcon,
  title,
  customIcon: isCustomIcon,
}: SidebarNavItemProps) => {
  return (
    <Link
      to={to}
      className="flex items-center space-x-3 py-3 px-2 rounded-md transition-all duration-200 text-secondary hover:text-white hover:bg-surface-highlight [&.active]:bg-primary/10 [&.active]:text-primary group border border-transparent [&.active]:border-primary/20"
      title={isCollapsed ? (title ?? label) : ""}
    >
      <div className="min-w-5 flex justify-center">
        {isCustomIcon ?? (
          <Icon
            name={isActive ? (activeIcon ?? "") : (defaultIcon ?? "")}
            size={{ height: 20, width: 20 }}
          />
        )}
      </div>
      {!isCollapsed && (
        <span
          className={`font-medium ${isActive ? "text-violet-800" : "text-white"}`}
        >
          {label}
        </span>
      )}
    </Link>
  );
};

export default SidebarNavItem;
