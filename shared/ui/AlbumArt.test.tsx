import { render, screen } from "@testing-library/react";
import { AlbumArt } from "./AlbumArt";

describe("AlbumArt", () => {
  it("renders an image when src is given", () => {
    render(<AlbumArt src="https://example.com/art.jpg" alt="Next Level 앨범아트" />);
    const img = screen.getByRole("img", { name: "Next Level 앨범아트" });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://example.com/art.jpg");
  });

  it("renders a placeholder block when src is null", () => {
    const { container } = render(<AlbumArt src={null} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
