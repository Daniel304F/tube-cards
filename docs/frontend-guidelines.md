# Frontend Guidelines

React + TypeScript patterns, component design, and UI conventions.

> All client code is **strict TypeScript** (`.tsx` / `.ts`). No `.jsx` / `.js`,
> no `any`, no implicit returns. Props are typed with `interface`, return type
> is always `React.JSX.Element` (or `null` where applicable).

---

## Component Structure

Every component follows this file order:

```tsx
// 1. Imports — external libs first, then internal
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useFlashcard } from "../../hooks/useFlashcard";
import { ErrorMessage } from "../error-message";
import { FlashcardCardSkeleton } from "./FlashcardCardSkeleton";

// 2. Props interface
interface FlashcardCardProps {
  flashcardId: number;
  onDelete: (id: number) => void;
}

// 3. Component
export function FlashcardCard({ flashcardId, onDelete }: FlashcardCardProps): React.JSX.Element | null {
  // 3a. Hooks (always at top)
  const { flashcard, isLoading, error } = useFlashcard(flashcardId);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // 3b. Derived values
  const previewText = flashcard?.answer?.slice(0, 120);

  // 3c. Handlers
  function handleDelete(): void {
    onDelete(flashcardId);
  }

  // 3d. Render guards (loading, error, empty)
  if (isLoading) return <FlashcardCardSkeleton />;
  if (error) return <ErrorMessage message={error} />;
  if (!flashcard) return null;

  // 3e. JSX
  return <div className="...">...</div>;
}
```

---

## States Every Component Must Handle

Never leave a state unhandled. Every data-fetching component needs:

```tsx
// Loading
if (isLoading) return <Skeleton />;

// Error
if (error) return <ErrorBanner message={error} />;

// Empty
if (flashcards.length === 0) return <EmptyState ... />;

// Data
return <FlashcardList flashcards={flashcards} />;
```

Empty states should be helpful — suggest an action, don't just say "No items found."

---

## Tailwind Usage

### Use Brand Tokens

```tsx
// WRONG — raw Tailwind color
<button className="bg-green-500 hover:bg-green-700">

// CORRECT — brand token
<button className="bg-brand hover:bg-brand-dark">
```

### Class Organization Order

Group Tailwind classes in this order for readability:

```
layout → sizing → spacing → typography → color → border → shadow → transition → state
```

```tsx
<div className="
  flex items-center          // layout
  w-full h-12                // sizing
  px-4 py-2 gap-3            // spacing
  text-sm font-medium        // typography
  text-text-base             // color
  bg-white
  border border-border       // border
  rounded-lg
  shadow-sm                  // shadow
  transition-colors          // transition
  hover:bg-brand-surface     // state
  focus:outline-none focus:ring-2 focus:ring-brand
">
```

### Never Use @apply

Extract to a component instead:

```tsx
// WRONG
// globals.css
.card { @apply rounded-lg border border-border shadow-sm p-4 ... }

// CORRECT
// components/card/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps): React.JSX.Element {
  return (
    <div className={`rounded-lg border border-border shadow-sm p-4 ${className}`}>
      {children}
    </div>
  );
}
```

---

## Icons (Lucide React)

Always import individually — never the whole library. For typed icon props use `LucideIcon`:

```tsx
// WRONG
import * as Icons from "lucide-react";

// CORRECT
import {
  BookOpen,
  Folder,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  type LucideIcon,
} from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
}
```

Size conventions:

| Context            | Size class | px  |
| ------------------ | ---------- | --- |
| Inline with text   | `size-4`   | 16  |
| Button icon        | `size-4`   | 16  |
| Section header     | `size-5`   | 20  |
| Empty state / hero | `size-8`   | 32  |

Loading spinner: always use `<Loader2 className="size-4 animate-spin" />`

---

## Layouts

All pages render inside a layout. Never build chrome (nav, sidebar) inside a page.

```tsx
// pages/history/HistoryPage.tsx
export default function HistoryPage(): React.JSX.Element {
  return (
    <div>
      <h1>History</h1>
      ...
    </div>
  );
}

// App.tsx / router — layout wraps all pages
<AppLayout>
  <HistoryPage />
</AppLayout>;
```

---

## Responsive Design — Mobile + Desktop

### Breakpoint Strategy

Always write **mobile-first**: base classes apply to mobile, `md:` overrides for desktop.

```tsx
// WRONG — desktop-first
<div className="flex-row md:flex-col">

// CORRECT — mobile-first
<div className="flex-col md:flex-row">
```

