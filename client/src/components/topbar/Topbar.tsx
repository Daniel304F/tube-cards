import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../constants/navigation";
import { SearchBar } from "../search-bar";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/folders/")) return "Folder";
  if (pathname.startsWith("/search")) return "Search";

  const match = NAV_ITEMS.find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "TubeCards";
}

export function Topbar(): React.JSX.Element {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);
  const showSearch = !pathname.startsWith("/search");

  return (
    <header className="
      flex items-center gap-6
      h-14 px-6
      bg-white dark:bg-dark-card
      border-b border-border dark:border-dark-border
      shrink-0
    ">
      <h1 className="text-lg font-semibold text-text-base dark:text-dark-text shrink-0">{title}</h1>
      {showSearch && (
        <div className="flex-1 flex justify-end">
          <SearchBar />
        </div>
      )}
    </header>
  );
}
