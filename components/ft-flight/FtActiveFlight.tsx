"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { withVariantQuery } from "@/lib/aircraft-applicability";
import {
  ActiveFlightClientError,
  archiveClientActiveFlight,
  createClientActiveFlight,
  deactivateClientActiveFlight,
  patchClientActiveFlight,
} from "@/lib/active-flight/client";
import type { ActiveFlight, ActiveFlightInput } from "@/lib/active-flight/types";
import { parseActiveFlightInput } from "@/lib/active-flight/validation";
import { useActiveFlightState } from "./use-active-flight";

import styles from "./ft-flight.module.css";

type DialogMode = "create" | "edit" | null;

export function FtActiveFlight({
  aircraftId,
  selectedVariant,
  activeFlight,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  activeFlight?: ActiveFlight | null;
}>) {
  const { flight, setFlight } = useActiveFlightState(aircraftId, activeFlight);
  const persistenceMode = activeFlight === undefined ? "local-only" : "server-mirror";
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = flight?.lifecycle === "ACTIVE" ? flight : null;
  const previous = flight?.lifecycle === "PREVIOUS" ? flight : null;
  const archived = flight?.lifecycle === "ARCHIVED" ? flight : null;

  async function submitFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError(null);

    const form = new FormData(formElement);
    const weightValue = Number(form.get("weight"));
    const input: ActiveFlightInput = {
      aircraftId,
      departure: { icao: String(form.get("departure") ?? "").trim().toUpperCase() },
      destination: { icao: String(form.get("destination") ?? "").trim().toUpperCase() },
      weight: {
        value: weightValue,
        unit: form.get("weightUnit") === "lb" ? "lb" : "kg",
      },
      brief: null,
    };

    const validated = parseActiveFlightInput(input);
    if (!validated) {
      setError("Check the flight setup fields.");
      setBusy(false);
      return;
    }

    try {
      if (dialogMode === "edit" && current) {
        const updated = await patchClientActiveFlight(current, {
          departure: validated.departure,
          destination: validated.destination,
          weight: validated.weight,
        });
        setFlight(updated);
      } else {
        const created = await createClientActiveFlight(validated, persistenceMode);
        setFlight(created);
      }
      setDialogMode(null);
      formElement.reset();
    } catch (caught) {
      setError(
        caught instanceof ActiveFlightClientError && caught.code === "active_flight_exists"
          ? "An active flight already exists. Deactivate it before creating another."
          : "Unable to save the flight.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      setFlight(await deactivateClientActiveFlight(current));
    } catch {
      setError("Unable to deactivate the flight.");
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    if (!previous) return;
    setBusy(true);
    setError(null);
    try {
      setFlight(await archiveClientActiveFlight(previous));
    } catch {
      setError("Unable to archive the flight.");
    } finally {
      setBusy(false);
    }
  }

  const editing = dialogMode === "edit" && current;
  const dialogTitle = editing ? "Edit flight" : "Start new flight";

  return (
    <section
      className={styles.section}
      aria-labelledby="ft-active-flight"
      data-empty={current ? "false" : "true"}
      data-lifecycle={flight?.lifecycle ?? "NONE"}
    >
      <p className={styles.eyebrow}>ACTIVE FLIGHT</p>
      <h2 id="ft-active-flight">Active Flight</h2>

      {current ? (
        <div className={styles.flightSummary}>
          <strong>{current.departure.icao} → {current.destination.icao}</strong>
          <span>{current.runway ? `RWY ${current.runway.identifier} · ` : ""}ACTIVE</span>
          <span>
            {current.weight.value} {current.weight.unit}
            {current.configuration?.flaps ? ` · FLAPS ${current.configuration.flaps}` : ""}
            {current.configuration?.antiIce ? " · ANTI-ICE ON" : ""}
          </span>
          <div className={styles.actionRow}>
            <Link
              className={styles.secondaryAction}
              href={withVariantQuery(`/aircraft/${aircraftId}/fly`, selectedVariant)}
            >
              Open operational view
            </Link>
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={() => {
                setError(null);
                setDialogMode("edit");
              }}
              disabled={busy}
            >
              Edit flight
            </button>
            <button className={styles.secondaryAction} type="button" onClick={deactivate} disabled={busy}>
              Deactivate flight
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className={styles.emptyState}>No active flight.</p>
          {previous ? (
            <div className={styles.lifecycleNotice}>
              <strong>Previous flight</strong>
              <span>
                {previous.departure.icao} → {previous.destination.icao}
                {previous.runway ? ` · RWY ${previous.runway.identifier}` : ""}
              </span>
              <button className={styles.secondaryAction} type="button" onClick={archive} disabled={busy}>
                Archive previous flight
              </button>
            </div>
          ) : archived ? (
            <p className={styles.lifecycleNotice}>Previous flight archived.</p>
          ) : null}
          <button
            className={styles.primaryAction}
            type="button"
            onClick={() => {
              setError(null);
              setDialogMode("create");
            }}
            disabled={busy}
          >
            Start new flight
          </button>
          <Link
            className={styles.textAction}
            href={withVariantQuery(`/aircraft/${aircraftId}/fly`, selectedVariant)}
          >
            Open operational view
          </Link>
        </>
      )}

      {error ? <p className={styles.formError} role="alert">{error}</p> : null}

      {dialogMode ? (
        <div className={styles.dialogBackdrop}>
          <div className={styles.flightDialog} role="dialog" aria-modal="true" aria-labelledby="ft-flight-dialog-title">
            <div className={styles.dialogHeader}>
              <div>
                <p className={styles.eyebrow}>ACTIVE FLIGHT</p>
                <h3 id="ft-flight-dialog-title">{dialogTitle}</h3>
              </div>
              <button
                className={styles.iconAction}
                type="button"
                aria-label="Close flight setup"
                onClick={() => setDialogMode(null)}
                disabled={busy}
              >
                ×
              </button>
            </div>

            <form className={styles.flightForm} onSubmit={submitFlight}>
              <label>
                Departure ICAO
                <input
                  name="departure"
                  required
                  maxLength={4}
                  pattern="[A-Za-z0-9]{4}"
                  autoCapitalize="characters"
                  defaultValue={editing ? editing.departure.icao : ""}
                />
              </label>
              <label>
                Destination ICAO
                <input
                  name="destination"
                  required
                  maxLength={4}
                  pattern="[A-Za-z0-9]{4}"
                  autoCapitalize="characters"
                  defaultValue={editing ? editing.destination.icao : ""}
                />
              </label>
              <div className={styles.fieldGroup}>
                <label htmlFor="ft-active-flight-weight">Weight</label>
                <span className={styles.inlineField}>
                  <input
                    id="ft-active-flight-weight"
                    name="weight"
                    required
                    type="number"
                    min="1"
                    step="0.1"
                    defaultValue={editing ? editing.weight.value : undefined}
                  />
                  <select
                    name="weightUnit"
                    aria-label="Weight unit"
                    defaultValue={editing ? editing.weight.unit : "kg"}
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </span>
              </div>
              <div className={styles.dialogActions}>
                <button
                  className={styles.secondaryAction}
                  type="button"
                  onClick={() => setDialogMode(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button className={styles.primaryAction} type="submit" disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save flight" : "Activate flight"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
