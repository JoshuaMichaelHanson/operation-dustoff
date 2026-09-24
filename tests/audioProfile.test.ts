import { describe, expect, it } from 'vitest';

import {
  getExplosionAudioProfile,
  getRotorAudioProfile,
} from '../src/game/audio/audioProfile';

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

describe('explosion audio profile', () => {
  it('gives larger explosions more weight than smaller explosions', () => {
    const small = getExplosionAudioProfile(20);
    const large = getExplosionAudioProfile(28);

    expect(large.volume).toBeGreaterThan(small.volume);
    expect(large.rate).toBeLessThan(small.rate);
  });

  it('clamps explosion sizes outside the authored range', () => {
    expect(getExplosionAudioProfile(0)).toEqual(
      getExplosionAudioProfile(20),
    );
    expect(getExplosionAudioProfile(100)).toEqual(
      getExplosionAudioProfile(28),
    );
  });
});
