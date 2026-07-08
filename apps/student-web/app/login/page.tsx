import Link from "next/link";
import { StudentLoginForm } from "./StudentLoginForm";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string | string[] }>;
};

export default async function StudentLoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorValue = resolvedSearchParams.error;
  const sessionError = Array.isArray(errorValue) ? errorValue[0] : errorValue;

  return (
    <main className="student-login-page">
      <section className="student-login-form-panel" aria-labelledby="student-login-title">
        <Link className="student-login-back" href="/" prefetch={false}>Back to home</Link>
        <div className="student-login-copy">
          <p>Student portal</p>
          <h1 id="student-login-title">IELTS Pro Login</h1>
          <span>Enter with the full name and access ID issued by your teacher.</span>
        </div>

        <StudentLoginForm sessionError={sessionError} />

        <p className="student-login-help">You can find your access ID in the message from your teacher.</p>
      </section>

      <section className="student-login-visual" aria-label="IELTS Pro visual preview">
        <div className="student-login-logo">IELTS <span>Pro</span></div>
        <div className="student-login-visual-card">
          <div>
            <p>Private workspace</p>
            <h2>Practice faster with lessons, tests, and feedback in one place.</h2>
          </div>
          <div className="student-login-skill-grid" aria-hidden="true">
            <span>Listening</span>
            <span>Reading</span>
            <span>Writing</span>
            <span>Mock</span>
          </div>
        </div>
        <div className="student-login-metrics" aria-hidden="true">
          <span><strong>4</strong> IELTS skills</span>
          <span><strong>24/7</strong> access</span>
          <span><strong>1</strong> teacher space</span>
        </div>
      </section>
    </main>
  );
}
