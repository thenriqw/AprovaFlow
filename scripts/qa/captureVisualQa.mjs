import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT_DIR = 'qa-screenshots';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });
  const desktopPage = await desktopContext.newPage();
  
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  async function runTests(page, prefix) {
    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore.googleapis.com') ||
          url.includes('identitytoolkit.googleapis.com') ||
          url.includes('securetoken.googleapis.com')) {
        console.error(`[NETWORK VIOLATION] Request made to Firebase backend: ${url}`);
        process.exit(1);
      }
    });

    page.on('pageerror', error => {
      console.error(`[PAGE ERROR] ${error.message}`);
      process.exit(1);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('failed to connect to websocket')) {
            console.error(`[CONSOLE ERROR] ${text}`);
            process.exit(1);
        }
      }
    });

    await page.goto('http://127.0.0.1:4173/?qaVisual=1', { waitUntil: 'networkidle' });

    await page.locator('text=QA Visual').filter({ hasText: 'QA Visual' }).first().waitFor({ state: 'attached', timeout: 5000 });

    const loginBtnCount = await page.locator('text=Entrar com Google').count();
    if (loginBtnCount > 0) {
      console.error(`[ERROR] Login screen is visible in QA mode!`);
      process.exit(1);
    }

    const clickNav = async (name) => {
      // Find the nav button that matches the name EXACTLY, and only interact with the visible one
      const loc = page.locator(`nav button`).filter({ hasText: new RegExp(`^${name}$`) });
      
      // On mobile/desktop, one nav is visible, one is hidden.
      // Playwright's click action automatically waits for visibility.
      // We will use `.first()` on the visible ones if possible. But `click()` will fail if the first is hidden.
      // Let's iterate and click the first visible one.
      const count = await loc.count();
      for (let i = 0; i < count; i++) {
        const el = loc.nth(i);
        if (await el.isVisible()) {
           await el.click();
           break;
        }
      }
      await page.waitForTimeout(500);
    };

    // 1. Hoje
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-hoje.png`), fullPage: true });

    // 2. Plano
    await clickNav('Plano');
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-plano.png`), fullPage: true });

    // 3. Conteúdo
    await clickNav('Conteúdo');
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-conteudo.png`), fullPage: true });

    // 4. Entrada
    await clickNav('Entrada');
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-entrada.png`), fullPage: true });

    // 5. Progresso
    await clickNav('Progresso');
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-progresso.png`), fullPage: true });

    // 6. Historico Detalhado
    try {
      const histBtn = page.locator('button:has-text("Histórico Detalhado")').first();
      // Wait to see if it exists
      await histBtn.waitFor({ state: 'visible', timeout: 1000 });
      await histBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT_DIR, `${prefix}-progresso-historico.png`), fullPage: true });
    } catch (e) {
      console.warn(`Could not capture detailed history for ${prefix}.`);
    }
  }

  console.log("Running Desktop QA...");
  await runTests(desktopPage, "01-desktop");
  console.log("Running Mobile QA...");
  await runTests(mobilePage, "02-mobile");

  await browser.close();
  console.log("Visual QA completed successfully.");
})();
