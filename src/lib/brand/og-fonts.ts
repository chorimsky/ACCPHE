import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Brand fonts for generated images (ImageResponse needs raw font data; .woff is supported). */
export async function ogFonts() {
  const dir = (pkg: string) => path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", "@fontsource", pkg, "files");
  const [serif500, serif600, sans400, sans600] = await Promise.all([
    readFile(path.join(dir("source-serif-4"), "source-serif-4-latin-500-normal.woff")),
    readFile(path.join(dir("source-serif-4"), "source-serif-4-latin-600-normal.woff")),
    readFile(path.join(dir("public-sans"), "public-sans-latin-400-normal.woff")),
    readFile(path.join(dir("public-sans"), "public-sans-latin-600-normal.woff")),
  ]);
  return [
    { name: "Source Serif 4", data: serif500, weight: 500 as const, style: "normal" as const },
    { name: "Source Serif 4", data: serif600, weight: 600 as const, style: "normal" as const },
    { name: "Public Sans", data: sans400, weight: 400 as const, style: "normal" as const },
    { name: "Public Sans", data: sans600, weight: 600 as const, style: "normal" as const },
  ];
}
