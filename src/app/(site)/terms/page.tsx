import { PolicyPage } from "@/components/site/policy-page";
import { seoFor } from "@/lib/seo";

export const metadata = seoFor("terms", "/terms");

export default function Page() {
  return <PolicyPage which="terms" />;
}
