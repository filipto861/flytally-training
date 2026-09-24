import { expect, test, type Locator, type Page } from "@playwright/test";

const shellOnBase = "http://127.0.0.1:3001";
const aircraftPath = "/aircraft/browser-ci-aircraft";

async function workspaceNavigation(
  page: Page,
  projectName: string,
): Promise<Locator> {
  const shell = page.locator('[data-ft-shell="true"]');

  if (projectName === "desktop-chromium") {
    return shell
      .getByRole("navigation", { name: "Aircraft workspace sections" })
      .first();
  }

  const trigger = shell.getByRole("button", { name: "Open aircraft navigation" });
  await expect(trigger).toBeVisible();
  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
  }

  const drawer = shell.getByRole("dialog", { name: "Aircraft navigation" });
  await expect(drawer).toBeVisible();
  return drawer.getByRole("navigation", { name: "Aircraft workspace sections" });
}

test("W0 keeps the legacy aircraft view when FT_NEW_SHELL is off", async ({ page }) => {
  await page.goto(aircraftPath);
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  const legacyNav = page.locator('section[aria-label="Aircraft navigation"]');
  await expect(legacyNav).toBeVisible();
  await expect(legacyNav.getByRole("navigation", { name: "Pilot workspace" })).toBeVisible();
});

test("W1 mounts the new shell without duplicate legacy navigation when the flag is on", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const shell = page.locator('[data-ft-shell="true"]');
  await expect(shell).toBeVisible();
  await expect(shell.getByText("Browser CI Aircraft", { exact: true }).first()).toBeVisible();
  const profile = shell.locator('[aria-label^="Aircraft profile:"]');
  await expect(profile).toHaveCount(1);
  await expect(profile).toHaveAttribute("aria-label", "Aircraft profile: Standard");

  const legacyNav = page.locator('section[aria-label="Aircraft navigation"]');
  await expect(legacyNav).toBeHidden();
});

test("P1.1 exposes Learn/EFB mode controls on desktop and touch navigation", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/learn`);

  const shell = page.locator('[data-ft-shell="true"]');
  const sideNav = shell.getByRole("navigation", { name: "Aircraft workspace sections" }).first();
  const drawerTrigger = shell.getByRole("button", { name: "Open aircraft navigation" });

  if (testInfo.project.name === "desktop-chromium") {
    await expect(sideNav).toBeVisible();
    await expect(drawerTrigger).toBeHidden();
    await expect(sideNav.getByRole("link", { name: "Learn", exact: true })).toBeVisible();
    await expect(sideNav.getByRole("link", { name: "Systems", exact: true })).toBeVisible();
    await expect(sideNav.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);
    return;
  }

  await expect(sideNav).toBeHidden();
  await expect(drawerTrigger).toBeVisible();
  await drawerTrigger.click();

  const drawer = shell.getByRole("dialog", { name: "Aircraft navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("link", { name: "LEARN", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(drawer.getByRole("link", { name: "EFB", exact: true })).toBeVisible();
  const drawerNav = drawer.getByRole("navigation", { name: "Aircraft workspace sections" });
  await expect(drawerNav.getByRole("link", { name: "Learn", exact: true })).toBeVisible();
  await expect(drawerNav.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(drawerTrigger).toBeFocused();
});

test("P1.1 keeps operational fast path inside EFB only", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/learn`);
  await expect(page.getByRole("navigation", { name: "Operational fast path" })).toHaveCount(0);

  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  const fastPath = page.getByRole("navigation", { name: "Operational fast path" });
  await expect(fastPath).toBeVisible();
  await expect(fastPath.getByRole("button")).toHaveCount(4);

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    await expect(fastPath.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
});

test("P1.1 mode-specific navigation exposes only the selected product surface", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/systems`);
  let nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(nav.getByRole("link", { name: "Systems", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);

  await page.goto(`${shellOnBase}${aircraftPath}/performance`);
  nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(nav.getByRole("link", { name: "Performance", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Systems", exact: true })).toHaveCount(0);
});

async function openAircraftSearch(page: Page, viaShortcut = false): Promise<Locator> {
  await page.goto(`${shellOnBase}${aircraftPath}`);
  const trigger = page.getByRole("button", { name: "Search aircraft workspace" });
  await expect(trigger).toBeVisible();

  if (viaShortcut) await page.keyboard.press("Control+K");
  else await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Search Browser CI Aircraft" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("W2 search trigger opens from click and Ctrl+K", async ({ page }) => {
  let dialog = await openAircraftSearch(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);

  dialog = await openAircraftSearch(page, true);
  await expect(dialog).toBeVisible();
});

test("W2 Escape closes the search overlay and restores trigger focus", async ({ page }) => {
  const dialog = await openAircraftSearch(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Search aircraft workspace" })).toBeFocused();
});

test("W2 empty state exposes deterministic sections and hides absent flight context", async ({ page }) => {
  const dialog = await openAircraftSearch(page);

  for (const heading of ["RECENT", "QUICK ACCESS", "BROWSE BY TYPE"]) {
    await expect(dialog.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  await expect(dialog.getByRole("heading", { name: "CURRENT FLIGHT", exact: true })).toHaveCount(0);
});

test("W2 checklist query returns relevant aircraft-scoped results", async ({ page }) => {
  const dialog = await openAircraftSearch(page);
  const input = dialog.getByRole("searchbox", { name: "Search Browser CI Aircraft..." });
  await input.fill("checklist");

  const results = dialog.getByRole("listbox", { name: "Search results" });
  await expect(results).toBeVisible();
  await expect(results.getByRole("option", { name: /^Browser CI Checklist\b/ })).toBeVisible();
});

test("W2 selecting a result navigates to its canonical route", async ({ page }) => {
  const dialog = await openAircraftSearch(page);
  const input = dialog.getByRole("searchbox", { name: "Search Browser CI Aircraft..." });
  await input.fill("Browser CI Checklist");

  const result = dialog.getByRole("option", { name: /^Browser CI Checklist\b/ });
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/checklists`);
});

test("W2 Arrow keys move selection and Enter activates the selected result", async ({ page }) => {
  const dialog = await openAircraftSearch(page);
  const input = dialog.getByRole("searchbox", { name: "Search Browser CI Aircraft..." });
  await input.fill("performance");

  const options = dialog.getByRole("option");
  await expect(options).toHaveCount(3);
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

  await input.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

  await input.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${aircraftPath}/performance#browser-takeoff-grid$`));
});

