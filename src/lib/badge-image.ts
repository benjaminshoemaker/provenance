import { ImageResponse } from "@vercel/og";

export function generateBadgeImage(aiPercentage: number): ImageResponse {
  return new ImageResponse(
    {
      type: "div",
      props: {
        style: {
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
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "4px",
              },
              children: [
                {
                  type: "span",
                  props: {
                    style: { fontSize: "14px" },
                    children: "◆",
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { fontWeight: 700 },
                    children: "Provenance",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: "10px",
                lineHeight: "1.3",
              },
              children: [
                {
                  type: "span",
                  props: {
                    children: `${aiPercentage}% AI-generated`,
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { opacity: 0.7 },
                    children: "Verified Process →",
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 200,
      height: 40,
    }
  );
}
