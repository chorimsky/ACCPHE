import { ImageResponse } from "next/og";
import { Mark } from "@/components/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon: the full seal, light on navy (iOS rounds the corners). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#142B45", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mark size={128} tone="light" />
      </div>
    ),
    size,
  );
}
