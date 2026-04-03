import { Link, useLocation } from "react-router-dom";
import { MonitorPlay } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";

export function Sidebar(): React.JSX.Element {
  const { pathname } = useLocation();

  return (
    <aside className="
      flex flex-col
      w-56 shrink-0
      bg-white border-r border-border
      h-full
    ">
      {/* Brand */}
      <Link
        to="/"
        className="
          flex items-center gap-2.5
          px-5 py-5
          border-b border-border
          transition-colors hover:bg-brand-surface
        "
      >
        <MonitorPlay className="size-6 text-brand shrink-0" />
        <span className="text-base font-bold text-text-base tracking-tight">TubeCards</span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`
                flex items-center gap-3
                px-3 py-2.5 rounded-lg
                text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "bg-brand-surface text-brand"
                    : "text-text-muted hover:bg-brand-surface hover:text-text-base"
                }
              `}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
