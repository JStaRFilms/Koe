import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = "Koe voice dictation for desktop and mobile";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#e2dfd2",
          color: "#050505",
          border: "18px solid #050505",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(5,5,5,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(5,5,5,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 72, zIndex: 1 }}>
          <div style={{ fontSize: 38, letterSpacing: 8, color: "#d9381e", marginBottom: 26 }}>
            {`${SITE_NAME} // VOICE EVERYWHERE`}
          </div>
          <div style={{ fontSize: 104, fontWeight: 900, lineHeight: 0.92, maxWidth: 820 }}>
            DICTATE IN ANY APP.
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.35, maxWidth: 820, marginTop: 34, color: "#333" }}>
            {SITE_DESCRIPTION}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 64,
            bottom: 44,
            fontSize: 220,
            lineHeight: 1,
            color: "#d9381e",
            opacity: 0.9,
          }}
        >
          声
        </div>
      </div>
    ),
    size
  );
}
