import { describe, expect, it } from 'vitest';

import { GAME_HEIGHT, GAME_TITLE, GAME_WIDTH } from '../src/game/constants';

describe('game constants', () => {
  it('defines a playable game viewport and title', () => {
    expect(GAME_WIDTH).toBe(1280);
    expect(GAME_HEIGHT).toBe(720);
    expect(GAME_TITLE).toBe('OPERATION DUSTOFF');
  });
});