test("P1.1 Learn search excludes EFB Performance results and shortcuts", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/learn`);
  const trigger = page.getByRole("button", { name: "Search aircraft workspace" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Search Browser CI Aircraft" });
  await expect(dialog.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);

  const input = dialog.getByRole("searchbox", { name: "Search Browser CI Aircraft..." });
  await input.fill("performance");
  await expect(dialog.getByRole("option")).toHaveCount(0);
});

test("P1.1 EFB chrome does not expose the knowledge search", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  await expect(page.getByRole("button", { name: "Search aircraft workspace" })).toHaveCount(0);
});

async function waitForFastPathShortcuts(page: Page): Promise<Locator> {
  const rail = page.getByRole("navigation", { name: "Operational fast path" });
  await expect(rail).toHaveAttribute("data-shortcuts-ready", "true");
  return rail;
}

async function openFastPath(page: Page, label: "CHECKLIST" | "QRH" | "PERF" | "REF") {
  const originalUrl = `${shellOnBase}${aircraftPath}/efb`;
  await page.goto(originalUrl);
  const rail = page.getByRole("navigation", { name: "Operational fast path" });
  await rail.getByRole("button", { name: label, exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(panel).toBeVisible();
  await expect(page).toHaveURL(originalUrl);
  return panel;
}

test("W3 rail opens fast path panel without navigating", async ({ page }) => {
  const panel = await openFastPath(page, "CHECKLIST");
  await expect(panel.getByRole("tab", { name: "CHECKLIST", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("W3 Escape closes the fast path panel", async ({ page }) => {
  const panel = await openFastPath(page, "CHECKLIST");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/efb`);
});

test("W3 Ctrl+Shift+1 opens CHECKLIST directly", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  await waitForFastPathShortcuts(page);
  await page.keyboard.press("Control+Shift+1");
  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("tab", { name: "CHECKLIST", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("W3 Ctrl+Shift+2 opens QRH directly", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  await waitForFastPathShortcuts(page);
  await page.keyboard.press("Control+Shift+2");
  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("tab", { name: "QRH", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    panel.getByRole("region", { name: "Emergency quick reference" }),
  ).toBeVisible();
});

test("P5 QRH fast path renders governed operational content without navigation", async ({ page }) => {
  const panel = await openFastPath(page, "QRH");
  const qrh = panel.getByRole("region", { name: "Emergency quick reference" });

  await expect(qrh).toBeVisible();
  await expect(
    qrh.getByRole("heading", { name: "Generic Condition A", exact: true }),
  ).toBeVisible();
  await expect(qrh.getByText("Action A", { exact: true })).toBeVisible();
  await expect(qrh.getByText("Action B", { exact: true })).toBeVisible();

  const authority = qrh.locator("details").filter({ hasText: "Source & authority" });
  await expect(authority).not.toHaveAttribute("open", "");
  await authority.getByText("Source & authority", { exact: true }).click();
  await expect(authority).toHaveAttribute("open", "");
  await expect(authority.getByText(/browser-ci-abnormal-source/)).toBeVisible();

  await expect(qrh.getByText("Training prompt A", { exact: true })).toHaveCount(0);
  await expect(qrh.getByText("Training explanation A", { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/efb`);
});

test("W3 checklist state persists after closing and reopening the panel", async ({ page }) => {
  const panel = await openFastPath(page, "CHECKLIST");
  const battery = panel.getByRole("checkbox", { name: /Battery/ });
  await expect(battery).not.toBeChecked();
  await battery.check();
  await expect(battery).toBeChecked();

  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);

  const indicator = page.getByRole("button", { name: "Open checklist progress 1 of 2" });
  await expect(indicator).toBeVisible();
  await indicator.click();

  const reopened = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(reopened).toBeVisible();
  await expect(reopened.getByRole("checkbox", { name: /Battery/ })).toBeChecked();
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/efb`);
});



test("P5 legacy checklist progress migrates into the shared new-shell session", async ({ page }) => {
  const legacyKey =
    "flytally:flight-checklist:v1:browser-ci-aircraft:Standard:Browser CI Checklist";
  const canonicalKey =
    "flytally-training-checklist-session:browser-ci-aircraft:Standard:Browser%20CI%20Checklist";

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    {
      key: legacyKey,
      value: JSON.stringify({
        version: 1,
        phaseId: "before-start",
        completedIds: ["battery"],
      }),
    },
  );

  const panel = await openFastPath(page, "CHECKLIST");
  await expect(panel.getByRole("checkbox", { name: /Battery/ })).toBeChecked();
  await expect(panel.getByRole("checkbox", { name: /Parking brake/ })).not.toBeChecked();

  const storageState = await page.evaluate(
    ({ legacy, canonical }) => ({
      legacy: window.localStorage.getItem(legacy),
      canonical: window.sessionStorage.getItem(canonical),
    }),
    { legacy: legacyKey, canonical: canonicalKey },
  );

  expect(storageState.legacy).toBeNull();
  expect(storageState.canonical).not.toBeNull();
});

test("W3 panel is a 520px desktop drawer and a full-screen touch sheet", async ({ page }, testInfo) => {
  const panel = await openFastPath(page, "CHECKLIST");
  const box = await panel.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;

  if (testInfo.project.name === "desktop-chromium") {
    expect(Math.abs(box.width - 520)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(2);
  } else {
    expect(Math.abs(box.width - viewport.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(box.height - viewport.height)).toBeLessThanOrEqual(2);
  }
});

test("P1.1 aircraft entry requires an explicit Learn or EFB choice", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft mode chooser" });
  await expect(launch).toBeVisible();
  await expect(launch.getByRole("heading", { name: "Learn the aircraft", exact: true })).toBeVisible();
  await expect(launch.getByRole("heading", { name: "Operate the flight", exact: true })).toBeVisible();
  await expect(launch.getByRole("link", { name: "Open Learn", exact: true })).toHaveAttribute(
    "href",
    `${aircraftPath}/learn?variant=Standard`,
  );
  await expect(launch.getByRole("link", { name: "Open EFB", exact: true })).toHaveAttribute(
    "href",
    `${aircraftPath}/efb?variant=Standard`,
  );
  await expect(launch).toContainText("No active flight");
});

test("P1.1 mode chooser keeps Recent secondary without fabricating history", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft mode chooser" });
  const recent = launch.getByRole("region", { name: "Recent" });
  await expect(recent).toBeVisible();
  await expect(recent).toContainText("Nothing recent.");
});

test("P1.1 mode chooser replaces the legacy Fly Learn Reference command surface", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  await expect(page.getByRole("main", { name: "Aircraft mode chooser" })).toBeVisible();
  await expect(page.locator(".pilot-command-grid")).toHaveCount(0);
  await expect(page.locator(".pilot-command-panel")).toHaveCount(0);
});

test("P0 flag off preserves the legacy aircraft command surface", async ({ page }) => {
  await page.goto(aircraftPath);

  await expect(page.getByRole("main", { name: "Aircraft mode chooser" })).toHaveCount(0);
  const legacy = page.locator(".pilot-command-grid");
  await expect(legacy).toBeVisible();
  await expect(legacy.getByRole("heading", { name: "Fly", exact: true })).toBeVisible();
  await expect(legacy.getByRole("heading", { name: "Learn", exact: true })).toBeVisible();
  await expect(legacy.getByRole("heading", { name: "Reference", exact: true })).toBeVisible();
});

async function openP1Flight(page: Page): Promise<Locator> {
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);
  const flight = page.getByRole("main", { name: "Flight workspace" });
  await expect(flight).toBeVisible();
  return flight;
}

test("P1 Flight page exposes the Flight Brief structure", async ({ page }) => {
  const flight = await openP1Flight(page);
  await expect(flight.getByRole("heading", { name: "Flight", exact: true })).toBeVisible();
  await expect(
    flight.getByRole("region", { name: "Flight Brief" }),
  ).toBeVisible();
});

test("P1 Flight page shows the Active Flight empty state", async ({ page }) => {
  const flight = await openP1Flight(page);
  const active = flight.getByRole("region", { name: "Active Flight" });

  await expect(active).toHaveAttribute("data-empty", "true");
  await expect(active).toContainText("No active flight.");
  await expect(
    active.getByRole("button", { name: "Start new flight", exact: true }),
  ).toBeVisible();
  await expect(
    active.getByRole("link", { name: "Open operational view", exact: true }),
  ).toHaveAttribute("href", new RegExp(`${aircraftPath}/fly`));
});

test("P1 Flight Brief Performance stays visibly empty without active-flight data", async ({ page }) => {
  const flight = await openP1Flight(page);
  const performance = flight.getByRole("region", { name: "Performance", exact: true });

  await expect(performance).toHaveAttribute("data-empty", "true");
  await expect(performance.getByText("Flight brief", { exact: true })).toBeVisible();
  await expect(performance).toContainText("No active flight.");
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveCount(0);
});

test("P1 Flight Brief Flight Considerations stays visibly empty", async ({ page }) => {
  const flight = await openP1Flight(page);
  const section = flight.getByRole("region", { name: "Flight Considerations" });

  await expect(section).toHaveAttribute("data-empty", "true");
  await expect(section).toContainText("No active flight.");
});

test("P1.1 EFB Flight Brief does not expose Training Recommendations", async ({ page }) => {
  const flight = await openP1Flight(page);
  await expect(
    flight.getByRole("region", { name: "Training Recommendations" }),
  ).toHaveCount(0);
});

test("P1 Flight Brief Relevant Procedures stays visibly empty", async ({ page }) => {
  const flight = await openP1Flight(page);
  const section = flight.getByRole("region", { name: "Relevant Procedures" });

  await expect(section).toHaveAttribute("data-empty", "true");
  await expect(section).toContainText("No active flight.");
});

test("P1 Flight page exposes an explicit Recent Flights empty state", async ({ page }) => {
  const flight = await openP1Flight(page);
  const recent = flight.getByRole("region", { name: "Recent Flights" });

  await expect(recent).toHaveAttribute("data-empty", "true");
  await expect(recent).toContainText("No recent flights.");
});

test("P1.1 EFB mode entry opens the briefing workspace", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);
  const launch = page.getByRole("main", { name: "Aircraft mode chooser" });

  await launch.getByRole("link", { name: "Open EFB", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`${aircraftPath}/efb(?:\\?variant=Standard)?$`),
  );
  await expect(page.getByRole("main", { name: "Flight workspace" })).toBeVisible();
});

