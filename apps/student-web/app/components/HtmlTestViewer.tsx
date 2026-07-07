"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@ielts-pro/ui";
import type { QuestionResult, Submission, Task } from "@ielts-pro/shared";

type ResultModalData = {
  score: number;
  total: number;
  results: QuestionResult[];
  timeTaken: number;
};

type Props = {
  htmlTest: string;
  task: Task;
  existingSubmission: Submission | null;
  skill: string;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HtmlTestViewer({ htmlTest, task, existingSubmission, skill }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resultData, setResultData] = useState<ResultModalData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  const updateFullscreenState = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, [updateFullscreenState]);

  useEffect(() => {
    if (resultData) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [resultData]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "ielts-submit-result") {
        const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setResultData({
          score: e.data.score,
          total: e.data.total,
          results: e.data.results || [],
          timeTaken
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
    } catch {
    }
  }, []);

  const closeModal = useCallback(() => setResultData(null), []);

  return (
    <div className={`html-test-viewer ${isFullscreen ? "html-test-viewer--fullscreen" : ""}`} ref={containerRef}>
      {!isFullscreen ? (
        <div className="exam-topline">
          <div>
            <Badge tone={toneFor(skill)}>{labelFor(skill)}</Badge>
          </div>
          <div className="topline-actions">
            {existingSubmission?.score != null ? (
              <span className="submission-score">Score: {existingSubmission.score}/{existingSubmission.total ?? "?"}</span>
            ) : null}
            {!resultData ? <span className="timer-display">{formatTime(elapsed)}</span> : null}
            <button type="button" className="btn btn-secondary" onClick={enterFullscreen}>
              Fullscreen
            </button>
            <Link href="/dashboard" className="btn btn-secondary">Exit test</Link>
          </div>
        </div>
      ) : null}

      {existingSubmission ? (
        <Card className="submitted-panel" style={{ marginBottom: 12 }}>
          <div>
            <Badge tone="success">Submitted</Badge>
            <span>Your result is saved.</span>
          </div>
        </Card>
      ) : null}

      <iframe
        className="html-test-iframe"
        srcDoc={htmlTest}
        title={task.title}
        allow="fullscreen"
      />

      {isFullscreen ? (
        <div className="fullscreen-controls">
          <button type="button" className="btn btn-sm" onClick={exitFullscreen}>
            Exit fullscreen (Esc)
          </button>
        </div>
      ) : null}

      {resultData ? (
        <div className="results-overlay" onClick={closeModal}>
          <div className="results-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="results-modal-close" onClick={closeModal} aria-label="Close">&times;</button>

            <div className="results-modal-header">
              <div className="band-score-badge">
                {bandScore(resultData.score, resultData.total)}
              </div>
              <p className="results-summary">
                {resultData.score} out of {resultData.total} correct
              </p>
              <p className="results-band-label">IELTS Band Score</p>
              {resultData.timeTaken > 0 ? (
                <p className="results-time">Time: {formatTime(resultData.timeTaken)}</p>
              ) : null}
            </div>

            {resultData.results.length ? (
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
                    {resultData.results.map((r) => (
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
              <Link href="/results" className="btn btn-primary" onClick={closeModal}>View results</Link>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>Continue</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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

function toneFor(skill: string) {
  if (skill === "reading") return "reading";
  if (skill === "listening") return "listening";
  if (skill === "writing") return "writing";
  if (skill === "full_test") return "full";
  return "neutral";
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}
