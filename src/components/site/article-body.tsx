import { Fragment } from "react";

/**
 * Article text with light formatting that staff can type without HTML:
 *   ## Heading      ### Subheading
 *   - item          1. item
 *   **bold**        [link text](https://…)   bare https:// links
 * Paragraphs are separated by a blank line. Everything is rendered as React elements (never raw HTML).
 */
export function ArticleBody({ text }: { text: string }) {
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i} className="m-0 mt-4 max-w-[720px] text-navy" style={{ font: "600 22px/1.3 var(--font-serif)" }}>{inline(b.slice(4))}</h3>;
        if (b.startsWith("## ")) return <h2 key={i} className="m-0 mt-6 max-w-[720px] text-navy" style={{ font: "500 28px/1.2 var(--font-serif)" }}>{inline(b.slice(3))}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-•]\s+/.test(l)))
          return (
            <ul key={i} className="m-0 flex max-w-[720px] list-none flex-col gap-2 p-0">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3.5" style={{ font: "400 18px/1.7 var(--font-sans)" }}>
                  <span aria-hidden="true" className="diamond" style={{ marginTop: 12 }} />
                  <span>{inline(l.replace(/^[-•]\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\d+[.)]\s+/.test(l)))
          return (
            <ol key={i} className="m-0 flex max-w-[720px] flex-col gap-2 pl-6" style={{ font: "400 18px/1.7 var(--font-sans)" }}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\d+[.)]\s+/, ""))}</li>
              ))}
            </ol>
          );
        return (
          <p key={i} className="m-0 max-w-[720px]" style={{ font: "400 18px/1.78 var(--font-sans)", textWrap: "pretty" }}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|mailto:[^\s)]+)\)|(https?:\/\/[^\s<]+[^\s<.,;:)])/g;

function inline(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(TOKEN)) {
    if (m.index! > last) out.push(s.slice(last, m.index));
    if (m[1]) out.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[2]) out.push(<a key={m.index} href={m[3]} {...(m[3].startsWith("http") ? { rel: "noopener" } : {})}>{m[2]}</a>);
    else if (m[4]) out.push(<a key={m.index} href={m[4]} rel="noopener">{m[4]}</a>);
    last = m.index! + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/** Plain text (for summaries and feeds). */
export function plainText(s: string) {
  return s.replace(/^#{2,3}\s+/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
