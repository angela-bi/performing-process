const channel = new BroadcastChannel('audio');

export const audio = {
  running: false,
  waveform: new Uint8Array(2048).fill(128),
  spectrum: new Uint8Array(1024),
  sampleRate: 48000,
};

let ctx: AudioContext | null = null;
let stream: MediaStream | null = null;
let raf = 0;

export function stopMic() {
  cancelAnimationFrame(raf);
  stream?.getTracks().forEach(t => t.stop());
  void ctx?.close();
  ctx = null;
  stream = null;
  audio.running = false;
  audio.waveform = new Uint8Array(2048).fill(128);
  audio.spectrum = new Uint8Array(1024);
}

// call from a click handler: AudioContext needs a user gesture
export async function startMic(deviceId?: string) {
  stopMic();
  const c = new AudioContext();            // created before any await, so the gesture counts
  ctx = c;
  await c.resume();
  stream = await navigator.mediaDevices.getUserMedia({
    audio: deviceId ? { deviceId: { exact: deviceId } } : true,
  });

  const analyser = c.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.5;
  c.createMediaStreamSource(stream).connect(analyser);

  const wave = new Uint8Array(analyser.fftSize);
  const spec = new Uint8Array(analyser.frequencyBinCount);
  audio.waveform = wave;
  audio.spectrum = spec;
  audio.sampleRate = c.sampleRate;
  audio.running = true;

  const tick = () => {
    analyser.getByteTimeDomainData(wave);
    analyser.getByteFrequencyData(spec);
    channel.postMessage({ waveform: wave, spectrum: spec, sampleRate: c.sampleRate });
    raf = requestAnimationFrame(tick);
  };
  tick();
}