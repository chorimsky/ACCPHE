import { RegisterForm } from "@/components/portal/auth-forms";

export const metadata = { title: "Request an account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return <RegisterForm initialRef={(sp.ref ?? "").slice(0, 40)} />;
}
