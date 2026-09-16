"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/shared/ui/Avatar";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { MOOD_COLORS, MOOD_OPTIONS } from "@/entities/record/mood";
import type { FriendToday } from "./useTodayFeed";

const MOOD_LABELS = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

/**
 * 팔로우한 친구 아바타 스트립. 오늘 기록한 친구만 하이라이트 + 탭 가능.
 * 탭하면 바텀시트로 그 친구의 오늘 기록을 "미리보기"하고,
 * 시트 안 카드를 다시 탭하면 `/profile/[id]` "전체보기"로 이동한다.
 */
export function FriendAvatarStrip({
  friends,
  onOpenPreview,
}: {
  friends: FriendToday[];
  onOpenPreview?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = friends.find((friend) => friend.id === selectedId) ?? null;

  function handleOpen(friendId: string) {
    onOpenPreview?.();
    setSelectedId(friendId);
  }

  return (
    <>
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {friends.map((friend) => {
          const hasRecordToday = friend.record !== null;

          return (
            <li key={friend.id} className="flex shrink-0 flex-col items-center gap-1">
              {hasRecordToday ? (
                <button
                  type="button"
                  onClick={() => handleOpen(friend.id)}
                  aria-label={`${friend.nickname}의 오늘 기록 보기`}
                  className="rounded-full p-0.5 ring-2 ring-accent"
                >
                  <Avatar src={friend.avatarUrl} alt={friend.nickname} size={56} />
                </button>
              ) : (
                <div className="rounded-full p-0.5 opacity-40">
                  <Avatar src={friend.avatarUrl} alt={friend.nickname} size={56} />
                </div>
              )}
              <span className="max-w-[56px] truncate text-[11px] text-ink-dim">
                {friend.nickname}
              </span>
            </li>
          );
        })}
      </ul>

      <BottomSheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        ariaLabel={selected ? `${selected.nickname}의 오늘 기록` : undefined}
      >
        {selected?.record && (
          <Link
            href={`/profile/${selected.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5"
          >
            <AlbumArt src={selected.record.album_art} size={56} radius={10} />
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-[14px] font-medium text-ink">
                {selected.record.track_name}
              </span>
              <span className="truncate text-[12px] text-ink-dim">
                {selected.record.artist}
              </span>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 text-xs text-bg"
              style={{ background: MOOD_COLORS[selected.record.mood] }}
            >
              {MOOD_LABELS[selected.record.mood] ?? selected.record.mood}
            </span>
          </Link>
        )}
      </BottomSheet>
    </>
  );
}
