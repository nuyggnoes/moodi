import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MusicSearch } from "./MusicSearch";
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

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MusicSearch />
    </QueryClientProvider>,
  );
}

function typeAndDebounce(text: string) {
  const input = screen.getByLabelText("음악 검색");
  fireEvent.change(input, { target: { value: text } });
  act(() => {
    jest.advanceTimersByTime(400);
  });
  jest.useRealTimers();
}

describe("MusicSearch", () => {
  it("shows the idle message before typing when there is no search history", () => {
    renderWithClient();
    expect(
      screen.getByText("좋아하는 곡이나 아티스트를 검색해보세요."),
    ).toBeInTheDocument();
  });

  it("shows recent search chips instead of the idle message when history exists", () => {
    addRecentSearch("aespa");
    addRecentSearch("아이유");

    renderWithClient();

    expect(screen.getByRole("button", { name: "아이유" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "aespa" })).toBeInTheDocument();
    expect(
      screen.queryByText("좋아하는 곡이나 아티스트를 검색해보세요."),
    ).not.toBeInTheDocument();
  });

  it("fills the input when a recent search chip is clicked", () => {
    addRecentSearch("aespa");
    renderWithClient();

    fireEvent.click(screen.getByRole("button", { name: "aespa" }));

    expect(screen.getByLabelText("음악 검색")).toHaveValue("aespa");
  });

  it("does not search until the debounce delay passes", () => {
    jest.useFakeTimers();
    mockFetchOnce({ results: [] });
    renderWithClient();

    fireEvent.change(screen.getByLabelText("음악 검색"), {
      target: { value: "aespa" },
    });
    expect(global.fetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(global.fetch).toHaveBeenCalled();
  });

  it("shows results after a successful search and records it as a recent search", async () => {
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
    renderWithClient();

    typeAndDebounce("aespa");

    await waitFor(() => {
      expect(screen.getByText("Next Level")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("moodi:recentSearches")!)).toEqual([
        "aespa",
      ]);
    });
  });

  it("shows an empty-results message and does not record it as a recent search", async () => {
    jest.useFakeTimers();
    mockFetchOnce({ results: [] });
    renderWithClient();

    typeAndDebounce("asdkjaslkdj");

    await waitFor(() => {
      expect(screen.getByText("검색 결과가 없어요.")).toBeInTheDocument();
    });
    expect(localStorage.getItem("moodi:recentSearches")).toBeNull();
  });

  it("shows an error message when the search fails", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockRejectedValue(new Error("network error"));
    renderWithClient();

    typeAndDebounce("aespa");

    await waitFor(() => {
      expect(
        screen.getByText("검색에 실패했어요. 잠시 후 다시 시도해주세요."),
      ).toBeInTheDocument();
    });
  });
});
