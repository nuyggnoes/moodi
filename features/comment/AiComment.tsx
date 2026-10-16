"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  COMMENT_GENERATING_WINDOW_MS,
  getCommentState,
} from "@/entities/record/comment";
import type { MusicRecord } from "@/entities/record/types";
import { requestDailyComment } from "./requestDailyComment";

const BOX = "rounded-xl border border-dashed border-border p-2 text-xs text-ink-faint";

/**
 * 기록의 AI 코멘트 표시: 본문 / 만드는 중 스켈레톤 / 없을 때 "코멘트 받기" 버튼.
 * 코멘트 대상이 아닌 기록(메모가 없거나 짧음)에는 아무것도 그리지 않는다.
 * `renderReady` 로 코멘트가 있을 때의 모양만 바꿀 수 있다 (예: 줄 수 제한).
 */
export function AiComment({
  record,
  renderReady,
}: {
  record: Pick<MusicRecord, "id" | "memo" | "ai_comment" | "created_at">;
  renderReady?: (comment: string) => ReactNode;
}) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const state = getCommentState(record, now);

  const mutation = useMutation({
    mutationFn: () => requestDailyComment(record.id),
    onSuccess: () => {
      // 달력 목록과 최근 7일 모두 새 코멘트를 다시 읽는다.
      queryClient.invalidateQueries({ queryKey: ["month-records"] });
      queryClient.invalidateQueries({ queryKey: ["week-records"] });
    },
  });

  // 만드는 중 → 만들지 못함 전환 시점에 다시 그린다 (그동안 데이터가 바뀌지 않아도).
  useEffect(() => {
    if (state !== "generating") return;
    const remaining =
      new Date(record.created_at).getTime() + COMMENT_GENERATING_WINDOW_MS - Date.now();
    const timer = setTimeout(() => setNow(Date.now()), Math.max(remaining, 0) + 50);
    return () => clearTimeout(timer);
  }, [state, record.created_at]);

  if (state === "none") return null;

  if (state === "ready") {
    if (renderReady) return <>{renderReady(record.ai_comment ?? "")}</>;
    return <div className={BOX}>{record.ai_comment}</div>;
  }

  if (state === "generating" || mutation.isPending) {
    return (
      <div role="status" aria-label="AI 코멘트를 만드는 중" className={`${BOX} flex flex-col gap-1.5`}>
        <span className="h-2.5 w-3/4 rounded bg-border motion-safe:animate-pulse" />
        <span className="h-2.5 w-1/2 rounded bg-border motion-safe:animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`${BOX} flex items-center justify-between gap-2`}>
      <span>
        {mutation.isError
          ? "코멘트를 만들지 못했어요. 잠시 후 다시 시도해주세요."
          : "코멘트가 아직 없어요."}
      </span>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        className="shrink-0 rounded-full border border-border px-2.5 py-1 text-ink-dim hover:text-accent"
      >
        코멘트 받기
      </button>
    </div>
  );
}
