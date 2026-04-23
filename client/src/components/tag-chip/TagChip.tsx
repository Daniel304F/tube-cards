import { X } from "lucide-react";

import type { TagData } from "../../api/tags";

interface TagChipProps {
  tag: TagData;
  onRemove?: () => void;
  onClick?: () => void;
  isActive?: boolean;
}

function getContrastColor(hex: string): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return "#ffffff";
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}

export function TagChip({ tag, onRemove, onClick, isActive }: TagChipProps): React.JSX.Element {
  const textColor = getContrastColor(tag.color);
  const isInteractive = Boolean(onClick);

  const content = (
    <span
      data-testid="tag-chip"
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5
        rounded-full
        text-xs font-medium
        transition-all
        ${isActive ? "ring-2 ring-offset-1 ring-brand" : ""}
      `}
      style={{ backgroundColor: tag.color, color: textColor }}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove tag ${tag.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            inline-flex items-center justify-center
            rounded-full
            hover:bg-black/20
            transition-colors
          "
          style={{ color: textColor }}
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex rounded-full focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      >
        {content}
      </button>
    );
  }

  return content;
}
