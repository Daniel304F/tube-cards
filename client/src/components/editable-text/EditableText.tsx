import { useEffect, useRef, useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface EditableTextProps {
  value: string;
  onSave: (next: string) => Promise<void> | void;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  textClassName?: string;
  label?: string;
}

export function EditableText({
  value,
  onSave,
  disabled = false,
  multiline = true,
  placeholder,
  className = "",
  textClassName = "",
  label = "text",
}: EditableTextProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(value);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing, multiline]);

  function enterEdit(): void {
    setDraft(value);
    setIsEditing(true);
  }

  function cancel(): void {
    setDraft(value);
    setIsEditing(false);
  }

  async function save(): Promise<void> {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || trimmed === value.trim()) {
      cancel();
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void save();
    }
  }

  if (isEditing) {
    const commonProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onKeyDown: handleKeyDown,
      placeholder,
      disabled: isSaving,
      "aria-label": label,
      className: `
        w-full
        rounded border border-border dark:border-dark-border
        bg-white dark:bg-dark-bg
        px-2 py-1.5
        text-sm text-text-base dark:text-dark-text
        focus:outline-none focus:ring-2 focus:ring-brand
        disabled:opacity-60
        ${textClassName}
      `,
    };

    return (
      <div className={`space-y-2 ${className}`}>
        {multiline ? (
          <textarea
            ref={textareaRef}
            {...commonProps}
            rows={3}
            className={`${commonProps.className} resize-y min-h-[72px]`}
          />
        ) : (
          <input ref={inputRef} type="text" {...commonProps} />
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={isSaving}
            aria-label="Cancel"
            className="
              inline-flex items-center gap-1
              rounded-md border border-border dark:border-dark-border
              bg-white dark:bg-dark-card
              px-2 py-1
              text-xs font-medium text-text-muted dark:text-dark-muted
              transition-colors
              hover:text-text-base dark:hover:text-dark-text
              disabled:opacity-50
              min-h-[32px]
            "
          >
            <X className="size-3" />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaving}
            aria-label="Save"
            className="
              inline-flex items-center gap-1
              rounded-md
              bg-brand
              px-2 py-1
              text-xs font-medium text-white
              transition-colors
              hover:bg-brand-dark
              disabled:opacity-50
              min-h-[32px]
            "
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <p className={`whitespace-pre-wrap ${textClassName}`}>{value}</p>
      {!disabled && (
        <button
          type="button"
          aria-label={`Edit ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            enterEdit();
          }}
          className="
            absolute top-0 right-0
            inline-flex items-center justify-center
            size-7 rounded-md
            bg-white/80 dark:bg-dark-card/80
            text-text-muted dark:text-dark-muted
            opacity-0 group-hover:opacity-100 focus:opacity-100
            transition-opacity
            hover:text-brand
            focus:outline-none focus:ring-2 focus:ring-brand
          "
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </div>
  );
}
