import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AiComment } from "./AiComment";
import { COMMENT_GENERATING_WINDOW_MS } from "@/entities/record/comment";

const originalFetch = global.fetch;

afterEach(() => {
  jest.useRealTimers();
  global.fetch = originalFetch;
});

function makeRecord(overrides: Partial<{ memo: string | null; ai_comment: string | null; created_at: string }> = {}) {
  return {
    id: "rec-1",
    memo: "퇴근길에 비가 와서 마음이 풀렸다",
    ai_comment: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function longAgo() {
  return new Date(Date.now() - COMMENT_GENERATING_WINDOW_MS - 5_000).toISOString();
}

function renderComment(record: ReturnType<typeof makeRecord>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, "invalidateQueries");
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AiComment record={record} />
    </QueryClientProvider>,
  );
  return { ...view, invalidate };
}

describe("AiComment", () => {
  it("shows the comment when it is ready", () => {
    renderComment(makeRecord({ ai_comment: "비 오는 퇴근길의 하루예요" }));

    expect(screen.getByText("비 오는 퇴근길의 하루예요")).toBeInTheDocument();
  });

  it.each([
    ["no memo", null],
    ["a memo shorter than 5 characters", "짧아요"],
  ])("renders nothing for %s", (_label, memo) => {
    const { container } = renderComment(makeRecord({ memo }));

    expect(container).toBeEmptyDOMElement();
  });

  it("shows a skeleton while the server is still generating", () => {
    renderComment(makeRecord());

    expect(screen.getByRole("status", { name: "AI 코멘트를 만드는 중" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "코멘트 받기" })).not.toBeInTheDocument();
  });

  it("offers a retry button once the generating window has passed", () => {
    renderComment(makeRecord({ created_at: longAgo() }));

    expect(screen.getByText("코멘트가 아직 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "코멘트 받기" })).toBeInTheDocument();
  });

  it("switches from the skeleton to the retry button when the window ends", () => {
    jest.useFakeTimers();
    renderComment(makeRecord({ created_at: new Date(Date.now() - COMMENT_GENERATING_WINDOW_MS + 1_000).toISOString() }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2_000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "코멘트 받기" })).toBeInTheDocument();
  });

  it("requests a comment on click, shows the skeleton meanwhile, and refreshes the lists", async () => {
    let resolveResponse: (value: unknown) => void = () => {};
    const fetchMock = jest.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { invalidate } = renderComment(makeRecord({ created_at: longAgo() }));

    fireEvent.click(screen.getByRole("button", { name: "코멘트 받기" }));

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "코멘트 받기" })).not.toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ recordId: "rec-1" });

    await act(async () => {
      resolveResponse({ ok: true, json: async () => ({ comment: "새 코멘트예요" }) });
    });

    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ["today-feed"] }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["month-records"] });
  });

  it("shows an error message and the button again when the request fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "upstream_error" }) }) as unknown as typeof fetch;
    renderComment(makeRecord({ created_at: longAgo() }));

    fireEvent.click(screen.getByRole("button", { name: "코멘트 받기" }));

    expect(
      await screen.findByText("코멘트를 만들지 못했어요. 잠시 후 다시 시도해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "코멘트 받기" })).toBeInTheDocument();
  });
});
