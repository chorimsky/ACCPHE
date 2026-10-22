import Link from "next/link";
import { ResetForm } from "@/components/portal/auth-forms";
import { findResetToken } from "@/server/auth";

export const metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = await findResetToken(token);
  if (!valid) {
    return (
      <div className="flex w-full max-w-[440px] flex-col gap-4">
        <h1 className="m-0 text-navy" style={{ font: "500 30px/1.15 var(--font-serif)" }}>
          This link has expired
        </h1>
        <p className="m-0 text-muted" style={{ font: "400 14.5px/1.55 var(--font-sans)" }}>
          Password links are valid for 60 minutes and can be used once. Request a new link to continue.
        </p>
        <Link href="/portal/forgot" className="p-btn self-start">
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetForm token={token} />;
}
