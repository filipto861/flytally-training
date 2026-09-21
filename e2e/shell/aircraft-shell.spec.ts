import { expect, test } from "@playwright/test";

const shellOnBase = "http://127.0.0.1:3001";
const aircraftPath = "/aircraft/browser-ci-aircraft";

test("W0 keeps the legacy aircraft view when FT_NEW_SHELL is off", async ({ page }) => {
  await page.goto(aircraftPath);
  await expect(page.locator('[data-ft-shell="true"]')).toHaveCount(0);
  const legacyNav = page.locator('section[aria-label="Aircraft navigation"]');
  await expect(legacyNav).toBeVisible();
  await expect(legacyNav.getByRole("navigation", { name: "Pilot workspace" })).toBeVisible();
});

test("W0 mounts the new aircraft shell when FT_NEW_SHELL is on", async ({ page }) => {
  await page.goto(`${shellOnBase}${aircraftPath}`);

  const shell = page.locator('[data-ft-shell="true"]');
  await expect(shell).toBeVisible();
  await expect(shell.getByText("Browser CI Aircraft", { exact: true }).first()).toBeVisible();
  await expect(shell.getByText(/Training profile:/)).toBeVisible();
  const legacyNav = page.locator('section[aria-label="Aircraft navigation"]');
  await expect(legacyNav).toBeVisible();
  await expect(legacyNav.getByRole("navigation", { name: "Pilot workspace" })).toBeVisible();
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
