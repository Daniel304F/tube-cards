import { useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../../constants/navigation";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/folders/")) return "Folder";

  const match = NAV_ITEMS.find((item) =>
    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
  );
  return match?.label ?? "TubeCards";
}

export function Topbar(): React.JSX.Element {
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <header className="
      flex items-center
      h-14 px-6
      bg-white border-b border-border
      shrink-0
    ">
      <h1 className="text-lg font-semibold text-text-base">{title}</h1>
    </header>
  );
}
