const channel = new BroadcastChannel('audio');
let started = false;

export async function startAudioHub() {
  if (started) return;
  started = true;
  try {
    const ctx = new AudioContext();
    await ctx.resume();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;                 // gives 1024 frequency bins
    analyser.smoothingTimeConstant = 0.5;    // 0 = raw, 1 = very smooth
    ctx.createMediaStreamSource(stream).connect(analyser);

    const waveform = new Uint8Array(analyser.fftSize);
    const spectrum = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(waveform);
      analyser.getByteFrequencyData(spectrum);
      channel.postMessage({ waveform, spectrum, sampleRate: ctx.sampleRate });
      requestAnimationFrame(tick);
    };
    tick();
  } catch (err) {
    started = false;
    console.error(err);
  }
}