"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** "Good morning, Executive Secretariat." in the viewer's own time zone. */
export function Greeting({ who }: { who: string }) {
  const hour = useSyncExternalStore(subscribe, () => new Date().getHours(), () => -1);
  const today = useSyncExternalStore(
    subscribe,
    () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    () => "",
  );
  const g = hour < 0 ? "Welcome" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="m-0 text-navy" style={{ font: "500 24px/1.25 var(--font-serif)" }}>
        {g}, {who}.
      </h2>
      <p className="m-0 min-h-[19px] text-muted" style={{ font: "400 13.5px/1.4 var(--font-sans)" }}>
        {today}
      </p>
    </div>
  );
}
