import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#F4F1E9",
        padding: "72px 80px",
        color: "#191813",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: "#191813",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F4F1E9",
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          PA
        </div>
        <div style={{ fontSize: 28, letterSpacing: "-0.01em", fontWeight: 600 }}>Process Atlas</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
        <div style={{ fontSize: 74, lineHeight: 1.04, letterSpacing: "-0.035em", fontWeight: 600 }}>
          Frame the process. Map the flow.
        </div>
        <div style={{ fontSize: 28, color: "#45433B", maxWidth: 760, lineHeight: 1.35 }}>
          A local-first SIPOC and process mapping workspace. No account, no backend, no spreadsheet
          graveyard.
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {["Suppliers", "Inputs", "Process", "Outputs", "Customers"].map((lane, index) => (
          <div
            key={lane}
            style={{
              flex: 1,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              border: "1px solid #DFD9CB",
              background: ["#EDF1F4", "#EEF2E8", "#FBEAE1", "#F8F1DE", "#F1ECF4"][index],
              color: ["#3E5B73", "#4B6640", "#A64727", "#80621F", "#6A4D78"][index],
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {lane}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
