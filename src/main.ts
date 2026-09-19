import Phaser from 'phaser';

import './style.css';
import { gameConfig } from './game/config';

const game = new Phaser.Game(gameConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
