import { describe, expect, it } from 'vitest';

import { getRotorAudioProfile } from '../src/game/audio/audioProfile';

describe('rotor audio profile', () => {
  it('keeps a subdued idle loop and increases presence with speed', () => {
    const idle = getRotorAudioProfile(true, 0);
    const moving = getRotorAudioProfile(true, 1);

    expect(idle.volume).toBeGreaterThan(0);
    expect(moving.volume).toBeGreaterThan(idle.volume);
    expect(moving.rate).toBeGreaterThan(idle.rate);
  });

  it('mutes the rotor while the helicopter is destroyed', () => {
    expect(getRotorAudioProfile(false, 0.75).volume).toBe(0);
  });

  it('clamps speed before calculating playback settings', () => {
    expect(getRotorAudioProfile(true, -1)).toEqual(
      getRotorAudioProfile(true, 0),
    );
    expect(getRotorAudioProfile(true, 2)).toEqual(
      getRotorAudioProfile(true, 1),
    );
  });
});
