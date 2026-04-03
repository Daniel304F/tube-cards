import { Link, useLocation } from "react-router-dom";
import { MonitorPlay } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";
import { ThemeToggle } from "../theme-toggle";

export function Sidebar(): React.JSX.Element {
  const { pathname } = useLocation();

  return (
    <aside className="
      flex flex-col
      w-56 shrink-0
      bg-white dark:bg-dark-card
      border-r border-border dark:border-dark-border
      h-full
    ">
      {/* Brand */}
      <Link
        to="/"
        className="
          flex items-center gap-2.5
          px-5 py-5
          border-b border-border dark:border-dark-border
          transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
        "
      >
        <MonitorPlay className="size-6 text-brand shrink-0" />
        <span className="text-base font-bold text-text-base dark:text-dark-text tracking-tight">TubeCards</span>
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
                    ? "bg-brand-surface dark:bg-dark-surface text-brand"
                    : "text-text-muted dark:text-dark-muted hover:bg-brand-surface dark:hover:bg-dark-surface hover:text-text-base dark:hover:text-dark-text"
                }
              `}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle at bottom */}
      <div className="px-3 py-3 border-t border-border dark:border-dark-border">
        <ThemeToggle />
      </div>
    </aside>
  );
}
