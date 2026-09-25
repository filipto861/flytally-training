"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

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
import {
  SimBriefClientError,
  importLatestSimBriefOfp,
} from "@/lib/simbrief/client";
import { parseSimBriefIdentity } from "@/lib/simbrief/ofp";
import {
  clearSimBriefIdentity,
  readSimBriefIdentity,
  writeSimBriefIdentity,
} from "@/lib/simbrief/preferences";
import type {
  SimBriefAircraftProfile,
  SimBriefIdentity,
  SimBriefImportedField,
  SimBriefPrefillProvenance,
} from "@/lib/simbrief/types";

import { useActiveFlightState } from "./use-active-flight";
import styles from "./ft-flight.module.css";

type DialogMode = "create" | "edit" | null;

function inputElement(
  form: HTMLFormElement | null,
  name: string,
): HTMLInputElement | HTMLSelectElement | null {
  const control = form?.elements.namedItem(name);
  return control instanceof HTMLInputElement || control instanceof HTMLSelectElement
    ? control
    : null;
}

function simBriefErrorMessage(error: unknown): string {
  if (!(error instanceof SimBriefClientError)) {
    return "Unable to import the latest SimBrief OFP.";
  }
  if (error.code === "simbrief_no_flight") {
    return "No current SimBrief OFP was found for this account.";
  }
  if (error.code === "aircraft_mismatch") {
    const actual = error.actualIcaoCode ?? "unknown";
    const expected = error.acceptedIcaoCodes?.join(" / ") ?? "configured aircraft";
    return `SimBrief aircraft ${actual} does not match this Training aircraft (${expected}).`;
  }
  if (error.code === "simbrief_timeout") {
    return "SimBrief did not respond in time. Try the import again.";
  }
  if (error.code === "simbrief_not_configured") {
    return "SimBrief import is not configured for this aircraft.";
  }
  if (error.code === "invalid_request") {
    return "Check the Navigraph Alias or SimBrief Pilot ID.";
  }
  return "Unable to import the latest SimBrief OFP.";
}

