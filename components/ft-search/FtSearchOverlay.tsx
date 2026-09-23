"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { AircraftSearchResult } from "@/lib/search/aircraft-search";
import { addRecentSearch, clearRecentSearches, readRecentSearches } from "@/lib/search/recent-searches";

import { FtSearchEmptyState } from "./FtSearchEmptyState";
import { FtSearchInput } from "./FtSearchInput";
import { FtSearchResults } from "./FtSearchResults";
import { FtSearchIcon } from "./icons/FtSearchIcon";
import styles from "./ft-search.module.css";

const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function FtSearchOverlay({
  aircraftId,
  aircraftIdentity,
  scope = "all",
}: Readonly<{
  aircraftId: string;
  aircraftIdentity: string;
  scope?: "all" | "learn";
}>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly AircraftSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recent, setRecent] = useState<readonly string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = useCallback(() => {
    setRecent(readRecentSearches(aircraftId));
    setOpen(true);
  }, [aircraftId]);

  const closeSearch = useCallback((restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
    setLoading(false);
    if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLocaleLowerCase("en-US") !== "k") return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [openSearch]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeSearch();
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open, closeSearch]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSelectedIndex(-1);
      setLoading(false);
      return;
    }

    setResults([]);
    setSelectedIndex(-1);
    setLoading(true);

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/aircraft/${encodeURIComponent(aircraftId)}/search?q=${encodeURIComponent(trimmed)}&limit=20`,
          { signal: controller.signal, cache: "no-store" },
        );
        if (!response.ok) {
          setResults([]);
          setSelectedIndex(-1);
          return;
        }
        const payload = (await response.json()) as { results?: AircraftSearchResult[] };
        const raw = Array.isArray(payload.results) ? payload.results : [];
        const next = scope === "learn"
          ? raw.filter((result) => result.type !== "performance")
          : raw;
        setResults(next);
        setSelectedIndex(next.length ? 0 : -1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
          setSelectedIndex(-1);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [aircraftId, open, query, scope]);

  function moveSelection(direction: 1 | -1) {
    if (!results.length) return;
    setSelectedIndex((current) => {
      const start = current < 0 ? (direction === 1 ? -1 : 0) : current;
      return (start + direction + results.length) % results.length;
    });
  }

  function activateResult(result: AircraftSearchResult) {
    setRecent(addRecentSearch(aircraftId, query));
    closeSearch(false);
    router.push(result.href);
  }

  function selectCurrent() {
    const result = selectedIndex >= 0 ? results[selectedIndex] : undefined;
    if (result) activateResult(result);
  }

  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Search aircraft workspace"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSearch}
      >
        <FtSearchIcon name="search" />
        <span>Search</span>
        <span className={styles.shortcutHint} aria-hidden="true">⌘K</span>
      </button>

      {open ? (
        <div className={styles.overlayLayer}>
          <button
            type="button"
            tabIndex={-1}
            className={styles.backdrop}
            aria-label="Close search"
            onClick={() => closeSearch()}
          />
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label={`Search ${aircraftIdentity}`}
            onKeyDown={trapFocus}
          >
            <div className={styles.dialogHeader}>
              <FtSearchInput
                value={query}
                loading={loading}
                placeholder={`Search ${aircraftIdentity}...`}
                inputRef={inputRef}
                activeDescendant={selectedIndex >= 0 ? `ft-search-result-${selectedIndex}` : undefined}
                onChange={setQuery}
                onMoveSelection={moveSelection}
                onSelectCurrent={selectCurrent}
                onEscape={() => closeSearch()}
              />
              <button type="button" className={styles.closeButton} onClick={() => closeSearch()}>
                CLOSE
              </button>
            </div>

            <div className={styles.dialogBody}>
              {query.trim().length < 2 ? (
                <FtSearchEmptyState
                  aircraftId={aircraftId}
                  scope={scope}
                  recent={recent}
                  onRecentQuery={setQuery}
                  onClearRecent={() => {
                    clearRecentSearches(aircraftId);
                    setRecent([]);
                  }}
                  onNavigate={() => closeSearch(false)}
                />
              ) : loading && !results.length ? (
                <div className={styles.noResults} role="status">Searching aircraft content…</div>
              ) : (
                <FtSearchResults
                  results={results}
                  selectedIndex={selectedIndex}
                  onSelect={activateResult}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
