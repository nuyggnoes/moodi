"use client";

import { useActionState, useRef, useState } from "react";
import { SongPicker } from "./SongPicker";
import { MoodPicker } from "./MoodPicker";
import { saveRecord, type RecordActionState } from "./actions";
import { RECORD_ERROR_MESSAGES } from "./error-codes";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PlayIcon, PauseIcon } from "@/shared/ui/icons";
import type { Mood } from "@/entities/record/mood";
import type { Track } from "@/shared/lib/music/types";

const MEMO_MAX_LENGTH = 200;
const MEMO_COUNTER_THRESHOLD = 170;
const initialState: RecordActionState = null;

export function RecordForm() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [memo, setMemo] = useState("");
  const [state, formAction, pending] = useActionState(saveRecord, initialState);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function togglePreview() {
    const audio = audioRef.current;
    if (!audio || !selectedTrack?.previewUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio.src = selectedTrack.previewUrl;
    audio.play();
    setIsPlaying(true);
  }

  function handleReselect() {
    setIsPlaying(false);
    setSelectedTrack(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 p-4">
      {!selectedTrack ? (
        <SongPicker onSelect={setSelectedTrack} />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleReselect}
              className="self-end text-sm text-ink-dim hover:text-accent"
            >
              ↺ 다시 검색
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3.5">
              <AlbumArt src={selectedTrack.albumArt} size={72} radius={12} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-[15px] font-medium text-ink">
                  {selectedTrack.trackName}
                </span>
                <span className="truncate text-[12.5px] text-ink-dim">
                  {selectedTrack.artist}
                </span>
              </div>
              {selectedTrack.previewUrl && (
                <button
                  type="button"
                  onClick={togglePreview}
                  aria-label={`${selectedTrack.trackName} ${isPlaying ? "정지" : "재생"}`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isPlaying
                      ? "bg-accent text-bg"
                      : "border border-border bg-surface text-ink-dim"
                  }`}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
              )}
            </div>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            <input
              type="hidden"
              name="trackId"
              value={String(selectedTrack.trackId)}
            />
            <input type="hidden" name="trackName" value={selectedTrack.trackName} />
            <input type="hidden" name="artist" value={selectedTrack.artist} />
            <input
              type="hidden"
              name="albumArt"
              value={selectedTrack.albumArt ?? ""}
            />
            <input
              type="hidden"
              name="previewUrl"
              value={selectedTrack.previewUrl ?? ""}
            />

            <MoodPicker value={mood} onChange={setMood} />

            <div className="flex flex-col gap-1">
              <textarea
                name="memo"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                onInput={(event) => {
                  const el = event.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                maxLength={MEMO_MAX_LENGTH}
                rows={1}
                placeholder="오늘 이 곡, 어떤 느낌이었나요? (선택)"
                className="resize-none overflow-hidden border-b border-transparent bg-transparent text-[15px] leading-[1.7] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
              {memo.length >= MEMO_COUNTER_THRESHOLD && (
                <span className="self-end text-xs text-ink-faint">
                  {memo.length}/{MEMO_MAX_LENGTH}
                </span>
              )}
            </div>

            {state?.error && (
              <p role="alert" className="text-sm text-error">
                {RECORD_ERROR_MESSAGES[state.error]}
              </p>
            )}

            <button
              type="submit"
              disabled={!mood || pending}
              className="rounded-[13px] bg-accent px-4 py-[15px] text-bg transition-colors disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-faint"
            >
              {pending ? "저장 중..." : "기록하기"}
            </button>
          </form>
        </>
      )}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden />
    </div>
  );
}
