import { ImageResponse } from "next/og";
import { Mark } from "@/components/brand/mark";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon: the seal without its outer ring (reads better at 16–32 px). */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex" }}>
        <Mark size={64} ring={false} />
      </div>
    ),
    size,
  );
}
