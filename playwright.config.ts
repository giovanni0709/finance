import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
export default defineConfig({
 testDir:'./e2e',workers:1,fullyParallel:false,timeout:45000,
 use:{baseURL:'http://127.0.0.1:3100',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined},trace:'retain-on-failure'},
 webServer:{command:'npm run start -- --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false,timeout:45000,env:{FINANCE_DB:path.join(tmpdir(),`my-finance-e2e-${randomUUID()}.sqlite`),NEXT_TELEMETRY_DISABLED:'1'}}
});
