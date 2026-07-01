import Link from "next/link";
import { Badge, Card, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAdminDashboardStats } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";

export default async function AdminDashboardPage() {
  const admin = await requireAdminSession();
  const stats = await getAdminDashboardStats(createServerSupabaseClient());
  const published = stats.lessons.filter((lesson) => lesson.published).length;

  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h1>Teacher control room</h1>
          <p className="muted">Track the class, publish practice, and keep writing feedback moving.</p>
        </div>
        <Link className="btn btn-primary" href="/lessons">Create Content</Link>
      </div>

      <section className="stats-grid">
        <StatCard label="Students" value={stats.students.length} note={`${stats.groups.length} groups`} />
        <StatCard label="Lessons" value={stats.lessons.length} note={`${published} published`} />
        <StatCard label="Tasks" value={stats.tasks.length} note="reading, listening, writing" />
        <StatCard label="Pending Writing" value={stats.pendingWriting.length} note="needs review" />
      </section>

      <div className="panel-grid">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Live activity</p>
              <h2>Recent submissions</h2>
            </div>
            <Link href="/submissions">Open queue</Link>
          </div>
          <Table>
            <thead><tr><th>Student</th><th>Task</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {stats.submissions.slice(0, 8).map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.students?.name || "Student"}</td>
                  <td>{submission.tasks?.title || "Task"}</td>
                  <td>{submission.score != null ? `${submission.score}/${submission.total ?? "band"}` : <Badge tone="warning">Pending</Badge>}</td>
                  <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card className="panel">
          <p className="eyebrow">Today</p>
          <h2>Operating notes</h2>
          <div className="checklist">
            <span>Review pending writing before the next lesson.</span>
            <span>Keep draft tests unpublished until questions are checked.</span>
            <span>Use results history to assign focused homework.</span>
          </div>
          <Link href="/submissions" className="btn btn-secondary">Review Writing</Link>
        </Card>
      </div>
    </AdminShell>
  );
}
