import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditableText } from "./EditableText";

describe("EditableText", () => {
  it("renders the value in read mode", () => {
    render(<EditableText value="Hello world" onSave={vi.fn()} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("switches to edit mode when the edit button is clicked", async () => {
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Hello");
  });

  it("saves when the save button is clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const textbox = screen.getByRole("textbox");
    await user.clear(textbox);
    await user.type(textbox, "World");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith("World");
  });

  it("does not call onSave when the value is unchanged", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not call onSave when the value is blank", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const textbox = screen.getByRole("textbox");
    await user.clear(textbox);
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it("reverts to the original value on cancel", async () => {
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const textbox = screen.getByRole("textbox");
    await user.clear(textbox);
    await user.type(textbox, "Something else");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cancels on Escape key", async () => {
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("saves on Ctrl+Enter", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<EditableText value="Hello" onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    const textbox = screen.getByRole("textbox");
    await user.clear(textbox);
    await user.type(textbox, "Updated");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(onSave).toHaveBeenCalledWith("Updated");
  });

  it("shows a disabled state and suppresses the edit affordance when disabled", () => {
    render(<EditableText value="Hello" onSave={vi.fn()} disabled />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
  });
});
