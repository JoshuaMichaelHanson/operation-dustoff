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

async function startGame(page: Page, levelIndex = 0,
  touch = false): Promise<void> {
  await page.goto(touch ? '/?touch=1' : '/');
  await expect(page.locator('#game canvas')).toBeVisible();
  for (let index = 0; index < levelIndex; index += 1) {
    await page.mouse.click(1_105, 539);
  }
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

async function holdTouch(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs: number,
): Promise<void> {
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 1 }],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: endX, y: endY, id: 1 }],
  });
  try {
    await page.waitForTimeout(durationMs);
  } finally {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await session.detach();
  }
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

test('renders solid terrain and distinct environments on harder missions', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page, 1);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 2_800);
  await attachScreenshot(page, testInfo, 'level-2-highland-ridge');

  await startGame(page, 2);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 2_800);
  await attachScreenshot(page, testInfo, 'level-3-night-ridge');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('drains and refills Dustline Hold fuel, then warns before an empty tank', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const issues = captureBrowserIssues(page);

  await startGame(page, 5);
  await attachScreenshot(page, testInfo, 'fuel-full-at-base');
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 2_800);
  await attachScreenshot(page, testInfo, 'fuel-used-in-flight');
  await holdKeys(page, ['ArrowUp', 'ArrowLeft'], 3_000);
  await holdKeys(page, ['ArrowDown'], 4_300);
  await holdKeys(page, ['ArrowRight'], 350);
  await page.waitForTimeout(500);
  await attachScreenshot(page, testInfo, 'fuel-refilled-at-base');
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 2_000);
  await page.keyboard.down('ArrowUp');
  try {
    await page.waitForTimeout(47_000);
    await attachScreenshot(page, testInfo, 'fuel-return-warning');
    await page.waitForTimeout(6_300);
    await attachScreenshot(page, testInfo, 'fuel-empty-life-lost');
  } finally {
    await page.keyboard.up('ArrowUp');
  }
  await page.waitForTimeout(2_500);
  await attachScreenshot(page, testInfo, 'fuel-respawned-full');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('shows Dustline Hold fuel through a touch flight and base landing', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const issues = captureBrowserIssues(page);

  await startGame(page, 5, true);
  await attachScreenshot(page, testInfo, 'fuel-touch-full');
  await holdTouch(page, 145, 585, 145, 520, 1_800);
  await attachScreenshot(page, testInfo, 'fuel-touch-airborne');
  await holdTouch(page, 145, 585, 145, 660, 3_000);
  await page.waitForTimeout(500);
  await attachScreenshot(page, testInfo, 'fuel-touch-refilled');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
  await context.close();
});

test('drops a bomb over the Highland Pass ridge to destroy its armored tank', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page, 1);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 3_000);
  await holdKeys(page, ['ArrowRight'], 1_600);
  await holdKeys(page, ['ArrowLeft'], 600);
  await holdKeys(page, ['z'], 120);
  await page.waitForTimeout(1_800);

  await attachScreenshot(page, testInfo, 'level-2-bombed-armored-tank');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('fires the cannon while retreating and after turning', async ({ page }, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 850);
  await holdKeys(page, ['ArrowLeft', 'Space'], 750);
  await attachScreenshot(page, testInfo, 'backward-cannon-fire');
  await page.keyboard.press('f');
  await holdKeys(page, ['ArrowLeft', 'Space'], 450);
  await attachScreenshot(page, testInfo, 'turned-cannon-fire');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('approaches the Copper Gorge AA gun and drops a bomb without browser errors', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page, 3);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 3_000);
  await holdKeys(page, ['ArrowRight'], 2_200);
  await holdKeys(page, ['ArrowLeft'], 600);
  await attachScreenshot(page, testInfo, 'level-4-aa-approach');
  await holdKeys(page, ['z'], 120);
  await page.waitForTimeout(1_800);

  await attachScreenshot(page, testInfo, 'level-4-aa-bomb');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('renders the bomb action in the forced touch layout', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await page.goto('/?touch=1');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  await attachScreenshot(page, testInfo, 'touch-bomb-control');
  await page.mouse.click(690, 615);
  await page.waitForTimeout(120);
  await attachScreenshot(page, testInfo, 'touch-turn-control');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('approaches the Sable Reach SAM and drops a bomb without browser errors', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page, 4);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 3_000);
  await attachScreenshot(page, testInfo, 'level-5-sam-warning');
  await holdKeys(page, ['ArrowRight'], 2_350);
  await holdKeys(page, ['ArrowLeft'], 600);
  await attachScreenshot(page, testInfo, 'level-5-sam-approach');
  await holdKeys(page, ['z'], 120);
  await page.waitForTimeout(1_800);

  await attachScreenshot(page, testInfo, 'level-5-sam-bomb');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('carries SF to Dustline Hold and defends a released POW camp', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const issues = captureBrowserIssues(page);

  await startGame(page, 5);
  await attachScreenshot(page, testInfo, 'level-6-sf-aboard');
  await page.keyboard.down('ArrowRight');
  try {
    for (let segment = 0; segment < 5; segment += 1) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(260);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(840);
    }
  } finally {
    await page.keyboard.up('ArrowRight');
  }
  await holdKeys(page, ['ArrowLeft'], 450);
  await holdKeys(page, ['ArrowDown'], 1_500);
  await holdKeys(page, ['g'], 180);
  await page.waitForTimeout(250);
  await attachScreenshot(page, testInfo, 'level-6-sf-deployed');
  await holdKeys(page, ['Space'], 1_600);
  await page.waitForTimeout(500);
  await attachScreenshot(page, testInfo, 'level-6-camp-open');
  await page.waitForTimeout(5_000);
  await attachScreenshot(page, testInfo, 'level-6-truck-assault');
  await page.waitForTimeout(3_000);
  await attachScreenshot(page, testInfo, 'level-6-sf-ground-defense');
  await page.waitForTimeout(2_000);
  await holdKeys(page, ['ArrowUp', 'ArrowLeft'], 5_000);
  await attachScreenshot(page, testInfo, 'level-6-return-approach');
  await holdKeys(page, ['ArrowDown'], 4_000);
  await page.waitForTimeout(5_500);
  await attachScreenshot(page, testInfo, 'level-6-survivors-rescued');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('keeps the full touch layout inside an older iPad viewport', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);
  const viewport = { width: 1_024, height: 768 };

  await page.setViewportSize(viewport);
  await page.goto('/?touch=1');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);

  const canvasBounds = await page.locator('#game canvas').boundingBox();
  expect(canvasBounds).not.toBeNull();
  if (!canvasBounds) {
    throw new Error('Game canvas bounds were unavailable');
  }

  const cannonRightEdge =
    canvasBounds.x + canvasBounds.width * ((1_160 + 68) / 1_280);
  expect(canvasBounds.x).toBeGreaterThanOrEqual(0);
  expect(canvasBounds.y).toBeGreaterThanOrEqual(0);
  expect(canvasBounds.x + canvasBounds.width).toBeLessThanOrEqual(
    viewport.width,
  );
  expect(canvasBounds.y + canvasBounds.height).toBeLessThanOrEqual(
    viewport.height,
  );
  expect(cannonRightEdge).toBeLessThanOrEqual(viewport.width);

  await attachScreenshot(page, testInfo, 'older-ipad-touch-layout');
  await attachConsoleReport(testInfo, issues);

  expect(issues).toEqual([]);
});

