import { ImageResponse } from "@vercel/og";

// Brand colors — neutral regardless of AI percentage ("court reporter, not judge")
const BRAND_LABEL_BG = "#1e2a4a"; // dark indigo
const BRAND_LABEL_TEXT = "#bac8ff"; // light indigo
const BRAND_VALUE_BG = "#3b5bdb"; // provenance-600
const BRAND_VALUE_TEXT = "#ffffff";

export function generateBadgeImage(aiPercentage: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "28px",
          borderRadius: "4px",
          overflow: "hidden",
          fontSize: "11px",
          fontFamily: "sans-serif",
          fontWeight: 600,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        {/* Left section: Provenance ✓ */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            height: "100%",
            backgroundColor: BRAND_LABEL_BG,
            color: BRAND_LABEL_TEXT,
          }}
        >
          Provenance ✓
        </div>
        {/* Right section: AI% */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            height: "100%",
            backgroundColor: BRAND_VALUE_BG,
            color: BRAND_VALUE_TEXT,
          }}
        >
          {aiPercentage}% AI
        </div>
      </div>
    ),
    { width: 170, height: 28 }
  );
}
