# FlyTally Training v2.8 — Compliance & Operational Safety Foundation

Status: private-beta implementation baseline. The canonical public legal notices live at `https://fly-tally.com/legal`; Training links to them rather than maintaining a second legal copy.

## Operational safety contract

FlyTally Training is a supplemental training/reference aid. Current approved aircraft documentation, operator procedures, regulatory requirements and qualified instruction remain authoritative.

### Performance
- An operational result may use an exact published source row regardless of interpolation policy.
- An input between published rows is supported only when the governed `PerformanceDataset.interpolation` value is explicitly `linear-explicit`.
- Runtime/Flight Deck code must never rewrite a dataset from `none` to `linear-explicit`.
- Extrapolation outside the published altitude/temperature/ISA envelope is always unsupported.
- Missing bounding rows, unsupported surfaces and incomplete source authority fail closed.
- Calculation UI must distinguish exact published rows from explicitly authorised bounded interpolation.

### Source authority & applicability
- Operational content is released through the governed content lifecycle; draft AI output cannot publish itself.
- Safety-critical operational domains (checklists, procedures, performance, weight & balance, limitations and abnormal/emergency) may be approved or published only from sources classified as `CONTROLLING` or `OPERATING_REFERENCE`.
- Aircraft/variant applicability is filtered before the operational client boundary.
- Source document identity/revision and content publication status are part of the safety boundary.
- Flight Deck independently re-checks current publication freshness and source authority for checklists, performance and abnormal/emergency content before exposing it.
- The legacy normal-flight fallback is not permitted in Flight Deck because it does not carry the same governed publication/source contract.
- If applicability, authority, freshness or database governance is ambiguous, the operational experience withholds the affected module rather than inferring or serving stale content.

### Emergency/reference wording
- FlyTally must not imply that a derived training page is an approved AFM/POH/QRH/MEL/checklist unless the underlying document and approval scope support that statement.
- Product copy should prefer Training Reference / Quick Reference / Emergency Reference where the material is a FlyTally derivative.

## AI and source-rights boundary

- OpenAI drafting is admin-only and draft-only; human governed review/approval is required before publication.
- `store:false` or equivalent API controls do not replace a source-rights assessment.
- Proprietary, NDA-restricted or otherwise non-shareable manual excerpts must not be sent to an external model/provider without verified permission for that processing.
- Source PDFs remain local during FlyTally source fingerprinting; FlyTally stores provenance/fingerprint metadata rather than the source document itself unless a future governed storage feature is explicitly introduced and reviewed.

## Privacy/storage baseline

Training may use:
- a required authentication/session mechanism;
- browser local storage for learner progress, form state and preferences;
- a service-worker cache for explicitly prepared offline flight-deck content;
- PostgreSQL for server-side identity/progress/governed content.

These functional mechanisms do not by themselves justify a non-essential-cookie consent banner. Advertising/behavioural tracking must not be introduced without a privacy/consent review.

Authenticated users have a Training-only `/account` privacy surface that can export their server-side learner progress and delete that progress. Deletion writes a minimal privacy-reset barrier so older offline/local progress from another device cannot silently recreate pre-deletion history. Progress ingestion and deletion take the same account-scoped PostgreSQL transaction advisory lock, preventing a concurrent old-device sync from racing across the reset boundary. Clearing the current device removes Training local/session storage, FlyTally Training caches and the Training service-worker registration. Main FlyTally identity/account deletion remains managed in Logbook; Training progress is a separate persistence boundary and can be erased independently. Logbook account deletion uses a purpose-bound, short-lived server-to-server erasure assertion and must receive a successful Training erasure response before disabling the main sign-in identity.

Canonical notices: Privacy, Terms, Cookies & Local Storage, Aviation Safety, Providers and Report are linked from the global footer through `NEXT_PUBLIC_FLYTALLY_LEGAL_URL`.

## Processor/service register

- **Vercel** — hosting, delivery, server-side runtime.
- **Neon** — Training PostgreSQL infrastructure.
- **FlyTally Logbook identity service** — short-lived trusted SSO assertion issuer.
- **OpenAI** — optional admin-only drafting provider when configured.

Adding a new production processor/provider requires an update to the canonical public provider notice, internal data-flow/processor record and DPA/transfer review before launch.

## Security boundary

- Global browser security headers include HSTS in production, clickjacking protection, restrictive Permissions Policy and a Content Security Policy limited to FlyTally-owned runtime resources.
- State-changing browser requests for Training progress, privacy deletion and logout reject cross-site or mismatched-origin requests in addition to the session cookie's SameSite policy. The mutation guard fails closed when both Origin and explicit same-origin Fetch Metadata are absent.
- Mutating responses and authenticated progress responses use no-store caching.
- Public/user supplied aircraft identifiers accepted by progress endpoints are constrained to the platform aircraft-id grammar rather than arbitrary text.
- Published Training catalogue/aircraft/reference pages are currently reachable without a mandatory Training session, while learner progress, account data, mutations and administration are authenticated. That access architecture is not proof of publication rights: public-display/licensing permission must be verified for each source-derived content set before broad public/commercial exposure.
- Training has no user-data public-sharing endpoint; pilot-created public flight sharing remains a Logbook boundary with its own limited public DTO, revocation and disclosure controls.
- Rate limiting remains a platform-level follow-up where a durable shared limiter is justified; an in-memory serverless limiter must not be treated as a security control.

## Incident response

Use the platform v2.8 incident process: contain, scope affected data/users/systems, rotate credentials or invalidate sessions if required, preserve minimal evidence, document decisions, assess personal-data breach reporting/user notification, remediate and add a regression test/control. Do not place secrets or unnecessary personal/source-confidential data in GitHub/CI incident records.

## v2.8 Training regression requirements

- runtime does not opt a source into interpolation;
- safety-critical publication rejects training-only, simulator-only or unclassified source authority;
- Flight Deck withholds stale, missing-source or non-authoritative operational modules and has no legacy checklist fallback;
- exact source rows work with interpolation `none`;
- between-row values fail closed with interpolation `none`;
- between-row values work only with `linear-explicit` and remain bounded;
- extrapolation remains blocked;
- legal/safety links are globally available;
- state-changing browser routes reject cross-site origins and authenticated mutation responses are not cacheable;
- browser security headers retain CSP, frame/object restrictions and cross-origin isolation;
- AI drafting remains human-approved and source-rights constrained;
- source PDFs remain non-hosted in the existing ingestion flow;
- Training data export/delete routes remain authenticated and non-cacheable;
- Training data deletion requires the fail-closed same-origin mutation guard plus explicit typed confirmation;
- Training deletion and progress ingestion serialize on the same account-scoped transaction advisory lock;
- Logbook account deletion uses the dedicated short-lived `ftp1` privacy-erasure contract and fails closed before local account erasure if Training cannot confirm deletion;
- progress ingestion respects the privacy-reset timestamp so stale offline events cannot resurrect deleted history;
- current-device privacy clearing removes Training browser storage, FlyTally caches and service-worker registration;
- Vercel preview builds remain skipped for ordinary feature branches, with production deployment only after validated merge to `main`.

## C5/C6 release audit

The cross-product release classification, public-access boundary and external/legal blockers are recorded in `V2_8_RELEASE_AUDIT.md`. Technical private-beta readiness must not be described as public/commercial legal clearance.
