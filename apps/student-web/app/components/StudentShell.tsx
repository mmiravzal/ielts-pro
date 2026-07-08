import Link from "next/link";
import type { ReactNode } from "react";
import { studentLogout } from "../actions/auth";
import { StudentNav } from "./StudentNav";

type StudentShellProps = {
  name: string;
  groupName?: string | null;
  sectionLabel?: string;
  sectionDescription?: string;
  variant?: "app" | "exam";
  children: ReactNode;
};

export function StudentShell({
  name,
  groupName,
  sectionLabel = "Student workspace",
  sectionDescription = "Practice, results, and teacher feedback",
  variant = "app",
  children
}: StudentShellProps) {
  if (variant === "exam") {
    return (
      <div className="student-exam-shell">
        <header className="student-exam-topbar">
          <Link className="student-app-brand" href="/dashboard">
            <span aria-hidden="true">IP</span>
            <strong>IELTS Pro</strong>
          </Link>
          <div className="student-exam-meta">
            <span>{name}</span>
            <form action={studentLogout}>
              <button className="student-outline-button" aria-label="Logout from student portal">Log out</button>
            </form>
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="student-app-shell">
      <aside className="student-app-sidebar">
        <Link className="student-app-brand" href="/dashboard">
          <span aria-hidden="true">IP</span>
          <strong>IELTS Pro</strong>
        </Link>
        <div className="student-app-search" aria-label="Student workspace status">
          <span aria-hidden="true">ON</span>
          <p>{groupName || "Private workspace"}</p>
        </div>
        <nav aria-label="Student navigation">
          <StudentNav />
        </nav>
        <div className="student-sidebar-footer">
          <span>{groupName || "Teacher group pending"}</span>
          <form action={studentLogout}>
            <button className="student-outline-button" aria-label="Logout from student portal">Log out</button>
          </form>
        </div>
      </aside>
      <div className="student-app-main">
        <header className="student-page-topbar">
          <div className="student-page-kicker">
            <span aria-hidden="true" />
            <div>
              <strong>{sectionLabel}</strong>
              <p>{sectionDescription}</p>
            </div>
          </div>
          <form className="student-topbar-search" action="/practice">
            <label>
              <span className="sr-only">Search lessons and tests</span>
              <input name="q" type="search" placeholder="Search lessons, tests, feedback..." />
            </label>
          </form>
          <div className="student-page-actions">
            <Link className="student-icon-button" href="/results" aria-label="Results">R</Link>
            <Link className="student-icon-button" href="/practice" aria-label="Practice tests">P</Link>
            <Link className="student-outline-button" href="/lessons">Lessons</Link>
            <Link className="student-user-pill" href="/profile">{name}</Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