Tailwind breakpoints used in this project:

| Prefix | Min-width | Use for           |
| ------ | --------- | ----------------- |
| (none) | 0px       | Mobile base       |
| `md:`  | 768px     | Desktop overrides |

Stick to just these two — avoid `sm:`, `lg:`, `xl:` unless strictly necessary.

---

### AppLayout — Viewport Switcher

```tsx
// layouts/AppLayout.tsx
import { useIsMobile } from "../hooks/useIsMobile";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  const isMobile = useIsMobile();
  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
```

---

### DesktopLayout

```tsx
// layouts/DesktopLayout.tsx
interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-screen bg-brand-surface">
      <Sidebar /> {/* fixed left nav */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

### MobileLayout

```tsx
// layouts/MobileLayout.tsx
interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps): React.JSX.Element {
  return (
    <div className="flex flex-col h-screen bg-brand-surface">
      <MobileTopbar />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {/* pb-24 ensures content clears the BottomNav */}
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
```

---

### BottomNav

- Maximum 5 items — icon + short label (1 word)
- Active route highlighted with `text-brand`
- Fixed at bottom, full width, white background with top border
- Safe area padding for notched phones
- Items come from the **shared `constants/navigation.ts`** (`NAV_ITEMS`),
  filtered to skip `Home` — so Sidebar (desktop) and BottomNav (mobile)
  stay in sync.

```tsx
// components/bottom-nav/BottomNav.tsx
import { useLocation, Link } from "react-router-dom";
import { NAV_ITEMS } from "../../constants/navigation";

const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter((item) => item.to !== "/");

export function BottomNav(): React.JSX.Element {
  const { pathname } = useLocation();

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        flex items-center justify-around
        bg-white dark:bg-dark-card border-t border-border dark:border-dark-border
        h-16
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive = pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`
              flex flex-col items-center gap-1
              min-w-[44px] min-h-[44px] justify-center
              transition-colors
              ${isActive ? "text-brand" : "text-text-muted hover:text-text-base"}
            `}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

### Touch Targets

Every tappable element on mobile must be at least **44×44px**:

```tsx
// WRONG — too small on mobile
<button className="p-1">
  <Trash2 className="size-4" />
</button>

// CORRECT — 44px minimum touch target
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
  <Trash2 className="size-4" />
</button>
```

---

### Spacing for Mobile

Reserve space below scrollable content for the BottomNav:

```tsx
// Any scrollable page container on mobile
<div className="pb-24 md:pb-0">{/* content */}</div>
```

Use generous tap-friendly spacing between list items on mobile:

```tsx
<ul className="flex flex-col gap-2 md:gap-1">
```

---

### Conditional Rendering by Viewport

Use `useIsMobile()` for structural differences, Tailwind for cosmetic differences:

```tsx
// Structural — different component tree → useIsMobile
const isMobile = useIsMobile();
return isMobile ? <MobileCardView /> : <DesktopTableView />;

// Cosmetic — same element, different styles → Tailwind
<h1 className="text-xl md:text-3xl font-bold">
```

---

## Hooks Pattern

Every data-fetching hook returns a consistent shape, fully typed via an
explicit `Use*Return` interface. Use `useCallback` so dependents
(`useEffect`, child components) don't re-fire on every render. Narrow
unknown errors with `instanceof Error`.

```ts
// hooks/useFlashcards.ts
import { useState, useEffect, useCallback } from "react";
import { fetchFlashcards, type FlashcardData } from "../api/flashcards";

interface UseFlashcardsReturn {
  flashcards: FlashcardData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFlashcards(folderId: number | null): UseFlashcardsReturn {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFlashcards(folderId);
      setFlashcards(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load flashcards";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { flashcards, isLoading, error, refetch: load };
}
```

---

## Transitions & Interactions

Every interactive element needs visible feedback:

```tsx
// Buttons
<button className="... transition-colors hover:bg-brand-dark active:scale-95">

// Cards (clickable)
<div className="... transition-shadow hover:shadow-md cursor-pointer">

// Fade in new content
<div className="animate-fade-in">
```

Avoid instant state switches — use `transition-*` utilities everywhere.

---

## Accessibility

- All `<img>` elements have descriptive `alt` attributes
- Icon-only buttons have `aria-label`
- Form inputs have associated `<label>` elements
- Interactive elements are keyboard-navigable (don't override default focus styles without replacing them)

```tsx
// Icon-only button
<button aria-label="Delete flashcard" onClick={handleDelete}>
  <Trash2 className="size-4" />
</button>
```
