interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-screen bg-brand-surface">
      {/* Sidebar — will be added later */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar — will be added later */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
