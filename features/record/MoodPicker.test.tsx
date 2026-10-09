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

  it("marks the AI-suggested chip and shows the reason", () => {
    render(
      <MoodPicker
        value="calm"
        onChange={() => {}}
        aiSuggestion={{ mood: "calm", reason: "퇴근길의 여유가 느껴져요" }}
      />,
    );

    expect(screen.getByText("AI 추천 · 퇴근길의 여유가 느껴져요")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    // 표시는 장식이라 라디오의 접근 가능한 이름에는 들어가지 않는다.
    expect(screen.getByRole("radio", { name: "차분한" })).toBeChecked();
  });

  it("shows no AI mark or reason without a suggestion", () => {
    render(<MoodPicker value="calm" onChange={() => {}} />);

    expect(screen.queryByText("AI")).not.toBeInTheDocument();
    expect(screen.queryByText(/AI 추천/)).not.toBeInTheDocument();
  });

  it("shows the idle hint when nothing is chosen and nothing is loading", () => {
    render(<MoodPicker value={null} onChange={() => {}} />);

    expect(
      screen.getByText("메모를 쓰면 AI가 어울리는 기분을 골라줘요"),
    ).toBeInTheDocument();
  });

  it("shows no hint when the user has chosen a mood without any suggestion", () => {
    render(<MoodPicker value="calm" onChange={() => {}} />);

    expect(screen.queryByText(/AI/)).not.toBeInTheDocument();
  });

  it("shows the loading text and shimmers only the unselected chips, which stay clickable", () => {
    const onChange = jest.fn();
    render(<MoodPicker value="calm" onChange={onChange} loading />);

    expect(screen.getByText("AI가 기분을 읽는 중…")).toBeInTheDocument();
    const chipOf = (name: string) =>
      screen.getByRole("radio", { name }).nextElementSibling as HTMLElement;
    expect(chipOf("신나는")).toHaveClass("chip-shimmer");
    expect(chipOf("차분한")).not.toHaveClass("chip-shimmer");

    fireEvent.click(screen.getByRole("radio", { name: "신나는" }));
    expect(onChange).toHaveBeenCalledWith("energetic");
  });

  it("prefers the loading text over a previous suggestion's reason", () => {
    render(
      <MoodPicker
        value="calm"
        onChange={() => {}}
        loading
        aiSuggestion={{ mood: "calm", reason: "이전 이유" }}
      />,
    );

    expect(screen.getByText("AI가 기분을 읽는 중…")).toBeInTheDocument();
    expect(screen.queryByText(/이전 이유/)).not.toBeInTheDocument();
  });
});
