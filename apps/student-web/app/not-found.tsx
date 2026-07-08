import Link from "next/link";

export default function NotFound() {
  return (
    <main className="student-not-found-page">
      <section className="student-not-found-card">
        <Link className="student-login-logo" href="/login" aria-label="IELTS Pro login">
          IELTS <span>Pro</span>
        </Link>
        <p className="student-not-found-kicker">Content unavailable</p>
        <h1>This practice item is not available.</h1>
        <p>
          The test may be unpublished, assigned to another group, or no longer available for
          your student access ID.
        </p>
        <div className="student-not-found-actions">
          <Link className="student-login-submit" href="/practice">
            Open practice
          </Link>
          <Link className="student-secondary-action" href="/dashboard">
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
