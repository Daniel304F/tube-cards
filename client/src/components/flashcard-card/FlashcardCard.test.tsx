import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FlashcardCard } from "./FlashcardCard";

describe("FlashcardCard", () => {
  const defaultProps = {
    question: "What is React?",
    answer: "A JavaScript library for building UIs.",
    index: 0,
  };

  it("shows the question initially", () => {
    render(<FlashcardCard {...defaultProps} />);

    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument();
  });

  it("shows the answer after a click", async () => {
    const user = userEvent.setup();
    render(<FlashcardCard {...defaultProps} />);

    await user.click(screen.getByRole("button"));

    expect(screen.getByText(defaultProps.answer)).toBeInTheDocument();
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("toggles back to the question on second click", async () => {
    const user = userEvent.setup();
    render(<FlashcardCard {...defaultProps} />);

    const button = screen.getByRole("button");
    await user.click(button);
    await user.click(button);

    expect(screen.getByText(defaultProps.question)).toBeInTheDocument();
  });

  it("renders the 1-based index badge", () => {
    render(<FlashcardCard {...defaultProps} index={4} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("exposes an accessible aria-label that reflects the flip state", async () => {
    const user = userEvent.setup();
    render(<FlashcardCard {...defaultProps} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Show answer");

    await user.click(button);
    expect(button).toHaveAttribute("aria-label", "Show question");
  });
});
