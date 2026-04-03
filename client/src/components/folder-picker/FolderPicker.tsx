import { useState, useRef, useEffect } from "react";
import { FolderInput, Check, X } from "lucide-react";
import type { FolderData } from "../../api/folders";

interface FolderPickerProps {
  folders: FolderData[];
  currentFolderId: number | null;
  onSelect: (folderId: number | null) => void;
}

export function FolderPicker({ folders, currentFolderId, onSelect }: FolderPickerProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentFolder = folders.find((f) => f.id === currentFolderId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          inline-flex items-center gap-1.5
          rounded-md border border-border bg-white dark:bg-dark-card dark:border-dark-border
          px-2 py-1
          text-xs text-text-muted dark:text-dark-muted
          transition-colors hover:bg-brand-surface dark:hover:bg-dark-surface
          min-h-[32px]
        "
        aria-label="Move to folder"
      >
        <FolderInput className="size-3" />
        {currentFolder ? currentFolder.name : "Move to…"}
      </button>

      {isOpen && (
        <div className="
          absolute right-0 top-full mt-1 z-20
          w-48
          rounded-lg border border-border dark:border-dark-border
          bg-white dark:bg-dark-card
          shadow-lg
          py-1
          max-h-60 overflow-y-auto
        ">
          {/* Remove from folder option */}
          {currentFolderId !== null && (
            <button
              type="button"
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className="
                w-full flex items-center gap-2
                px-3 py-2 text-xs text-left
                text-text-muted dark:text-dark-muted
                hover:bg-brand-surface dark:hover:bg-dark-surface
                transition-colors
              "
            >
              <X className="size-3" />
              Remove from folder
            </button>
          )}

          {folders.length === 0 ? (
            <p className="px-3 py-2 text-xs text-text-muted dark:text-dark-muted">
              No folders yet
            </p>
          ) : (
            folders.map((folder) => {
              const isSelected = folder.id === currentFolderId;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => { onSelect(folder.id); setIsOpen(false); }}
                  className={`
                    w-full flex items-center justify-between
                    px-3 py-2 text-xs text-left
                    transition-colors
                    ${isSelected
                      ? "text-brand bg-brand-surface dark:bg-dark-surface"
                      : "text-text-base dark:text-dark-text hover:bg-brand-surface dark:hover:bg-dark-surface"
                    }
                  `}
                >
                  <span className="truncate">{folder.name}</span>
                  {isSelected && <Check className="size-3 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
