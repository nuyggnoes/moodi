import { render, screen } from "@testing-library/react";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("renders an image when src is given", () => {
    render(<Avatar src="https://example.com/avatar.png" alt="임성균" />);
    const img = screen.getByRole("img", { name: "임성균" });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("renders a placeholder when src is null", () => {
    render(<Avatar src={null} alt="임성균" />);
    const placeholder = screen.getByRole("img", { name: "임성균" });
    expect(placeholder.tagName).toBe("DIV");
  });
});
