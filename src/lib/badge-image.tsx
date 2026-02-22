import { ImageResponse } from "@vercel/og";
import { getAIPercentageColor } from "./badge-colors";

export function generateBadgeImage(aiPercentage: number): ImageResponse {
  const color = getAIPercentageColor(aiPercentage);

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
        {/* Left section: Provenance */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            height: "100%",
            backgroundColor: "#374151",
            color: "#f3f4f6",
          }}
        >
          Provenance
        </div>
        {/* Right section: AI% */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            height: "100%",
            backgroundColor: color.hex,
            color: "#ffffff",
          }}
        >
          {aiPercentage}% AI
        </div>
      </div>
    ),
    { width: 160, height: 28 }
  );
}
