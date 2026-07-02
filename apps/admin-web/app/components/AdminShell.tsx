import Link from "next/link";
import { AppShell } from "@ielts-pro/ui";
import { adminLogout } from "../actions/auth";
import { AdminNav } from "./AdminNav";

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <AppShell sidebar={<Sidebar email={email} />}>
      <div className="admin-topbar">
        <div>
          <span className="admin-status-dot" aria-hidden="true" />
          <span>Teacher workspace</span>
        </div>
        <div className="admin-topbar-actions">
          <Link href="/students">Student access</Link>
          <Link href="/full-tests/new">New test</Link>
        </div>
      </div>
      <div className="admin-content">
        {children}
      </div>
    </AppShell>
  );
}

function Sidebar({ email }: { email: string }) {
  return (
    <>
      <div>
        <div className="sidebar-brand">IELTS <span>Pro</span></div>
        <p className="sidebar-kicker">Teacher command center</p>
      </div>
      <AdminNav />
      <div className="sidebar-user">
        <p>{email}</p>
        <form action={adminLogout}><button className="btn btn-ghost" aria-label="Logout from admin panel">Logout</button></form>
      </div>
    </>
  );
}
