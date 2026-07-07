"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitTaskAttempt, type SubmitResult } from "../actions/attempts";
import type { QuestionResult } from "@ielts-pro/shared";

type Props = {
  children: React.ReactNode;
  taskId: string;
};

type ModalData = {
  score: number;
  total: number;
  results: QuestionResult[];
  submissionId: string;
  timeTaken: number;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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

export function StandardTestForm({ children, taskId }: Props) {
  const router = useRouter();
  const [state, formAction] = useActionState<SubmitResult | null, FormData>(
    async (_prev, formData) => submitTaskAttempt(formData),
    null
  );
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!state) return;
    if (!state.ok) {
      if (state.error === "empty") {
        router.push(`/tests/${taskId}?error=empty`);
      } else if (state.error === "unavailable") {
        router.push("/dashboard?error=unavailable");
      }
      return;
    }
    if (state.redirectUrl) {
      router.push(state.redirectUrl);
      return;
    }
    if (state.submissionId && state.score != null) {
      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setModalData({
        score: state.score,
        total: state.total ?? 0,
        results: state.results ?? [],
        submissionId: state.submissionId,
        timeTaken,
      });
    }
  }, [state, router, taskId]);

  const closeModal = useCallback(() => setModalData(null), []);

  return (
    <>
      <form action={formAction} className="exam-layout" id="test-answer-form" data-testid="test-answer-form">
        <input type="hidden" name="taskId" value={taskId} />
        {children}
      </form>

      {modalData ? (
        <div className="results-overlay" onClick={closeModal}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="results-modal-close" onClick={closeModal} aria-label="Close">&times;</button>

            <div className="results-modal-header">
              <div className="band-score-badge">
                {bandScore(modalData.score, modalData.total)}
              </div>
              <p className="results-summary">
                {modalData.score} out of {modalData.total} correct
              </p>
              <p className="results-band-label">IELTS Band Score</p>
              {modalData.timeTaken > 0 ? (
                <p className="results-time">Time: {formatTime(modalData.timeTaken)}</p>
              ) : null}
            </div>

            {modalData.results.length > 0 ? (
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
                    {modalData.results.map((r) => (
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
            ) : (
              <p className="results-no-detail">No per-question breakdown available.</p>
            )}

            <div className="results-modal-actions">
              <Link href={`/results/${modalData.submissionId}`} className="btn btn-primary" onClick={closeModal}>View results</Link>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Continue</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
