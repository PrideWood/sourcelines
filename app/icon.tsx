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
          background: "#f8f5ef",
          color: "#3b2f23",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -8,
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
