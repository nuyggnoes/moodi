"use client";

import { MOOD_OPTIONS, MOOD_COLORS, type Mood } from "@/entities/record/mood";

export type AiMoodSuggestion = { mood: Mood; reason: string };

const LOADING_TEXT = "AI가 기분을 읽는 중…";
const IDLE_HINT = "메모를 쓰면 AI가 어울리는 기분을 골라줘요";

export function MoodPicker({
  value,
  onChange,
  aiSuggestion = null,
  loading = false,
}: {
  value: Mood | null;
  onChange: (mood: Mood) => void;
  /** 현재 선택이 AI 제안에서 온 경우에만 넘긴다. 해당 칩에 표시를 붙이고 이유를 보여준다. */
  aiSuggestion?: AiMoodSuggestion | null;
  /** AI 제안을 기다리는 중. 칩은 계속 누를 수 있고, 선택 안 된 칩에만 shimmer 를 입힌다. */
  loading?: boolean;
}) {
  // 로딩이 이유보다 우선한다 — 다시 읽는 동안 이전 이유를 그대로 두면 지금 메모와 어긋나 보인다.
  const hint = loading
    ? LOADING_TEXT
    : aiSuggestion
      ? `AI 추천 · ${aiSuggestion.reason}`
      : value === null
        ? IDLE_HINT
        : null;

  return (
    <div>
      <div role="radiogroup" aria-label="기분" className="flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((option, index) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className="rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="mood"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                required={index === 0}
                className="sr-only"
              />
              <span
                className={`inline-block cursor-pointer rounded-full px-4 py-[9px] text-sm transition-colors ${
                  isSelected
                    ? "text-bg"
                    : "border border-border bg-surface text-ink-dim"
                } ${loading && !isSelected ? "chip-shimmer" : ""}`}
                style={isSelected ? { background: MOOD_COLORS[option.value] } : undefined}
              >
                {option.label}
                {aiSuggestion?.mood === option.value && (
                  <span aria-hidden="true" className="ml-1.5 text-[10px] font-semibold">
                    AI
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {/* 비어 있어도 렌더링해 두어야 내용이 바뀔 때 스크린리더가 읽는다. */}
      <p
        aria-live="polite"
        className={hint ? "mt-2 text-[12.5px] text-ink-dim" : undefined}
      >
        {hint && (
          <span key={hint} className="mood-hint-in">
            {hint}
          </span>
        )}
      </p>
    </div>
  );
}
