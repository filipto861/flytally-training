import { test,expect } from "@playwright/test";

async function expectNoHorizontalOverflow(page){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("Training library shell renders responsively with governed content empty or populated",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Your aircraft"})).toBeVisible();
  await expect(page.locator(".pilot-aircraft-list")).toBeVisible();
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

test("unauthenticated account state resolves to the normal sign-in action",async({page})=>{
  await page.goto("/");
  const signIn=page.getByRole("link",{name:"Sign in"});
  await expect(signIn).toBeVisible();
  await expect(signIn).toHaveAttribute("href",/\/api\/auth\/flytally\/start/);
  const box=await signIn.boundingBox();
  expect(box?.height??0).toBeGreaterThanOrEqual(40);
  await expectNoHorizontalOverflow(page);
});
