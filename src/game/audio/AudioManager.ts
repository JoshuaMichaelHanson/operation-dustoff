import Phaser from 'phaser';

import {
  getExplosionAudioProfile,
  getRotorAudioProfile,
} from './audioProfile';

type AdjustableSound = Phaser.Sound.BaseSound & {
  setRate?: (value: number) => unknown;
  setVolume?: (value: number) => unknown;
};

export class AudioManager {
  private readonly rotor: AdjustableSound;
  private readonly music: Phaser.Sound.BaseSound;
  private destroyed = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.rotor = scene.sound.add('rotor-loop', {
      loop: true,
      volume: 0,
    }) as AdjustableSound;
    this.music = scene.sound.add('music-loop', {
      loop: true,
      volume: 0.075,
    });

    if (scene.sound.locked) {
      scene.sound.once(
        Phaser.Sound.Events.UNLOCKED,
        this.startGameplayAudio,
      );
    } else {
      this.startGameplayAudio();
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

  playExplosion(visualRadius: number): void {
    const profile = getExplosionAudioProfile(visualRadius);
    this.scene.sound.play('explosion', profile);
  }

  playBoarding(): void {
    this.scene.sound.play('boarding', {
      volume: 0.24,
      detune: Phaser.Math.Between(-18, 18),
    });
  }

  playRescue(): void {
    this.scene.sound.play('rescue', {
      volume: 0.27,
    });
  }

  playSmush(): void {
    this.scene.sound.play('smush', {
      volume: 0.34,
      detune: Phaser.Math.Between(-45, 25),
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.scene.sound.off(
      Phaser.Sound.Events.UNLOCKED,
      this.startGameplayAudio,
    );
    this.rotor.stop();
    this.rotor.destroy();
    this.music.stop();
    this.music.destroy();
  }

  private readonly startGameplayAudio = (): void => {
    if (!this.destroyed && !this.rotor.isPlaying) {
      this.rotor.play();
    }
    if (!this.destroyed && !this.music.isPlaying) {
      this.music.play();
    }
  };
}
