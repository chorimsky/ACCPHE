import { NextResponse, type NextRequest } from "next/server";
import { INDEXABLE } from "@/lib/site";

/**
 * Runs before every request.
 * 1. Portal pages need a session cookie, otherwise go to sign-in. Real authorization happens in requireModule() /
 *    authorize() on every page and server action; the path is forwarded so guards can build ?next=.
 * 2. The portal, API and auth pages are never indexed (and nothing is indexed on non-production deployments).
 */
const PUBLIC_PORTAL = ["/portal/sign-in", "/portal/register", "/portal/forgot", "/portal/reset", "/portal/verify", "/portal/dev-mail"];
const under = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(`${p}/`));

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const headers = new Headers(req.headers);
  headers.set("x-accphe-path", pathname + search);

  if (under(pathname, ["/portal"]) && !under(pathname, PUBLIC_PORTAL) && !req.cookies.has("accphe_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/portal/sign-in";
    url.search = pathname === "/portal" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next({ request: { headers } });
  if (!INDEXABLE || under(pathname, ["/portal", "/api"])) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:png|jpg|svg|webp|ico|woff2?)$).*)"],
};
