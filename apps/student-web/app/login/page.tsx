"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { studentLogin } from "../actions/auth";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<main className="student-login-page" />}>
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  const searchParams = useSearchParams();
  const sessionError = searchParams.get("error");
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://ielts-pro-admin-web.vercel.app";

  return (
    <main className="student-login-page">
      <section className="student-login-form-panel" aria-labelledby="student-login-title">
        <Link className="student-login-back" href="/">Back</Link>
        <div className="student-login-copy">
          <p>Student portal</p>
          <h1 id="student-login-title">Login</h1>
          <span>Login via your personal ID</span>
        </div>

        <form action={action} className="student-login-form">
          <label className="student-line-field">
            <span>Student</span>
            <input name="name" autoComplete="name" placeholder="Full Name" required />
          </label>
          <label className="student-line-field">
            <span>Personal ID</span>
            <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="Student Access ID" required />
          </label>
          {sessionError === "session-revoked" ? <p className="student-login-error">This device session was revoked or your access was closed. Contact your teacher.</p> : null}
          {sessionError === "session-expired" ? <p className="student-login-error">Your session expired. Enter your Student Access ID again.</p> : null}
          {sessionError === "access-setup" ? <p className="student-login-error">Student access setup is not finished yet. Apply the Supabase migration, then try again.</p> : null}
          {state?.error ? <p className="student-login-error">{state.error}</p> : null}
          <button className="student-login-next" disabled={pending}>{pending ? "Checking..." : "Next"}</button>
        </form>

        <p className="student-login-help">You can find your ID from your teacher.</p>
        <Link className="student-login-admin" href={adminUrl}>Admin</Link>
      </section>

      <section className="student-login-visual" aria-label="IELTS Pro visual preview">
        <div className="student-login-logo">IELTS <span>Pro</span></div>
        <div className="student-login-visual-card">
          <div>
            <p>Personal LMS</p>
            <h2>Practice IELTS with clear progress.</h2>
          </div>
          <div className="student-login-skill-grid" aria-hidden="true">
            <span>Listening</span>
            <span>Reading</span>
            <span>Writing</span>
            <span>Mock</span>
          </div>
        </div>
      </section>
    </main>
  );
}
