import Link from "next/link";
import type { ReactNode } from "react";

import { AccountActions } from "@/components/account-actions";

const FLYTALLY_MARK = "https://fly-tally.com/logbook_icon_32.png";

export function ProductShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" href="/" aria-label="FlyTally Training home">
            <span className="brand-mark" aria-hidden="true">
              <img src={FLYTALLY_MARK} alt="" width="32" height="32" />
            </span>
            <span className="brand-copy">
              <small>Training</small>
              <strong>FlyTally</strong>
            </span>
          </Link>
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