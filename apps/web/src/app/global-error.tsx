"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Roboto, system-ui, sans-serif",
          background: "linear-gradient(135deg, #0a1628 0%, #1a1a2e 50%, #16213e 100%)",
          color: "#e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "90%",
            padding: "2.5rem",
            borderRadius: "1.25rem",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.12)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔥</div>
          <h1
            style={{
              fontFamily: "Montserrat, system-ui, sans-serif",
              fontSize: "1.375rem",
              fontWeight: 700,
              margin: "0 0 0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "rgba(226,232,240,0.6)",
              margin: "0 0 1.5rem",
              lineHeight: 1.5,
            }}
          >
            An unexpected error crashed the app.
            {error.digest && (
              <span style={{ display: "block", marginTop: "0.25rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
                Digest: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              fontFamily: "Montserrat, system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "0.625rem 1.5rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#00ACED",
              color: "#fff",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
