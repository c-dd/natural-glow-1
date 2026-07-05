"use client";

// The full Natural Glow experience (marketing pages, auth, customer & admin
// dashboards) is delivered as a single self-contained document at
// /public/natural-glow.html. We mount it full-viewport so it owns the page.
export default function Page() {
  return (
    <iframe
      src="/natural-glow.html"
      title="Natural Glow"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        display: "block",
      }}
    />
  );
}
