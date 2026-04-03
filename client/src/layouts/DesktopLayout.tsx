import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-screen bg-brand-surface dark:bg-dark-bg">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
