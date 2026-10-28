import type { CSSProperties } from "react";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { AiComment } from "@/features/comment/AiComment";
import { MOOD_OPTIONS, MOOD_COLORS } from "@/entities/record/mood";
import type { MusicRecord } from "@/entities/record/types";

const MOOD_LABELS = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function DayDetail({ records }: { records: MusicRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-border px-5 py-12 text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full border border-border text-ink-faint"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </span>
        <p className="text-[15px] font-medium text-ink-dim">
          이 날은 기록이 없어요.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {records.map((record) => {
        const color = MOOD_COLORS[record.mood];
        return (
          <li
            key={record.id}
            style={{ "--mc": color } as CSSProperties}
            className="flex flex-col gap-5 rounded-[20px] border border-border bg-surface p-5 shadow-[0_24px_60px_rgba(8,6,16,0.35)]"
          >
            <AlbumArt src={record.album_art} size={144} radius={16} />
            <div className="flex flex-col gap-1">
              <span className="text-[19px] font-semibold leading-snug tracking-tight text-ink">
                {record.track_name}
              </span>
              <span className="text-[14px] text-ink-dim">{record.artist}</span>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-[color-mix(in_srgb,var(--mc)_55%,transparent)] bg-[color-mix(in_srgb,var(--mc)_20%,var(--color-surface))] px-3.5 py-1.5 text-[13px] font-medium text-ink">
              <i className="size-2 rounded-full bg-[var(--mc)]" />
              {MOOD_LABELS[record.mood] ?? record.mood}
            </span>
            {record.memo && (
              <div className="flex flex-col gap-1">
                <h3 className="font-mono text-[11px] font-normal tracking-[0.06em] text-ink-faint">
                  MEMO
                </h3>
                <p className="text-[15px] leading-relaxed text-ink">
                  {record.memo}
                </p>
              </div>
            )}
            <AiComment
              record={record}
              renderReady={(comment) => (
                <div className="flex flex-col gap-1">
                  <h3 className="font-mono text-[11px] font-normal tracking-[0.06em] text-ink-faint">
                    AI COMMENT
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink-dim">
                    {comment}
                  </p>
                </div>
              )}
            />
          </li>
        );
      })}
    </ul>
  );
}
