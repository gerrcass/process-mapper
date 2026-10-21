import type { SipocLane } from "@/domain/types";

export interface LaneStyle {
  tint: string;
  line: string;
  text: string;
  accentBar: string;
  chip: string;
}

export const LANE_STYLES: Record<SipocLane, LaneStyle> = {
  suppliers: {
    tint: "bg-suppliers-tint",
    line: "border-suppliers-line",
    text: "text-suppliers-text",
    accentBar: "bg-suppliers-text",
    chip: "border-suppliers-line bg-suppliers-tint text-suppliers-text",
  },
  inputs: {
    tint: "bg-inputs-tint",
    line: "border-inputs-line",
    text: "text-inputs-text",
    accentBar: "bg-inputs-text",
    chip: "border-inputs-line bg-inputs-tint text-inputs-text",
  },
  process: {
    tint: "bg-process-tint",
    line: "border-process-line",
    text: "text-process-text",
    accentBar: "bg-process-text",
    chip: "border-process-line bg-process-tint text-process-text",
  },
  outputs: {
    tint: "bg-outputs-tint",
    line: "border-outputs-line",
    text: "text-outputs-text",
    accentBar: "bg-outputs-text",
    chip: "border-outputs-line bg-outputs-tint text-outputs-text",
  },
  customers: {
    tint: "bg-customers-tint",
    line: "border-customers-line",
    text: "text-customers-text",
    accentBar: "bg-customers-text",
    chip: "border-customers-line bg-customers-tint text-customers-text",
  },
};
