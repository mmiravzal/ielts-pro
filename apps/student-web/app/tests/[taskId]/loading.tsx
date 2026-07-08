export default function TestLoading() {
  return (
    <div className="student-exam-shell">
      <header className="student-exam-topbar">
        <div className="student-app-brand">IELTS <span>Pro</span></div>
        <div className="student-exam-meta">
          <div className="skeleton-row short" />
        </div>
      </header>
      <main className="test-page">
        <div className="skeleton-block" style={{ height: 400 }} />
      </main>
    </div>
  );
}
