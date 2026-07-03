"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input } from "@ielts-pro/ui";
import { studentLogin } from "../actions/auth";

export default function StudentLoginPage() {
  return (
    <Suspense fallback={<main className="login-screen" />}>
      <StudentLoginForm />
    </Suspense>
  );
}

function StudentLoginForm() {
  const [state, action, pending] = useActionState(studentLogin, undefined);
  const searchParams = useSearchParams();
  const sessionError = searchParams.get("error");
  return (
    <main className="login-screen">
      <Link className="login-home-link" href="/">IELTS Pro home</Link>
      <section className="login-hero">
        <p className="eyebrow">Private IELTS Pro portal</p>
        <h1>Enter your teacher-issued IELTS workspace.</h1>
        <p>
          Use the exact full name and Student Access ID from your teacher. The portal keeps your assigned tests,
          writing feedback, result history, and device sessions in one place.
        </p>
        <div className="login-skill-strip" aria-label="IELTS skills">
          <span>Reading</span>
          <span>Listening</span>
          <span>Writing</span>
          <span>Full tests</span>
        </div>
        <div className="study-map" aria-hidden="true">
          <div className="study-map-head">
            <span>Band path</span>
            <strong>7.0+</strong>
          </div>
          <div className="study-row"><span>R</span><i /><b>Passage drills</b></div>
          <div className="study-row"><span>L</span><i /><b>Audio sections</b></div>
          <div className="study-row"><span>W</span><i /><b>Teacher feedback</b></div>
        </div>
      </section>
      <Card className="login-card">
        <p className="eyebrow">Teacher-issued access</p>
        <h2>Student access</h2>
        <p className="muted">There is no public signup. Access is created in the admin panel.</p>
        <form action={action} className="form-stack">
          <label>
            Full Name
            <Input name="name" autoComplete="name" placeholder="Miravzal S" required />
          </label>
          <label>
            Student Access ID
            <Input name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="1111111" required />
          </label>
          {sessionError === "session-revoked" ? <p className="form-error">This device session was revoked or your access was closed. Contact your teacher.</p> : null}
          {sessionError === "session-expired" ? <p className="form-error">Your session expired. Enter your Student Access ID again.</p> : null}
          {sessionError === "access-setup" ? <p className="form-error">Student access setup is not finished yet. Apply the Supabase migration, then try again.</p> : null}
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <Button disabled={pending}>{pending ? "Checking..." : "Enter Student Portal"}</Button>
        </form>
      </Card>
    </main>
  );
}
