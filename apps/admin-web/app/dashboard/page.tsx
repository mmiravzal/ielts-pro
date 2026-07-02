import Link from "next/link";
import { Badge, Card, EmptyState, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAdminDashboardStats } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";

export default async function AdminDashboardPage() {
  const admin = await requireAdminSession();
  const stats = await getAdminDashboardStats(createServerSupabaseClient());
  const published = stats.lessons.filter((lesson) => lesson.published).length;
  const draftLessons = stats.lessons.filter((lesson) => !lesson.published).length;
  const activeStudents = stats.students.filter((student) => student.is_active !== false && student.access_status !== "closed").length;
  const draftContent = stats.tasks.filter((task) => !task.lessons?.published || task.content_status === "draft").length;

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Operate the LMS from one clear overview.</h1>
          <p className="muted">Students, groups, content, lessons, submissions, and writing review status are all pulled from Supabase.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-primary" href="/full-tests/new">Import test</Link>
          <Link className="btn btn-secondary" href="/students">Add student</Link>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="Students" value={stats.students.length} note={`${activeStudents} open access`} />
        <StatCard label="Groups" value={stats.groups.length} note="student paths" />
        <StatCard label="Published lessons" value={published} note={`${draftLessons} drafts`} />
        <StatCard label="Draft content" value={draftContent} note="waiting for attach/publish" />
      </section>

      <section className="stats-grid">
        <StatCard label="Pending writing" value={stats.pendingWriting.length} note="needs teacher review" />
        <StatCard label="Recent submissions" value={stats.submissions.length} note="all attempts" />
        <StatCard label="Tasks" value={stats.tasks.length} note="reading/listening/writing" />
        <StatCard label="No group" value={stats.students.filter((student) => !student.group_id).length} note="assign before lessons show" />
      </section>

      <div className="panel-grid">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Recent submissions</p>
              <h2>Latest student work</h2>
            </div>
            <Link href="/submissions">Open queue</Link>
          </div>
          {stats.submissions.length ? (
            <Table>
              <thead><tr><th>Student</th><th>Task</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {stats.submissions.slice(0, 8).map((submission) => (
                  <tr key={submission.id}>
                    <td>{submission.students?.name || "Student"}</td>
                    <td>{submission.tasks?.title || "Task"}<p className="table-note">{submission.tasks?.lessons?.title || "No lesson"}</p></td>
                    <td>{submission.score != null ? `${submission.score}/${submission.total ?? "band"}` : <Badge tone="warning">Pending</Badge>}</td>
                    <td>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <EmptyState title="No submissions yet" body="Student attempts will appear here after the first published lesson is completed." />}
        </Card>

        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Quick actions</p>
              <h2>Most used controls</h2>
            </div>
          </div>
          <div className="quick-action-list">
            <Link href="/students" className="quick-action">Add student access</Link>
            <Link href="/lessons#groups" className="quick-action">Create or view groups</Link>
            <Link href="/full-tests/new" className="quick-action">Import HTML test</Link>
            <Link href="/lessons#lesson-builder" className="quick-action">Create lesson</Link>
            <Link href="/submissions" className="quick-action">Open writing review</Link>
          </div>
        </Card>
      </div>

      <div className="panel-grid dashboard-lower">
        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h2>Draft lessons</h2>
            </div>
          </div>
          <div className="lesson-list">
            {stats.lessons.filter((lesson) => !lesson.published).slice(0, 6).map((lesson) => (
              <div className="attention-row" key={lesson.id}>
                <strong>{lesson.title}</strong>
                <span>{lesson.group_id ? "Group assigned" : "No group"}</span>
                <Link href="/lessons#lesson-builder">Open</Link>
              </div>
            ))}
            {!draftLessons ? <EmptyState title="No draft lessons" body="New lesson drafts will appear here before publishing." /> : null}
          </div>
        </Card>

        <Card className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Writing queue</p>
              <h2>Pending review</h2>
            </div>
          </div>
          <div className="lesson-list">
            {stats.pendingWriting.slice(0, 6).map((submission) => (
              <div className="attention-row" key={submission.id}>
                <strong>{submission.students?.name || "Student"}</strong>
                <span>{submission.tasks?.title || "Writing task"}</span>
                <Link href="/submissions">Review</Link>
              </div>
            ))}
            {!stats.pendingWriting.length ? <EmptyState title="Writing queue is clear" body="Writing attempts that need scores will appear here." /> : null}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
