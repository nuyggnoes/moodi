import { render, screen, fireEvent } from "@testing-library/react";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("renders nothing when closed", () => {
    render(
      <BottomSheet open={false} onClose={jest.fn()}>
        <p>내용</p>
      </BottomSheet>,
    );
    expect(screen.queryByText("내용")).not.toBeInTheDocument();
  });

  it("renders children when open", () => {
    render(
      <BottomSheet open onClose={jest.fn()}>
        <p>내용</p>
      </BottomSheet>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("내용")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = jest.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <p>내용</p>
      </BottomSheet>,
    );

    fireEvent.click(screen.getByTestId("bottom-sheet-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
