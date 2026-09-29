import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

interface BrowserIssue {
  source: 'console' | 'page';
  level: 'warning' | 'error';
  message: string;
}

function captureBrowserIssues(page: Page): BrowserIssue[] {
  const issues: BrowserIssue[] = [];

  page.on('console', (message) => {
    const level = message.type();
    if (level !== 'warning' && level !== 'error') {
      return;
    }
    issues.push({
      source: 'console',
      level,
      message: message.text(),
    });
  });
  page.on('pageerror', (error) => {
    issues.push({
      source: 'page',
      level: 'error',
      message: error.message,
    });
  });

  return issues;
}

async function attachScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path });
  await testInfo.attach(name, {
    path,
    contentType: 'image/png',
  });
}

async function attachConsoleReport(
  testInfo: TestInfo,
  issues: BrowserIssue[],
): Promise<void> {
  const path = testInfo.outputPath('browser-console.json');
  await writeFile(path, JSON.stringify({ issues }, null, 2), 'utf8');
  await testInfo.attach('browser-console', {
    path,
    contentType: 'application/json',
  });
}

async function holdKeys(
  page: Page,
  keys: string[],
  durationMs: number,
): Promise<void> {
  for (const key of keys) {
    await page.keyboard.down(key);
  }

  try {
    await page.waitForTimeout(durationMs);
  } finally {
    for (const key of [...keys].reverse()) {
      await page.keyboard.up(key);
    }
  }
}

async function startGame(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

test('holds flight and cannon input across gameplay frames', async ({ page }, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 900);
  await holdKeys(page, ['ArrowRight', 'Space'], 1_100);
  await attachScreenshot(page, testInfo, 'held-flight-and-cannon');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('flies to the first camp, destroys it, and observes released hostages', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page);
  await page.keyboard.down('ArrowRight');
  try {
    for (let segment = 0; segment < 7; segment += 1) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(260);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(840);
    }
  } finally {
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('ArrowRight');
  }

  await holdKeys(page, ['ArrowLeft'], 450);
  await holdKeys(page, ['ArrowDown'], 1_500);
  await holdKeys(page, ['Space'], 1_600);
  await page.waitForTimeout(1_200);

  await attachScreenshot(page, testInfo, 'first-camp-hostages-released');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});
