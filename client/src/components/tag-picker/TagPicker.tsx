import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import type { TagData } from "../../api/tags";
import { TagChip } from "../tag-chip/TagChip";

interface TagPickerProps {
  allTags: TagData[];
  attachedTagIds: number[];
  onAttach: (tagId: number) => void;
  onDetach: (tagId: number) => void;
  onCreate: (name: string) => Promise<TagData>;
}

export function TagPicker({
  allTags,
  attachedTagIds,
  onAttach,
  onDetach,
  onCreate,
}: TagPickerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [draftName, setDraftName] = useState<string>("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const attached = allTags.filter((t) => attachedTagIds.includes(t.id));
  const available = allTags.filter((t) => !attachedTagIds.includes(t.id));

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  async function handleCreate(): Promise<void> {
    const name = draftName.trim();
    if (!name) return;
    try {
      const tag = await onCreate(name);
      onAttach(tag.id);
      setDraftName("");
      setIsOpen(false);
    } catch {
      // caller surfaces errors
    }
  }

  return (
    <div ref={rootRef} className="relative inline-flex flex-wrap items-center gap-1.5">
      {attached.map((tag) => (
        <TagChip key={tag.id} tag={tag} onRemove={() => onDetach(tag.id)} />
      ))}

      <button
        type="button"
        aria-label="Add tag"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="
          inline-flex items-center gap-1
          rounded-full
          border border-dashed border-border dark:border-dark-border
          bg-white dark:bg-dark-card
          px-2 py-0.5
          text-xs font-medium text-text-muted dark:text-dark-muted
          transition-colors
          hover:text-brand hover:border-brand
          focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1
          min-h-[24px]
        "
      >
        <Plus className="size-3" />
        <span>Tag</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="
            absolute z-20 top-full left-0 mt-2
            w-56
            rounded-md border border-border dark:border-dark-border
            bg-white dark:bg-dark-card
            shadow-lg
            p-2
            space-y-1
          "
        >
          <div className="flex gap-1">
            <input
              type="text"
              placeholder="New tag…"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreate();
                }
              }}
              className="
                flex-1
                rounded
                border border-border dark:border-dark-border
                bg-white dark:bg-dark-bg
                px-2 py-1
                text-xs text-text-base dark:text-dark-text
                focus:outline-none focus:ring-2 focus:ring-brand
              "
            />
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!draftName.trim()}
              className="
                inline-flex items-center justify-center
                rounded
                bg-brand
                px-2 py-1
                text-xs font-medium text-white
                transition-colors
                hover:bg-brand-dark
                disabled:opacity-50
              "
            >
              Add
            </button>
          </div>

          {available.length > 0 ? (
            <ul className="space-y-0.5 pt-1">
              {available.map((tag) => (
                <li key={tag.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onAttach(tag.id);
                      setIsOpen(false);
                    }}
                    className="
                      w-full text-left
                      inline-flex items-center gap-2
                      rounded
                      px-2 py-1
                      text-xs text-text-base dark:text-dark-text
                      transition-colors
                      hover:bg-brand-surface dark:hover:bg-dark-surface
                    "
                  >
                    <span
                      className="inline-block size-2 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="truncate">{tag.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-1 text-xs text-text-muted dark:text-dark-muted">
              No other tags — type a name to create one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
