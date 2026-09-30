import { describe, expect, it } from 'vitest';

import {
  quantizeVirtualStick,
  shouldEnableTouchControls,
  TouchInputState,
} from '../src/game/input/touchInput';

describe('virtual touch stick', () => {
  it('stays neutral inside the dead zone', () => {
    expect(quantizeVirtualStick(8, -6, 18)).toEqual({
      horizontal: 0,
      vertical: 0,
    });
  });

  it('selects cardinal directions without accidental diagonals', () => {
    expect(quantizeVirtualStick(70, 8, 18)).toEqual({
      horizontal: 1,
      vertical: 0,
    });
    expect(quantizeVirtualStick(-7, -70, 18)).toEqual({
      horizontal: 0,
      vertical: -1,
    });
  });

  it('supports all axes at once for diagonal flight', () => {
    expect(quantizeVirtualStick(55, -55, 18)).toEqual({
      horizontal: 1,
      vertical: -1,
    });
    expect(quantizeVirtualStick(-55, 55, 18)).toEqual({
      horizontal: -1,
      vertical: 1,
    });
  });
});

describe('touch input state', () => {
  it('holds movement and cannon until reset', () => {
    const input = new TouchInputState();
    input.setDirection({ horizontal: -1, vertical: 1 });
    input.cannonDown = true;

    expect(input.horizontal).toBe(-1);
    expect(input.vertical).toBe(1);
    expect(input.cannonDown).toBe(true);

    input.reset();
    expect(input.horizontal).toBe(0);
    expect(input.vertical).toBe(0);
    expect(input.cannonDown).toBe(false);
  });

  it('consumes a missile press exactly once', () => {
    const input = new TouchInputState();
    input.queueMissile();

    expect(input.consumeMissile()).toBe(true);
    expect(input.consumeMissile()).toBe(false);
  });

  it('consumes a bomb press exactly once and clears it on reset', () => {
    const input = new TouchInputState();
    input.queueBomb();

    expect(input.consumeBomb()).toBe(true);
    expect(input.consumeBomb()).toBe(false);

    input.queueBomb();
    input.reset();
    expect(input.consumeBomb()).toBe(false);
  });
});

describe('touch capability detection', () => {
  it('enables controls for touch, coarse pointers, or the preview override', () => {
    expect(
      shouldEnableTouchControls({
        maximumTouchPoints: 2,
        coarsePointer: false,
        forced: false,
      }),
    ).toBe(true);
    expect(
      shouldEnableTouchControls({
        maximumTouchPoints: 0,
        coarsePointer: true,
        forced: false,
      }),
    ).toBe(true);
    expect(
      shouldEnableTouchControls({
        maximumTouchPoints: 0,
        coarsePointer: false,
        forced: true,
      }),
    ).toBe(true);
  });

  it('keeps touch controls hidden on a normal desktop', () => {
    expect(
      shouldEnableTouchControls({
        maximumTouchPoints: 0,
        coarsePointer: false,
        forced: false,
      }),
    ).toBe(false);
  });
});
