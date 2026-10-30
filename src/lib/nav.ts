/** Main website navigation (shared by the header, the mobile menu and the 404 page). */
export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/accreditation", label: "Accreditation" },
  { href: "/fellows", label: "College of Fellows & Distinctions" },
  { href: "/standards", label: "Standards & Policies" },
  { href: "/governance", label: "Governance" },
  { href: "/directory", label: "Member Institutions" },
  { href: "/news", label: "News & Insights" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
