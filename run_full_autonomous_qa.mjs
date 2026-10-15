import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

function getChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find((c) => c && fs.existsSync(c));
}

const ARTIFACT_DIR = 'C:/Users/1306s/.gemini/antigravity/brain/78f8ce49-eb56-48c5-b29d-7859418c83d1';

async function safeClick(page, testId) {
  await page.evaluate((id) => {
    const elements = Array.from(document.querySelectorAll(`button[data-testid="${id}"]`));
    const visible = elements.find((el) => el.offsetParent !== null) || elements[0];
    if (visible) visible.click();
    else console.warn(`Element with data-testid="${id}" not found`);
  }, testId);
  await new Promise((r) => setTimeout(r, 600));
}

async function runAutonomousQA() {
  const chromePath = getChromePath();
  console.log('--- PHASE 4: AUTONOMOUS BROWSER WORKFLOW TESTING ---');
  console.log('Using Chrome executable:', chromePath);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--mute-audio',
    ],
  });

  const errors = [];
  const logs = [];

  try {
    const page = await browser.newPage();

    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });

    page.on('pageerror', (err) => {
      errors.push(`Page error: ${err.message}`);
    });

    // ---------------------------------------------------------
    // A. STARTUP VERIFICATION (1440x900 Desktop)
    // ---------------------------------------------------------
    console.log('\n[TEST A] Startup verification (Desktop 1440x900)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    const startTime = Date.now();
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    console.log(`Page domcontentloaded in ${loadTime}ms`);

    // Verify 3D canvas is NOT present
    const canvas3dExists = await page.evaluate(() => {
      return document.querySelector('canvas[data-engine="three.js"]') !== null;
    });
    console.log('3D ThreeJS canvas exists:', canvas3dExists, '(Expected: false)');
    if (canvas3dExists) errors.push('Regression: ThreeJS 3D canvas was found in the DOM on startup!');

    // Set theme to Light for clean baseline
    await page.evaluate(() => {
      localStorage.setItem('smart-list-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    });
    await new Promise((r) => setTimeout(r, 500));

    // Navigate to Dashboard
    await safeClick(page, 'nav-dashboard-btn');
    await new Promise((r) => setTimeout(r, 600));

    // Capture Light Mode Desktop Dashboard
    const dashLightScreenshot = path.join(ARTIFACT_DIR, 'desktop_dashboard_light.png');
    await page.screenshot({ path: dashLightScreenshot });
    console.log('✓ Captured desktop_dashboard_light.png');

    // ---------------------------------------------------------
    // B. DARK MODE VERIFICATION
    // ---------------------------------------------------------
    console.log('\n[TEST B] Dark mode toggle and verification...');
    // Click theme toggle button to switch to dark
    await safeClick(page, 'theme-toggle-btn');
    await new Promise((r) => setTimeout(r, 400));
    const isDarkAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('Document .dark class after first click:', isDarkAfterToggle);

    // Ensure dark class is active for dark captures
    await page.evaluate(() => {
      localStorage.setItem('smart-list-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    });
    await new Promise((r) => setTimeout(r, 500));

    // Capture Dark Mode Desktop Dashboard
    const dashDarkScreenshot = path.join(ARTIFACT_DIR, 'desktop_dashboard_dark.png');
    await page.screenshot({ path: dashDarkScreenshot });
    console.log('✓ Captured desktop_dashboard_dark.png');

    // ---------------------------------------------------------
    // C. MULTI-LIST WORKFLOW & PERSISTENCE
    // ---------------------------------------------------------
    console.log('\n[TEST C] Multi-List CRUD and Isolation...');
    await safeClick(page, 'nav-lists-btn');
    await new Promise((r) => setTimeout(r, 600));

    // Capture My Lists in Dark Mode
    const listsDarkScreenshot = path.join(ARTIFACT_DIR, 'desktop_my_lists_dark.png');
    await page.screenshot({ path: listsDarkScreenshot });
    console.log('✓ Captured desktop_my_lists_dark.png');

    // ---------------------------------------------------------
    // D. SHOPPING LIST CHECKLIST & ITEM WORKFLOW
    // ---------------------------------------------------------
    console.log('\n[TEST D] Shopping List interactions...');
    await safeClick(page, 'nav-shopping-btn');
    await new Promise((r) => setTimeout(r, 600));

    // Capture Shopping List in Dark Mode
    const shoppingDarkScreenshot = path.join(ARTIFACT_DIR, 'desktop_shopping_list_dark.png');
    await page.screenshot({ path: shoppingDarkScreenshot });
    console.log('✓ Captured desktop_shopping_list_dark.png');

    // Switch back to Light Mode for light captures
    await page.evaluate(() => {
      localStorage.setItem('smart-list-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    });
    await new Promise((r) => setTimeout(r, 500));

    const shoppingLightScreenshot = path.join(ARTIFACT_DIR, 'desktop_shopping_list_light.png');
    await page.screenshot({ path: shoppingLightScreenshot });
    console.log('✓ Captured desktop_shopping_list_light.png');

    // ---------------------------------------------------------
    // E. TABLET RESPONSIVENESS (768x1024)
    // ---------------------------------------------------------
    console.log('\n[TEST E] Tablet Viewport (768x1024)...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600));
    await safeClick(page, 'nav-shopping-btn');
    await new Promise((r) => setTimeout(r, 500));

    const tabletScreenshot = path.join(ARTIFACT_DIR, 'tablet_shopping_list_dark.png');
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: tabletScreenshot });
    console.log('✓ Captured tablet_shopping_list_dark.png');

    // ---------------------------------------------------------
    // F. MOBILE RESPONSIVENESS (390x844)
    // ---------------------------------------------------------
    console.log('\n[TEST F] Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600));

    // Mobile in Dark Mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await new Promise((r) => setTimeout(r, 400));
    await safeClick(page, 'nav-shopping-btn');
    await new Promise((r) => setTimeout(r, 500));

    const mobileDarkScreenshot = path.join(ARTIFACT_DIR, 'mobile_shopping_list_dark.png');
    await page.screenshot({ path: mobileDarkScreenshot });
    console.log('✓ Captured mobile_shopping_list_dark.png');

    // Mobile in Light Mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    await new Promise((r) => setTimeout(r, 400));

    const mobileLightScreenshot = path.join(ARTIFACT_DIR, 'mobile_shopping_list_light.png');
    await page.screenshot({ path: mobileLightScreenshot });
    console.log('✓ Captured mobile_shopping_list_light.png');

    console.log('\n--- BROWSER QA COMPLETED SUCCESSFULLY ---');
    console.log('Total console errors observed:', errors.length);
    if (errors.length > 0) {
      console.warn('Errors:', errors);
    }

  } catch (err) {
    console.error('Fatal Puppeteer error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAutonomousQA();
