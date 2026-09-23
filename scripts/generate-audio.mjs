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

mkdirSync(outputDirectory, { recursive: true });
writeMonoPcm16('rotor-loop.wav', createRotorLoop());
writeMonoPcm16('cannon.wav', createCannonHeavy());

console.log(`Generated audio assets in ${outputDirectory}`);
