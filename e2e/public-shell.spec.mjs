import { test,expect } from "@playwright/test";

async function expectNoHorizontalOverflow(page){
  const state=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const overflow=document.documentElement.scrollWidth-viewport;
    const offenders=[...document.querySelectorAll("body *")].map(element=>{
      const rect=element.getBoundingClientRect();
      const style=getComputedStyle(element);
      return{
        tag:element.tagName.toLowerCase(),
        id:element.id||"",
        className:typeof element.className==="string"?element.className.slice(0,140):"",
        left:Math.round(rect.left*10)/10,
        right:Math.round(rect.right*10)/10,
        width:Math.round(rect.width*10)/10,
        scrollWidth:element instanceof HTMLElement?element.scrollWidth:0,
        overflowX:style.overflowX,
      };
    }).filter(item=>item.right>viewport+1||item.left<-1).slice(0,20);
    return{viewport,scrollWidth:document.documentElement.scrollWidth,overflow,offenders};
  });
  expect(state.overflow,JSON.stringify(state,null,2)).toBeLessThanOrEqual(1);
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

  const checklistTab=page.getByRole("button",{name:"Checklist",exact:true});
  const performanceTab=page.getByRole("button",{name:"Performance",exact:true});
  await expect(checklistTab).toHaveAttribute("aria-pressed","true");
  const battery=page.getByRole("button",{name:/Battery/});
  await expect(battery).toHaveAttribute("aria-pressed","false");
  await battery.click();
  await expect(battery).toHaveAttribute("aria-pressed","true");
  await page.waitForFunction(()=>[...Array(localStorage.length).keys()].map(index=>localStorage.key(index)).filter(Boolean).some(key=>{
    if(!key?.startsWith("flytally:flight-checklist:v1:browser-ci-aircraft:Standard:"))return false;
    try{return JSON.parse(localStorage.getItem(key)||"{}").completedIds?.includes("battery")===true}catch{return false}
  }));
  await page.reload();
  await expect(page.getByRole("button",{name:/Battery/})).toHaveAttribute("aria-pressed","true");

  await performanceTab.click();
  await expect(performanceTab).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("region",{name:"Declarative operational performance"})).toBeVisible();
  await page.getByLabel("Airport altitude").fill("0");
  await page.getByLabel("OAT").fill("15");
  await page.getByLabel("Runway available").fill("1000");
  const distanceResult=page.locator("div").filter({hasText:/^50 ft distance500 m$/}).getByRole("strong");
  await expect(distanceResult).toHaveText("500 m");
  await page.waitForFunction(()=>[...Array(localStorage.length).keys()].map(index=>localStorage.key(index)).filter(Boolean).some(key=>{
    if(!key?.startsWith("flytally:flight-performance:v2:browser-ci-aircraft:Standard"))return false;
    try{return Object.values(JSON.parse(localStorage.getItem(key)||"{}").values||{}).includes("1000")}catch{return false}
  }));
  await page.reload();
  await performanceTab.click();
  await expect(page.getByLabel("Airport altitude")).toHaveValue("0");
  await expect(page.getByLabel("OAT")).toHaveValue("15");
  await expect(page.getByLabel("Runway available")).toHaveValue("1000");
  await expect(page.locator("div").filter({hasText:/^50 ft distance500 m$/}).getByRole("strong")).toHaveText("500 m");
  await expectNoHorizontalOverflow(page);
});
