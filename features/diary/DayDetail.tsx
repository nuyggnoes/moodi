import { AlbumArt } from "@/shared/ui/AlbumArt";
import { MOOD_OPTIONS, MOOD_COLORS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

const MOOD_LABELS = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function DayDetail({ records }: { records: MusicRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-ink-faint">이 날은 기록이 없어요.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {records.map((record) => (
        <li
          key={record.id}
          className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5"
        >
          <div className="flex items-center gap-3">
            <AlbumArt src={record.album_art} size={56} radius={10} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-[14px] font-medium text-ink">
                {record.track_name}
              </span>
              <span className="truncate text-[12px] text-ink-dim">
                {record.artist}
              </span>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs text-bg"
              style={{ background: MOOD_COLORS[record.mood] }}
            >
              {MOOD_LABELS[record.mood] ?? record.mood}
            </span>
          </div>
          {record.memo && <p className="text-sm text-ink-dim">{record.memo}</p>}
          <div className="rounded-xl border border-dashed border-border p-2 text-xs text-ink-faint">
            {record.ai_comment ?? "AI 코멘트는 아직 준비 중이에요."}
          </div>
        </li>
      ))}
    </ul>
  );
}
