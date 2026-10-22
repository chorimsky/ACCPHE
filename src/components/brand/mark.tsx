/**
 * ACCPHE brand marks. One geometry (a 48-unit square) is used everywhere — header, footer, portal, favicon, social
 * image and email — so the seal is identical at every size.
 *
 * Seal: an outer ring, a disc, and a Latin cross whose crossbar sits at one third of its height.
 */
export const SEAL = {
  view: 48,
  ring: { r: 23.25, stroke: 1.5 },
  disc: { r: 19 },
  /** vertical bar, then crossbar */
  stem: { x: 22.2, y: 10.5, w: 3.6, h: 27 },
  bar: { x: 15.5, y: 17.2, w: 17, h: 3.6 },
} as const;

export const SEAL_TONES = {
  /** navy seal on a light background */
  navy: { ring: "#142B45", disc: "#142B45", cross: "#F7F9FB" },
  /** light seal on a navy background */
  light: { ring: "#8FA6BC", disc: "#F7F9FB", cross: "#142B45" },
} as const;

export function Mark({ size = 46, tone = "navy", ring = true, title }: { size?: number; tone?: keyof typeof SEAL_TONES; ring?: boolean; title?: string }) {
  const c = SEAL_TONES[tone];
  const h = SEAL.view / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SEAL.view} ${SEAL.view}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      style={{ flex: "none", display: "block" }}
    >
      {ring && <circle cx={h} cy={h} r={SEAL.ring.r} fill="none" stroke={c.ring} strokeWidth={SEAL.ring.stroke} />}
      <circle cx={h} cy={h} r={ring ? SEAL.disc.r : h} fill={c.disc} />
      <rect x={SEAL.stem.x} y={SEAL.stem.y} width={SEAL.stem.w} height={SEAL.stem.h} fill={c.cross} />
      <rect x={SEAL.bar.x} y={SEAL.bar.y} width={SEAL.bar.w} height={SEAL.bar.h} fill={c.cross} />
    </svg>
  );
}

/** Seal + wordmark (+ optional descriptor) — the ACCPHE lockup. */
export function Lockup({
  tone = "navy",
  size = 46,
  descriptor,
  descriptorClass = "",
}: {
  tone?: keyof typeof SEAL_TONES;
  size?: number;
  descriptor?: React.ReactNode;
  descriptorClass?: string;
}) {
  const ink = tone === "navy" ? "var(--color-navy)" : "var(--color-mist)";
  const sub = tone === "navy" ? "var(--color-muted)" : "var(--color-haze)";
  return (
    <span className="flex items-center" style={{ gap: Math.round(size * 0.28) }}>
      <Mark size={size} tone={tone} />
      <span className="flex flex-col" style={{ gap: 4 }}>
        <span style={{ font: `600 ${Math.round(size * 0.44)}px/1 var(--font-serif)`, color: ink, letterSpacing: ".08em" }}>ACCPHE</span>
        {descriptor && (
          <span className={descriptorClass} style={{ font: `500 ${size >= 46 ? 10.5 : 11}px/1.3 var(--font-sans)`, color: sub, letterSpacing: ".02em" }}>
            {descriptor}
          </span>
        )}
      </span>
    </span>
  );
}

const CROSS = "polygon(44.3% 0,55.7% 0,55.7% 26%,100% 26%,100% 33.6%,55.7% 33.6%,55.7% 100%,44.3% 100%,44.3% 33.6%,0 33.6%,0 26%,44.3% 26%)";

/**
 * Concentric rings with a faint cross, placed behind dark sections. Decorative: it never receives pointer events and
 * is clipped by its section. `cross={false}` keeps only the rings (behind text-heavy panels).
 */
export function Ornament({ size = 620, cross = true, className = "", style }: { size?: number; cross?: boolean; className?: string; style?: React.CSSProperties }) {
  const ring = (inset: number, alpha: number) => <span style={{ position: "absolute", inset, borderRadius: "50%", border: `1px solid rgba(247,249,251,${alpha})` }} />;
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`} style={{ position: "absolute", width: size, height: size, ...style }}>
      {ring(0, 0.07)}
      {ring(size * 0.11, 0.07)}
      {ring(size * 0.24, 0.056)}
      {cross && (
        <span
          style={{ position: "absolute", left: "50%", top: "50%", width: size * 0.4, height: size * 0.6, transform: "translate(-50%,-50%)", background: "rgba(247,249,251,0.05)", clipPath: CROSS }}
        />
      )}
    </div>
  );
}
