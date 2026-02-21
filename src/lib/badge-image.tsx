import { ImageResponse } from "@vercel/og";

export function generateBadgeImage(aiPercentage: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "200px",
          height: "40px",
          backgroundColor: "#1a1a2e",
          color: "#e0e0e0",
          fontFamily: "sans-serif",
          fontSize: "12px",
          padding: "0 12px",
          borderRadius: "6px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "14px" }}>◆</span>
          <span style={{ fontWeight: 700 }}>Provenance</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            fontSize: "10px",
            lineHeight: "1.3",
          }}
        >
          <span>{aiPercentage}% AI-generated</span>
          <span style={{ opacity: 0.7 }}>Verified Process →</span>
        </div>
      </div>
    ),
    {
      width: 200,
      height: 40,
    }
  );
}
