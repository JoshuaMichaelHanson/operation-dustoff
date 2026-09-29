import Phaser from 'phaser';

import './style.css';
import { gameConfig } from './game/config';

const root = document.documentElement;

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

writeVisualViewportSize();

const game = new Phaser.Game(gameConfig);
let settledResize: number | undefined;

const refreshGameLayout = (): void => {
  writeVisualViewportSize();
  window.requestAnimationFrame(() => game.scale.refresh());

  window.clearTimeout(settledResize);
  settledResize = window.setTimeout(() => {
    writeVisualViewportSize();
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
