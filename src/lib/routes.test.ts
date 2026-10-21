import { describe, expect, it } from "vitest";
import { mapHref } from "./routes";

describe("mapHref", () => {
  it("keeps the map id in the static editor route", () => {
    expect(mapHref("map-support-escalation")).toBe("/maps?map=map-support-escalation");
  });

  it("adds the flow view and encoded node focus", () => {
    expect(mapHref("map-1", { view: "flow", node: "node a&b" })).toBe(
      "/maps?map=map-1&view=flow&node=node+a%26b",
    );
  });
});
