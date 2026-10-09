import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { moodSuggester } from "@/shared/lib/ai";
import { MOOD_OPTIONS } from "@/entities/record/mood";
import {
  MEMO_MAX_LENGTH,
  MOOD_SUGGEST_MIN_MEMO_LENGTH,
} from "@/entities/record/memo";

const FIELD_MAX_LENGTH = 200;
const MOODS = MOOD_OPTIONS.map((option) => option.value);

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  // proxy.ts 는 /api 경로를 보호하지 않는다 — LLM 비용이 드는 엔드포인트라 여기서 직접 확인한다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<
    string,
    unknown
  >;
  const memo = readString(raw.memo);
  const trackName = readString(raw.trackName);
  const artist = readString(raw.artist);

  if (
    memo.length < MOOD_SUGGEST_MIN_MEMO_LENGTH ||
    memo.length > MEMO_MAX_LENGTH ||
    !trackName ||
    trackName.length > FIELD_MAX_LENGTH ||
    !artist ||
    artist.length > FIELD_MAX_LENGTH
  ) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await moodSuggester.suggest({
    memo,
    trackName,
    artist,
    moods: MOODS,
  });

  if (!result.success) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }

  return NextResponse.json({
    suggestedMood: result.suggestedMood,
    reason: result.reason,
  });
}
