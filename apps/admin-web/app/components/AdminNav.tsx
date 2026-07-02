"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "D" },
  { href: "/students", label: "Students", icon: "S" },
  { href: "/lessons", label: "Content Studio", icon: "C" },
  { href: "/full-tests", label: "Full Tests", icon: "F" },
  { href: "/full-tests/new", label: "Test Builder", icon: "B" },
  { href: "/submissions", label: "Writing Review", icon: "W" }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      {navItems.map((item) => {
        const active = item.href === "/full-tests"
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} key={item.href}>
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
