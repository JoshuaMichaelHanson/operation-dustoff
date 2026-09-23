import Phaser from 'phaser';

import { getRotorAudioProfile } from './audioProfile';

type AdjustableSound = Phaser.Sound.BaseSound & {
  setRate?: (value: number) => unknown;
  setVolume?: (value: number) => unknown;
};

export class AudioManager {
  private readonly rotor: AdjustableSound;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.rotor = scene.sound.add('rotor-loop', {
      loop: true,
      volume: 0,
    }) as AdjustableSound;

    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, this.startRotor);
    } else {
      this.startRotor();
    }
  }

  updateRotor(isHelicopterActive: boolean, speedRatio: number): void {
    const profile = getRotorAudioProfile(isHelicopterActive, speedRatio);
    this.rotor.setVolume?.(profile.volume);
    this.rotor.setRate?.(profile.rate);
  }

  playCannon(): void {
    this.scene.sound.play('cannon', {
      volume: 0.32,
      detune: Phaser.Math.Between(-35, 35),
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.scene.sound.off(Phaser.Sound.Events.UNLOCKED, this.startRotor);
    this.rotor.stop();
    this.rotor.destroy();
  }

  private readonly startRotor = (): void => {
    if (!this.destroyed && !this.rotor.isPlaying) {
      this.rotor.play();
    }
  };
}
