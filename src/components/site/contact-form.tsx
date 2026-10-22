"use client";

import { useFormAction } from "@/components/ui/use-form-action";
import { submitContact } from "@/server/actions/public";

export function ContactForm({ routes, initialRoute }: { routes: string[]; initialRoute: string }) {
  const [state, onSubmit, pending] = useFormAction(submitContact);
  if (state?.ok) {
    return (
      <div role="status" className="box box-top flex flex-col gap-3.5" style={{ padding: "clamp(32px,5vw,48px)" }}>
        <h2 className="m-0 text-navy" style={{ font: "500 30px var(--font-serif)" }}>
          Message received
        </h2>
        <p className="body-lg">Thank you for contacting ACCPHE. The Secretariat will respond through the contact details provided.</p>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
      {state && !state.ok && (
        <div role="alert" className="alert-error col-span-full">
          {state.error}
        </div>
      )}
      <label className="field col-span-full">
        <span>Nature of inquiry *</span>
        <select name="route" required defaultValue={initialRoute} className="select">
          {routes.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Full name *</span>
        <input name="name" required maxLength={150} autoComplete="name" className="input" />
      </label>
      <label className="field">
        <span>Organization</span>
        <input name="org" maxLength={200} autoComplete="organization" className="input" />
      </label>
      <label className="field col-span-full">
        <span>Email *</span>
        <input name="email" type="email" required autoComplete="email" className="input" />
      </label>
      <label className="field col-span-full">
        <span>Message *</span>
        <textarea name="body" required rows={7} maxLength={8000} className="textarea" />
      </label>
      <div aria-hidden="true" className="absolute left-[-10000px] h-px w-px overflow-hidden">
        <label>
          Company website
          <input name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="col-span-full flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-primary" style={{ padding: "16px 28px" }}>
          {pending ? "Sending…" : "Send Message"}
        </button>
        <span className="text-muted" style={{ font: "400 13px var(--font-sans)" }}>
          Complaints should be submitted in writing with supporting information.
        </span>
      </div>
    </form>
  );
}
