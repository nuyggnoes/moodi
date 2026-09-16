import { render, screen } from "@testing-library/react";
import { EmptyRecordCTA } from "./EmptyRecordCTA";

describe("EmptyRecordCTA", () => {
  it("links to /record", () => {
    render(<EmptyRecordCTA />);
    expect(screen.getByRole("link", { name: "기록하기" })).toHaveAttribute(
      "href",
      "/record",
    );
  });
});
