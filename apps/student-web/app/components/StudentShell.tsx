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

export function StudentShell({ name, groupName, sectionLabel = "Student workspace", sectionDescription = "Practice, results, and teacher feedback", variant = "app", children }: StudentShellProps) {
  if (variant === "exam") {
    return (
      <div className="student-exam-shell">
        <header className="student-exam-topbar">
          <Link className="student-app-brand" href="/dashboard">
            IELTS <span>Pro</span>
          </Link>
          <div className="student-exam-meta">
            <span>{name}</span>
            <form action={studentLogout}>
              <button className="student-outline-button" aria-label="Logout from student portal">Logout</button>
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
          IELTS <span>Pro</span>
        </Link>
        <div className="student-app-search" aria-label="Student search">
          <span aria-hidden="true">/</span>
          <p>Search lessons</p>
        </div>
        <nav aria-label="Student navigation">
          <StudentNav />
        </nav>
        <div className="student-sidebar-footer">
          <span>{groupName || "Teacher group pending"}</span>
          <form action={studentLogout}>
            <button aria-label="Logout from student portal">Logout</button>
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
          <div className="student-page-actions">
            <Link className="student-outline-button" href="/lessons">Lessons</Link>
            <Link className="student-outline-button" href="/practice">Practice</Link>
            <Link className="student-user-pill" href="/profile">{name}</Link>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
