import { useLocation, Link } from "react-router-dom";
import { Plus, Clock, Folder, Settings } from "lucide-react";

const NAV_ITEMS = [
  { to: "/process", icon: Plus, label: "New" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/folders", icon: Folder, label: "Folders" },
  { to: "/config", icon: Settings, label: "Config" },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        flex items-center justify-around
        bg-white border-t border-border
        h-16
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`
              flex flex-col items-center gap-1
              min-w-[44px] min-h-[44px] justify-center
              transition-colors
              ${isActive ? "text-brand" : "text-text-muted hover:text-text-base"}
            `}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
