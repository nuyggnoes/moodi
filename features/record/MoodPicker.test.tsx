import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { MoodPicker } from "./MoodPicker";
import type { Mood } from "@/entities/record/mood";

function Wrapper() {
  const [mood, setMood] = useState<Mood | null>(null);
  return <MoodPicker value={mood} onChange={setMood} />;
}

describe("MoodPicker", () => {
  it("renders all 5 mood options", () => {
    render(<Wrapper />);
    for (const label of ["설레는", "차분한", "신나는", "우울한", "집중되는"]) {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("selects a mood when clicked", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("radio", { name: "차분한" }));
    expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked();
  });

  it("only one mood can be selected at a time", () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByRole("radio", { name: "차분한" }));
    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    expect(screen.getByRole("radio", { name: "차분한" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "신나는" })).toBeChecked();
  });
});
