import puppeteer from 'puppeteer';
import fs from 'node:fs';

// Pre-compiled list of blocked resource types and tracker domains
const BLOCKED_RESOURCE_TYPES = new Set([
  'image',
  'stylesheet',
  'font',
  'media',
  'other', // favicons, manifests, etc.
]);

const BLOCKED_URL_PATTERNS = [
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.net',
  'sentry.io',
  'hotjar.com',
];

// Helper to auto-locate Chrome on Windows if bundled Chromium is missing
function getChromePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return candidates.find(c => fs.existsSync(c));
}

export async function runFastAutomation(options = {}) {
  const targetUrl = options.url || 'https://example.com';
  const chromePath = getChromePath();

  const browser = await puppeteer.launch({
    headless: true, // Use standard headless mode
    executablePath: chromePath || undefined,
    args: [
      // Disable unnecessary UI and backend features
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // Prevents Docker/low-memory crashes
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      // Avoid audio/video processing
      '--mute-audio',
      // Render optimizations
      '--blink-settings=imagesEnabled=false',
    ],
  });

  const page = await browser.newPage();

  // 1. Cut network rendering overhead
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    try {
      const resourceType = req.resourceType();
      const url = req.url();

      // Abort media/stylesheets and common analytics trackers
      if (
        BLOCKED_RESOURCE_TYPES.has(resourceType) ||
        BLOCKED_URL_PATTERNS.some((tracker) => url.includes(tracker))
      ) {
        req.abort();
      } else {
        req.continue();
      }
    } catch {
      // Safe guard against race conditions on handled requests
    }
  });

  // 2. Navigate: Only wait for the DOM to parse, not for full asset loads
  const startTime = performance.now();
  console.log(`[FastPuppeteer] Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded', // Much faster than networkidle0 / networkidle2
    timeout: 15000,
  });

  // 3. Fast Data Filling: Direct DOM injection + dispatching input events (if selectors exist)
  if (options.fillSelectors) {
    const { usernameSelector = '#username', passwordSelector = '#password', userValue = 'fast_user@example.com', passValue = 'InstantPassword456!' } = options;
    const hasInputs = await page.$(usernameSelector);
    if (hasInputs) {
      await page.evaluate((uSel, pSel, uVal, pVal) => {
        const userInput = document.querySelector(uSel);
        const passInput = document.querySelector(pSel);

        const setValue = (element, val) => {
          if (!element) return;
          element.value = val;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        };

        setValue(userInput, uVal);
        setValue(passInput, pVal);
      }, usernameSelector, passwordSelector, userValue, passValue);
      console.log('[FastPuppeteer] Injected form credentials via synthetic events.');
    }
  }

  // 4. Instant Action (if button exists)
  if (options.submitSelector) {
    const submitBtn = await page.$(options.submitSelector);
    if (submitBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {}),
        submitBtn.click(),
      ]);
    }
  }

  // 5. Instant Scroll: Jump straight to the bottom without intermediate steps
  await page.evaluate(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'instant',
    });
  });

  const duration = (performance.now() - startTime).toFixed(0);
  console.log(`[FastPuppeteer] Execution completed in ${duration} ms`);

  await browser.close();
  return { success: true, durationMs: Number(duration) };
}

// Self-run demo
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  runFastAutomation().catch((err) => {
    console.error('Error running automation:', err);
    process.exit(1);
  });
}
