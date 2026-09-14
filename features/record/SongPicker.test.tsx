import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SongPicker } from "./SongPicker";
import {
  addRecentSearch,
  __resetRecentSearchesCacheForTests,
} from "@/shared/lib/recentSearches";

const originalFetch = global.fetch;

beforeEach(() => {
  window.localStorage.clear();
  __resetRecentSearchesCacheForTests();
});

afterEach(() => {
  jest.useRealTimers();
  global.fetch = originalFetch;
});

function mockFetchOnce(body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }) as unknown as typeof fetch;
}

function renderPicker(onSelect = jest.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SongPicker onSelect={onSelect} />
    </QueryClientProvider>,
  );
  return onSelect;
}

describe("SongPicker", () => {
  it("shows the idle message before typing when there is no search history", () => {
    renderPicker();
    expect(screen.getByText("기록할 곡을 검색해보세요.")).toBeInTheDocument();
  });

  it("shows recent search chips when history exists", () => {
    addRecentSearch("aespa");
    renderPicker();
    expect(screen.getByRole("button", { name: "aespa" })).toBeInTheDocument();
  });

  it("calls onSelect with the track when 선택 is clicked", async () => {
    jest.useFakeTimers();
    mockFetchOnce({
      results: [
        {
          trackId: 1,
          trackName: "Next Level",
          artist: "aespa",
          albumArt: null,
          previewUrl: null,
        },
      ],
    });
    const onSelect = renderPicker();

    fireEvent.change(screen.getByLabelText("음악 검색"), {
      target: { value: "aespa" },
    });
    act(() => {
      jest.advanceTimersByTime(400);
    });
    jest.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("Next Level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "선택" }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: 1, trackName: "Next Level" }),
    );
  });
});
