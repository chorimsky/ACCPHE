import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ACCPHE — Accreditation & Compliance Council for Christian and Private Higher Education",
    short_name: "ACCPHE",
    start_url: "/",
    display: "browser",
    background_color: "#FFFFFF",
    theme_color: "#142B45",
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
