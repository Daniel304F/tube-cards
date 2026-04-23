import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TagData } from "../../api/tags";
import { TagPicker } from "./TagPicker";

const T = (id: number, name: string): TagData => ({
  id,
  name,
  color: "#10b981",
  created_at: "x",
});

describe("TagPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows attached tags", () => {
    render(
      <TagPicker
        allTags={[T(1, "react"), T(2, "vue")]}
        attachedTagIds={[1]}
        onAttach={vi.fn()}
        onDetach={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("opens a menu with available tags when the add button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <TagPicker
        allTags={[T(1, "react"), T(2, "vue")]}
        attachedTagIds={[1]}
        onAttach={vi.fn()}
        onDetach={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add tag/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /vue/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /^react$/i })).not.toBeInTheDocument();
  });

  it("calls onAttach when a tag from the menu is selected", async () => {
    const onAttach = vi.fn();
    const user = userEvent.setup();
    render(
      <TagPicker
        allTags={[T(1, "react"), T(2, "vue")]}
        attachedTagIds={[]}
        onAttach={onAttach}
        onDetach={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add tag/i }));
    await user.click(screen.getByRole("menuitem", { name: /react/i }));

    expect(onAttach).toHaveBeenCalledWith(1);
  });

  it("calls onDetach when an attached tag's remove button is clicked", async () => {
    const onDetach = vi.fn();
    const user = userEvent.setup();
    render(
      <TagPicker
        allTags={[T(1, "react")]}
        attachedTagIds={[1]}
        onAttach={vi.fn()}
        onDetach={onDetach}
        onCreate={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /remove tag react/i }));

    expect(onDetach).toHaveBeenCalledWith(1);
  });

  it("creates a new tag from the input and attaches it", async () => {
    const onCreate = vi.fn().mockResolvedValue(T(99, "newtag"));
    const onAttach = vi.fn();
    const user = userEvent.setup();
    render(
      <TagPicker
        allTags={[]}
        attachedTagIds={[]}
        onAttach={onAttach}
        onDetach={vi.fn()}
        onCreate={onCreate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add tag/i }));
    const input = screen.getByPlaceholderText(/new tag/i);
    await user.type(input, "newtag");
    await user.keyboard("{Enter}");

    expect(onCreate).toHaveBeenCalledWith("newtag");
  });
});
