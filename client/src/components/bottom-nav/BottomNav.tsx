import { useLocation, Link } from "react-router-dom";
import { NAV_ITEMS } from "../../constants/navigation";

// BottomNav shows only the main 4 items (skip Home)
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== "/");

export function BottomNav(): React.JSX.Element {
  const { pathname } = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        flex items-center justify-around
        bg-white dark:bg-dark-card border-t border-border dark:border-dark-border
        h-16
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`
              flex flex-col items-center gap-1
              min-w-[44px] min-h-[44px] justify-center
              transition-colors
              ${isActive ? "text-brand" : "text-text-muted dark:text-dark-muted hover:text-text-base dark:hover:text-dark-text"}
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
