import { render, screen, fireEvent } from "@testing-library/react";
import { Drawer } from "./Drawer";

describe("Drawer", () => {
  it("renders nothing when closed", () => {
    render(
      <Drawer open={false} onClose={jest.fn()}>
        <p>내용</p>
      </Drawer>,
    );
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("renders children in a dialog when open", () => {
    render(
      <Drawer open onClose={jest.fn()} ariaLabel="메뉴">
        <p>내용</p>
      </Drawer>,
    );
    expect(screen.getByRole("dialog", { name: "메뉴" })).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = jest.fn();
    render(
      <Drawer open onClose={onClose}>
        <p>내용</p>
      </Drawer>,
    );
    fireEvent.click(screen.getByTestId("drawer-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the panel itself is clicked", () => {
    const onClose = jest.fn();
    render(
      <Drawer open onClose={onClose}>
        <p>내용</p>
      </Drawer>,
    );
    fireEvent.click(screen.getByText("내용"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose on Escape", () => {
    const onClose = jest.fn();
    render(
      <Drawer open onClose={onClose}>
        <p>내용</p>
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks body scroll while open and restores it on close", () => {
    const { rerender } = render(
      <Drawer open onClose={jest.fn()}>
        <p>내용</p>
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Drawer open={false} onClose={jest.fn()}>
        <p>내용</p>
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("");
  });
});
