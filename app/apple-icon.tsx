import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "#f8f5ef",
          color: "#3b2f23",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -3,
          fontFamily: "serif",
        }}
      >
        SL
      </div>
    ),
    {
      ...size,
    },
  );
}
