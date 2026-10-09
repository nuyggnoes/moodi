/** 서버에 기록 한 건의 AI 코멘트 생성을 요청한다 (재시도·이전 기록용). */
export async function requestDailyComment(recordId: string): Promise<string> {
  const response = await fetch("/api/ai/daily-comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recordId }),
  });

  if (!response.ok) {
    throw new Error("daily_comment_failed");
  }

  const data: { comment?: unknown } = await response.json();
  if (typeof data.comment !== "string") {
    throw new Error("daily_comment_invalid");
  }

  return data.comment;
}
