import Link from "next/link";
import { Badge, Card, LinkButton, StatCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getStudentDeviceSessions, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";

export default async function ProfilePage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [submissions, deviceSessions] = await Promise.all([
    getStudentSubmissions(supabase, session.id),
    getStudentDeviceSessions(supabase, session.id)
  ]);
  const reviewed = submissions.filter((submission) => submission.score != null);
  const feedback = submissions.filter((submission) => submission.feedback);
  const activeDevices = deviceSessions.filter((device) => device.is_active !== false && !device.revoked_at);

  return (
    <StudentShell name={session.name}>
      <main className="page">
        <section className="profile-hero">
          <div>
            <p className="eyebrow">Student profile</p>
            <h1>{session.name}</h1>
            <p>Private IELTS workspace connected to your teacher-issued access ID.</p>
            <div className="profile-actions">
              <LinkButton href="/practice">Continue practice</LinkButton>
              <LinkButton href="/progress" variant="secondary">View results</LinkButton>
            </div>
          </div>
          <div className="access-pass">
            <span>Student Access ID</span>
            <strong>{maskAccessId(session.student_code)}</strong>
            <small>Never share this code publicly.</small>
          </div>
        </section>

        <section className="stats-grid" aria-label="Profile summary">
          <StatCard label="Attempts" value={submissions.length} note="submitted tasks" />
          <StatCard label="Reviewed" value={reviewed.length} note="scored attempts" />
          <StatCard label="Feedback" value={feedback.length} note="teacher notes" />
          <StatCard label="Devices" value={activeDevices.length} note="active sessions" />
        </section>

        <div className="content-grid">
          <section>
            <div className="section-head">
              <h2>Recent results</h2>
              <Link href="/progress">All history</Link>
            </div>
            <div className="attempt-list">
              {submissions.slice(0, 5).map((submission) => (
                <Card className="attempt-item" key={submission.id}>
                  <strong>{submission.tasks?.title || "Practice task"}</strong>
                  <small>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(submission.submitted_at))}</small>
                  {submission.score != null ? <span>{submission.score}/{submission.total ?? "?"}</span> : <Badge tone="warning">Waiting for review</Badge>}
                </Card>
              ))}
              {!submissions.length ? <Card className="attempt-item"><strong>No attempts yet</strong><small>Start practice to build your result history.</small></Card> : null}
            </div>
          </section>

          <aside className="right-rail">
            <div className="section-head"><h2>Device sessions</h2></div>
            <div className="device-stack">
              {deviceSessions.slice(0, 5).map((device) => (
                <Card className="profile-device" key={device.id}>
                  {device.is_active !== false && !device.revoked_at ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Revoked</Badge>}
                  <strong>{shortUserAgent(device.user_agent)}</strong>
                  <small>Last seen {formatDate(device.last_seen_at)}</small>
                </Card>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </StudentShell>
  );
}

function maskAccessId(value: string) {
  if (value.length <= 3) return "***";
  return `${value.slice(0, 2)}${"*".repeat(Math.max(value.length - 4, 2))}${value.slice(-2)}`;
}

function shortUserAgent(userAgent?: string | null) {
  if (!userAgent) return "Unknown browser";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  return userAgent.slice(0, 34);
}

function formatDate(value?: string | null) {
  if (!value) return "never";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
