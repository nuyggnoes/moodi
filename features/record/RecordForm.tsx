"use client";

import { useActionState, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SongPicker } from "./SongPicker";
import { MoodPicker } from "./MoodPicker";
import { saveRecord, type RecordActionState } from "./actions";
import { RECORD_ERROR_MESSAGES } from "./error-codes";
import { useMoodSuggestion } from "./useMoodSuggestion";
import { MoodChip } from "./MoodChip";
import { PosterFace } from "@/entities/record/PosterFace";
import { MoodBleed } from "@/shared/ui/MoodBleed";
import { formatDayLabel } from "@/shared/lib/date/dayLabel";
import { DEFAULT_BLEED, MOOD_COLORS, type Mood } from "@/entities/record/mood";
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
 * 기록 폼: 왼쪽에는 홈에 올라갈 포스터의 라이브 미리보기, 오른쪽에는 메모 → 기분 → 저장.
 * `initialRecord` 가 있으면 오늘 기록을 수정하는 모드다 — 곡·무드·메모가 채워진 채로 열리고,
 * 저장은 같은 `saveRecord` 가 오늘 기록을 대체한다 (docs/adr/0007).
 */
export function RecordForm({
  initialRecord = null,
  todayKey,
}: {
  initialRecord?: MusicRecord | null;
  /** 오늘의 KST 날짜 키(YYYY-MM-DD). 서버가 정해 내려준다 — 렌더 중에 시계를 읽지 않기 위해서. */
  todayKey: string;
}) {
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

  const dayLabel = formatDayLabel(initialRecord?.record_date ?? todayKey);
  const bleed = mood ? MOOD_COLORS[mood] : DEFAULT_BLEED;

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-7 px-4 py-8 min-[900px]:px-8 min-[900px]:py-10">
      <MoodBleed color={bleed} />
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden />

      {!selectedTrack ? (
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-6">
          <header className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-dim">
              오늘의 기록 · {dayLabel.date}
            </p>
            <h1 className="mt-1.5 text-[clamp(24px,2.6vw,32px)] font-semibold tracking-tight [text-wrap:balance]">
              오늘 어떤 노래를 들었어요?
            </h1>
          </header>
          <SongPicker onSelect={setSelectedTrack} />
        </div>
      ) : (
        <>
          <header className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-dim">
              {initialRecord ? "오늘의 기록 수정" : "오늘의 기록"} · {dayLabel.date}
            </p>
            <h1 className="mt-1.5 text-[clamp(24px,2.6vw,32px)] font-semibold tracking-tight [text-wrap:balance]">
              {initialRecord ? "오늘의 기록을 수정하고 있어요." : "오늘의 포스터를 만들어요"}
            </h1>
          </header>

          <div className="grid items-center justify-center gap-10 min-[900px]:grid-cols-[320px_minmax(0,420px)] min-[900px]:gap-16">
            <section aria-label="포스터 미리보기" className="grid justify-items-center gap-3.5">
              <PosterFace
                dateText={dayLabel.date}
                dayText={`${dayLabel.weekdayName} · 오늘`}
                trackName={selectedTrack.trackName}
                artist={selectedTrack.artist}
                albumArt={selectedTrack.albumArt}
                previewUrl={selectedTrack.previewUrl}
                isPlaying={isPlaying}
                onTogglePlay={togglePreview}
                glowColor={mood ? MOOD_COLORS[mood] : null}
                footer={<MoodChip mood={mood} />}
                className="w-[280px] min-[900px]:-rotate-2 motion-safe:transition-[transform,box-shadow] motion-safe:duration-500 min-[900px]:hover:rotate-0"
              />
              <p className="font-mono text-xs tracking-wide text-ink-faint">홈에서 이렇게 보여요</p>
              <button
                type="button"
                onClick={handleReselect}
                className="rounded-full border border-border px-3 py-1.5 text-[13px] text-ink-dim hover:bg-surface-hover hover:text-ink"
              >
                ↺ 다시 검색
              </button>
            </section>

            <form action={handleSubmit} className="flex flex-col gap-6">
              <input type="hidden" name="trackId" value={String(selectedTrack.trackId)} />
              <input type="hidden" name="trackName" value={selectedTrack.trackName} />
              <input type="hidden" name="artist" value={selectedTrack.artist} />
              <input type="hidden" name="albumArt" value={selectedTrack.albumArt ?? ""} />
              <input type="hidden" name="previewUrl" value={selectedTrack.previewUrl ?? ""} />
              <input type="hidden" name="moodSource" value={moodSource} />

              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  <label htmlFor="memo">한마디</label>
                  <span aria-hidden="true">선택</span>
                </div>
                <div className="rounded-[18px] border border-border bg-surface px-4 py-3.5 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                  <textarea
                    id="memo"
                    name="memo"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    onInput={(event) => {
                      const el = event.currentTarget;
                      el.style.height = "auto";
                      el.style.height = `${el.scrollHeight}px`;
                    }}
                    maxLength={MEMO_MAX_LENGTH}
                    rows={3}
                    placeholder="오늘 이 곡, 어떤 느낌이었나요?"
                    className="min-h-[84px] w-full resize-none bg-transparent text-[15px] leading-[1.7] text-ink placeholder:text-ink-faint focus:outline-none"
                  />
                </div>
                {memo.length >= MEMO_COUNTER_THRESHOLD && (
                  <span className="self-end text-xs text-ink-faint">
                    {memo.length}/{MEMO_MAX_LENGTH}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <p
                  aria-hidden="true"
                  className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint"
                >
                  기분
                </p>
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
              </div>

              {state?.error && (
                <p role="alert" className="text-sm text-error">
                  {RECORD_ERROR_MESSAGES[state.error]}
                </p>
              )}

              <button
                type="submit"
                disabled={!mood || pending}
                className="rounded-full bg-accent px-7 py-3.5 font-semibold text-bg transition-[filter] hover:enabled:brightness-110 disabled:cursor-not-allowed disabled:bg-surface disabled:text-ink-faint"
              >
                {pending ? "저장 중..." : initialRecord ? "수정하기" : "기록하기"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
