import Phaser from 'phaser';

import './style.css';
import { gameConfig } from './game/config';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import { calculateContainedDisplaySize } from './game/logic/displaySize';

const root = document.documentElement;
const gameHost = document.querySelector<HTMLElement>('#game');
const main = document.querySelector<HTMLElement>('main');

const writeVisualViewportSize = (): void => {
  const viewport = window.visualViewport;
  root.style.setProperty(
    '--viewport-width',
    `${Math.round(viewport?.width ?? window.innerWidth)}px`,
  );
  root.style.setProperty(
    '--viewport-height',
    `${Math.round(viewport?.height ?? window.innerHeight)}px`,
  );
};

const readPixels = (value: string): number =>
  Number.parseFloat(value) || 0;

const writeGameDisplaySize = (): void => {
  if (!gameHost || !main) {
    return;
  }

  const mainStyle = window.getComputedStyle(main);
  const availableWidth =
    main.clientWidth -
    readPixels(mainStyle.paddingLeft) -
    readPixels(mainStyle.paddingRight);
  const availableHeight =
    main.clientHeight -
    readPixels(mainStyle.paddingTop) -
    readPixels(mainStyle.paddingBottom);
  const displaySize = calculateContainedDisplaySize(
    availableWidth,
    availableHeight,
    GAME_WIDTH,
    GAME_HEIGHT,
  );

  if (displaySize.width > 0 && displaySize.height > 0) {
    root.style.setProperty('--game-width', `${displaySize.width}px`);
    root.style.setProperty('--game-height', `${displaySize.height}px`);
  }
};

const refreshViewportSize = (): void => {
  writeVisualViewportSize();
  writeGameDisplaySize();
};

refreshViewportSize();

const game = new Phaser.Game(gameConfig);
let settledResize: number | undefined;

const refreshGameLayout = (): void => {
  refreshViewportSize();
  window.requestAnimationFrame(() => {
    refreshViewportSize();
    game.scale.refresh();
  });

  window.clearTimeout(settledResize);
  settledResize = window.setTimeout(() => {
    refreshViewportSize();
    game.scale.refresh();
  }, 250);
};

window.addEventListener('resize', refreshGameLayout);
window.addEventListener('orientationchange', refreshGameLayout);
window.visualViewport?.addEventListener('resize', refreshGameLayout);
window.requestAnimationFrame(() => game.scale.refresh());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('resize', refreshGameLayout);
    window.removeEventListener('orientationchange', refreshGameLayout);
    window.visualViewport?.removeEventListener('resize', refreshGameLayout);
    window.clearTimeout(settledResize);
    game.destroy(true);
  });
}
