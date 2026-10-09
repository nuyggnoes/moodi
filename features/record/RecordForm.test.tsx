import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecordForm } from "./RecordForm";
import type { Track } from "@/shared/lib/music/types";

jest.mock("./actions", () => ({ saveRecord: jest.fn() }));
// 디바운스 타이머 자체는 useDebouncedValue.test.ts 에서 검증한다. 여기서는 즉시 통과시킨다.
jest.mock("@/shared/lib/useDebouncedValue", () => ({
  useDebouncedValue: <T,>(value: T) => value,
}));
jest.mock("./SongPicker", () => {
  const track: Track = {
    trackId: 1,
    trackName: "Next Level",
    artist: "aespa",
    albumArt: null,
    previewUrl: null,
  };
  return {
    SongPicker: ({ onSelect }: { onSelect: (track: Track) => void }) => (
      <button type="button" onClick={() => onSelect(track)}>
        곡 선택
      </button>
    ),
  };
});

const originalFetch = global.fetch;
const MEMO = "퇴근길에 들으니 마음이 차분해졌다";

afterEach(() => {
  global.fetch = originalFetch;
});

function mockSuggestion(body: unknown, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({ ok, json: async () => body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RecordForm />
    </QueryClientProvider>,
  );
}

/** 진행 중인 요청이 끝나고 상태가 반영될 시간을 준다 (act 안에서 기다려 경고를 피한다). */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
}

function selectTrack() {
  fireEvent.click(screen.getByText("곡 선택"));
}

function typeMemo(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/어떤 느낌/), {
    target: { value: text },
  });
}

function moodSourceValue() {
  return (document.querySelector('input[name="moodSource"]') as HTMLInputElement)
    .value;
}

