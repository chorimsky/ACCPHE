import { redirect } from "next/navigation";
import { homeFor } from "@/lib/domain";
import { currentUser } from "@/server/auth";

export default async function PortalIndex() {
  const user = await currentUser();
  redirect(user ? homeFor(user.role) : "/portal/sign-in");
}
