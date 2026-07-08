import Link from "next/link";
import { PublicShell } from "../components/PublicShell";

export default function ContactPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <p className="public-kicker">Contact</p>
          <h1>Need access or feedback?</h1>
          <p>Ask the teacher to create your Student Access ID, assign lessons, or review writing work.</p>
        </section>
        <section className="contact-panel">
          <article>
            <strong>Student access</strong>
            <p>Use your full name and access ID exactly as created by your teacher.</p>
            <Link href="/login" prefetch={false}>Go to login</Link>
          </article>
          <article>
            <strong>Teacher support</strong>
            <p>If your ID does not work, send your teacher the exact full name and access ID you entered.</p>
            <Link href="/practice-tests" prefetch={false}>Explore practice</Link>
          </article>
        </section>
      </main>
    </PublicShell>
  );
}
