import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, type BadgeTone } from "@ielts-pro/ui";
import { createServerSupabaseClient, getSubmissionDetail } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../../components/StudentShell";
import { formatDate, labelForSkill, toneForSkill } from "../../student-utils";

export default async function SubmissionDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const session = await requireStudentSession();
  const { submissionId } = await params;
  const submission = await getSubmissionDetail(createServerSupabaseClient(), submissionId);
  if (!submission || submission.student_id !== session.id) notFound();

  const correctCount = submission.results?.filter((r) => r.isCorrect).length ?? 0;
  const totalResults = submission.results?.length ?? 0;

  return (
    <StudentShell name={session.name} sectionLabel="Result detail" sectionDescription="Per-question breakdown">
      <main className="student-page">
        <div className="page-head page-head-hero">
          <div>
            <p className="eyebrow">Result detail</p>
            <h1>{submission.tasks?.title || "Practice task"}</h1>
            <p className="muted">
              <Badge tone={toneForSkill(submission.tasks?.skill) as BadgeTone}>{labelForSkill(submission.tasks?.skill)}</Badge>
              {" · "}
              {formatDate(submission.submitted_at, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
          <Link href="/results" className="btn btn-secondary">Back to results</Link>
        </div>

        {submission.score != null ? (
          <section className="student-stat-grid" style={{ marginBottom: 28 }}>
            <article className="student-metric-card">
              <span>Score</span>
              <strong>{submission.score}/{submission.total ?? "?"}</strong>
            </article>
            <article className="student-metric-card">
              <span>Band</span>
              <strong>{bandScore(submission.score, submission.total ?? 1)}</strong>
            </article>
            <article className="student-metric-card">
              <span>Correct</span>
              <strong>{correctCount}/{totalResults || (submission.score ?? "?")}</strong>
            </article>
          </section>
        ) : null}

        {totalResults > 0 ? (
          <section className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Analysis</p>
                <h2>Per-question breakdown</h2>
              </div>
            </div>
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Your answer</th>
                    <th>Correct answer</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {submission.results!.map((r) => (
                    <tr key={r.questionIndex} className={r.isCorrect ? "result-row-correct" : "result-row-incorrect"}>
                      <td>{r.questionIndex + 1}</td>
                      <td>{r.question ?? ""}</td>
                      <td className="answer-cell">{formatAnswer(r.studentAnswer)}</td>
                      <td className="answer-cell">{formatAnswer(r.correctAnswer)}</td>
                      <td className="result-icon">{r.isCorrect ? "✓" : "✗"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : submission.answer ? (
          <section className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Raw data</p>
                <h2>Submitted answer</h2>
              </div>
            </div>
            <pre style={{ fontSize: 13, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{submission.answer}</pre>
          </section>
        ) : null}

        {submission.feedback ? (
          <section className="student-panel" style={{ marginTop: 20 }}>
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Feedback</p>
                <h2>Teacher notes</h2>
              </div>
            </div>
            <p>{submission.feedback}</p>
          </section>
        ) : null}
      </main>
    </StudentShell>
  );
}

function bandScore(score: number, total: number) {
  if (!total || total <= 0) return "-";
  const raw = (score / total) * 9;
  const rounded = Math.round(raw * 2) / 2;
  return Math.max(1, Math.min(9, rounded)).toFixed(1);
}

function formatAnswer(value: unknown): string {
  if (value == null) return "-";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
