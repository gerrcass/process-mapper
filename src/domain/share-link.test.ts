import { afterEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import { completeMap, mapWithSteps } from "@/test/fixtures";
import type { ProcessMap } from "@/domain/types";
import {
  SHARE_LINK_BUDGET,
  buildShareLink,
  decodeSharePayload,
  encodeSharePayload,
  exceedsShareLinkBudget,
  sharePayloadFromHash,
} from "@/domain/share-link";

/**
 * Worked example produced independently with Node's zlib and Buffer,
 * not with the encoder under test.
 */
const LITERAL_MAP: ProcessMap = {
  schemaVersion: 1,
  id: "map-literal",
  title: "Return handling",
  description: "A two-step returns flow for the worked example.",
  status: "draft",
  origin: "blank",
  createdAt: "2026-10-20T09:00:00.000Z",
  updatedAt: "2026-10-20T09:00:00.000Z",
  sipoc: {
    suppliers: [{ id: "entry-1", label: "Return desk", detail: "Front counter" }],
    inputs: [],
    outputs: [{ id: "entry-2", label: "Refund note", detail: "" }],
    customers: [],
  },
  nodes: [
    {
      id: "node-1",
      kind: "start",
      title: "Return arrives",
      description: "",
      owner: "",
      system: "",
      duration: "",
      position: { x: 0, y: 100 },
    },
    {
      id: "node-2",
      kind: "step",
      title: "Check the receipt",
      description: "",
      owner: "Returns clerk",
      system: "Till",
      duration: "5m",
      position: { x: 320, y: 100 },
      sipocOrder: 1,
    },
  ],
  edges: [{ id: "edge-1", source: "node-1", target: "node-2", label: "", kind: "flow" }],
  viewport: { x: 0, y: 0, zoom: 1 },
};

const U1_LITERAL =
  "u1.eyJzY2hlbWFWZXJzaW9uIjoxLCJpZCI6Im1hcC1saXRlcmFsIiwidGl0bGUiOiJSZXR1cm4gaGFuZGxpbmciLCJkZXNjcmlwdGlvbiI6IkEgdHdvLXN0ZXAgcmV0dXJucyBmbG93IGZvciB0aGUgd29ya2VkIGV4YW1wbGUuIiwic3RhdHVzIjoiZHJhZnQiLCJvcmlnaW4iOiJibGFuayIsImNyZWF0ZWRBdCI6IjIwMjYtMTAtMjBUMDk6MDA6MDAuMDAwWiIsInVwZGF0ZWRBdCI6IjIwMjYtMTAtMjBUMDk6MDA6MDAuMDAwWiIsInNpcG9jIjp7InN1cHBsaWVycyI6W3siaWQiOiJlbnRyeS0xIiwibGFiZWwiOiJSZXR1cm4gZGVzayIsImRldGFpbCI6IkZyb250IGNvdW50ZXIifV0sImlucHV0cyI6W10sIm91dHB1dHMiOlt7ImlkIjoiZW50cnktMiIsImxhYmVsIjoiUmVmdW5kIG5vdGUiLCJkZXRhaWwiOiIifV0sImN1c3RvbWVycyI6W119LCJub2RlcyI6W3siaWQiOiJub2RlLTEiLCJraW5kIjoic3RhcnQiLCJ0aXRsZSI6IlJldHVybiBhcnJpdmVzIiwiZGVzY3JpcHRpb24iOiIiLCJvd25lciI6IiIsInN5c3RlbSI6IiIsImR1cmF0aW9uIjoiIiwicG9zaXRpb24iOnsieCI6MCwieSI6MTAwfX0seyJpZCI6Im5vZGUtMiIsImtpbmQiOiJzdGVwIiwidGl0bGUiOiJDaGVjayB0aGUgcmVjZWlwdCIsImRlc2NyaXB0aW9uIjoiIiwib3duZXIiOiJSZXR1cm5zIGNsZXJrIiwic3lzdGVtIjoiVGlsbCIsImR1cmF0aW9uIjoiNW0iLCJwb3NpdGlvbiI6eyJ4IjozMjAsInkiOjEwMH0sInNpcG9jT3JkZXIiOjF9XSwiZWRnZXMiOlt7ImlkIjoiZWRnZS0xIiwic291cmNlIjoibm9kZS0xIiwidGFyZ2V0Ijoibm9kZS0yIiwibGFiZWwiOiIiLCJraW5kIjoiZmxvdyJ9XSwidmlld3BvcnQiOnsieCI6MCwieSI6MCwiem9vbSI6MX19";

const Z1_LITERAL =
  "z1.jZJBa9wwEIX_ipmzHGSXFqpbKORaCCGHlD0o0uyusCyJ0SjOdvF_L7K3rJeF0pvGjJ6_957OkM0RR_2KlF0MoDoBzoKCUafWO0bSHgSwY4-g4Bm5UGiOOljvwgEEWMyGXOLlMjw2PMU2M6aGltXc7H2cmn2kho_YTJEGtA1-6jF5fAABmTWXDAos6T2DgEju4KrWu9dhAAGGUDPaRwYFvey_tZ1se_kivysplZQPUso3EFCS_Z-17FI0oM6QS0reIWVQv86rZwxMp7YDAV6_o7_6tZiHxStrVz8_UQzcmFgCI8G8E-BCKlyldgJi4ctwo9vf6O5LsE2IjFvdRcqUzHFcwXazgBAtbsTquDAOLtQ5sya-r0gTuQ_Mdw3VhKeAtB7zKTOO69kW0telFLNbpzN8gpICTqA6KedZbEH6LQimDcePI5phKZ3QoEv8L5Tny2MxHmnYcr0472_Zvo73dF_6K9-l4p9kq3JXE0V72CZYxyXBHAsZ3GbKmg7IW3N_G7v6rA96KerD4ZQi8U1EUsDvGMf65_kP";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share link payload codec", () => {
  it("round-trips a map through the compressed format", async () => {
    const map = completeMap();
    const payload = await encodeSharePayload(map);

    expect(payload.startsWith("z1.")).toBe(true);
    expect(payload.length).toBeLessThan(JSON.stringify(map).length);

    const result = await decodeSharePayload(payload);
    expect(result).toEqual({ ok: true, value: map });
  });

  it("falls back to the plain format when compression is unavailable", async () => {
    vi.stubGlobal("CompressionStream", undefined);
    const map = mapWithSteps(2);

    const payload = await encodeSharePayload(map);

    expect(payload.startsWith("u1.")).toBe(true);
    const result = await decodeSharePayload(payload);
    expect(result).toEqual({ ok: true, value: map });
  });

  it("falls back to the plain format when compression throws", async () => {
    vi.stubGlobal(
      "CompressionStream",
      class BrokenCompressionStream {
        constructor() {
          throw new Error("compression unsupported");
        }
      },
    );
    const map = mapWithSteps(2);

    const payload = await encodeSharePayload(map);

    expect(payload.startsWith("u1.")).toBe(true);
    const result = await decodeSharePayload(payload);
    expect(result).toEqual({ ok: true, value: map });
  });

  it("decodes a hand-written plain payload literal", async () => {
    const result = await decodeSharePayload(U1_LITERAL);

    expect(result).toEqual({ ok: true, value: LITERAL_MAP });
  });

  it("decodes a hand-written compressed payload literal", async () => {
    const result = await decodeSharePayload(Z1_LITERAL);

    expect(result).toEqual({ ok: true, value: LITERAL_MAP });
  });

  it("rejects an empty payload and explains that the link carries no map", async () => {
    const result = await decodeSharePayload("");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This share link carries no map.");
  });

  it("rejects a payload that is only a format prefix", async () => {
    for (const prefix of ["z1.", "u1."]) {
      const result = await decodeSharePayload(prefix);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe("This share link carries no map.");
    }
  });

  it("rejects a payload without a format prefix with its own message", async () => {
    const result = await decodeSharePayload("YWJjZA");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This share link is missing its format prefix.");
  });

  it("rejects an unknown format prefix and names the format", async () => {
    const result = await decodeSharePayload("x9.YWJjZA");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This share link uses an unsupported format: x9.");
  });

  it("names a future format version among unknown prefixes", async () => {
    const result = await decodeSharePayload("u2.YWJjZA");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This share link uses an unsupported format: u2.");
  });

  it("rejects when the decompressor fails on the write side instead of reading truncated output", async () => {
    // A decompressor whose writable side rejects while the readable side
    // resolves with a truncated prefix of the JSON: a write-side-only failure
    // must surface as corruption, not as a misleading JSON error.
    vi.stubGlobal(
      "DecompressionStream",
      class WriteSideFailure {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        constructor(format: string) {}
        readable = new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array([123])); // a lone "{"
            controller.close();
          },
        });
        writable = new WritableStream<Uint8Array>({
          write() {
            throw new Error("decompression failed");
          },
        });
      },
    );

    const result = await decodeSharePayload("z1.YWJjZA");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("This share link is damaged: the payload is corrupt.");
  });

  it("rejects a payload with invalid base64", async () => {
    const result = await decodeSharePayload("u1.a!bc");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not valid base64");
  });

  it("rejects a payload that is not JSON", async () => {
    const result = await decodeSharePayload("u1.bm90IGpzb24");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("not valid JSON");
  });

  it("rejects a document that fails the map schema and names the field", async () => {
    const map = completeMap();
    const broken = {
      ...map,
      nodes: map.nodes.map((node, index) =>
        index === 1 ? { ...node, id: map.nodes[0].id } : node,
      ),
    };
    const payload = `u1.${Buffer.from(JSON.stringify(broken), "utf8").toString("base64url")}`;

    const result = await decodeSharePayload(payload);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Could not read this share link");
      expect(result.error).toContain("duplicate node id");
    }
  });

  it("rejects a corrupt compressed payload", async () => {
    // Flip the first compressed byte to another valid base64url digit,
    // corrupting the deflate stream while keeping the base64 valid.
    const corrupt = `${Z1_LITERAL.slice(0, 3)}k${Z1_LITERAL.slice(4)}`;

    const result = await decodeSharePayload(corrupt);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("corrupt");
  });

  it("never throws on hostile input", async () => {
    for (const input of ["", "x", "z1.", "u1.", "z1.!!", "u1.a", "shared=", "#shared=", "u1./+="]) {
      const result = await decodeSharePayload(input);
      expect(result.ok).toBe(false);
    }
  });
});

describe("share link budget", () => {
  it("passes a payload just under the budget and at it, and refuses one just over", () => {
    expect(exceedsShareLinkBudget("a".repeat(SHARE_LINK_BUDGET - 1))).toBe(false);
    expect(exceedsShareLinkBudget("a".repeat(SHARE_LINK_BUDGET))).toBe(false);
    expect(exceedsShareLinkBudget("a".repeat(SHARE_LINK_BUDGET + 1))).toBe(true);
  });
});

describe("share link building", () => {
  it("builds the link from the browser's own origin and path", () => {
    expect(
      buildShareLink("abc", {
        origin: "https://gerrcass.github.io",
        pathname: "/process-mapper/maps",
      }),
    ).toBe("https://gerrcass.github.io/process-mapper/maps#shared=abc");
  });

  it("extracts the payload from a share fragment", () => {
    expect(sharePayloadFromHash("#shared=abc")).toBe("abc");
    expect(sharePayloadFromHash("#shared=")).toBe("");
    expect(sharePayloadFromHash("#other")).toBeNull();
    expect(sharePayloadFromHash("")).toBeNull();
  });
});
