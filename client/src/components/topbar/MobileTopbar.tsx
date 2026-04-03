import { Link, useLocation } from "react-router-dom";
import { MonitorPlay } from "lucide-react";
import { NAV_ITEMS } from "../../constants/navigation";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "TubeCards";
  if (pathname.startsWith("/folders/")) return "Folder";

  const match = NAV_ITEMS.find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "TubeCards";
}

export function MobileTopbar(): React.JSX.Element {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="
      flex items-center gap-3
      h-14 px-4
      bg-white border-b border-border
      shrink-0
    ">
      <Link to="/" className="shrink-0">
        <MonitorPlay className="size-5 text-brand" />
      </Link>
      <h1 className="text-base font-semibold text-text-base truncate">{title}</h1>
    </header>
  );
}
