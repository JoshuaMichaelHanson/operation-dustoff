import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44_100;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(
  scriptDirectory,
  '..',
  'public',
  'assets',
  'audio',
);

function createSamples(durationSeconds, sampleAt) {
  const sampleCount = Math.round(durationSeconds * SAMPLE_RATE);
  const samples = new Float32Array(sampleCount);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = sampleAt(index / SAMPLE_RATE, index);
  }

  let peak = 0;
  for (const sample of samples) {
    peak = Math.max(peak, Math.abs(sample));
  }
  const gain = peak > 0 ? 0.92 / peak : 1;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= gain;
  }

  return samples;
}

function writeMonoPcm16(fileName, samples) {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataLength);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(sample * 32_767), 44 + index * 2);
  }

  writeFileSync(resolve(outputDirectory, fileName), buffer);
}

function createRotorLoop() {
  return createSamples(2, (time) => {
    const bladePulse =
      Math.sin(Math.PI * 2 * 28 * time) +
      Math.sin(Math.PI * 2 * 56 * time) * 0.46 +
      Math.sin(Math.PI * 2 * 84 * time) * 0.2;
    const engineTexture =
      Math.sin(Math.PI * 2 * 137 * time) * 0.09 +
      Math.sin(Math.PI * 2 * 211 * time) * 0.045;
    const beat = 0.52 + Math.sin(Math.PI * 2 * 7 * time) * 0.16;

    return Math.tanh((bladePulse * beat + engineTexture) * 1.25) * 0.72;
  });
}

function createCannonHeavy() {
  let seed = 0x1b873593;
  let filteredNoise = 0;
  let phase = 0;

  return createSamples(0.28, (time) => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const noise = (seed / 0xffff_ffff) * 2 - 1;
    filteredNoise = filteredNoise * 0.82 + noise * 0.18;

    const progress = time / 0.28;
    const frequency = 108 - progress * 62;
    phase += (Math.PI * 2 * frequency) / SAMPLE_RATE;

    const attack = Math.min(1, time / 0.0025);
    const decay = Math.exp(-time * 14);
    const tail = Math.min(1, (0.28 - time) / 0.02);
    const body = Math.sin(phase) * 0.84 + filteredNoise * 0.52;

    return Math.tanh(body * 1.75) * attack * decay * Math.max(0, tail);
  });
}

function createExplosion() {
  let seed = 0x85ebca6b;
  let filteredNoise = 0;
  let rumblePhase = 0;

  return createSamples(0.72, (time) => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const noise = (seed / 0xffff_ffff) * 2 - 1;
    filteredNoise = filteredNoise * 0.86 + noise * 0.14;

    const progress = time / 0.72;
    const rumbleFrequency = 82 - progress * 47;
    rumblePhase += (Math.PI * 2 * rumbleFrequency) / SAMPLE_RATE;

    const attack = Math.min(1, time / 0.0015);
    const blastDecay = Math.exp(-time * 10.5);
    const rumbleDecay = Math.exp(-time * 5.2);
    const debrisTail = Math.exp(-time * 7.5);
    const tail = Math.min(1, (0.72 - time) / 0.045);
    const blast = noise * 0.58 * blastDecay;
    const rumble = Math.sin(rumblePhase) * 0.74 * rumbleDecay;
    const debris = filteredNoise * 0.46 * debrisTail;

    return (
      Math.tanh((blast + rumble + debris) * 1.65) *
      attack *
      Math.max(0, tail)
    );
  });
}

function createBoardingCue() {
  let seed = 0xc2b2ae35;

  return createSamples(0.22, (time) => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const noise = (seed / 0xffff_ffff) * 2 - 1;
    const firstProgress = time / 0.085;
    const secondProgress = (time - 0.072) / 0.14;
    const firstEnvelope =
      firstProgress >= 0 && firstProgress <= 1
        ? Math.sin(Math.PI * firstProgress) * Math.exp(-firstProgress * 1.2)
        : 0;
    const secondEnvelope =
      secondProgress >= 0 && secondProgress <= 1
        ? Math.sin(Math.PI * secondProgress) * Math.exp(-secondProgress * 1.05)
        : 0;
    const firstTone = Math.sin(Math.PI * 2 * 520 * time) * firstEnvelope;
    const secondTone =
      Math.sin(Math.PI * 2 * 760 * (time - 0.072)) * secondEnvelope;
    const click = noise * Math.exp(-time * 85) * 0.16;

    return firstTone * 0.42 + secondTone * 0.68 + click;
  });
}

function tonePulse(time, start, duration, frequency, brightness = 0.18) {
  const progress = (time - start) / duration;
  if (progress < 0 || progress > 1) {
    return 0;
  }

  const localTime = time - start;
  const envelope =
    Math.sin(Math.PI * progress) * Math.exp(-progress * 0.72);
  return (
    (Math.sin(Math.PI * 2 * frequency * localTime) +
      Math.sin(Math.PI * 4 * frequency * localTime) * brightness) *
    envelope
  );
}

function createRescueCue() {
  return createSamples(0.5, (time) => {
    const first = tonePulse(time, 0, 0.18, 523.25, 0.12);
    const second = tonePulse(time, 0.105, 0.2, 659.25, 0.14);
    const third = tonePulse(time, 0.215, 0.275, 783.99, 0.16);

    return first * 0.38 + second * 0.48 + third * 0.58;
  });
}

function createVictoryCue() {
  return createSamples(1.55, (time) => {
    const lead =
      tonePulse(time, 0, 0.28, 392, 0.2) * 0.42 +
      tonePulse(time, 0.16, 0.3, 523.25, 0.2) * 0.48 +
      tonePulse(time, 0.33, 0.34, 659.25, 0.2) * 0.54;
    const finalChord =
      tonePulse(time, 0.56, 0.96, 523.25, 0.12) * 0.34 +
      tonePulse(time, 0.56, 0.96, 659.25, 0.12) * 0.3 +
      tonePulse(time, 0.56, 0.96, 783.99, 0.12) * 0.36;

    return lead + finalChord;
  });
}

function createGameOverCue() {
  return createSamples(1.45, (time) => {
    const descent =
      tonePulse(time, 0, 0.5, 392, 0.08) * 0.48 +
      tonePulse(time, 0.31, 0.55, 311.13, 0.07) * 0.52 +
      tonePulse(time, 0.68, 0.74, 233.08, 0.06) * 0.62;
    const lowTail = tonePulse(time, 0.72, 0.7, 116.54, 0.04) * 0.2;

    return descent + lowTail;
  });
}

mkdirSync(outputDirectory, { recursive: true });
writeMonoPcm16('rotor-loop.wav', createRotorLoop());
writeMonoPcm16('cannon.wav', createCannonHeavy());
writeMonoPcm16('explosion.wav', createExplosion());
writeMonoPcm16('boarding.wav', createBoardingCue());
writeMonoPcm16('rescue.wav', createRescueCue());
writeMonoPcm16('victory.wav', createVictoryCue());
writeMonoPcm16('game-over.wav', createGameOverCue());

console.log(`Generated audio assets in ${outputDirectory}`);
