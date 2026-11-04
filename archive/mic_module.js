const channel = new BroadcastChannel('audio');

let waveform = new Uint8Array(2048).fill(128);  // 128 = silence
let spectrum = new Uint8Array(1024);
let sampleRate = 48000;
let lastSeen = 0;

channel.onmessage = e => {
  waveform = e.data.waveform;
  spectrum = e.data.spectrum;
  sampleRate = e.data.sampleRate;
  lastSeen = Date.now();
};

const live = () => Date.now() - lastSeen < 500;

export const getWaveform = () => (live() ? waveform : new Uint8Array(2048).fill(128));
export const getSpectrum = () => (live() ? spectrum : new Uint8Array(1024));

export function getVolume() {
  if (!live()) return 0;
  let sum = 0;
  for (let i = 0; i < waveform.length; i++) {
    const v = (waveform[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / waveform.length);
}

// can also implement based on getByteFrequencyData(data)
// examples: https://therewasaguy.github.io/p5-music-viz/
// https://editor.p5js.org/jonfroehlich/sketches/d2euV09i