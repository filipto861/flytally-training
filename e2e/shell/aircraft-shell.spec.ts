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
  await expect(shell.getByText(/Training profile:/)).toBeVisible();

  const legacyNav = page.locator('section[aria-label="Aircraft navigation"]');
  await expect(legacyNav).toBeHidden();
});

test("W0 exposes desktop side navigation and touch drawer navigation", async ({ page }, testInfo) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const shell = page.locator('[data-ft-shell="true"]');
  const sideNav = shell.getByRole("navigation", { name: "Aircraft workspace sections" }).first();
  const drawerTrigger = shell.getByRole("button", { name: "Open aircraft navigation" });

  if (testInfo.project.name === "desktop-chromium") {
    await expect(sideNav).toBeVisible();
    await expect(drawerTrigger).toBeHidden();
    await expect(sideNav.getByRole("link")).toHaveCount(5);
    return;
  }

  await expect(sideNav).toBeHidden();
  await expect(drawerTrigger).toBeVisible();
  await drawerTrigger.click();

  const drawer = shell.getByRole("dialog", { name: "Aircraft navigation" });
  await expect(drawer).toBeVisible();
  const drawerNav = drawer.getByRole("navigation", { name: "Aircraft workspace sections" });
  await expect(drawerNav.getByRole("link")).toHaveCount(5);

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(drawerTrigger).toBeFocused();
});

test("W0 exposes the four operational fast-path destinations", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const fastPath = page.getByRole("navigation", { name: "Operational fast path" });
  await expect(fastPath).toBeVisible();
  await expect(fastPath.getByRole("button")).toHaveCount(4);

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    await expect(fastPath.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
});

test("W1 top-level IA links navigate to the canonical section routes", async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  const destinations = [
    ["AIRCRAFT", aircraftPath],
    ["PROCEDURES", `${aircraftPath}/procedures`],
    ["PERFORMANCE", `${aircraftPath}/performance`],
    ["TRAINING", `${aircraftPath}/training`],
    ["FLIGHT", `${aircraftPath}/fly`],
  ] as const;

  for (const [label, href] of destinations) {
    await page.goto(`${shellOnBase}${aircraftPath}`);
    const nav = await workspaceNavigation(page, testInfo.project.name);
    const link = nav.getByRole("link", { name: label, exact: true });

    await expect(link).toHaveAttribute("href", href);
    await link.click();
    await expect(page).toHaveURL(`${shellOnBase}${href}`);
  }
});

