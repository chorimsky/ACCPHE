import { ImageResponse } from "next/og";
import { Mark } from "@/components/brand/mark";
import { ogFonts } from "@/lib/brand/og-fonts";

export const alt = "ACCPHE — Accreditation & Compliance Council for Christian and Private Higher Education";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ring = (s: number, x: number, y: number, a: number) => (
  <div style={{ position: "absolute", left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: s / 2, border: `1.5px solid rgba(247,249,251,${a})`, display: "flex" }} />
);

/** Default share image, in the site's type and colours. */
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#142B45", color: "#F7F9FB", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", position: "relative", fontFamily: "Public Sans" }}>
        {ring(760, 1060, 315, 0.07)}
        {ring(590, 1060, 315, 0.07)}
        {ring(400, 1060, 315, 0.055)}
        <div style={{ position: "absolute", left: 1060 - 9, top: 315 - 190, width: 18, height: 340, background: "rgba(247,249,251,.05)", display: "flex" }} />
        <div style={{ position: "absolute", left: 1060 - 75, top: 315 - 125, width: 150, height: 18, background: "rgba(247,249,251,.05)", display: "flex" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Mark size={76} tone="light" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: "Source Serif 4", fontWeight: 600, fontSize: 38, letterSpacing: 4 }}>ACCPHE</div>
            <div style={{ fontSize: 17, color: "#A9BBCC" }}>Accreditation &amp; Compliance Council for Christian and Private Higher Education</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 860 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 17, letterSpacing: 3, color: "#A9BBCC", fontWeight: 600 }}>
            <div style={{ width: 34, height: 1.5, background: "#A9BBCC", display: "flex" }} />
            ACCREDITATION · QUALITY ASSURANCE · INSTITUTIONAL INTEGRITY
          </div>
          <div style={{ fontFamily: "Source Serif 4", fontWeight: 500, fontSize: 66, lineHeight: 1.06, letterSpacing: -0.5 }}>Advancing Excellence in Christian and Private Higher Education</div>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #33506D", paddingTop: 22, gap: 44, fontSize: 18, color: "#C9D5E0" }}>
          <span>12 accreditation standards</span>
          <span>8-stage evaluation pathway</span>
          <span>Official institutional directory</span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
