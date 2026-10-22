import { notFound } from "next/navigation";

/** Unknown public addresses render the site's 404 page (inside the site layout). */
export default function Missing() {
  notFound();
}
