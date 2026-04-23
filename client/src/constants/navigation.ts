import { Home, Plus, Clock, Folder, Settings, GraduationCap, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/process", icon: Plus, label: "New" },
  { to: "/study", icon: GraduationCap, label: "Study" },
  { to: "/history", icon: Clock, label: "History" },
  { to: "/folders", icon: Folder, label: "Folders" },
  { to: "/config", icon: Settings, label: "Config" },
];
