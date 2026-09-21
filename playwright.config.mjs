import { defineConfig,devices } from "@playwright/test";

const ipadBase={
  browserName:"chromium",
  deviceScaleFactor:2,
  hasTouch:true,
  isMobile:true,
};

export default defineConfig({
  testDir:"./e2e",
  timeout:30_000,
  expect:{timeout:5_000},
  fullyParallel:false,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[["line"],["html",{outputFolder:"playwright-report",open:"never"}]]:"line",
  use:{
    baseURL:"http://127.0.0.1:3000",
    trace:"retain-on-failure",
    screenshot:"only-on-failure",
    video:"off",
  },
  projects:[
    {name:"desktop-chromium",use:{...devices["Desktop Chrome"]}},
    {name:"mobile-chromium",use:{...devices["Pixel 7"]}},
    {
      name:"ipad-landscape",
      use:{
        ...ipadBase,
        viewport:{width:1024,height:768},
      },
    },
    {
      name:"ipad-portrait",
      use:{
        ...ipadBase,
        viewport:{width:768,height:1024},
      },
    },
  ],
  webServer:{
    command:"npm start",
    url:"http://127.0.0.1:3000",
    reuseExistingServer:!process.env.CI,
    timeout:120_000,
  },
});
