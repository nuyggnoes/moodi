import type { AiError } from "./types";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
// gemini-2.5-flash-lite 는 신규 프로젝트 접근이 제한돼 3.5 세대를 쓴다.
const MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 5000;

export type GeminiJsonRequest = {
  systemInstruction: string;
  userText: string;
  responseSchema: object;
  temperature: number;
  maxOutputTokens: number;
};

export type GeminiJsonResult =
  | { success: true; data: unknown }
  | { success: false; error: AiError };

type GeminiPart = { text?: string; thought?: boolean };

type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
};

function toError(error: unknown): AiError {
  // AbortSignal.timeout 은 name 이 "TimeoutError" 인 DOMException 으로 reject 한다.
  // 실행 환경(realm)에 따라 instanceof Error 가 어긋날 수 있어 name 만 본다.
  return (error as { name?: string } | null)?.name === "TimeoutError"
    ? "timeout"
    : "upstream";
}

/**
 * Gemini `generateContent` 를 JSON 응답 모드로 호출하고, 본문 텍스트를 JSON 으로 파싱해 돌려준다.
 * 값의 형태·범위 검증은 호출 측 책임이다 — 구조화 출력이어도 값은 신뢰하지 않는다.
 */
export async function requestGeminiJson(
  request: GeminiJsonRequest,
): Promise<GeminiJsonResult> {
  // 빌드 시점이 아닌 호출 시점에 읽는다 — 키 없이도 CI build 가 통과해야 한다.
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return { success: false, error: "not_configured" };

  try {
    const response = await fetch(`${GEMINI_BASE_URL}/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: request.userText }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: request.responseSchema,
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return { success: false, error: "upstream" };

    const body: GeminiResponse = await response.json();
    // thinking 모델은 사고 파트가 앞에 섞여 올 수 있어 본문 텍스트 파트를 찾는다.
    const parts = body.candidates?.[0]?.content?.parts ?? [];
    const text = parts.find((part) => !part.thought && part.text)?.text;
    if (!text) return { success: false, error: "invalid_response" };

    try {
      return { success: true, data: JSON.parse(text) };
    } catch {
      return { success: false, error: "invalid_response" };
    }
  } catch (error) {
    return { success: false, error: toError(error) };
  }
}
