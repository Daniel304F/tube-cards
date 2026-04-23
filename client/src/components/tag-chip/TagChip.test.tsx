import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TagChip } from "./TagChip";

const TAG = { id: 1, name: "react", color: "#10b981", created_at: "x" };

describe("TagChip", () => {
  it("renders the tag name", () => {
    render(<TagChip tag={TAG} />);
    expect(screen.getByText("react")).toBeInTheDocument();
  });

  it("applies the tag color", () => {
    render(<TagChip tag={TAG} />);
    const chip = screen.getByText("react").closest("[data-testid='tag-chip']");
    expect(chip).toHaveStyle({ backgroundColor: "#10b981" });
  });

  it("fires onRemove when remove button is clicked", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();

    render(<TagChip tag={TAG} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: /remove tag react/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not render a remove button when onRemove is not provided", () => {
    render(<TagChip tag={TAG} />);
    expect(screen.queryByRole("button", { name: /remove tag/i })).not.toBeInTheDocument();
  });
});
