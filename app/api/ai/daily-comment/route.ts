import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { commentGenerator } from "@/shared/lib/ai";
import { generateDailyComment } from "@/features/comment/generateDailyComment";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const recordId = (body as { recordId?: unknown } | null)?.recordId;
  if (typeof recordId !== "string" || !UUID_PATTERN.test(recordId)) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await generateDailyComment(
    { supabase, generator: commentGenerator },
    user.id,
    recordId,
  );

  if (result.success) {
    return NextResponse.json({ comment: result.comment });
  }
  if (result.error === "not_found") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (result.error === "no_memo") {
    return NextResponse.json({ error: "no_memo" }, { status: 422 });
  }

  // 메모 내용은 남기지 않는다 — 기록 id 와 실패 원인만.
  console.error("daily-comment failed", { recordId, cause: result.cause });
  return NextResponse.json({ error: "upstream_error" }, { status: 502 });
}
