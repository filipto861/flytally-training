"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SessionState =
  | { readonly authenticated: false }
  | { readonly authenticated: true; readonly role: "admin" | "user"; readonly exp: number };

export function AccountActions() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Session endpoint unavailable.");
        return await response.json() as SessionState;
      })
      .then(setSession)
      .catch(error => {
        if (!controller.signal.aborted) setSession({ authenticated: false });
        if (process.env.NODE_ENV !== "production" && !controller.signal.aborted) console.warn(error);
      });
    return () => controller.abort();
  }, []);

  if (session === null) return <div className="account-actions account-actions-loading" aria-label="Account"/>;

  if (!session.authenticated) {
    return <div className="account-actions" aria-label="Account">
      <Link className="header-action" href="/api/auth/flytally/start?next=/">Sign in</Link>
    </div>;
  }

  return <div className="account-actions" aria-label="Account">
    <Link className="header-action header-action-secondary" href="/account">Account</Link>
    {session.role === "admin" ? <Link className="header-action header-action-secondary" href="/admin">Admin</Link> : null}
    <form action="/api/auth/logout" method="post">
      <button className="header-action header-action-secondary" type="submit">Sign out</button>
    </form>
  </div>;
}
