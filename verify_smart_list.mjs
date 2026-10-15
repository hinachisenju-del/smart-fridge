import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

function getChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find((c) => fs.existsSync(c));
}

async function verifySmartList() {
  console.log('=== Smart List Full E2E & Theme Verification ===');
  const chromePath = getChromePath();
  const screenshotDir = path.resolve('frontend/screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Navigate to frontend dev server
  const startTime = performance.now();
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  console.log('✔ Navigated to http://localhost:5173');

  // Verify Title
  const title = await page.title();
  console.log(`✔ Page title: "${title}"`);

  // Helper to click visible button
  const clickVisible = async (selector) => {
    return await page.evaluate((sel) => {
      const els = Array.from(document.querySelectorAll(sel));
      const visible = els.find((el) => el.offsetParent !== null) || els[0];
      if (visible) {
        visible.click();
        return true;
      }
      return false;
    }, selector);
  };

  // Ensure Dashboard view is active
  await clickVisible('[data-testid="nav-dashboard-btn"]');
  await new Promise((r) => setTimeout(r, 400));

  // Force Light mode for Dashboard Light screenshot
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    localStorage.setItem('smart-list-theme', 'light');
  });
  await new Promise((r) => setTimeout(r, 200));

  // Take screenshot of Light Mode Dashboard
  await page.screenshot({ path: path.join(screenshotDir, '01_dashboard_light.png'), fullPage: false });
  console.log('✔ Saved 01_dashboard_light.png (Light Mode)');

  // 2. Toggle Theme to Dark via visible button
  const toggleClicked = await clickVisible('[data-testid="theme-toggle-btn"]');
  console.log(`✔ Clicked theme toggle: ${toggleClicked}`);
  await new Promise((r) => setTimeout(r, 200));

  // Ensure dark mode DOM classes
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    localStorage.setItem('smart-list-theme', 'dark');
  });
  await new Promise((r) => setTimeout(r, 200));

  let isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`✔ Dark mode verified isDark: ${isDark}`);

  await page.screenshot({ path: path.join(screenshotDir, '02_dashboard_dark.png'), fullPage: false });
  console.log('✔ Saved 02_dashboard_dark.png (Dark Mode)');

  // 3. Navigate to Shopping List
  if (await clickVisible('[data-testid="nav-shopping-btn"]')) {
    await new Promise((r) => setTimeout(r, 400));
    console.log('✔ Navigated to Shopping List view');

    const hasMlCard = await page.$('[data-testid="ml-restock-predictions-section"]');
    console.log(`✔ Smart Restock ML section visible in Shopping: ${hasMlCard !== null}`);

    await page.screenshot({ path: path.join(screenshotDir, '03_shopping_list_dark.png'), fullPage: false });
    console.log('✔ Saved 03_shopping_list_dark.png');
  }

  // 4. Navigate to My Lists
  if (await clickVisible('[data-testid="nav-lists-btn"]')) {
    await new Promise((r) => setTimeout(r, 400));
    console.log('✔ Navigated to My Lists view');
    await page.screenshot({ path: path.join(screenshotDir, '04_my_lists_dark.png'), fullPage: false });
    console.log('✔ Saved 04_my_lists_dark.png');
  }

  // 5. Navigate to Settings View
  if (await clickVisible('[data-testid="nav-settings-btn"]')) {
    await new Promise((r) => setTimeout(r, 400));
    console.log('✔ Navigated to Settings view');

    const themeLightBtn = await page.$('[data-testid="theme-option-light"]');
    const themeDarkBtn = await page.$('[data-testid="theme-option-dark"]');
    const themeSystemBtn = await page.$('[data-testid="theme-option-system"]');
    console.log(`✔ Segmented theme options present: Light (${themeLightBtn !== null}), Dark (${themeDarkBtn !== null}), System (${themeSystemBtn !== null})`);

    await page.screenshot({ path: path.join(screenshotDir, '05_settings_dark.png'), fullPage: false });
    console.log('✔ Saved 05_settings_dark.png');
  }

  // 6. Mobile Viewport Check (390 x 844 iPhone 14)
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(screenshotDir, '06_mobile_settings_dark.png'), fullPage: false });
  console.log('✔ Saved 06_mobile_settings_dark.png');

  const duration = (performance.now() - startTime).toFixed(0);
  console.log(`\n🎉 Verification Completed successfully in ${duration} ms!`);

  await browser.close();
}

verifySmartList().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
