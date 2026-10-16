"use client";

import { useActionState, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SongPicker } from "./SongPicker";
import { MoodPicker } from "./MoodPicker";
import { saveRecord, type RecordActionState } from "./actions";
import { RECORD_ERROR_MESSAGES } from "./error-codes";
import { useMoodSuggestion } from "./useMoodSuggestion";
import { AlbumArt } from "@/shared/ui/AlbumArt";
import { PlayIcon, PauseIcon } from "@/shared/ui/icons";
import type { Mood } from "@/entities/record/mood";
import { MEMO_MAX_LENGTH } from "@/entities/record/memo";
import type { Track } from "@/shared/lib/music/types";
import type { MusicRecord } from "@/entities/record/types";

const MEMO_COUNTER_THRESHOLD = 170;
const initialState: RecordActionState = null;

/** 저장된 기록을 폼의 곡 선택 상태로 되돌린다 (수정 모드). */
function trackFromRecord(record: MusicRecord): Track {
  return {
    trackId: Number(record.track_id),
    trackName: record.track_name,
    artist: record.artist,
    albumArt: record.album_art,
    previewUrl: record.preview_url,
  };
}

/**
 * 기록 폼. `initialRecord` 가 있으면 오늘 기록을 수정하는 모드다 — 곡·무드·메모가 채워진 채로 열리고,
 * 저장은 같은 `saveRecord` 가 오늘 기록을 대체한다 (docs/adr/0007).
 */
export function RecordForm({ initialRecord = null }: { initialRecord?: MusicRecord | null }) {
  const queryClient = useQueryClient();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(() =>
    initialRecord ? trackFromRecord(initialRecord) : null,
  );
  // 사용자가 직접 고른 mood 만 상태로 둔다. 화면의 mood 는 "직접 고른 값 → AI 제안" 순으로 파생한다.
  // 그래서 직접 고른 값은 항상 우선하고, 늦게 도착한 AI 제안은 자동으로 무시된다.
  // 수정 모드에서는 저장된 무드를 직접 고른 값으로 시작해, 열자마자 AI 제안이 요청되거나 덮어쓰지 않게 한다.
  const [userMood, setUserMood] = useState<Mood | null>(initialRecord?.mood ?? null);
  const [memo, setMemo] = useState(initialRecord?.memo ?? "");
  const [state, formAction, pending] = useActionState(saveRecord, initialState);

  // 직접 고른 뒤에는 요청하지 않는다 (직접 고른 값이 항상 이기므로 결과를 쓸 일이 없다).
  const { data, isFetching } = useMoodSuggestion(selectedTrack, memo, userMood === null);
  const suggestion = data ?? null;
  const mood = userMood ?? suggestion?.suggestedMood ?? null;
  // 수정 모드에서 무드를 바꾸지 않았다면 저장돼 있던 출처를 유지한다 (수정만으로 AI 채택률이 왜곡되지 않게).
  const moodSource =
    userMood !== null
      ? initialRecord && userMood === initialRecord.mood && initialRecord.mood_source === "ai"
        ? "ai"
        : "user"
      : suggestion
        ? "ai"
        : "user";

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

  // 저장 후 돌아오는 화면(`/`, `/diary`)이 옛 기록을 잠깐 보여주지 않도록 캐시를 비우고 저장한다.
  function handleSubmit(formData: FormData) {
    queryClient.removeQueries({ queryKey: ["week-records"] });
    queryClient.removeQueries({ queryKey: ["month-records"] });
    return formAction(formData);
  }

  function handleReselect() {
    setIsPlaying(false);
    setSelectedTrack(null);
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 p-4">
      {initialRecord && (
        <p className="text-sm text-ink-dim">오늘의 기록을 수정하고 있어요.</p>
      )}
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

          <form action={handleSubmit} className="flex flex-col gap-5">
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

            <input type="hidden" name="moodSource" value={moodSource} />

            <MoodPicker
              value={mood}
              onChange={setUserMood}
              loading={userMood === null && isFetching}
              aiSuggestion={
                moodSource === "ai" && suggestion
                  ? { mood: suggestion.suggestedMood, reason: suggestion.reason }
                  : null
              }
            />

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
              {pending ? "저장 중..." : initialRecord ? "수정하기" : "기록하기"}
            </button>
          </form>
        </>
      )}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden />
    </div>
  );
}
