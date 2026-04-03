# Skill: Create React Component

Use this skill when asked to create a new reusable UI component.

## Folder Structure

Every component gets its own folder:

```
src/components/<component-name>/
├── <ComponentName>.jsx   # The component
└── index.js              # Re-export for clean imports
```

```js
// index.js
export { <ComponentName> } from './<ComponentName>'
```

## Component Template

```jsx
import { useState } from 'react'
import { <Icon> } from 'lucide-react'

/**
 * @param {{
 *   prop1: string,
 *   prop2?: () => void,
 * }} props
 */
export function <ComponentName>({ prop1, prop2 }) {
  // 1. Hooks
  const [isExpanded, setIsExpanded] = useState(false)

  // 2. Derived values
  const displayText = prop1?.slice(0, 80)

  // 3. Handlers
  function handleAction() {
    prop2?.()
  }

  // 4. Render guards
  if (!prop1) return null

  // 5. JSX — mobile-first
  return (
    <div className="...">
      ...
    </div>
  )
}
```

## Mandatory States Checklist

Every component that fetches or displays data **must** implement all four:

### Loading

```jsx
if (isLoading) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 animate-pulse">
      <div className="h-4 bg-brand-surface rounded w-3/4 mb-2" />
      <div className="h-3 bg-brand-surface rounded w-1/2" />
    </div>
  );
}
```

### Error

```jsx
if (error) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {error}
    </div>
  );
}
```

### Empty

```jsx
if (items.length === 0) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-text-muted">
      <BookOpen className="size-8 opacity-40" />
      <p className="text-sm">No items yet</p>
      <button className="text-sm text-brand hover:underline" onClick={onAdd}>
        Create your first one
      </button>
    </div>
  );
}
```

### Data — the normal render

## Styling Rules

- Mobile-first: base classes are for mobile, `md:` for desktop
- Use brand tokens — never raw Tailwind colors
- Tailwind class order: layout → sizing → spacing → typography → color → border → shadow → transition → state
- Touch targets ≥ 44×44px on mobile (`min-w-[44px] min-h-[44px]`)

```jsx
// Interactive element — correct sizing and feedback
<button
  className="
    flex items-center gap-2
    min-w-[44px] min-h-[44px] px-4
    text-sm font-medium text-white
    bg-brand hover:bg-brand-dark
    rounded-lg
    transition-colors
    active:scale-95
  "
  onClick={handleAction}
>
  <Plus className="size-4" />
  Add
</button>
```

## Icons

Import individually from lucide-react:

```jsx
import { Plus, Trash2, ChevronRight, Loader2 } from "lucide-react";
```

| Context         | Class                 |
| --------------- | --------------------- |
| Inline / button | `size-4`              |
| Section header  | `size-5`              |
| Empty state     | `size-8`              |
| Loading spinner | `size-4 animate-spin` |

Loading spinner always uses `Loader2`:

```jsx
<Loader2 className="size-4 animate-spin text-brand" />
```

## Mobile vs Desktop Rendering

For cosmetic differences, use Tailwind:

```jsx
<h2 className="text-lg md:text-2xl font-bold">Title</h2>
```

For structural differences (different component tree), use `useIsMobile`:

```jsx
const isMobile = useIsMobile();
return isMobile ? <MobileView /> : <DesktopView />;
```

## Accessibility

- Icon-only buttons: `aria-label` required
- Images: descriptive `alt`
- Form inputs: always paired with `<label>`
- Don't remove focus ring without replacing it

```jsx
<button aria-label="Delete item" className="... focus:ring-2 focus:ring-brand">
  <Trash2 className="size-4" />
</button>
```

## After Creating the Component

- Add the `index.js` re-export
- Verify all four states are handled
- Check touch targets on mobile-relevant interactions
- Import via `@/components/<component-name>` (not relative path)