describe("RecordForm AI mood suggestion", () => {
  it("auto-selects the suggested mood and shows the AI mark and reason", async () => {
    const fetchMock = mockSuggestion({
      suggestedMood: "calm",
      reason: "퇴근길의 여유가 느껴져요",
    });
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked(),
    );
    expect(screen.getByText("AI 추천 · 퇴근길의 여유가 느껴져요")).toBeInTheDocument();
    expect(moodSourceValue()).toBe("ai");
    expect(screen.getByRole("button", { name: "기록하기" })).toBeEnabled();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/ai/mood-suggest");
    expect(JSON.parse(init.body)).toEqual({
      memo: MEMO,
      trackName: "Next Level",
      artist: "aespa",
    });
  });

  it("does not call the API for a memo shorter than 5 characters", async () => {
    const fetchMock = mockSuggestion({ suggestedMood: "calm", reason: "x" });
    renderForm();
    selectTrack();
    typeMemo("짧아요");

    // 요청이 가지 않았음을 확인하려면 잠시 기다려 본다.
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "기록하기" })).toBeDisabled();
  });

  it("does not call the API before a track is selected", async () => {
    const fetchMock = mockSuggestion({ suggestedMood: "calm", reason: "x" });
    renderForm();

    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("silently ignores a failed suggestion and leaves the choice to the user", async () => {
    const fetchMock = mockSuggestion({ error: "upstream_error" }, false);
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await settle();

    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "차분한" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "기록하기" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    expect(screen.getByRole("radio", { name: "신나는" })).toBeChecked();
    expect(moodSourceValue()).toBe("user");
  });

  it("ignores an invalid mood value from the API", async () => {
    mockSuggestion({ suggestedMood: "angry", reason: "x" });
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    await settle();
    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
    expect(moodSourceValue()).toBe("user");
  });

  it("keeps the user's own pick when the suggestion arrives later", async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    ) as unknown as typeof fetch;
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    resolveResponse({
      ok: true,
      json: async () => ({ suggestedMood: "calm", reason: "차분해요" }),
    });

    await settle();
    expect(screen.getByRole("radio", { name: "신나는" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "차분한" })).not.toBeChecked();
    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
    expect(moodSourceValue()).toBe("user");
  });

  it("switches to user source and hides the AI hint once the user picks another mood", async () => {
    mockSuggestion({ suggestedMood: "calm", reason: "차분해요" });
    renderForm();
    selectTrack();
    typeMemo(MEMO);
    await waitFor(() => expect(moodSourceValue()).toBe("ai"));

    fireEvent.click(screen.getByRole("radio", { name: "우울한" }));

    expect(screen.getByRole("radio", { name: "우울한" })).toBeChecked();
    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
    expect(moodSourceValue()).toBe("user");
  });

  it("keeps the AI source when the user taps the already-selected suggested chip", async () => {
    mockSuggestion({ suggestedMood: "calm", reason: "차분해요" });
    renderForm();
    selectTrack();
    typeMemo(MEMO);
    await waitFor(() => expect(moodSourceValue()).toBe("ai"));

    // 이미 선택된 라디오를 다시 눌러도 change 가 없다 — 제안을 그대로 수용한 것으로 본다.
    fireEvent.click(screen.getByRole("radio", { name: "차분한" }));

    expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked();
    expect(moodSourceValue()).toBe("ai");
  });

  it("stays a user choice when the user picked first and the AI later suggests the same mood", async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    ) as unknown as typeof fetch;
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    fireEvent.click(screen.getByRole("radio", { name: "차분한" }));
    resolveResponse({
      ok: true,
      json: async () => ({ suggestedMood: "calm", reason: "차분해요" }),
    });

    await settle();
    expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked();
    expect(moodSourceValue()).toBe("user");
    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
  });

  it("follows the latest suggestion while the user has not picked a mood", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestedMood: "calm", reason: "차분해요" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ suggestedMood: "sad", reason: "쓸쓸해요" }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;
    renderForm();
    selectTrack();
    typeMemo(MEMO);
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked(),
    );

    typeMemo("비 오는 날 혼자 있으니 쓸쓸해졌다");

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "우울한" })).toBeChecked(),
    );
    expect(moodSourceValue()).toBe("ai");
  });

  it("shows the idle hint until a mood is chosen, then hides it", () => {
    mockSuggestion({ suggestedMood: "calm", reason: "x" });
    renderForm();
    selectTrack();

    expect(
      screen.getByText("메모를 쓰면 AI가 어울리는 기분을 골라줘요"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    expect(
      screen.queryByText("메모를 쓰면 AI가 어울리는 기분을 골라줘요"),
    ).not.toBeInTheDocument();
  });

  it("shows a loading state while waiting, keeps the chips clickable, and replaces it with the reason", async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    global.fetch = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    ) as unknown as typeof fetch;
    renderForm();
    selectTrack();
    typeMemo(MEMO);

    expect(await screen.findByText("AI가 기분을 읽는 중…")).toBeInTheDocument();
    expect(
      screen.queryByText("메모를 쓰면 AI가 어울리는 기분을 골라줘요"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "차분한" })).toBeEnabled();

    await act(async () => {
      resolveResponse({
        ok: true,
        json: async () => ({ suggestedMood: "calm", reason: "차분해요" }),
      });
    });

    await waitFor(() =>
      expect(screen.getByText("AI 추천 · 차분해요")).toBeInTheDocument(),
    );
    expect(screen.queryByText("AI가 기분을 읽는 중…")).not.toBeInTheDocument();
  });

  it("drops the loading state as soon as the user picks a mood", async () => {
    global.fetch = jest
      .fn()
      .mockReturnValue(new Promise(() => {})) as unknown as typeof fetch;
    renderForm();
    selectTrack();
    typeMemo(MEMO);
    expect(await screen.findByText("AI가 기분을 읽는 중…")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));

    expect(screen.queryByText("AI가 기분을 읽는 중…")).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "신나는" })).toBeChecked();
  });

  it("does not call the API when the user picked a mood before writing the memo", async () => {
    const fetchMock = mockSuggestion({ suggestedMood: "calm", reason: "x" });
    renderForm();
    selectTrack();

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    typeMemo(MEMO);

    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(moodSourceValue()).toBe("user");
  });
});
