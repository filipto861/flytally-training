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
  await expect(fastPath.getByRole("link")).toHaveCount(4);

  for (const label of ["CHECKLIST", "QRH", "PERF", "REF"]) {
    await expect(fastPath.getByRole("link", { name: label, exact: true })).toBeVisible();
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
