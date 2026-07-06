import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentById, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import {
  averageScore,
  completionState,
  feedbackSubmissions,
  formatDate,
  labelForSkill,
  nextTask,
  progressBySkill,
  reviewedSubmissions,
  scoreLabel,
  taskSummary,
  toneForSkill
} from "../student-utils";

export default async function DashboardPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const currentGroupId = student?.group_id ?? session.group_id;
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase, currentGroupId),
    getStudentSubmissions(supabase, session.id)
  ]);
  const groupName = student?.groups?.name || "Teacher group pending";
  const progress = completionState(tasks, submissions);
  const skills = progressBySkill(tasks, submissions);
  const next = nextTask(tasks, submissions);
  const reviewed = reviewedSubmissions(submissions);
  const feedback = feedbackSubmissions(submissions);
  const avgScore = averageScore(submissions);

  return (
    <StudentShell
      name={session.name}
      groupName={groupName}
      sectionLabel="Dashboard"
      sectionDescription="Practice plan, results, and teacher feedback"
    >
      <main className="student-page student-dashboard-page">
        <section className="student-dashboard-grid">
          <article className="student-welcome-card">
            <p className="student-kicker">Welcome back</p>
            <h1>{session.name}</h1>
            <p>{currentGroupId ? `Your private IELTS workspace is connected to ${groupName}.` : "Ask your teacher to assign your access ID to a group so lessons can appear here."}</p>
            <div className="student-action-row">
              {next ? (
                <Link className="student-primary-button" href={`/tests/${next.id}`} target="_blank" rel="noopener noreferrer">
                  Continue practice
                </Link>
              ) : (
                <Link className="student-primary-button" href="/practice">Open practice</Link>
              )}
              <Link className="student-secondary-button" href="/results">View results</Link>
            </div>
          </article>

          <aside className="student-panel student-inbox-card">
            <div className="student-panel-head">
              <p className="student-kicker">Inbox</p>
              <strong>{feedback.length}</strong>
            </div>
            {feedback[0] ? (
              <div className="student-feedback-preview">
                <span>{feedback[0].tasks?.title || "Teacher feedback"}</span>
                <p>{feedback[0].feedback}</p>
                <small>{formatDate(feedback[0].submitted_at, { dateStyle: "medium", timeStyle: "short" })}</small>
              </div>
            ) : (
              <p className="student-muted">No teacher feedback yet. Submit writing or full-test work to receive review notes.</p>
            )}
          </aside>
        </section>

        <section className="student-stat-grid" aria-label="Dashboard summary">
          <MetricCard label="Tasks" value={tasks.length} note={`${lessons.length} published lessons`} />
          <MetricCard label="Completed" value={progress.completed} note={`${progress.percent}% overall progress`} />
          <MetricCard label="Reviewed" value={reviewed.length} note={avgScore ? `Average score ${avgScore}` : "No reviewed score yet"} />
          <MetricCard label="Feedback" value={feedback.length} note="teacher notes received" />
        </section>

        <section className="student-two-column">
          <article className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Skill map</p>
                <h2>Practice progress</h2>
              </div>
              <Link href="/practice">All skills</Link>
            </div>
            <div className="student-progress-list">
              {skills.map((skill) => (
                <Link className="student-progress-row" href={skill.href} key={skill.key}>
                  <span className={`student-skill-icon tone-${toneForSkill(skill.key)}`}>{skill.mark}</span>
                  <div>
                    <strong>{skill.label}</strong>
                    <small>{skill.done}/{skill.total} completed</small>
                  </div>
                  <em>{skill.percent}%</em>
                </Link>
              ))}
            </div>
          </article>

          <article className="student-panel student-donut-panel">
            <p className="student-kicker">Completion</p>
            <div className="student-donut" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties}>
              <strong>{progress.percent}%</strong>
              <span>{progress.completed}/{tasks.length || 0}</span>
            </div>
            <p className="student-muted">Your dashboard updates from real submitted attempts, not static demo data.</p>
          </article>
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Assigned work</p>
              <h2>Latest practice</h2>
            </div>
            <Link href="/lessons">Open lessons</Link>
          </div>
          <div className="student-task-list">
            {tasks.slice(0, 6).map((task) => {
              const submitted = progress.completedIds.has(task.id);
              return (
                <article className="student-task-row" key={task.id}>
                  <span className={`student-skill-icon tone-${toneForSkill(task.skill)}`}>{labelForSkill(task.skill).slice(0, 1)}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{taskSummary(task, lessons)}</small>
                  </div>
                  <span className={`student-status-pill ${submitted ? "is-done" : ""}`}>{submitted ? "Submitted" : "Open"}</span>
                  <Link className="student-small-button" href={`/tests/${task.id}`} target="_blank" rel="noopener noreferrer">
                    {submitted ? "Review" : "Start"}
                  </Link>
                </article>
              );
            })}
            {!tasks.length ? (
              <div className="student-empty-card">
                <h3>No published practice yet</h3>
                <p>{currentGroupId ? "Your teacher has not published IELTS work for this group yet." : "Your teacher needs to assign your Student Access ID to a group first."}</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Recent results</p>
              <h2>Attempt history</h2>
            </div>
            <Link href="/results">All results</Link>
          </div>
          <div className="student-result-strip">
            {submissions.slice(0, 4).map((submission) => (
              <article className="student-result-card" key={submission.id}>
                <span>{labelForSkill(submission.tasks?.skill)}</span>
                <strong>{submission.tasks?.title || "Practice task"}</strong>
                <small>{formatDate(submission.submitted_at)}</small>
                <em>{scoreLabel(submission)}</em>
              </article>
            ))}
            {!submissions.length ? <p className="student-muted">No attempts yet. Start a practice test to build history.</p> : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <article className="student-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
