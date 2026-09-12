# M54 — Emergency access polish

M54 makes the existing source-backed QRH faster to reach without expanding the Fly toolset or inventing emergency priorities.

## Quick access

Emergency categories are derived directly from the published operational scenarios. The source order is preserved. `All` keeps the complete native procedure selector, while selecting a category narrows the selector and exposes direct one-tap procedure buttons for that category. If the current procedure belongs to the selected category it stays selected; otherwise the first published procedure in that category becomes active.

## Cockpit interaction

The quick-access index is sticky on mobile, category controls are horizontally scrollable, and procedure controls retain cockpit-sized touch targets. The existing native `<select>` remains available because it is efficient and familiar on mobile devices.

## Safety boundary

No category names, emergency priorities, memory-item classifications, or aircraft-specific procedure assumptions are hard-coded in the UI. M54 consumes only the operational Emergency DTO introduced in M53 and continues to render only published expected responses, notices, configuration context and source authority.
