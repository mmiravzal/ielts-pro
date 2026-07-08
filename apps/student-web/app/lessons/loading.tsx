export default function LessonsLoading() {
  return (
    <div className="student-app-shell">
      <aside className="student-app-sidebar">
        <div className="student-app-brand">Ielts <span>Pro</span></div>
        <nav aria-label="Student navigation">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </nav>
        <div className="student-sidebar-footer">
          <div className="skeleton-row short" />
          <div className="skeleton-row short" />
        </div>
      </aside>
      <div className="student-app-main">
        <header className="student-page-topbar">
          <div className="student-topbar-search">
            <div className="skeleton-row" />
          </div>
          <div className="student-topbar-actions">
            <div className="skeleton-circle" />
            <div className="skeleton-circle" />
            <div className="skeleton-row short" />
          </div>
        </header>
        <main className="student-page">
          <section className="student-hero-panel compact">
            <div className="skeleton-block" style={{ height: 80 }} />
          </section>
          <section className="student-card-list">
            {[1, 2, 3].map((i) => (
              <article key={i} className="student-lesson-card">
                <div className="skeleton-block" style={{ height: 120 }} />
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
