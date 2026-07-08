import Link from "next/link";
import type { CSSProperties } from "react";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import { getStudentWorkspaceData } from "../student-data";
import {
  completionState,
  labelForSkill,
  nextTask,
  progressBySkill,
  studentSkillCards,
  taskSummary,
  tasksForSkill,
  toneForSkill
} from "../student-utils";

type PracticePageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
  const session = await requireStudentSession();
  const params = await searchParams;
  const query = params?.q?.trim().toLowerCase() || "";
  const { groupId: currentGroupId, groupName, lessons, tasks, submissions, unavailable, errorMessage } = await getStudentWorkspaceData(session);
  const progress = completionState(tasks, submissions);
  const next = nextTask(tasks, submissions);
  const skillProgress = progressBySkill(tasks, submissions);
  const visibleTasks = query
    ? tasks.filter((task) =>
        [task.title, labelForSkill(task.skill), taskSummary(task, lessons)]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      )
    : tasks;

  return (
    <StudentShell
      name={session.name}
      groupName={groupName}
      sectionLabel="Practice"
      sectionDescription="Choose a skill and open tests in a focused exam tab"
    >
      <main className="student-page student-practice-page">
        <section className="student-hero-panel">
          <div>
            <p className="student-kicker">Choose your skill</p>
            <h1>IELTS practice built around your teacher plan.</h1>
            <p>
              {currentGroupId
                ? `Showing work assigned to ${groupName}.`
                : "No group is assigned yet. Ask your teacher to connect your Student Access ID to a group."}
            </p>
            <div className="student-action-row">
              {next ? (
                <Link className="student-primary-button" href={`/tests/${next.id}`} target="_blank" rel="noopener noreferrer">
                  Continue next task
                </Link>
              ) : (
                <Link className="student-primary-button" href="/lessons">Open lessons</Link>
              )}
              <Link className="student-secondary-button" href="/results">Result history</Link>
            </div>
          </div>
          <div className="student-hero-progress">
            <span>Course progress</span>
            <strong>{progress.percent}%</strong>
            <div className="student-progress-bar" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties} />
            <small>{progress.completed}/{tasks.length} tasks submitted</small>
          </div>
        </section>

        {unavailable ? (
          <section className="student-alert-card" role="status">
            <strong>Practice data unavailable</strong>
            <p>{errorMessage}</p>
          </section>
        ) : null}

        <section className="student-skill-grid" aria-label="Choose an IELTS skill">
          {studentSkillCards.map((card) => {
            const data = skillProgress.find((skill) => skill.key === card.key);
            const available = tasksForSkill(tasks, card.key).length;
            return (
              <Link className={`student-skill-card tone-${toneForSkill(card.key)}`} href={card.href} key={card.key}>
                <span className={`student-skill-icon tone-${toneForSkill(card.key)}`}>{card.mark}</span>
                <div>
                  <h2>{card.label}</h2>
                  <p>{card.duration} · {data?.total || available} task{(data?.total || available) === 1 ? "" : "s"}</p>
                </div>
                <small>{card.detail}</small>
                <em>{data?.done || 0}/{data?.total || available} completed</em>
              </Link>
            );
          })}
        </section>

        <section className="student-stat-grid" aria-label="Practice summary">
          <MetricCard label="Lessons" value={lessons.length} note="published by teacher" />
          <MetricCard label="Open Tasks" value={progress.open} note="available now" />
          <MetricCard label="Attempts" value={submissions.length} note="submitted answers" />
          <MetricCard label="Feedback" value={submissions.filter((submission) => submission.feedback).length} note="teacher notes" />
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Latest work</p>
              <h2>{query ? "Search results" : "Published practice"}</h2>
              {query ? <p className="student-muted">Showing practice that matches "{query}".</p> : null}
            </div>
            <Link href="/lessons">View by lesson</Link>
          </div>
          <div className="student-task-list">
            {visibleTasks.slice(0, 10).map((task) => {
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
            {!visibleTasks.length ? (
              <div className="student-empty-card">
                <h3>{query ? "No matching practice" : "No practice yet"}</h3>
                <p>
                  {query
                    ? "Try a different skill, title, or lesson keyword."
                    : currentGroupId
                      ? "Your teacher has not published IELTS work for this group yet."
                      : "Your Student Access ID is not assigned to a group yet."}
                </p>
              </div>
            ) : null}
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