test('opens a Highland Pass camp without releasing hostages into its ridge', async ({
  page,
}, testInfo) => {
  const issues = captureBrowserIssues(page);

  await startGame(page, 1);
  await holdKeys(page, ['ArrowUp', 'ArrowRight'], 3_000);
  await page.keyboard.down('ArrowRight');
  try {
    for (let segment = 0; segment < 4; segment += 1) {
      await page.keyboard.down('ArrowUp');
      await page.waitForTimeout(260);
      await page.keyboard.up('ArrowUp');
      await page.waitForTimeout(840);
    }
  } finally {
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('ArrowRight');
  }

  await holdKeys(page, ['ArrowLeft'], 600);
  await holdKeys(page, ['z'], 120);
  await page.waitForTimeout(1_400);
  await holdKeys(page, ['z'], 120);
  await page.waitForTimeout(2_500);
  await holdKeys(page, ['ArrowDown'], 1_200);
  await page.waitForTimeout(500);

  await attachScreenshot(page, testInfo, 'level-2-ridge-safe-hostages');
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

test('flies a keyboard pickup and return route without browser errors', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
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
    await page.keyboard.up('ArrowRight');
  }
  await holdKeys(page, ['ArrowLeft'], 450);
  await holdKeys(page, ['ArrowDown'], 1_500);
  await holdKeys(page, ['Space'], 1_600);
  await page.waitForTimeout(4_000);
  await attachScreenshot(page, testInfo, 'keyboard-pickup');

  await holdKeys(page, ['ArrowUp', 'ArrowLeft'], 7_000);
  await holdKeys(page, ['ArrowDown'], 4_500);
  await page.waitForTimeout(3_000);
  await attachScreenshot(page, testInfo, 'keyboard-base-return');
  await attachConsoleReport(testInfo, issues);
  expect(issues).toEqual([]);
});

test('touch controls drive a pickup and return route without browser errors', async ({
  browser,
}, testInfo) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();
  const issues = captureBrowserIssues(page);
  await page.goto('http://127.0.0.1:4173/?touch=1');
  await expect(page.locator('#game canvas')).toBeVisible();
  await page.touchscreen.tap(640, 640);
  await page.waitForTimeout(500);

  for (let segment = 0; segment < 7; segment += 1) {
    await holdTouch(page, 145, 585, 210, 520, 260);
    await holdTouch(page, 145, 585, 220, 585, 840);
  }
  await holdTouch(page, 145, 585, 70, 585, 450);
  await holdTouch(page, 145, 585, 145, 660, 1_500);
  await holdTouch(page, 1_160, 590, 1_160, 590, 1_600);
  await page.waitForTimeout(4_000);
  await attachScreenshot(page, testInfo, 'touch-pickup');

  await holdTouch(page, 145, 585, 80, 520, 7_000);
  await holdTouch(page, 145, 585, 145, 660, 4_500);
  await page.waitForTimeout(5_000);
  await attachScreenshot(page, testInfo, 'touch-base-return');
  await attachConsoleReport(testInfo, issues);
  expect(issues).toEqual([]);
  await context.close();
});
