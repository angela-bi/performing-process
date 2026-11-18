import { useEffect, useRef, useState } from 'react';
import type { PanelDoc } from '../App';
import { Panel } from './Panel';
import { audio, startMic, stopMic } from '../utils/audioEngine';
import {
  rms, averageLevel, bandLevel, peakFrequency, spectralCentroid,
} from '../utils/audioAnalysis';

interface Props {
  doc: PanelDoc;
  onChange: (changes: Partial<PanelDoc>) => void;
  onFocus: () => void;
  zIndex: number;
}

const W = 600;
const H = 260;
const WAVE_H = 90;
const MAX_HZ = 8000;

export function SoundWindow(props: Props) {
  const { doc, onChange } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLPreElement>(null);
  const [running, setRunning] = useState(audio.running);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState('');

  async function start(deviceId?: string) {
    try {
      await startMic(deviceId);
      setRunning(true);
      setError('');
      const all = await navigator.mediaDevices.enumerateDevices();   // labels appear after permission
      setDevices(all.filter(d => d.kind === 'audioinput'));
    } catch (err) {
      setRunning(false);
      setError(String(err));
    }
  }

  function stop() {
    stopMic();
    setRunning(false);
  }

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      const { waveform, spectrum, sampleRate } = audio;

      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = '#ED225E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const x = (i / (waveform.length - 1)) * W;
        const y = WAVE_H / 2 + ((waveform[i] - 128) / 128) * (WAVE_H / 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      const shown = Math.min(spectrum.length, Math.round((MAX_HZ * spectrum.length * 2) / sampleRate));
      const barW = W / shown;
      const top = WAVE_H + 10;
      ctx.fillStyle = '#0A7CA9';
      for (let i = 0; i < shown; i++) {
        const h = (spectrum[i] / 255) * (H - top);
        ctx.fillRect(i * barW, H - h, Math.max(1, barW - 0.5), h);
      }

      if (readout.current) {
        readout.current.textContent =
          `volume     ${rms(waveform).toFixed(3)}\n` +
          `average    ${averageLevel(spectrum).toFixed(3)}\n` +
          `bass       ${bandLevel(spectrum, sampleRate, 20, 250).toFixed(3)}\n` +
          `mid        ${bandLevel(spectrum, sampleRate, 250, 4000).toFixed(3)}\n` +
          `treble     ${bandLevel(spectrum, sampleRate, 4000, 16000).toFixed(3)}\n` +
          `peak       ${peakFrequency(spectrum, sampleRate).toFixed(0)} Hz\n` +
          `brightness ${spectralCentroid(spectrum, sampleRate).toFixed(0)} Hz`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Panel {...props} label="sound" headerColor='#f5f5f5' minW={260} minH={200}>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => (running ? stop() : start(doc.deviceId))}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: running ? '#bdbdbd' : '#ED225E', color: '#fff', fontSize: 12 }}
          >
            {running ? 'Stop microphone' : 'Start microphone'}
          </button>
          {devices.length > 1 && (
            <select
              value={doc.deviceId ?? ''}
              onChange={e => { onChange({ deviceId: e.target.value }); void start(e.target.value); }}
              style={{ fontSize: 11, minWidth: 0, flex: 1 }}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || 'microphone'}</option>
              ))}
            </select>
          )}
        </div>

        {error && <div style={{ color: '#D52889', fontSize: 11 }}>{error}</div>}

        <canvas ref={canvasRef} width={W} height={H}
          style={{ width: '100%', height: 'auto', borderRadius: 6, border: '1px solid #eee' }} />

        <pre ref={readout} style={{ margin: 0, fontSize: 11, color: '#555', lineHeight: 1.5 }} />
      </div>
    </Panel>
  );
}