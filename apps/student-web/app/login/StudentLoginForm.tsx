"use client";

import { useActionState } from "react";
import { studentLogin } from "../actions/auth";

type StudentLoginFormProps = {
  sessionError?: string;
};

export function StudentLoginForm({ sessionError }: StudentLoginFormProps) {
  const [state, action, pending] = useActionState(studentLogin, undefined);

  return (
    <form action={action} className="student-login-form">
      <label className="student-line-field">
        <span>Full name</span>
        <input name="name" autoComplete="name" placeholder="Miravzal S" required />
      </label>
      <label className="student-line-field">
        <span>Student access ID</span>
        <input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="1111111" required />
      </label>
      {sessionError === "session-revoked" ? <p className="student-login-error">This device session was revoked or your access was closed. Contact your teacher.</p> : null}
      {sessionError === "session-expired" ? <p className="student-login-error">Your session expired. Enter your Student Access ID again.</p> : null}
      {sessionError === "access-setup" ? <p className="student-login-error">Student access setup is not finished yet. Ask the teacher to finish student access setup, then try again.</p> : null}
      {state?.error ? <p className="student-login-error">{state.error}</p> : null}
      <button className="student-login-next" disabled={pending}>
        {pending ? "Checking..." : "Enter student portal"}
      </button>
    </form>
  );
}
