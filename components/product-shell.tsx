import Link from "next/link";
import type { ReactNode } from "react";

import { AccountActions } from "@/components/account-actions";
import { LegalLinks } from "@/components/legal-links";

const FLYTALLY_MARK = "/pwa-icon";

export function ProductShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
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
      <div id="main-content" className="app-main-content" tabIndex={-1}>{children}</div>
      <footer className="app-footer">
        <div className="app-footer-inner" style={{alignItems:"flex-start",padding:"18px 0",minHeight:"84px"}}>
          <div>
            <strong style={{display:"block",color:"#526277",marginBottom:"4px"}}>FlyTally Training</strong>
            <span>Supplemental training/reference aid · current approved aircraft, operator and regulatory documents remain authoritative.</span>
          </div>
          <LegalLinks />
        </div>
      </footer>
    </>
  );
}
