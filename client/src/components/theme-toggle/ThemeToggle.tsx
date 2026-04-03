import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle(): React.JSX.Element {
  const { isDark, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="
        p-2 min-w-[44px] min-h-[44px]
        flex items-center justify-center
        rounded-lg
        text-text-muted dark:text-dark-muted
        transition-colors
        hover:bg-brand-surface dark:hover:bg-dark-surface
        hover:text-text-base dark:hover:text-dark-text
        focus:outline-none focus:ring-2 focus:ring-brand
      "
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
