"use client";

import { useEffect, useState } from "react";


/** "On this page" navigation with scroll-spy (About, Accreditation). */
export function Toc({ items, children }: { items: [string, string][]; children?: React.ReactNode }) {
  const [active, setActive] = useState(items[0]?.[0]);
  useEffect(() => {
    const onScroll = () => {
      let a = items[0][0];
      for (const [id] of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 170) a = id;
      }
      setActive(a);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);
  return (
    <aside className="sticky top-28 hidden flex-[0_0_240px] flex-col min-[980px]:flex">
      <nav aria-label="On this page" className="flex flex-col">
        <span className="caps pb-3.5">On this page</span>
        {items.map(([id, label]) => {
          const on = active === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              aria-current={on ? "true" : undefined}
              className="py-2.5 pl-4 no-underline transition-colors"
              style={{
                borderLeft: `2px solid ${on ? "var(--color-navy)" : "var(--color-line)"}`,
                font: `${on ? 600 : 500} 14.5px/1.35 var(--font-sans)`,
                color: on ? "var(--color-navy)" : "var(--color-muted)",
              }}
            >
              {label}
            </a>
          );
        })}
      </nav>
      {children}
    </aside>
  );
}

/** Accreditation FAQ: one question open at a time; every answer is in the HTML for search engines. */
export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  useEffect(() => {
    const m = /^#faq-(\d+)$/.exec(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deep link from site search
    if (m) setOpen(Number(m[1]) - 1);
  }, []);
  return (
    <div className="border-b border-line">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} id={`faq-${i + 1}`} className="border-t border-line">
            <h3 className="m-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i + 1}`}
                className="flex w-full items-center justify-between gap-6 border-0 bg-transparent py-6 text-left text-navy transition-colors hover:text-slate"
                style={{ font: "600 clamp(17px,1.6vw,19px)/1.4 var(--font-serif)" }}
              >
                <span>{f.q}</span>
                <span aria-hidden="true" className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line-strong text-navy" style={{ font: "400 18px/1 var(--font-sans)" }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <p id={`faq-a-${i + 1}`} hidden={!isOpen} className="m-0 pb-[26px] pr-16" style={{ font: "400 16px/1.72 var(--font-sans)", textWrap: "pretty" }}>
              {f.a}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/** Browser for the twelve standards. All standards are rendered; the selected one is shown. */
export function StandardsBrowser({ standards: STANDARDS, adjective }: { standards: { t: string; s: string; items: string[]; note: string }[]; adjective: string }) {
  const [si, setSi] = useState(0);
  const count = STANDARDS.length;
  useEffect(() => {
    const read = () => {
      const m = /^#standard-(\d+)$/.exec(window.location.hash);
      if (m && +m[1] >= 1 && +m[1] <= count) setSi(+m[1] - 1);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [count]);
  const pick = (i: number) => {
    setSi(i);
    history.replaceState(null, "", `#standard-${i + 1}`);
  };
  return (
    <div className="flex flex-wrap items-start gap-8">
      {/* compact picker on narrow screens */}
      <div className="flex w-full min-w-0 flex-[1_1_100%] flex-col gap-2.5 min-[980px]:hidden">
        <span className="caps">Select a standard</span>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STANDARDS.map((s, i) => (
            <button
              key={s.t}
              type="button"
              onClick={() => pick(i)}
              aria-current={i === si ? "true" : undefined}
              aria-label={`Standard ${i + 1}: ${s.t}`}
              className="grid h-11 w-11 flex-none place-items-center"
              style={
                i === si
                  ? { background: "var(--color-navy)", color: "var(--color-mist)", font: "600 15px var(--font-serif)", border: 0 }
                  : { border: "1px solid var(--color-line-strong)", color: "var(--color-navy)", font: "500 15px var(--font-serif)", background: "#fff" }
              }
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <ol className="sticky top-[150px] m-0 hidden flex-[1_1_300px] list-none border border-line p-0 min-[980px]:block">
        {STANDARDS.map((s, i) => {
          const on = i === si;
          return (
            <li key={s.t} className="-mt-px border-t border-line">
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={on ? "true" : undefined}
                className="grid w-full grid-cols-[30px_1fr] gap-2.5 border-0 px-4 py-[13px] text-left transition-colors"
                style={on ? { background: "var(--color-navy)", color: "var(--color-mist)", font: "600 14px/1.4 var(--font-sans)" } : { background: "transparent", color: "var(--color-navy)", font: "500 14px/1.4 var(--font-sans)" }}
              >
                <span style={{ font: "500 14px/1.4 var(--font-serif)", color: on ? "var(--color-haze)" : "var(--color-steel)" }}>{i + 1}</span>
                <span>{s.t}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="min-w-0 flex-[999_1_520px]">
        {STANDARDS.map((st, i) => (
          <article key={st.t} id={`standard-${i + 1}`} hidden={i !== si} aria-labelledby={`standard-${i + 1}-title`} className="flex flex-col border border-line">
            <div className="flex flex-col gap-[22px] border-b border-line bg-mist" style={{ padding: "clamp(28px,4vw,48px)" }}>
              <div className="flex items-center justify-between gap-3">
                <span className="caps">
                  {adjective} standard {i + 1} of {STANDARDS.length}
                </span>
                <span aria-hidden="true" style={{ font: "500 64px/0.8 var(--font-serif)", color: "var(--color-line)" }}>
                  {i + 1}
                </span>
              </div>
              <h3 id={`standard-${i + 1}-title`} className="m-0 text-navy" style={{ font: "500 clamp(26px,2.8vw,36px)/1.15 var(--font-serif)", textWrap: "balance" }}>
                {st.t}
              </h3>
              <p className="m-0" style={{ font: "400 clamp(17px,1.6vw,20px)/1.55 var(--font-serif)", textWrap: "pretty" }}>
                {st.s}
              </p>
            </div>
            <div className="flex flex-col gap-1.5" style={{ padding: "clamp(28px,4vw,48px)" }}>
              <h4 className="m-0 pb-2.5 text-navy" style={{ font: "600 12px/1.4 var(--font-sans)", letterSpacing: ".12em", textTransform: "uppercase" }}>
                Evaluation considerations
              </h4>
              <ul className="m-0 list-none p-0">
                {st.items.map((it) => (
                  <li key={it} className="flex gap-3.5 border-t border-line py-[11px]" style={{ font: "400 15.5px/1.55 var(--font-sans)" }}>
                    <span aria-hidden="true" className="diamond" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              {st.note && (
                <p className="m-0 mt-[18px] border border-line px-5 py-[18px] text-navy" style={{ font: "500 15px/1.6 var(--font-sans)" }}>
                  {st.note}
                </p>
              )}
            </div>
            <div className="mt-auto flex justify-between gap-3 border-t border-line py-[18px]" style={{ paddingInline: "clamp(28px,4vw,48px)" }}>
              <button type="button" onClick={() => pick((i + 11) % 12)} className="border-0 bg-transparent text-navy hover:text-slate" style={{ font: "600 14px var(--font-sans)" }}>
                ← Previous
              </button>
              <button type="button" onClick={() => pick((i + 1) % 12)} className="border-0 bg-transparent text-navy hover:text-slate" style={{ font: "600 14px var(--font-sans)" }}>
                Next standard →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
