import Link from "next/link";
import type { ReactNode } from "react";

export function ProductShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" href="/">
            <span className="brand-mark">FT</span>
            <span>
              <strong>FlyTally</strong>
              <small>Training</small>
            </span>
          </Link>

          <nav className="global-nav" aria-label="Global navigation">
            <Link href="/">Aircraft</Link>
          </nav>

          <span className="product-tag">Simulator training</span>
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>FlyTally Training</span>
          <span>Learn the aircraft. Fly the aircraft.</span>
        </div>
      </footer>
    </>
  );
}