test("W1 active top-level state follows fixture-supported routes", async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  // Browser CI publishes only checklist + performance content. Use routes that
  // actually render for that governed fixture; exhaustive legacy sub-route
  // classification is covered by redesign-w1-content-ia.test.ts.
  const cases = [
    [aircraftPath, "AIRCRAFT"],
    [`${aircraftPath}/checklists`, "PROCEDURES"],
    [`${aircraftPath}/performance`, "PERFORMANCE"],
    [`${aircraftPath}/training`, "TRAINING"],
    [`${aircraftPath}/reference`, "FLIGHT"],
  ] as const;

  for (const [href, activeLabel] of cases) {
    await page.goto(`${shellOnBase}${href}`);
    const nav = await workspaceNavigation(page, testInfo.project.name);
    await expect(
      nav.getByRole("link", { name: activeLabel, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
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

async function waitForFastPathShortcuts(page: Page): Promise<Locator> {
  const rail = page.getByRole("navigation", { name: "Operational fast path" });
  await expect(rail).toHaveAttribute("data-shortcuts-ready", "true");
  return rail;
}

async function openFastPath(page: Page, label: "CHECKLIST" | "QRH" | "PERF" | "REF") {
  const originalUrl = `${shellOnBase}${aircraftPath}`;
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
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}`);
});

test("W3 Ctrl+Shift+1 opens CHECKLIST directly", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);
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
  await page.goto(`${shellOnBase}${aircraftPath}`);
  await waitForFastPathShortcuts(page);
  await page.keyboard.press("Control+Shift+2");
  const panel = page.getByRole("dialog", { name: "Operational fast path" });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("tab", { name: "QRH", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(panel.getByRole("heading", { name: "QRH", exact: true })).toBeVisible();
});

test("W3 QRH placeholder can open the canonical full page", async ({ page }) => {
  const panel = await openFastPath(page, "QRH");
  await panel.getByRole("link", { name: "Open full page", exact: true }).click();
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}/abnormal`);
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
  await expect(page).toHaveURL(`${shellOnBase}${aircraftPath}`);
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

test("P0 launch surface Continue Training enters the training workspace", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft launch surface" });
  await expect(launch).toBeVisible();
  await expect(
    launch.getByRole("heading", { name: "Continue Training", exact: true }),
  ).toBeVisible();

  const action = launch.getByRole("link", { name: "Start training", exact: true });
  await expect(action).toBeVisible();
  await action.click();
  await expect(page).toHaveURL(
    new RegExp(`${aircraftPath}/training(?:\\?variant=Standard)?$`),
  );
});

test("P0 launch surface exposes the no-active-flight placeholder", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft launch surface" });
  const flight = launch.getByRole("region", { name: "Flight" });
  await expect(flight).toContainText("No active flight.");
  await expect(
    flight.getByRole("link", { name: "Start new flight", exact: true }),
  ).toBeVisible();
});

test("P0 launch surface includes Recent without fabricating history", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft launch surface" });
  const recent = launch.getByRole("region", { name: "Recent" });
  await expect(recent).toBeVisible();
  await expect(recent).toContainText("Nothing recent.");
});

test("P0 flag on replaces the legacy Fly Learn Reference command surface", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  await expect(page.getByRole("main", { name: "Aircraft launch surface" })).toBeVisible();
  await expect(page.locator(".pilot-command-grid")).toHaveCount(0);
  await expect(page.locator(".pilot-command-panel")).toHaveCount(0);
});

