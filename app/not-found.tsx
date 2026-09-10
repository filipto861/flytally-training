import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell state-page">
      <p className="eyebrow">Not found</p>
      <h1>This training item is not available.</h1>
      <p className="lede">It may not be published for this aircraft, or the link may refer to an older content version.</p>
      <div className="state-actions">
        <Link className="state-primary" href="/">Aircraft library</Link>
      </div>
    </main>
  );
}