export function FtActiveFlight({
  aircraftId,
  selectedVariant,
  activeFlight,
  simBriefProfile,
}: Readonly<{
  aircraftId: string;
  selectedVariant?: string;
  activeFlight?: ActiveFlight | null;
  simBriefProfile?: SimBriefAircraftProfile;
}>) {
  const { flight, setFlight } = useActiveFlightState(aircraftId, activeFlight);
  const persistenceMode = activeFlight === undefined ? "local-only" : "server-mirror";
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [busy, setBusy] = useState(false);
  const [simBriefBusy, setSimBriefBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simBriefError, setSimBriefError] = useState<string | null>(null);
  const [simBriefIdentity, setSimBriefIdentity] = useState<SimBriefIdentity>({
    kind: "alias",
    value: "",
  });
  const [rememberSimBrief, setRememberSimBrief] = useState(true);
  const [prefillProvenance, setPrefillProvenance] =
    useState<SimBriefPrefillProvenance | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const current = flight?.lifecycle === "ACTIVE" ? flight : null;
  const previous = flight?.lifecycle === "PREVIOUS" ? flight : null;
  const archived = flight?.lifecycle === "ARCHIVED" ? flight : null;

  function openDialog(mode: Exclude<DialogMode, null>) {
    setError(null);
    setSimBriefError(null);
    setDialogMode(mode);
    setPrefillProvenance(
      mode === "edit" ? current?.prefillProvenance ?? null : null,
    );
    const saved = readSimBriefIdentity(window.localStorage);
    if (saved) {
      setSimBriefIdentity(saved);
      setRememberSimBrief(true);
    }
  }

  function clearImportedField(field: SimBriefImportedField) {
    setPrefillProvenance((currentProvenance) => {
      if (!currentProvenance?.fields.includes(field)) return currentProvenance;
      const fields = currentProvenance.fields.filter((item) => item !== field);
      return fields.length ? { ...currentProvenance, fields } : null;
    });
  }

  async function importSimBrief() {
    const identity = parseSimBriefIdentity(simBriefIdentity);
    if (!identity) {
      setSimBriefError("Check the Navigraph Alias or SimBrief Pilot ID.");
      return;
    }

    if (rememberSimBrief) {
      writeSimBriefIdentity(window.localStorage, identity);
    } else {
      clearSimBriefIdentity(window.localStorage);
    }

    setSimBriefBusy(true);
    setSimBriefError(null);
    try {
      const ofp = await importLatestSimBriefOfp(aircraftId, identity);
      const form = formRef.current;
      const departure = inputElement(form, "departure");
      const destination = inputElement(form, "destination");
      const weight = inputElement(form, "weight");
      const unit = inputElement(form, "weightUnit");

      if (!departure || !destination || !weight || !unit) {
        throw new SimBriefClientError("invalid_form");
      }

      departure.value = ofp.departure.icao;
      destination.value = ofp.destination.icao;
      weight.value = String(ofp.weight.value);
      unit.value = ofp.weight.unit;

      setPrefillProvenance({
        provider: "simbrief",
        requestId: ofp.requestId,
        generatedAt: ofp.generatedAt,
        importedAt: new Date().toISOString(),
        aircraftIcaoCode: ofp.aircraftIcaoCode,
        fields: ["departure", "destination", "weight"],
      });
    } catch (caught) {
      setSimBriefError(simBriefErrorMessage(caught));
    } finally {
      setSimBriefBusy(false);
    }
  }

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
      prefillProvenance,
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
          prefillProvenance: validated.prefillProvenance ?? null,
        });
        setFlight(updated);
      } else {
        const created = await createClientActiveFlight(validated, persistenceMode);
        setFlight(created);
      }
      setDialogMode(null);
      setPrefillProvenance(null);
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
  const hasSimBriefPrefill = Boolean(current?.prefillProvenance?.fields.length);

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
          <span>
            {current.runway ? `RWY ${current.runway.identifier} · ` : ""}ACTIVE
            {hasSimBriefPrefill ? (
              <span className={styles.provenanceBadge}>SIMBRIEF PREFILL</span>
            ) : null}
          </span>
          <span>
            {current.weight.value} {current.weight.unit}
            {current.configuration ? ` · FLAPS ${current.configuration.flaps}` : ""}
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
              onClick={() => openDialog("edit")}
              disabled={busy}
            >
              Edit flight
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={deactivate}
              disabled={busy}
            >
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
              <button
                className={styles.secondaryAction}
                type="button"
                onClick={archive}
                disabled={busy}
              >
                Archive previous flight
              </button>
            </div>
          ) : archived ? (
            <p className={styles.lifecycleNotice}>Previous flight archived.</p>
          ) : null}
          <button
            className={styles.primaryAction}
            type="button"
            onClick={() => openDialog("create")}
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
          <div
            className={styles.flightDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ft-flight-dialog-title"
          >
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
                disabled={busy || simBriefBusy}
              >
                ×
              </button>
            </div>

            <form ref={formRef} className={styles.flightForm} onSubmit={submitFlight}>
              {simBriefProfile ? (
                <section className={styles.simBriefImport} aria-label="SimBrief import">
                  <div className={styles.simBriefImportHeader}>
                    <div>
                      <p className={styles.eyebrow}>SIMBRIEF</p>
                      <strong>Import latest OFP</strong>
                    </div>
                    <span className={styles.simBriefAircraft}>
                      {simBriefProfile.acceptedIcaoCodes.join(" / ")}
                    </span>
                  </div>
                  <div className={styles.simBriefIdentity}>
                    <select
                      aria-label="SimBrief account identifier type"
                      value={simBriefIdentity.kind}
                      onChange={(event) =>
                        setSimBriefIdentity((currentIdentity) => ({
                          ...currentIdentity,
                          kind: event.target.value === "pilot-id" ? "pilot-id" : "alias",
                        }))
                      }
                      disabled={simBriefBusy}
                    >
                      <option value="alias">Navigraph Alias</option>
                      <option value="pilot-id">SimBrief Pilot ID</option>
                    </select>
                    <input
                      aria-label={
                        simBriefIdentity.kind === "pilot-id"
                          ? "SimBrief Pilot ID"
                          : "Navigraph Alias"
                      }
                      value={simBriefIdentity.value}
                      inputMode={simBriefIdentity.kind === "pilot-id" ? "numeric" : "text"}
                      maxLength={simBriefIdentity.kind === "pilot-id" ? 7 : 64}
                      onChange={(event) =>
                        setSimBriefIdentity((currentIdentity) => ({
                          ...currentIdentity,
                          value: event.target.value,
                        }))
                      }
                      placeholder={
                        simBriefIdentity.kind === "pilot-id"
                          ? "1234567"
                          : "Your Navigraph Alias"
                      }
                      disabled={simBriefBusy}
                    />
                    <button
                      className={styles.secondaryAction}
                      type="button"
                      onClick={importSimBrief}
                      disabled={busy || simBriefBusy || !simBriefIdentity.value.trim()}
                    >
                      {simBriefBusy ? "Importing…" : "Import latest OFP"}
                    </button>
                  </div>
                  <label className={styles.rememberSimBrief}>
                    <input
                      type="checkbox"
                      checked={rememberSimBrief}
                      onChange={(event) => setRememberSimBrief(event.target.checked)}
                    />
                    Remember this identifier on this device
                  </label>
                  {simBriefError ? (
                    <p className={styles.formError} role="alert">{simBriefError}</p>
                  ) : prefillProvenance ? (
                    <p className={styles.simBriefStatus}>
                      Imported OFP {prefillProvenance.requestId}
                      {prefillProvenance.generatedAt
                        ? ` · generated ${new Date(prefillProvenance.generatedAt).toLocaleString("en-GB")}`
                        : ""}
                    </p>
                  ) : null}
                </section>
              ) : null}

              <label>
                <span className={styles.fieldLabel}>
                  Departure ICAO
                  {prefillProvenance?.fields.includes("departure") ? (
                    <span className={styles.provenanceBadge} aria-hidden="true">SIMBRIEF</span>
                  ) : null}
                </span>
                <input
                  name="departure"
                  required
                  maxLength={4}
                  pattern="[A-Za-z0-9]{4}"
                  autoCapitalize="characters"
                  defaultValue={editing ? editing.departure.icao : ""}
                  onChange={() => clearImportedField("departure")}
                />
              </label>
              <label>
                <span className={styles.fieldLabel}>
                  Destination ICAO
                  {prefillProvenance?.fields.includes("destination") ? (
                    <span className={styles.provenanceBadge} aria-hidden="true">SIMBRIEF</span>
                  ) : null}
                </span>
                <input
                  name="destination"
                  required
                  maxLength={4}
                  pattern="[A-Za-z0-9]{4}"
                  autoCapitalize="characters"
                  defaultValue={editing ? editing.destination.icao : ""}
                  onChange={() => clearImportedField("destination")}
                />
              </label>
              <div className={styles.fieldGroup}>
                <label htmlFor="ft-active-flight-weight">
                  <span className={styles.fieldLabel}>
                    Weight
                    {prefillProvenance?.fields.includes("weight") ? (
                      <span className={styles.provenanceBadge} aria-hidden="true">SIMBRIEF TOW</span>
                    ) : null}
                  </span>
                </label>
                <span className={styles.inlineField}>
                  <input
                    id="ft-active-flight-weight"
                    name="weight"
                    required
                    type="number"
                    min="1"
                    step="0.1"
                    defaultValue={editing ? editing.weight.value : undefined}
                    onChange={() => clearImportedField("weight")}
                  />
                  <select
                    name="weightUnit"
                    aria-label="Weight unit"
                    defaultValue={editing ? editing.weight.unit : "kg"}
                    onChange={() => clearImportedField("weight")}
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
                  disabled={busy || simBriefBusy}
                >
                  Cancel
                </button>
                <button
                  className={styles.primaryAction}
                  type="submit"
                  disabled={busy || simBriefBusy}
                >
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