test("P1 flag off redirects /flight to the legacy operational /fly route", async ({ page }) => {
  await page.goto(`${aircraftPath}/flight`);

  await expect(page).toHaveURL(new RegExp(`${aircraftPath}/fly$`));
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Browser CI Aircraft flight deck" }),
  ).toBeVisible();
});

test("P1 preserves the existing /fly operational route", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/fly`);

  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/fly`);
  await expect(
    page.getByRole("region", { name: "Browser CI Aircraft flight deck" }),
  ).toBeVisible();
  await expect(page.getByRole("main", { name: "Flight workspace" })).toHaveCount(0);
});

async function createD0ActiveFlight(page: Page): Promise<Locator> {
  const flight = await openP1Flight(page);
  const active = flight.getByRole("region", { name: "Active Flight" });
  await active.getByRole("button", { name: "Start new flight", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Start new flight" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Departure ICAO").fill("LKPR");
  await dialog.getByLabel("Destination ICAO").fill("LOWW");
  await dialog.getByLabel("Weight", { exact: true }).fill("12000");
  await dialog.getByLabel("Weight unit").selectOption("lb");
  await dialog.getByRole("button", { name: "Activate flight", exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(active).toHaveAttribute("data-lifecycle", "ACTIVE");
  await expect(active).toContainText("LKPR → LOWW");
  await expect(active).toContainText("ACTIVE");
  await expect(active).not.toContainText("RWY");
  return active;
}

test("D0 Active Flight creation flow persists into the local mirror", async ({ page }) => {
  await createD0ActiveFlight(page);

  const mirrored = await page.evaluate(() => {
    const raw = localStorage.getItem(
      "flytally-training:active-flight:v1:browser-ci-aircraft",
    );
    return raw ? JSON.parse(raw) : null;
  });
  expect(mirrored).toMatchObject({
    aircraftId: "browser-ci-aircraft",
    accountSubject: "local",
    lifecycle: "ACTIVE",
    departure: { icao: "LKPR" },
    destination: { icao: "LOWW" },
    runway: null,
    configuration: null,
  });
});

test("P1.1 local Active Flight is reflected in the EFB top bar", async ({ page }) => {
  await createD0ActiveFlight(page);

  const status = page.locator('[aria-label="Active flight status"]');
  await expect(status).toContainText("Active flight");
  await expect(status).toContainText("LKPR → LOWW");

  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  const reloadedStatus = page.locator('[aria-label="Active flight status"]');
  await expect(reloadedStatus).toContainText("Active flight");
  await expect(reloadedStatus).toContainText("LKPR → LOWW");
});

test("D0 Active Flight is reflected only in the EFB choice on the mode chooser", async ({ page }) => {
  await createD0ActiveFlight(page);
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft mode chooser" });
  const efb = launch.getByRole("region", { name: "EFB mode" });
  const learn = launch.getByRole("region", { name: "Learn mode" });
  await expect(efb).toContainText("LKPR → LOWW");
  await expect(efb).toContainText("ACTIVE");
  await expect(efb.getByRole("link", { name: "Open Flight Brief", exact: true })).toBeVisible();
  await expect(learn).not.toContainText("LKPR");
  await expect(learn).not.toContainText("LOWW");
});

test("D0 Active Flight survives navigation back to the P1 Flight page", async ({ page }) => {
  await createD0ActiveFlight(page);
  await page.goto(`${shellOnBase}${aircraftPath}`);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const active = page.getByRole("region", { name: "Active Flight" });
  await expect(active).toHaveAttribute("data-lifecycle", "ACTIVE");
  await expect(active).toContainText("LKPR → LOWW");
});

test("D0 activates Flight Brief context without inventing downstream brief data", async ({ page }) => {
  await createD0ActiveFlight(page);

  const brief = page.getByRole("region", { name: "Flight Brief" });
  await expect(brief).toHaveAttribute("data-flight-context", "active");

  const performance = page.getByRole("region", { name: "Performance", exact: true });
  await expect(performance).toHaveAttribute("data-empty", "true");
  await expect(performance.getByText("Flight brief", { exact: true })).toBeVisible();
  await expect(performance).toContainText("Performance setup required");
  await expect(
    page.getByRole("region", { name: "Flight Considerations" }),
  ).toContainText("No considerations yet.");
  await expect(
    page.getByRole("region", { name: "Training Recommendations" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Relevant Procedures" }),
  ).toContainText("No relevant procedures yet.");
});

test("D0 deactivate transition moves ACTIVE to PREVIOUS only by explicit action", async ({ page }) => {
  const active = await createD0ActiveFlight(page);
  await active.getByRole("button", { name: "Deactivate flight", exact: true }).click();

  await expect(active).toHaveAttribute("data-lifecycle", "PREVIOUS");
  await expect(active).toContainText("No active flight.");
  await expect(active).toContainText("Previous flight");
  await expect(
    active.getByRole("button", { name: "Archive previous flight", exact: true }),
  ).toBeVisible();
});

test("D0 archive transition moves PREVIOUS to ARCHIVED only by explicit action", async ({ page }) => {
  const active = await createD0ActiveFlight(page);
  await active.getByRole("button", { name: "Deactivate flight", exact: true }).click();
  await active.getByRole("button", { name: "Archive previous flight", exact: true }).click();

  await expect(active).toHaveAttribute("data-lifecycle", "ARCHIVED");
  await expect(active).toContainText("Previous flight archived.");
  await expect(active).toContainText("No active flight.");
});

test("D0 flag off API fails closed with feature_disabled", async ({ request }) => {
  const response = await request.get(
    `/api/active-flight?aircraftId=browser-ci-aircraft`,
  );
  expect(response.status()).toBe(404);
  await expect(response.json()).resolves.toEqual({ error: "feature_disabled" });
});



async function calculateP2Performance(page: Page): Promise<Locator> {
  await createD0ActiveFlight(page);
  await page.goto(`${shellOnBase}${aircraftPath}/performance`);

  const workspace = page.getByRole("main", { name: "Performance workspace" });
  await expect(workspace).toBeVisible();
  const performance = workspace.getByRole("region", { name: "Performance", exact: true });
  await expect(performance).toContainText("Performance setup required");
  await performance.getByLabel("Takeoff runway").selectOption("24");
  await performance.getByLabel("QNH").fill("1013.25");
  await performance.getByLabel("OAT").fill("15");
  await performance.getByRole("button", { name: "Calculate Takeoff", exact: true }).click();

  const strip = performance.locator('[data-ft-performance-strip="true"]');
  await expect(strip).toBeVisible();
  await expect(performance).toHaveAttribute("data-empty", "false");
  return strip;
}

test("P2 PERFORMANCE top-level renders the source-backed takeoff data strip", async ({ page }) => {
  const strip = await calculateP2Performance(page);

  await expect(strip.locator('[data-metric="n1"]')).toContainText("94 %");
  await expect(strip.locator('[data-metric="v1"]')).toContainText("110 KIAS");
  await expect(strip.locator('[data-metric="vr"]')).toContainText("115 KIAS");
  await expect(strip.locator('[data-metric="v2"]')).toContainText("125 KIAS");
  await expect(strip.locator('[data-metric="takeoffDistance"]')).toContainText("3,100 ft");
});

test("P1.1 PERFORMANCE top-level identifies its EFB context", async ({ page }) => {
  await calculateP2Performance(page);
  const workspace = page.getByRole("main", { name: "Performance workspace" });
  await expect(workspace.getByText("EFB", { exact: true })).toBeVisible();
});

test("P2 Flight Brief reuses the same performance result with Flight brief context", async ({ page }) => {
  await calculateP2Performance(page);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const performance = page.getByRole("region", { name: "Performance", exact: true });
  await expect(performance.getByText("Flight brief", { exact: true })).toBeVisible();
  await expect(performance.locator('[data-metric="takeoffDistance"]')).toContainText("3,100 ft");
});

test("P2 PERF fast path reuses the same performance result with Operational context", async ({ page }) => {
  await calculateP2Performance(page);
  const panel = await openFastPath(page, "PERF");

  const performance = panel.getByRole("region", { name: "Performance", exact: true });
  await expect(performance.getByText("Operational", { exact: true })).toBeVisible();
  await expect(performance.locator('[data-metric="v2"]')).toContainText("125 KIAS");
});

test("B4 Takeoff weight change marks stored performance NEEDS RECALCULATION", async ({ page }) => {
  await calculateP2Performance(page);

  const performance = page.getByRole("region", { name: "Performance", exact: true });
  await performance.getByLabel("Takeoff weight").fill("13000");

  await expect(performance.getByText("NEEDS RECALCULATION", { exact: true })).toBeVisible();
  await expect(performance).toContainText("Weight: 12,000 lb → 13,000 lb");
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "true",
  );
});

test("B4 Recalculate replaces stale values with the new operation-owned weight", async ({ page }) => {
  await calculateP2Performance(page);

  const performance = page.getByRole("region", { name: "Performance", exact: true });
  await performance.getByLabel("Takeoff weight").fill("13000");
  await performance.getByRole("button", { name: "Recalculate", exact: true }).click();

  await expect(performance.getByText("NEEDS RECALCULATION", { exact: true })).toHaveCount(0);
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "false",
  );
  await expect(performance.locator('[data-metric="takeoffDistance"]')).toContainText("3,500 ft");
});

test("P1.3 newer METAR remains AVAILABLE until explicit Apply & recalculate", async ({ page }) => {
  let metar = {
    station: "LKPR",
    observedAt: "2026-09-24T06:30:00.000Z",
    fetchedAt: "2026-09-24T06:31:00.000Z",
    rawText: "LKPR 240630Z 24008KT CAVOK 15/08 Q1013",
    temperatureC: 15,
    dewpointC: 8,
    qnhHpa: 1013.25,
    windDirectionTrueDeg: 240,
    windSpeedKt: 8,
    windVariable: false,
    windCalm: false,
    source: "aviationweather.gov",
  };

  await page.route("**/api/weather/metar?icao=LKPR", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(metar),
    });
  });

  await createD0ActiveFlight(page);
  await page.goto(`${shellOnBase}${aircraftPath}/performance`);

  const performance = page
    .getByRole("main", { name: "Performance workspace" })
    .getByRole("region", { name: "Performance", exact: true });

  await performance.getByLabel("Takeoff runway").selectOption("24");
  await expect(performance.getByLabel("QNH")).toHaveValue("1013.25");
  await expect(performance.getByLabel("OAT")).toHaveValue("15");
  await performance.getByRole("button", { name: "Calculate Takeoff", exact: true }).click();
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "false",
  );
  await expect(performance.getByText("+8.0 kt", { exact: true })).toBeVisible();

  metar = {
    ...metar,
    observedAt: "2026-09-24T07:00:00.000Z",
    fetchedAt: "2026-09-24T07:01:00.000Z",
    rawText: "LKPR 240700Z 06012KT CAVOK 17/09 Q1011",
    temperatureC: 17,
    dewpointC: 9,
    qnhHpa: 1011,
    windDirectionTrueDeg: 60,
    windSpeedKt: 12,
  };

  await page.reload();
  const restored = page
    .getByRole("main", { name: "Performance workspace" })
    .getByRole("region", { name: "Performance", exact: true });

  await expect(restored.getByLabel("QNH")).toHaveValue("1013.25");
  await expect(restored.getByLabel("OAT")).toHaveValue("15");
  await expect(restored.getByText("NEWER WEATHER AVAILABLE", { exact: true })).toBeVisible();
  await expect(restored.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "false",
  );
  await expect(restored.getByText("+8.0 kt", { exact: true })).toBeVisible();

  await restored.getByRole("button", { name: "Apply & recalculate", exact: true }).click();

  await expect(restored.getByLabel("QNH")).toHaveValue("1011");
  await expect(restored.getByLabel("OAT")).toHaveValue("17");
  await expect(restored.getByText("NEWER WEATHER AVAILABLE", { exact: true })).toHaveCount(0);
  await expect(restored.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "false",
  );
  await expect(restored.getByText("-12.0 kt", { exact: true })).toBeVisible();
});

