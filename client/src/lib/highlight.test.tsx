import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Highlight } from "./highlight";

describe("Highlight", () => {
  it("renders the plain text when the query is empty", () => {
    render(<Highlight text="Hello world" query="" />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
    expect(screen.queryByRole("mark" as never)).not.toBeInTheDocument();
  });

  it("wraps the matching substring in a <mark>", () => {
    const { container } = render(<Highlight text="Hello world" query="world" />);

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toBe("world");
  });

  it("matches case-insensitively but preserves original casing", () => {
    const { container } = render(
      <Highlight text="The Quick Brown Fox" query="quick" />,
    );

    const marks = container.querySelectorAll("mark");
    expect(marks[0]?.textContent).toBe("Quick");
  });

  it("highlights every occurrence", () => {
    const { container } = render(
      <Highlight text="ab ab ab" query="ab" />,
    );

    expect(container.querySelectorAll("mark")).toHaveLength(3);
  });

  it("renders the text unchanged when there is no match", () => {
    const { container } = render(<Highlight text="hello" query="xyz" />);

    expect(container.querySelectorAll("mark")).toHaveLength(0);
    expect(container.textContent).toBe("hello");
  });

  it("preserves the full original text", () => {
    const { container } = render(
      <Highlight text="prefix-MATCH-suffix" query="match" />,
    );

    expect(container.textContent).toBe("prefix-MATCH-suffix");
  });

  it("treats a whitespace-only query as empty", () => {
    const { container } = render(<Highlight text="hello world" query="   " />);

    expect(container.querySelectorAll("mark")).toHaveLength(0);
  });
});
