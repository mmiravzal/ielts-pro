"use client";

// Opens the uploaded HTML test in a new tab. `noopener` keeps the new tab from
// touching window.opener — the test reports its score via same-origin fetch,
// not through the opener reference.
export function HtmlTestStart({ taskId, label = "Start test (opens in new tab)" }: { taskId: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn btn-primary"
      onClick={() => window.open(`/tests/html/${taskId}`, "_blank", "noopener")}
    >
      {label}
    </button>
  );
}
