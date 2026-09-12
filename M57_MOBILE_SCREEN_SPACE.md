# M57 — Mobile screen-space optimization

M57 is a focused mobile UI refinement following physical iPhone screen-recording review.

## Scope

- Remove duplicated Fly/aircraft identity from the mobile flight-deck header while retaining offline readiness status.
- Compress the Fly aircraft context row and tool tabs without changing destinations or desktop behavior.
- Make checklist previous/next phase controls part of normal document flow instead of a second sticky bottom toolbar.
- Reduce the sticky Performance result footprint, with a compact idle result strip and denser ready state.
- Collapse Emergency Quick Access automatically after the pilot scrolls into the active procedure; a compact procedure bar returns to the full selector.
- Preserve iOS safe areas, bottom navigation clearance, operational data, calculations and QRH content.

## Non-goals

- No FlyTally platform consolidation.
- No aircraft data, checklist content, performance logic, interpolation policy or emergency procedure changes.
- No Learn redesign in this milestone.
- Desktop navigation and content hierarchy remain unchanged.

## Acceptance

Automated contracts cover the mobile screen-space rules and aircraft-agnostic implementation. Physical iPhone/PWA acceptance remains required for final visual judgment of browser chrome and safe-area behavior.
