import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chromium } from "@playwright/test";

const baseUrl = process.env.UX6_BASE_URL ?? "https://training.fly-tally.com";
const statePath = path.resolve(
  process.cwd(),
  process.env.UX6_STORAGE_STATE ?? "ux6-auth-state.json",
);

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
const rl = createInterface({ input, output });

try {
  await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });

  console.log("");
  console.log("UX6 authenticated capture setup");
  console.log("1. Sign in in the opened browser.");
  console.log("2. Open the Learjet 35A Flight workspace.");
  console.log("3. Create or confirm the Active Flight state you want reviewed.");

  await page
    .getByRole("link", { name: "Account", exact: true })
    .waitFor({ state: "visible", timeout: 300_000 });

  console.log("");
  console.log("Authentication detected.");
  await rl.question(
    "When the Active Flight state is ready in the browser, press Enter here to save the local capture session...",
  );

  await context.storageState({ path: statePath });
  console.log("Saved authenticated Playwright state to: " + statePath);
  console.log(
    'Use: $env:UX6_STORAGE_STATE="' +
      path.relative(process.cwd(), statePath).replaceAll("\\", "/") +
      '"',
  );
} finally {
  rl.close();
  await browser.close();
}
