"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the ROOT layout itself (where the
 * normal error.tsx can't render). It must provide its own <html>/<body>, and
 * can't rely on the app's CSS, so styles are inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fefae0",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#283618",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a9c84", margin: 0 }}>
            Result Prime
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 400, margin: "14px 0 8px", color: "#283618" }}>Something went wrong</h1>
          <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: 15, lineHeight: 1.6, color: "#4a4f3a", margin: "0 auto 22px" }}>
            A critical error occurred while loading the app. Please reload the page — your data is safe.
          </p>
          <button
            onClick={reset}
            style={{ fontFamily: "Helvetica, Arial, sans-serif", background: "#606c38", color: "#fff", border: 0, borderRadius: 8, padding: "11px 22px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
