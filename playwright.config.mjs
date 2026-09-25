import { defineConfig,devices } from "@playwright/test";

const browserFixtureEnv={
  ...process.env,
  FLYTALLY_TRAINING_BROWSER_FIXTURE:"1",
  CI:"true",
};

const ipadUserAgent="Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ipadChromium={
  browserName:"chromium",
  deviceScaleFactor:2,
  hasTouch:true,
  isMobile:true,
  userAgent:ipadUserAgent,
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
      use:{...ipadChromium,viewport:{width:1112,height:834}},
    },
    {
      name:"ipad-portrait",
      use:{...ipadChromium,viewport:{width:834,height:1112}},
    },
  ],
  webServer:[
    {
      command:"npm start",
      url:"http://127.0.0.1:3000",
      reuseExistingServer:process.env.PW_REUSE_EXISTING_SERVER==="1",
      timeout:120_000,
      env:{...browserFixtureEnv,FT_NEW_SHELL:"false"},
    },
    {
      command:"npm start -- -p 3001",
      url:"http://127.0.0.1:3001",
      reuseExistingServer:process.env.PW_REUSE_EXISTING_SERVER==="1",
      timeout:120_000,
      env:{...browserFixtureEnv,FT_NEW_SHELL:"true"},
    },
  ],
});
