import { Badge, Card, StatCard, Table } from "@ielts-pro/ui";
import { getSupabaseUrl } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";

export default async function SettingsPage() {
  const admin = await requireAdminSession();
  const studentUrl = process.env.NEXT_PUBLIC_STUDENT_APP_URL || "Not configured";
  const adminEmails = process.env.ADMIN_EMAILS || "miravzalsalakhiddinov@gmail.com";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>System configuration.</h1>
          <p className="muted">Read-only production settings that help diagnose deploy and import behavior. Secrets are intentionally hidden.</p>
        </div>
      </div>

      <section className="stats-grid">
        <StatCard label="LMS name" value="IELTS Pro" note="student and admin brand" />
        <StatCard label="HTML rendering" value="Safe" note="scripts and handlers stripped" />
        <StatCard label="Default visibility" value="Draft" note="imported content stays hidden" />
        <StatCard label="Default groups" value="3" note="seeded idempotently" />
      </section>

      <Card className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Environment</p>
            <h2>Configured URLs and behavior</h2>
          </div>
        </div>
        <Table>
          <tbody>
            <tr><th>Supabase project URL</th><td>{getSupabaseUrl()}</td><td><Badge tone="success">Public URL</Badge></td></tr>
            <tr><th>Student site URL</th><td>{studentUrl}</td><td><Badge tone={studentUrl === "Not configured" ? "warning" : "success"}>{studentUrl === "Not configured" ? "Missing" : "Configured"}</Badge></td></tr>
            <tr><th>Admin emails</th><td>{adminEmails}</td><td><Badge tone="neutral">Allowlist</Badge></td></tr>
            <tr><th>Import behavior</th><td>HTML uploads save as draft content first</td><td><Badge tone="success">Safe</Badge></td></tr>
            <tr><th>Student visibility</th><td>Published lesson plus group assignment</td><td><Badge tone="success">Controlled</Badge></td></tr>
          </tbody>
        </Table>
      </Card>
    </AdminShell>
  );
}
