import { Link, useLocation } from "react-router-dom";
import { MonitorPlay, Search } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";
import { ThemeToggle } from "../theme-toggle";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "TubeCards";
  if (pathname.startsWith("/folders/")) return "Folder";
  if (pathname.startsWith("/search")) return "Search";

  const match = NAV_ITEMS.find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "TubeCards";
}

export function MobileTopbar(): React.JSX.Element {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const isSearchPage = pathname.startsWith("/search");

  return (
    <header className="
      flex items-center justify-between
      h-14 px-4
      bg-white dark:bg-dark-card
      border-b border-border dark:border-dark-border
      shrink-0
    ">
      <div className="flex items-center gap-3 min-w-0">
        <Link to="/" className="shrink-0">
          <MonitorPlay className="size-5 text-brand" />
        </Link>
        <h1 className="text-base font-semibold text-text-base dark:text-dark-text truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        {!isSearchPage && (
          <Link
            to="/search"
            aria-label="Search"
            className="
              flex items-center justify-center
              size-11
              rounded-lg
              text-text-muted dark:text-dark-muted
              transition-colors
              hover:bg-brand-surface dark:hover:bg-dark-surface hover:text-text-base dark:hover:text-dark-text
            "
          >
            <Search className="size-5" />
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
