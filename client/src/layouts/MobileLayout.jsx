import { BottomNav } from "../components/bottom-nav/BottomNav";

export function MobileLayout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-brand-surface">
      {/* MobileTopbar — will be added later */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
