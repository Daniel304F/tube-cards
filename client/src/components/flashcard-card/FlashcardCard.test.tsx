import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FlashcardCard } from "./FlashcardCard";

describe("FlashcardCard", () => {
  const defaultProps = {
    question: "What is React?",
    answer: "A JavaScript library for building UIs.",
    index: 0,
  };

  function flipButton(): HTMLElement {
    return screen.getByRole("button", { name: /show (answer|question)/i });
  }

  it("shows the question initially", () => {
    render(<FlashcardCard {...defaultProps} />);

    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument();
  });

  it("shows the answer after a click", async () => {
    const user = userEvent.setup();
    render(<FlashcardCard {...defaultProps} />);

    await user.click(flipButton());

    expect(screen.getByText(defaultProps.answer)).toBeInTheDocument();
    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("toggles back to the question on second click", async () => {
    const user = userEvent.setup();
    render(<FlashcardCard {...defaultProps} />);

    const button = flipButton();
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

    const button = flipButton();
    expect(button).toHaveAttribute("aria-label", "Show answer");

    await user.click(button);
    expect(button).toHaveAttribute("aria-label", "Show question");
  });

  describe("edit mode", () => {
    it("exposes no edit affordance when onSave is not provided", () => {
      render(<FlashcardCard {...defaultProps} />);
      expect(screen.queryByRole("button", { name: /edit flashcard/i })).not.toBeInTheDocument();
    });

    it("shows an edit button when onSave is provided", () => {
      render(<FlashcardCard {...defaultProps} onSave={vi.fn()} />);
      expect(screen.getByRole("button", { name: /edit flashcard/i })).toBeInTheDocument();
    });

    it("enters edit mode with both fields editable", async () => {
      const user = userEvent.setup();
      render(<FlashcardCard {...defaultProps} onSave={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit flashcard/i }));

      expect(screen.getByRole("textbox", { name: /question/i })).toHaveValue("What is React?");
      expect(screen.getByRole("textbox", { name: /answer/i })).toHaveValue(
        "A JavaScript library for building UIs.",
      );
    });

    it("saves changes and calls onSave with both fields", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<FlashcardCard {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByRole("button", { name: /edit flashcard/i }));
      const q = screen.getByRole("textbox", { name: /question/i });
      await user.clear(q);
      await user.type(q, "What is Vue?");
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(onSave).toHaveBeenCalledWith({
        question: "What is Vue?",
        answer: "A JavaScript library for building UIs.",
      });
    });

    it("cancel restores the original fields", async () => {
      const user = userEvent.setup();
      render(<FlashcardCard {...defaultProps} onSave={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit flashcard/i }));
      const q = screen.getByRole("textbox", { name: /question/i });
      await user.clear(q);
      await user.type(q, "Totally different");
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.getByText("What is React?")).toBeInTheDocument();
    });

    it("does not call onSave when both fields are unchanged", async () => {
      const onSave = vi.fn();
      const user = userEvent.setup();
      render(<FlashcardCard {...defaultProps} onSave={onSave} />);

      await user.click(screen.getByRole("button", { name: /edit flashcard/i }));
      await user.click(screen.getByRole("button", { name: /^save$/i }));

      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
