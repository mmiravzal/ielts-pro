"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/practice", label: "Practice Tests" },
  { href: "/progress", label: "Results" },
  { href: "/profile", label: "Profile" }
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
