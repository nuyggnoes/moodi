"use client";

export function RecentSearches({
  queries,
  onSelect,
}: {
  queries: string[];
  onSelect: (query: string) => void;
}) {
  if (queries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {queries.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onSelect(query)}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink-dim hover:bg-surface-hover"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
