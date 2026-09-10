export default function Loading() {
  return (
    <main className="shell loading-page" aria-busy="true" aria-label="Loading training content">
      <div className="loading-line loading-line-short" />
      <div className="loading-line loading-line-title" />
      <div className="loading-line" />
      <div className="loading-grid">
        <div className="loading-card" />
        <div className="loading-card" />
        <div className="loading-card" />
      </div>
    </main>
  );
}
