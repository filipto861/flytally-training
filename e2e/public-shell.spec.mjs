import { test,expect } from "@playwright/test";

async function expectNoHorizontalOverflow(page){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("aircraft library renders as a usable responsive surface",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Your aircraft"})).toBeVisible();
  const aircraft=page.locator("a.pilot-aircraft-row");
  await expect(aircraft.first()).toBeVisible();
  expect(await aircraft.count()).toBeGreaterThan(0);
  await expectNoHorizontalOverflow(page);
});

test("keyboard users can skip persistent Training chrome",async({page})=>{
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip=page.getByRole("link",{name:"Skip to content"});
  await expect(skip).toBeFocused();
  await skip.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("aircraft selection opens the pilot workspace without overflow",async({page})=>{
  await page.goto("/");
  const first=page.locator("a.pilot-aircraft-row").first();
  const name=(await first.getByRole("heading",{level:2}).textContent())?.trim();
  expect(name).toBeTruthy();
  await first.click();
  await expect(page).toHaveURL(/\/aircraft\//);
  await expect(page.getByRole("heading",{level:1,name})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Pilot workspace"})).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
