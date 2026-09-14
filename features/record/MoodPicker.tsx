"use client";

import { MOOD_OPTIONS, MOOD_COLORS, type Mood } from "@/entities/record/mood";

export function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}) {
  return (
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
              }`}
              style={isSelected ? { background: MOOD_COLORS[option.value] } : undefined}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