test("B4 departure airport change invalidates Takeoff and clears the selected runway", async ({ page }) => {
  await calculateP2Performance(page);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const active = page.getByRole("region", { name: "Active Flight" });
  await active.getByRole("button", { name: "Edit flight", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit flight" });
  await dialog.getByLabel("Departure ICAO").fill("LKKV");
  await dialog.getByRole("button", { name: "Save flight", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  await page.goto(`${shellOnBase}${aircraftPath}/performance`);
  const performance = page.getByRole("region", { name: "Performance", exact: true });
  await expect(performance.getByLabel("Takeoff runway")).toHaveValue("");
  await expect(performance.getByText("NEEDS RECALCULATION", { exact: true })).toBeVisible();
  await expect(performance.getByRole("button", { name: "Recalculate", exact: true })).toBeDisabled();
});

test("P2 takeoff strip preserves Round 3.7 order and never exposes VREF", async ({ page }) => {
  const strip = await calculateP2Performance(page);

  const labels = await strip.locator('[class*="metricLabel"]').allTextContents();
  expect(labels).toEqual(["N1", "V1", "VR", "V2", "Takeoff Distance"]);
  await expect(strip.getByText("VREF", { exact: true })).toHaveCount(0);
});

test("P2 flag off preserves the legacy Performance route", async ({ page }) => {
  await page.goto(`${aircraftPath}/performance`);

  await expect(page.locator('[data-ft-performance-page="true"]')).toHaveCount(0);
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Performance", exact: true })).toBeVisible();
  await expect(page.locator('section[aria-label="Aircraft navigation"]')).toBeVisible();
});

test("P2 PERFORMANCE shows an explicit empty state without Active Flight", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/performance`);

  const workspace = page.getByRole("main", { name: "Performance workspace" });
  const performance = workspace.getByRole("region", { name: "Performance", exact: true });
  await expect(performance).toHaveAttribute("data-empty", "true");
  await expect(performance).toContainText("No active flight.");
  await expect(performance.getByText("EFB", { exact: true })).toBeVisible();
});


async function openP3Systems(page: Page): Promise<Locator> {
  await page.goto(`${shellOnBase}${aircraftPath}/systems`);
  const systems = page.getByRole("main", { name: "Systems workspace" });
  await expect(systems).toBeVisible();
  return systems;
}

test("P3 Systems opens inside Learn mode", async ({ page }, testInfo) => {
  const systems = await openP3Systems(page);

  await expect(systems).toHaveAttribute("data-ft-systems-page", "true");
  await expect(
    systems.getByRole("heading", { name: "Generic Source System", exact: true }),
  ).toBeVisible();

  const nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(nav.getByRole("link", { name: "Systems", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("P3 published schematic renders source-backed nodes and edges", async ({ page }) => {
  const systems = await openP3Systems(page);

  for (const label of ["Source A", "Pump A", "Valve A", "Consumer A"]) {
    await expect(systems.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(systems.getByText("supply", { exact: true })).toBeVisible();
  await expect(systems.getByText("delivery", { exact: true })).toBeVisible();
});

test("P3 node selection updates detail and connections", async ({ page }) => {
  const systems = await openP3Systems(page);
  await systems.getByRole("button", { name: "Pump A", exact: true }).click();

  const detail = systems.locator("aside").filter({ hasText: "Connected to" });
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole("heading", { name: "Pump A", exact: true }),
  ).toBeVisible();
  await expect(detail).toContainText("Source A (supply)");
  await expect(detail).toContainText("Valve A");
  await expect(detail).toContainText("P3 deterministic fixture");
  await expect(detail).toContainText("P3-1");
});

test("P3 keyboard interaction can select a node", async ({ page }) => {
  const systems = await openP3Systems(page);
  const source = systems.getByRole("button", { name: "Source A", exact: true });
  const pump = systems.getByRole("button", { name: "Pump A", exact: true });

  await source.focus();
  await expect(source).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(pump).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(pump).toHaveAttribute("aria-pressed", "true");
});

test("P3 Escape clears node selection", async ({ page }) => {
  const systems = await openP3Systems(page);
  const pump = systems.getByRole("button", { name: "Pump A", exact: true });

  await pump.click();
  await expect(pump).toHaveAttribute("aria-pressed", "true");
  await expect(systems.getByRole("heading", { name: "Pump A", exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(pump).toHaveAttribute("aria-pressed", "false");
  await expect(
    systems.getByRole("heading", { name: "Select a component", exact: true }),
  ).toBeVisible();
});

test("P3 text-only system works without a schematic", async ({ page }) => {
  const systems = await openP3Systems(page);
  const mobilePicker = systems.getByRole("combobox");

  if (await mobilePicker.isVisible()) {
    await mobilePicker.selectOption("generic-text-system");
  } else {
    await systems.getByRole("button", { name: /Generic Text System/ }).click();
  }

  await expect(
    systems.getByRole("heading", { name: "Generic Text System", exact: true }),
  ).toBeVisible();
  await expect(systems.getByText("Text component A", { exact: true })).toBeVisible();
  await expect(systems.getByText("Text control A", { exact: true })).toBeVisible();
  await expect(systems.getByText("Text indication A", { exact: true })).toBeVisible();
  await expect(systems.getByText("LOGICAL SCHEMATIC", { exact: true })).toHaveCount(0);
});

test("P3 flag OFF preserves legacy Systems presentation", async ({ page }) => {
  await page.goto(`${aircraftPath}/systems`);

  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(page.locator('[data-ft-systems-page="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Systems learning workspace" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Generic Source System", exact: true, level: 2 }),
  ).toBeVisible();
});

test("P3 Cockpit Orientation remains inside Learn mode", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/orientation`);

  await expect(
    page.getByRole("region", { name: "Cockpit orientation explorer" }),
  ).toBeVisible();
  await expect(page.getByText("Region A", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-ft-systems-page="true"]')).toHaveCount(0);

  const nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(nav.getByRole("link", { name: "Learn", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});


async function openP4Procedures(page: Page): Promise<Locator> {
  await page.goto(`${shellOnBase}${aircraftPath}/procedures`);
  const procedures = page.locator('[data-ft-procedures-page="true"]');
  await expect(procedures).toBeVisible();
  return procedures;
}

async function selectP4Procedure(
  procedures: Locator,
  procedureId: string,
  title: string,
): Promise<void> {
  const mobilePicker = procedures.getByRole("combobox", {
    name: "Procedure",
    exact: true,
  });

  if (await mobilePicker.isVisible()) {
    await mobilePicker.selectOption(procedureId);
  } else {
    await procedures
      .getByRole("navigation", { name: "Available procedures" })
      .getByRole("button", { name: new RegExp(title) })
      .click();
  }

  await expect(
    procedures.getByRole("heading", { name: title, exact: true, level: 2 }),
  ).toBeVisible();
}

test("P4 Procedures opens under PROCEDURES in new shell", async ({ page }, testInfo) => {
  const procedures = await openP4Procedures(page);

  await expect(procedures).toHaveAttribute("data-ft-procedures-page", "true");
  await expect(
    procedures.getByRole("heading", {
      name: "Generic Linear Procedure",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();

  const nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(
    nav.getByRole("link", { name: "Procedures", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("P4 Learn shows source-defined explanation without changing procedure progress", async ({ page }) => {
  const procedures = await openP4Procedures(page);
  await selectP4Procedure(
    procedures,
    "generic-linear-procedure",
    "Generic Linear Procedure",
  );

  const detail = procedures.getByRole("article", {
    name: "Procedure: Generic Linear Procedure",
  });
  const learn = detail.getByRole("region", { name: "Learn" });

  await expect(detail.getByText("0/2", { exact: true })).toBeVisible();
  await expect(learn.getByText("STEP 01", { exact: true })).toBeVisible();
  await expect(learn.getByRole("heading", { name: "Action A", exact: true })).toBeVisible();
  await expect(learn.getByText("Expected A", { exact: true })).toBeVisible();
  await expect(learn.getByText("Verify A", { exact: true })).toBeVisible();
  await expect(learn.getByText("Reason A", { exact: true })).toBeVisible();
  await expect(detail.getByText("0/2", { exact: true })).toBeVisible();
});

test("P4 Relevance shows phase prerequisites completion criteria and source condition", async ({ page }) => {
  const procedures = await openP4Procedures(page);

  await selectP4Procedure(
    procedures,
    "generic-branch-procedure",
    "Generic Branch Procedure",
  );
  let relevance = procedures
    .getByRole("article", { name: "Procedure: Generic Branch Procedure" })
    .getByRole("region", { name: "Relevance" });

  await expect(relevance.getByText("In flight", { exact: true })).toBeVisible();
  await expect(
    relevance.getByText("When Condition A applies.", { exact: true }),
  ).toBeVisible();

  await selectP4Procedure(
    procedures,
    "generic-linear-procedure",
    "Generic Linear Procedure",
  );
  relevance = procedures
    .getByRole("article", { name: "Procedure: Generic Linear Procedure" })
    .getByRole("region", { name: "Relevance" });

  await expect(relevance.getByText("Preparation", { exact: true })).toBeVisible();
  await expect(relevance.getByText("Prerequisite A", { exact: true })).toBeVisible();
  await expect(
    relevance.getByText("Completion criterion A", { exact: true }),
  ).toBeVisible();
});

test("P4 Operate linear completion uses the existing procedure session", async ({ page }) => {
  const procedures = await openP4Procedures(page);
  await selectP4Procedure(
    procedures,
    "generic-linear-procedure",
    "Generic Linear Procedure",
  );

  let operate = procedures
    .getByRole("article", { name: "Procedure: Generic Linear Procedure" })
    .getByRole("region", { name: "Operate" });
  const firstStep = operate.getByRole("button", {
    name: "Complete procedure step 1",
    exact: true,
  });

  await firstStep.click();
  const completedFirstStep = operate.getByRole("button", {
    name: "Uncheck procedure step 1",
    exact: true,
  });
  await expect(completedFirstStep).toHaveAttribute("aria-pressed", "true");
  await expect(
    procedures
      .getByRole("article", { name: "Procedure: Generic Linear Procedure" })
      .getByText("1/2", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.locator('[data-ft-procedures-page="true"]')).toBeVisible();

  operate = page
    .getByRole("article", { name: "Procedure: Generic Linear Procedure" })
    .getByRole("region", { name: "Operate" });
  await expect(
    operate.getByRole("button", {
      name: "Uncheck procedure step 1",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("P4 Operate graph decision follows only the explicit selected branch", async ({ page }) => {
  const procedures = await openP4Procedures(page);
  await selectP4Procedure(
    procedures,
    "generic-branch-procedure",
    "Generic Branch Procedure",
  );

  const operate = procedures
    .getByRole("article", { name: "Procedure: Generic Branch Procedure" })
    .getByRole("region", { name: "Operate" });

  await expect(
    operate.getByRole("heading", { name: "Select condition", exact: true }),
  ).toBeVisible();
  await operate.getByRole("button", { name: "Condition A", exact: true }).click();

  await expect(operate.getByText("Graph Action A", { exact: true })).toBeVisible();
  await expect(operate.getByText("Graph Note B", { exact: true })).toHaveCount(0);
});

test("P4 Learn can inspect branch content without changing active graph branch", async ({ page }) => {
  const procedures = await openP4Procedures(page);
  await selectP4Procedure(
    procedures,
    "generic-branch-procedure",
    "Generic Branch Procedure",
  );

  const detail = procedures.getByRole("article", {
    name: "Procedure: Generic Branch Procedure",
  });
  const learn = detail.getByRole("region", { name: "Learn" });
  const operate = detail.getByRole("region", { name: "Operate" });

  await expect(learn.getByText("Graph Note B", { exact: true })).toBeVisible();
  await expect(
    operate.getByRole("heading", { name: "Select condition", exact: true }),
  ).toBeVisible();
  await expect(operate.getByText("Graph Action A", { exact: true })).toHaveCount(0);
  await expect(operate.getByText("Graph Note B", { exact: true })).toHaveCount(0);
});

test("P4 flag OFF preserves legacy ProcedureBrowser presentation", async ({ page }) => {
  await page.goto(`${aircraftPath}/procedures`);

  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(page.locator('[data-ft-procedures-page="true"]')).toHaveCount(0);
  await expect(page.locator('section[aria-label="Procedure workspace"]')).toBeVisible();
});

test("P4 deep link and selected procedure survive new-shell navigation", async ({ page }) => {
  const url = `${shellOnBase}${aircraftPath}/procedures#generic-branch-procedure`;
  await page.goto(url);

  await expect(page.locator('[data-ft-procedures-page="true"]')).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Generic Branch Procedure",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();

  await page.reload();

  await expect(page.locator('[data-ft-procedures-page="true"]')).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Generic Branch Procedure",
      exact: true,
      level: 2,
    }),
  ).toBeVisible();
});


async function openP6Training(page: Page): Promise<Locator> {
  await page.goto(`${shellOnBase}${aircraftPath}/training`);
  const training = page.locator('[data-ft-training-page="true"]');
  await expect(training).toBeVisible();
  return training;
}

async function completeP6FirstScenario(page: Page): Promise<Locator> {
  const training = await openP6Training(page);
  const trainer = training.getByRole("region", {
    name: "Abnormal and emergency scenario trainer",
  });

  await expect(
    trainer.getByRole("heading", { name: "Generic Condition A", exact: true }),
  ).toBeVisible();
  await trainer
    .getByRole("button", { name: "Reveal expected response", exact: true })
    .click();
  await expect(trainer.getByText("Action A", { exact: true })).toBeVisible();
  await expect(trainer.getByText("Action B", { exact: true })).toBeVisible();
  await expect(
    trainer.getByText("Training explanation A", { exact: true }),
  ).toBeVisible();

  await trainer.getByRole("button", { name: /^Finish scenario/ }).click();
  await expect(
    trainer.getByRole("heading", { name: "Scenario complete.", exact: true }),
  ).toBeVisible();
  return trainer;
}

test("P6 Training opens as the Learn home", async ({ page }, testInfo) => {
  const training = await openP6Training(page);

  await expect(training).toHaveAttribute("data-ft-training-page", "true");
  await expect(
    training.getByRole("heading", { name: "Training", exact: true }),
  ).toBeVisible();
  await expect(
    training.getByRole("heading", { name: "Scenario training", exact: true }),
  ).toBeVisible();

  const nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(
    nav.getByRole("link", { name: "Learn", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("P6 scenario reveal ends in the source-defined debrief", async ({ page }) => {
  const trainer = await completeP6FirstScenario(page);

  await expect(
    trainer.getByText("Review the generic response.", { exact: true }),
  ).toBeVisible();
  await expect(
    trainer.getByRole("button", { name: "Repeat now", exact: true }),
  ).toBeVisible();
  await expect(
    trainer.getByRole("button", {
      name: "Mark for targeted repeat",
      exact: true,
    }),
  ).toBeVisible();
});

test("P6 targeted repeat is explicit and returns to scenario practice", async ({ page }) => {
  const trainer = await completeP6FirstScenario(page);

  await trainer
    .getByRole("button", { name: "Mark for targeted repeat", exact: true })
    .click();
  await expect(
    trainer.getByRole("button", {
      name: "Remove from repeat queue",
      exact: true,
    }),
  ).toBeVisible();
  await expect(trainer.getByText("1 queued", { exact: true })).toBeVisible();

  await trainer.getByRole("button", { name: "Practice queue", exact: true }).click();
  await expect(
    trainer.getByRole("button", { name: "Reveal expected response", exact: true }),
  ).toBeVisible();
});

test("P6 scenario completion writes the shared scenario progress event", async ({ page }) => {
  await completeP6FirstScenario(page);

  const events = await page.evaluate(() => {
    const raw = window.localStorage.getItem(
      "flytally-training-progress:browser-ci-aircraft",
    );
    return raw ? JSON.parse(raw) : [];
  });

  expect(events).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        aircraftId: "browser-ci-aircraft",
        kind: "scenario",
        contentId: "generic-condition-a",
        completed: true,
      }),
    ]),
  );
  const scenario = events.find(
    (event: { kind?: string; contentId?: string }) =>
      event.kind === "scenario" && event.contentId === "generic-condition-a",
  );
  expect(scenario?.scorePercent).toBeUndefined();
  expect(scenario?.weakAreas).toBeUndefined();
});

test("P6 scenario training does not mutate an ACTIVE D0 flight", async ({ page }) => {
  await createD0ActiveFlight(page);
  await completeP6FirstScenario(page);

  await page.goto(`${shellOnBase}${aircraftPath}/flight`);
  const active = page.getByRole("region", { name: "Active Flight" });
  await expect(active).toHaveAttribute("data-lifecycle", "ACTIVE");
  await expect(active).toContainText("LKPR → LOWW");
});

test("P6 flag OFF preserves the legacy Training hub", async ({ page }) => {
  await page.goto(`${aircraftPath}/training`);

  await expect(page.locator('[data-ft-training-page="true"]')).toHaveCount(0);
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Learn", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('section[aria-label="Aircraft navigation"]'),
  ).toBeVisible();
});


test("P7 REF fast path renders governed published limitations", async ({ page }) => {
  const panel = await openFastPath(page, "REF");
  const reference = panel.getByRole("region", { name: "Reference quick access" });

  await expect(reference).toBeVisible();
  await expect(
    reference.getByRole("heading", { name: "Quick reference", exact: true }),
  ).toBeVisible();
  await expect(reference.getByText("Generic Speeds", { exact: true })).toBeVisible();
  await expect(
    reference.getByText("Maximum generic speed", { exact: true }),
  ).toBeVisible();
  await expect(reference.getByText("200 KIAS", { exact: true })).toBeVisible();
  const caution = reference.locator("p").filter({ hasText: "Generic caution." });
  await expect(caution).toBeVisible();
  await expect(caution).toContainText("CAUTION");
  await expect(caution).toContainText("Generic caution.");
});

test("P7 REF exposes source provenance only on explicit disclosure", async ({ page }) => {
  const panel = await openFastPath(page, "REF");
  const reference = panel.getByRole("region", { name: "Reference quick access" });
  const source = reference.locator("details").filter({ hasText: "Source" }).first();

  await expect(source).not.toHaveAttribute("open", "");
  await source.getByText("Source", { exact: true }).click();
  await expect(source).toHaveAttribute("open", "");
  await expect(source.getByText(/browser-ci-limitations-source/)).toBeVisible();
});

test("P7 REF preserves the selected variant in the full-reference deep link", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/efb?variant=Standard`);
  const rail = page.getByRole("navigation", { name: "Operational fast path" });
  await rail.getByRole("button", { name: "REF", exact: true }).click();

  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(
    panel.getByRole("link", { name: "Open full reference", exact: true }),
  ).toHaveAttribute(
    "href",
    `${aircraftPath}/reference?variant=Standard`,
  );
});

test("P7 new-shell Reference page reuses the REF limitation presentation", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/reference?variant=Standard`);
  const referencePage = page.locator('[data-ft-reference-page="true"]');

  await expect(referencePage).toBeVisible();
  await expect(
    referencePage.getByRole("heading", { name: "Reference", exact: true }),
  ).toBeVisible();
  await expect(
    referencePage.getByText("Maximum generic speed", { exact: true }),
  ).toBeVisible();
  await expect(
    referencePage.getByRole("link", { name: /Limitations/ }),
  ).toHaveAttribute(
    "href",
    `${aircraftPath}/limitations?variant=Standard`,
  );

  const nav = await workspaceNavigation(page, testInfo.project.name);
  await expect(
    nav.getByRole("link", { name: "Reference", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("P7 flag OFF preserves the legacy Reference hub", async ({ page }) => {
  await page.goto(`${aircraftPath}/reference`);

  await expect(page.locator('[data-ft-reference-page="true"]')).toHaveCount(0);
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Reference", exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('section[aria-label="Aircraft navigation"]'),
  ).toBeVisible();
});


test("UX4 key new-shell routes do not overflow the viewport horizontally", async ({ page }) => {
  for (const href of [
    aircraftPath,
    `${aircraftPath}/procedures`,
    `${aircraftPath}/performance`,
    `${aircraftPath}/training`,
    `${aircraftPath}/reference`,
    `${aircraftPath}/flight`,
    `${aircraftPath}/systems`,
  ]) {
    await page.goto(`${shellOnBase}${href}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("UX4 fast path returns keyboard focus to the initiating rail action", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  const rail = page.getByRole("navigation", { name: "Operational fast path" });
  const trigger = rail.getByRole("button", { name: "CHECKLIST", exact: true });

  await trigger.focus();
  await trigger.click();
  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(panel).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("P1.1 compact rail exposes mode-specific accessible destination names", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/learn`);
  let nav = await workspaceNavigation(page, testInfo.project.name);
  for (const label of ["Learn", "Systems", "Procedures", "Limitations", "Reference"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Performance", exact: true })).toHaveCount(0);

  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  nav = await workspaceNavigation(page, testInfo.project.name);
  for (const label of ["Flight Brief", "Performance", "Flight Deck"]) {
    await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole("link", { name: "Systems", exact: true })).toHaveCount(0);
});

test("UX6.8 touch Procedures exposes compact selector controls before procedure content", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}/procedures`);
  const procedures = page.locator('[data-ft-procedures-page="true"]');
  await expect(procedures).toBeVisible();

  const picker = procedures.getByRole("combobox", { name: "Procedure", exact: true });

  if (testInfo.project.name === "desktop-chromium") {
    await expect(picker).toBeHidden();
    await expect(
      procedures.getByRole("navigation", { name: "Available procedures" }),
    ).toBeVisible();
    return;
  }

  await expect(picker).toBeVisible();
  await expect(procedures.getByText("Filter", { exact: true })).toBeVisible();
});

test("UX6.8 primary touch shell controls meet the 44px boundary", async ({ page }, testInfo) => {
  if (testInfo.project.name === "desktop-chromium") return;

  await page.goto(`${shellOnBase}${aircraftPath}/efb`);
  const trigger = page.getByRole("button", { name: "Open aircraft navigation" });
  const fastPath = page.getByRole("navigation", { name: "Operational fast path" });
  const controls = [
    trigger,
    fastPath.getByRole("button", { name: "CHECKLIST", exact: true }),
    fastPath.getByRole("button", { name: "QRH", exact: true }),
    fastPath.getByRole("button", { name: "PERF", exact: true }),
    fastPath.getByRole("button", { name: "REF", exact: true }),
  ];

  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    if (!box) continue;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

