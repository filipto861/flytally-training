import { test,expect } from "@playwright/test";

async function expectNoHorizontalOverflow(page){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("aircraft library shell renders responsively",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Your aircraft"})).toBeVisible();
  await expect(page.locator("main.pilot-library")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("unauthenticated public shell exposes the sign-in boundary",async({page})=>{
  await page.goto("/");
  const signIn=page.getByRole("link",{name:"Sign in"});
  await expect(signIn).toBeVisible();
  await expect(signIn).toHaveAttribute("href",/\/api\/auth\/flytally\/start/);
});

test("keyboard users can skip persistent Training chrome",async({page})=>{
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip=page.getByRole("link",{name:"Skip to content"});
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("deterministic aircraft opens the pilot workspace without overflow",async({page})=>{
  await page.goto("/");
  const aircraft=page.locator("a.pilot-aircraft-row").filter({hasText:"Browser CI Aircraft"});
  await expect(aircraft).toBeVisible();
  await aircraft.click();
  await expect(page).toHaveURL(/\/aircraft\/browser-ci-aircraft$/);
  await expect(page.getByRole("heading",{level:1,name:"Browser CI Aircraft"})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Pilot workspace"})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("deterministic aircraft exposes checklist and performance in Fly",async({page})=>{
  await page.goto("/aircraft/browser-ci-aircraft");
  await page.getByRole("link",{name:/Open Fly/}).click();
  await expect(page).toHaveURL(/\/aircraft\/browser-ci-aircraft\/fly(?:\?variant=Standard)?$/);
  await expect(page.getByRole("navigation",{name:"Flight tools"})).toBeVisible();

  const checklistTab=page.getByRole("button",{name:"Checklist"});
  const performanceTab=page.getByRole("button",{name:"Performance"});
  await expect(checklistTab).toHaveAttribute("aria-pressed","true");
  const battery=page.getByRole("button",{name:/Battery/});
  await expect(battery).toHaveAttribute("aria-pressed","false");
  await battery.click();
  await expect(battery).toHaveAttribute("aria-pressed","true");

  await performanceTab.click();
  await expect(performanceTab).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("region",{name:"Declarative operational performance"})).toBeVisible();
  await page.getByLabel("Airport altitude").fill("0");
  await page.getByLabel("OAT").fill("15");
  await page.getByLabel("Runway available").fill("1000");
  await expect(page.getByText("500 m",{exact:true})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
