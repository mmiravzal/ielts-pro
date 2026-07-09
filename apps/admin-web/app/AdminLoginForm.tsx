"use client";

import { useActionState } from "react";
import { adminLogin } from "./actions/auth";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, undefined);

  return (
    <main className="admin-login-page">
      <section className="admin-login-form-panel">
        <div className="admin-login-mark">IELTS Pro</div>
        <div className="admin-login-copy">
          <p>Teacher command center</p>
          <h1>Admin login</h1>
          <span>Use the admin email and password configured for this LMS.</span>
        </div>

        <form action={action} className="admin-login-form">
          <label className="admin-line-field">
            <span>Admin email</span>
            <input name="email" type="email" autoComplete="email" spellCheck={false} placeholder="admin@email.com" required />
          </label>
          <label className="admin-line-field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" placeholder="Enter admin password" required />
          </label>
          {state?.error ? <p className="form-error">{state.error}</p> : null}
          <button className="admin-login-next" disabled={pending}>{pending ? "Signing in..." : "Open admin panel"}</button>
        </form>

        <p className="admin-login-help">Secure teacher access only. Use the credentials issued for this workspace.</p>
      </section>

      <section className="admin-login-visual" aria-label="IELTS Pro">
        <div className="admin-login-badge">
          IELTS <span>PRO</span>
        </div>
        <div className="admin-login-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="admin-login-visual-copy">
          <p>Admin workspace</p>
          <h2>Control lessons, students, tests, and writing review from one secure panel.</h2>
        </div>
      </section>
    </main>
  );
}
