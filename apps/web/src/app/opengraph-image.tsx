import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ProtoBurn — Claude API Cost & Usage Dashboard";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0a0a0f 0%, #0d1117 40%, #111827 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "300px",
            background:
              "radial-gradient(ellipse at center bottom, rgba(0,172,237,0.15) 0%, rgba(245,158,11,0.08) 40%, transparent 70%)",
          }}
        />

        {/* Fire icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00ACED"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#ffffff",
            marginTop: 24,
            letterSpacing: "-0.02em",
          }}
        >
          ProtoBurn
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#9ca3af",
            marginTop: 12,
          }}
        >
          Claude API Cost & Usage Dashboard
        </div>

        {/* Tag pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 32,
          }}
        >
          {["Token Tracking", "Prompt Caching", "Cost Analytics"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "8px 20px",
                  borderRadius: 9999,
                  border: "1px solid rgba(0,172,237,0.3)",
                  background: "rgba(0,172,237,0.08)",
                  color: "#00ACED",
                  fontSize: 18,
                }}
              >
                {tag}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