test("P0 flag off preserves the legacy aircraft command surface", async ({ page }) => {
  await page.goto(aircraftPath);

  await expect(page.getByRole("main", { name: "Aircraft launch surface" })).toHaveCount(0);
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
  const performance = flight.getByRole("region", { name: "Performance" });

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

test("P1 Flight Brief Training Recommendations stays visibly empty", async ({ page }) => {
  const flight = await openP1Flight(page);
  const section = flight.getByRole("region", { name: "Training Recommendations" });

  await expect(section).toHaveAttribute("data-empty", "true");
  await expect(section).toContainText("No active flight.");
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

test("P1 P0 Flight entry opens the new briefing workspace", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);
  const launch = page.getByRole("main", { name: "Aircraft launch surface" });
  const flight = launch.getByRole("region", { name: "Flight" });

  await flight.getByRole("link", { name: "Start new flight", exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`${aircraftPath}/flight(?:\\?variant=Standard)?$`),
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
  await dialog.getByLabel("Runway").fill("24");
  await dialog.getByLabel("Weight", { exact: true }).fill("12000");
  await dialog.getByLabel("Weight unit").selectOption("lb");
  await dialog.getByLabel("Flaps").fill("8");
  await dialog.getByRole("button", { name: "Activate flight", exact: true }).click();

  await expect(dialog).toHaveCount(0);
  await expect(active).toHaveAttribute("data-lifecycle", "ACTIVE");
  await expect(active).toContainText("LKPR → LOWW");
  await expect(active).toContainText("RWY 24 · ACTIVE");
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
    runway: { identifier: "24" },
  });
});

test("D0 Active Flight is visible on the P0 Flight launch section", async ({ page }) => {
  await createD0ActiveFlight(page);
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const launch = page.getByRole("main", { name: "Aircraft launch surface" });
  const flight = launch.getByRole("region", { name: "Flight" });
  await expect(flight).toContainText("LKPR → LOWW");
  await expect(flight).toContainText("RWY 24 · ACTIVE");
  await expect(
    flight.getByRole("link", { name: "Open flight brief", exact: true }),
  ).toBeVisible();
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

  const performance = page.getByRole("region", { name: "Performance" });
  await expect(performance).toHaveAttribute("data-empty", "true");
  await expect(performance.getByText("Flight brief", { exact: true })).toBeVisible();
  await expect(performance).toContainText("No performance computed yet.");
  await expect(
    page.getByRole("region", { name: "Flight Considerations" }),
  ).toContainText("No considerations yet.");
  await expect(
    page.getByRole("region", { name: "Training Recommendations" }),
  ).toContainText("No recommendations yet.");
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
  const performance = workspace.getByRole("region", { name: "Performance" });
  await expect(performance).toContainText("No performance computed yet.");
  await performance.getByRole("button", { name: "Calculate performance", exact: true }).click();

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

test("P2 PERFORMANCE top-level identifies its Training view context", async ({ page }) => {
  await calculateP2Performance(page);
  const workspace = page.getByRole("main", { name: "Performance workspace" });
  await expect(workspace.getByText("Training view", { exact: true })).toBeVisible();
});

test("P2 Flight Brief reuses the same performance result with Flight brief context", async ({ page }) => {
  await calculateP2Performance(page);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const performance = page.getByRole("region", { name: "Performance" });
  await expect(performance.getByText("Flight brief", { exact: true })).toBeVisible();
  await expect(performance.locator('[data-metric="takeoffDistance"]')).toContainText("3,100 ft");
});

test("P2 PERF fast path reuses the same performance result with Operational context", async ({ page }) => {
  await calculateP2Performance(page);
  const panel = await openFastPath(page, "PERF");

  const performance = panel.getByRole("region", { name: "Performance" });
  await expect(performance.getByText("Operational", { exact: true })).toBeVisible();
  await expect(performance.locator('[data-metric="v2"]')).toContainText("125 KIAS");
});

test("P2 dependency change marks stored performance NEEDS RECALCULATION", async ({ page }) => {
  await calculateP2Performance(page);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const active = page.getByRole("region", { name: "Active Flight" });
  await active.getByRole("button", { name: "Edit flight", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Edit flight" });
  await dialog.getByLabel("Weight", { exact: true }).fill("13000");
  await dialog.getByRole("button", { name: "Save flight", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  const performance = page.getByRole("region", { name: "Performance" });
  await expect(performance.getByText("NEEDS RECALCULATION", { exact: true })).toBeVisible();
  await expect(performance).toContainText("Weight: 12,000 lb → 13,000 lb");
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "true",
  );
});

test("P2 Recalculate replaces stale values with the new dependency context", async ({ page }) => {
  await calculateP2Performance(page);
  await page.goto(`${shellOnBase}${aircraftPath}/flight`);

  const active = page.getByRole("region", { name: "Active Flight" });
  await active.getByRole("button", { name: "Edit flight", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit flight" });
  await dialog.getByLabel("Weight", { exact: true }).fill("13000");
  await dialog.getByRole("button", { name: "Save flight", exact: true }).click();

  const performance = page.getByRole("region", { name: "Performance" });
  await performance.getByRole("button", { name: "Recalculate", exact: true }).click();

  await expect(performance.getByText("NEEDS RECALCULATION", { exact: true })).toHaveCount(0);
  await expect(performance.locator('[data-ft-performance-strip="true"]')).toHaveAttribute(
    "data-stale",
    "false",
  );
  await expect(performance.locator('[data-metric="takeoffDistance"]')).toContainText("3,500 ft");
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
  const performance = workspace.getByRole("region", { name: "Performance" });
  await expect(performance).toHaveAttribute("data-empty", "true");
  await expect(performance).toContainText("No active flight.");
  await expect(performance.getByText("Training view", { exact: true })).toBeVisible();
});
