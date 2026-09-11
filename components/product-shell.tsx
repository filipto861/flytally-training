import Link from "next/link";
import type { ReactNode } from "react";

import { AccountActions } from "@/components/account-actions";

export function ProductShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" href="/" aria-label="FlyTally Training home">
            <span className="brand-mark" aria-hidden="true">FT</span>
            <span>
              <strong>FlyTally</strong>
              <small>Training</small>
            </span>
          </Link>

          <nav className="global-nav" aria-label="Global navigation">
            <Link href="/">Aircraft library</Link>
          </nav>

          <AccountActions />
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <div className="app-footer-inner">
          <span>FlyTally Training</span>
          <span>Training aid · current approved aircraft, operator and regulatory documents remain authoritative.</span>
        </div>
      </footer>
    </>
  );
}
