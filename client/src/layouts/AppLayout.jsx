import { useIsMobile } from "../hooks/useIsMobile";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";

export function AppLayout({ children }) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
