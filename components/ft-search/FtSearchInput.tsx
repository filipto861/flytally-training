"use client";

import type { KeyboardEvent, RefObject } from "react";

import { FtSearchIcon } from "./icons/FtSearchIcon";
import styles from "./ft-search.module.css";

export function FtSearchInput({
  value,
  loading,
  placeholder,
  inputRef,
  activeDescendant,
  onChange,
  onMoveSelection,
  onSelectCurrent,
  onEscape,
}: Readonly<{
  value: string;
  loading: boolean;
  placeholder: string;
  inputRef: RefObject<HTMLInputElement | null>;
  activeDescendant?: string;
  onChange: (value: string) => void;
  onMoveSelection: (direction: 1 | -1) => void;
  onSelectCurrent: () => void;
  onEscape: () => void;
}>) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onMoveSelection(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onMoveSelection(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onSelectCurrent();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
    }
  }

  return (
    <div className={styles.inputRow}>
      <FtSearchIcon name="search" />
      <input
        ref={inputRef}
        className={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-controls="ft-search-results"
        aria-activedescendant={activeDescendant}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
      />
      <span className={styles.loadingState} role="status" aria-live="polite">
        {loading ? "SEARCHING" : ""}
      </span>
    </div>
  );
}
