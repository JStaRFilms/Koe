import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e2dfd2",
          color: "#d9381e",
          border: "18px solid #050505",
          fontSize: 168,
          fontWeight: 900,
          fontFamily: "monospace",
        }}
      >
        KOE
      </div>
    ),
    size
  );
}
