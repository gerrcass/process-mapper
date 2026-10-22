import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeededWorkspace } from "@/domain/templates";
import { TEST_NOW } from "@/test/fixtures";
import { ShareDialog } from "./share-dialog";

function clipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

function supportMap() {
  return structuredClone(createSeededWorkspace(TEST_NOW)[0]);
}

/**
 * Deterministic pseudo-random text that deflate cannot collapse, so the
 * encoded payload genuinely exceeds the share link budget.
 */
function bulkyDescription(length: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_,./";
  let seed = 987654321;
  let out = "";
  for (let index = 0; index < length; index += 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    out += alphabet[seed % alphabet.length];
  }
  return out;
}

beforeEach(() => {
  window.history.replaceState({}, "", "/maps?map=map-support-escalation");
});

describe("share dialog", () => {
  it("shows the link, the snapshot caveat, and copy and preview actions", async () => {
    render(<ShareDialog map={supportMap()} open onOpenChange={vi.fn()} />);

    const input = (await screen.findByLabelText("Share link")) as HTMLInputElement;
    await waitFor(() => expect(input.value).toMatch(/^http:\/\/localhost:3000\/maps#shared=z1\./));
    expect(input).toHaveAttribute("readonly");

    expect(screen.getByText(/anyone with the link can read the map/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();

    const preview = screen.getByRole("link", { name: /Open preview/ });
    expect(preview).toHaveAttribute("target", "_blank");
    expect(preview.getAttribute("href")).toBe(input.value);
  });

  it("copies the link to the clipboard and announces the result", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);

    render(<ShareDialog map={supportMap()} open onOpenChange={vi.fn()} />);
    const input = (await screen.findByLabelText("Share link")) as HTMLInputElement;
    await waitFor(() => expect(input.value).toContain("#shared="));

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(input.value);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Link copied."));
  });

  it("reports a clipboard failure instead of failing silently", async () => {
    const user = userEvent.setup();
    clipboard(vi.fn().mockRejectedValue(new Error("denied")));

    render(<ShareDialog map={supportMap()} open onOpenChange={vi.fn()} />);
    await screen.findByLabelText("Share link");
    await waitFor(() =>
      expect((screen.getByLabelText("Share link") as HTMLInputElement).value).toContain("#shared="),
    );

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/Could not copy the link/),
    );
  });

  it("refuses to produce a link when the map exceeds the budget and points at the JSON export", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard(writeText);
    const oversized = { ...supportMap(), description: bulkyDescription(60_000) };

    render(<ShareDialog map={oversized} open onOpenChange={vi.fn()} />);

    expect(await screen.findByText("This map is too large for a share link.")).toBeInTheDocument();
    expect(screen.getByText(/Export menu/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Share link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy link" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open preview/ })).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="shared="]')).toBeNull();
    expect(writeText).not.toHaveBeenCalled();
  });
});
