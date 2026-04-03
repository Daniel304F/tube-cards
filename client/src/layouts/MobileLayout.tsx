import { BottomNav } from "../components/bottom-nav/BottomNav";
import { MobileTopbar } from "../components/topbar/MobileTopbar";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-brand-surface dark:bg-dark-bg">
      <MobileTopbar />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
