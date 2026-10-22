import Link from "next/link";
import { Lockup, Ornament } from "@/components/brand/mark";

/** Sign-in, account request and password screens. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <div className="dark relative flex flex-[1_1_420px] flex-col justify-between gap-12 overflow-hidden" style={{ padding: "clamp(40px,6vw,72px)" }}>
        <Ornament size={620} className="hidden md:block" style={{ right: -240, bottom: -240 }} />
        <Link href="/" aria-label="ACCPHE — public website" className="relative self-start no-underline">
          <Lockup tone="light" size={46} descriptor="Staff & Institution Portal" />
        </Link>
        <div className="relative flex max-w-[480px] flex-col gap-5">
          <p className="m-0" style={{ font: "500 clamp(32px,3.6vw,46px)/1.1 var(--font-serif)", letterSpacing: "-.01em" }}>
            Administering quality assurance with transparency.
          </p>
          <p className="m-0 text-fog" style={{ font: "400 16px/1.65 var(--font-sans)" }}>
            Manage institutional applications, the official directory, published articles, complaints and appeals, and website content — or follow your institution’s evaluation pathway.
          </p>
        </div>
        <p className="relative m-0 max-w-[460px] text-haze" style={{ font: "400 13px/1.6 var(--font-sans)" }}>
          Access is limited to verified Council personnel, reviewers, Commission members and institution representatives. Activity is recorded in the Council’s audit log.
        </p>
      </div>
      <main className="flex flex-[1_1_460px] items-center justify-center" style={{ padding: "clamp(32px,6vw,72px)" }}>
        {children}
      </main>
    </div>
  );
}
