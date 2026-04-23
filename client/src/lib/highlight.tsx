interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps): React.JSX.Element {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const parts: React.JSX.Element[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQuery, cursor);
    if (idx === -1) {
      parts.push(<span key={cursor}>{text.slice(cursor)}</span>);
      break;
    }
    if (idx > cursor) {
      parts.push(<span key={`p-${cursor}`}>{text.slice(cursor, idx)}</span>);
    }
    parts.push(
      <mark
        key={`m-${idx}`}
        className="bg-brand/25 text-brand-dark dark:text-brand dark:bg-brand/30 rounded-sm px-0.5"
      >
        {text.slice(idx, idx + trimmed.length)}
      </mark>,
    );
    cursor = idx + trimmed.length;
  }

  return <>{parts}</>;
}
