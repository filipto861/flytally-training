"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("FlyTally Training route error", error);
  }, [error]);

  return (
    <main className="shell state-page" role="alert">
      <p className="eyebrow">Training temporarily unavailable</p>
      <h1>We could not load this part of the aircraft.</h1>
      <p className="lede">Your saved progress is not changed by this error. Try the request again; if it persists, return to the aircraft library.</p>
      <div className="state-actions">
        <button className="state-primary" type="button" onClick={reset}>Try again</button>
        <a className="state-secondary" href="/">Aircraft library</a>
      </div>
    </main>
  );
}
