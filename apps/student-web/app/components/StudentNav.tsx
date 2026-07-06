"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", mark: "D", aliases: ["/dashboard"] },
  { href: "/lessons", label: "Lessons", mark: "L", aliases: ["/lessons", "/lesson"] },
  { href: "/practice", label: "Practice", mark: "P", aliases: ["/practice", "/tests"] },
  { href: "/mock", label: "Mock", mark: "M", aliases: ["/mock"] },
  { href: "/speaking", label: "Speaking", mark: "S", aliases: ["/speaking"] },
  { href: "/vocabulary", label: "Vocabulary", mark: "V", aliases: ["/vocabulary"] },
  { href: "/analytics", label: "Analytics", mark: "A", aliases: ["/analytics"] },
  { href: "/results", label: "Results", mark: "R", aliases: ["/results", "/progress"] },
  { href: "/profile", label: "Profile", mark: "I", aliases: ["/profile"] }
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <div className="student-app-nav-list">
      {items.map((item) => {
        const active = item.aliases.some((alias) => pathname === alias || pathname.startsWith(`${alias}/`));
        return (
          <Link href={item.href} className={`student-app-nav-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined} key={item.href}>
            <span aria-hidden="true">{item.mark}</span>
            <strong>{item.label}</strong>
          </Link>
        );
      })}
    </div>
  );
}
