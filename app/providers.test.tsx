import { render, screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { Providers } from "./providers";

function Probe() {
  const { isPending } = useQuery({
    queryKey: ["probe"],
    queryFn: () => Promise.resolve("ok"),
  });
  return <div>{isPending ? "pending" : "done"}</div>;
}

describe("Providers", () => {
  it("QueryClientProvider 하위에서 useQuery 가 에러 없이 렌더된다", () => {
    render(
      <Providers>
        <Probe />
      </Providers>,
    );
    expect(screen.getByText("pending")).toBeInTheDocument();
  });
});
