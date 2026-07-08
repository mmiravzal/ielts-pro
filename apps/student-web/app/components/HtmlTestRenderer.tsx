"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  downloadUrl: string | null;
  task: Task;
  existingSubmission: Submission | null;
  skill: string;
};

function extractHtmlParts(html: string) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyHtml = bodyMatch ? bodyMatch[1] : html;
  bodyHtml = bodyHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

  const styles: string[] = [];
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(html)) !== null) {
    if (m[1].trim()) styles.push(m[1]);
  }

  const scripts: string[] = [];
  const scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = scriptRe.exec(html)) !== null) {
    if (m[1].trim()) scripts.push(m[1]);
  }

  return { bodyHtml, styles, scripts };
}

function scopeCSS(css: string): string {
  return css
    .replace(/html\s*\{/gi, "#html-test-content {")
    .replace(/body\s*\{/gi, "#html-test-content {");
}

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

export function HtmlTestRenderer({ downloadUrl, task, existingSubmission, skill }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resultData, setResultData] = useState<ResultModalData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [rawHtml, setRawHtml] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const startTimeRef = useRef(Date.now());
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!downloadUrl) {
      setFetchError(true);
      return;
    }
    let active = true;
    fetch(downloadUrl)
      .then((res) => (res.ok ? res.text() : null))
      .then((html) => {
        if (!active) return;
        if (html) setRawHtml(html);
        else setFetchError(true);
      })
      .catch(() => {
        if (active) setFetchError(true);
      });
    return () => { active = false; };
  }, [downloadUrl]);

  const parts = useMemo(() => {
    if (!rawHtml) return { bodyHtml: "", styles: [], scripts: [] };
    return extractHtmlParts(rawHtml);
  }, [rawHtml]);

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
    if (injectedRef.current) return;
    if (existingSubmission) return;

    if (contentRef.current) {
      contentRef.current.innerHTML = parts.bodyHtml;
    }

    const styleEl = document.createElement("style");
    styleEl.id = "html-test-styles";
    styleEl.textContent = parts.styles.map(scopeCSS).join("\n");
    document.head.appendChild(styleEl);

    const scriptEls: HTMLScriptElement[] = [];
    parts.scripts.forEach((content) => {
      const s = document.createElement("script");
      s.textContent = content;
      document.body.appendChild(s);
      scriptEls.push(s);
    });

    let submitted = false;

    function scanResultTable(): QuestionResult[] {
      const tbody = document.getElementById("result-tbody");
      if (!tbody) return [];
      const results: QuestionResult[] = [];
      tbody.querySelectorAll("tr").forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 5) return;
        const isCorrect = cells[4].textContent?.includes("Correct") ?? false;
        results.push({
          questionIndex: results.length,
          questionType: "auto",
          question: "",
          studentAnswer: cells[2].textContent ?? null,
          correctAnswer: cells[3].textContent ?? null,
          isCorrect,
          points: isCorrect ? 1 : 0,
          maxPoints: 1,
        });
      });
      return results;
    }

    function extractAndSubmit() {
      if (submitted) return;
      const statsEl = document.getElementById("result-stats");
      if (!statsEl) return;
      const text = statsEl.textContent ?? "";
      const match = text.match(/(\d+)\s*\/\s*(\d+)/);
      if (!match) return;
      const score = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      if (!total || score > total) return;
      const results = scanResultTable();

      submitted = true;
      fetch("/api/html-attempts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          score,
          total,
          answers: null,
          results: results.length ? results : null,
        }),
      })
        .then(async (r) => {
          const text = await r.text();
          let json: Record<string, unknown>;
          try { json = JSON.parse(text); } catch { json = { raw: text }; }
          if (!r.ok || !json.ok) {
            console.error("submitAttempt API rejected", { status: r.status, body: json });
            submitted = false;
            return;
          }
          const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setResultData({ score, total, results, timeTaken });
        })
        .catch((err) => {
          console.error("submitAttempt fetch failed", err);
          submitted = false;
        });
    }

    function hookCheckAnswers() {
      if (typeof (window as any).checkAnswers !== "function") return false;
      const original = (window as any).checkAnswers;
      (window as any).checkAnswers = function () {
        original.apply(this, arguments as unknown as unknown[]);
        setTimeout(extractAndSubmit, 100);
      };
      return true;
    }

    if (typeof (window as any).submitIeltsScore === "function") {
      delete (window as any).submitIeltsScore;
    }

    const cleanups: (() => void)[] = [];

    if (!hookCheckAnswers()) {
      const pollId = setInterval(() => {
        if (hookCheckAnswers()) clearInterval(pollId);
      }, 200);
      cleanups.push(() => clearInterval(pollId));

      const timeoutId = setTimeout(() => {
        clearInterval(pollId);
        if (submitted) return;
        const btn = document.createElement("button");
        btn.textContent = "Submit results";
        btn.style.cssText =
          "position:fixed;bottom:24px;right:24px;z-index:99999;padding:12px 24px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2)";
        btn.onclick = () => {
          if (submitted) return;
          const text = prompt("Enter your score (e.g. 7/10):");
          if (!text) return;
          const m = text.match(/(\d+)\s*\/\s*(\d+)/);
          if (!m) {
            alert("Format: score/total (e.g. 7/10)");
            return;
          }
          const score = Number(m[1]);
          const total = Number(m[2]);
          submitted = true;
          fetch("/api/html-attempts", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              taskId: task.id,
              score,
              total,
              answers: {},
              results: null,
            }),
          })
            .then(async (r) => {
              const text = await r.text();
              let json: Record<string, unknown>;
              try { json = JSON.parse(text); } catch { json = { raw: text }; }
              if (!r.ok || !json.ok) {
                console.error("fallback submit rejected", { status: r.status, body: json });
                submitted = false;
                return;
              }
              const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setResultData({ score, total, results: [], timeTaken });
            })
            .catch((err) => {
              console.error("fallback submit failed", err);
              submitted = false;
            });
          btn.remove();
        };
        document.body.appendChild(btn);
        cleanups.push(() => btn.remove());
      }, 30000);
      cleanups.push(() => clearTimeout(timeoutId));
    }

    injectedRef.current = true;

    return () => {
      styleEl.remove();
      scriptEls.forEach((el) => el.remove());
      cleanups.forEach((fn) => fn());
      injectedRef.current = false;
    };
  }, [parts, existingSubmission, task.id]);

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
    <div
      className={`html-test-viewer ${isFullscreen ? "html-test-viewer--fullscreen" : ""}`}
      ref={containerRef}
    >
      {!isFullscreen ? (
        <div className="exam-topline">
          <div>
            <Badge tone={toneFor(skill)}>{labelFor(skill)}</Badge>
          </div>
          <div className="topline-actions">
            {existingSubmission?.score != null ? (
              <span className="submission-score">
                Score: {existingSubmission.score}/{existingSubmission.total ?? "?"}
              </span>
            ) : null}
            {!resultData ? <span className="timer-display">{formatTime(elapsed)}</span> : null}
            <button type="button" className="btn btn-secondary" onClick={enterFullscreen}>
              Fullscreen
            </button>
            <Link href="/dashboard" className="btn btn-secondary">
              Exit test
            </Link>
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

      {fetchError ? (
        <div className="html-test-viewer-status">
          <p className="form-error">Test file is missing. Ask your teacher to re-upload it.</p>
        </div>
      ) : !rawHtml ? (
        <div className="html-test-viewer-status">
          <div className="skeleton-block" style={{ height: 400 }} />
        </div>
      ) : (
        <div id="html-test-content" ref={contentRef} />
      )}

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
            <button
              type="button"
              className="results-modal-close"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>

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
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {resultData.results.map((r) => (
                      <tr
                        key={r.questionIndex}
                        className={r.isCorrect ? "result-row-correct" : "result-row-incorrect"}
                      >
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
              <Link href="/results" className="btn btn-primary" onClick={closeModal}>
                View results
              </Link>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
