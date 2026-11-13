import { useEffect, useRef, useState } from 'react';
import type { SoundDoc } from '../App';
import { audio, startMic, stopMic } from '../utils/audioEngine';
import {
  rms, averageLevel, bandLevel, peakFrequency, spectralCentroid,
} from '../utils/audioAnalysis';

interface SoundWindowProps {
  doc: SoundDoc;
  onChange: (changes: Partial<SoundDoc>) => void;
  onFocus: () => void;
  onDelete: () => void;
  zIndex: number;
}

const W = 600;
const H = 260;
const WAVE_H = 90;
const MAX_HZ = 8000;   // spectrum shown up to here; the rest is mostly empty

export function SoundWindow({ doc, onChange, onFocus, onDelete, zIndex }: SoundWindowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLPreElement>(null);
  const [running, setRunning] = useState(audio.running);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState('');

  const [pos, setPos] = useState({ x: doc.position.x, y: doc.position.y });
  const posRef = useRef(pos);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });

  function onPointerDown(e: React.PointerEvent) {
    onFocus();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: pos.x, wy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const next = {
      x: dragStart.current.wx + (e.clientX - dragStart.current.mx),
      y: Math.max(0, dragStart.current.wy + (e.clientY - dragStart.current.my)),
    };
    posRef.current = next;
    setPos(next);
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    onChange({ position: { ...doc.position, ...posRef.current } });
  }

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

  function remove() {
    stopMic();          // stop here, not on unmount: Strict Mode unmounts once in dev
    onDelete();
  }

  // visualization + readouts, driven by one animation loop
  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      const { waveform, spectrum, sampleRate } = audio;

      ctx.fillStyle = '#fafafa';
      ctx.fillRect(0, 0, W, H);

      // waveform
      ctx.strokeStyle = '#ED225E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const x = (i / (waveform.length - 1)) * W;
        const y = WAVE_H / 2 + ((waveform[i] - 128) / 128) * (WAVE_H / 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // spectrum bars, 0 to MAX_HZ
      const shown = Math.min(spectrum.length, Math.round((MAX_HZ * spectrum.length * 2) / sampleRate));
      const barW = W / shown;
      const top = WAVE_H + 10;
      ctx.fillStyle = '#0A7CA9';
      for (let i = 0; i < shown; i++) {
        const h = (spectrum[i] / 255) * (H - top);
        ctx.fillRect(i * barW, H - h, Math.max(1, barW - 0.5), h);
      }

      // numbers, written straight to the DOM
      if (readout.current) {
        const vol = rms(waveform);
        readout.current.textContent =
          `volume     ${vol.toFixed(3)}\n` +
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
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: doc.position.w, height: doc.position.h, zIndex,
        boxSizing: 'border-box', resize: 'both', overflow: 'hidden',
        minWidth: 260, minHeight: 200,
        display: 'flex', flexDirection: 'column',
        background: '#fff', border: '1px solid #ddd', borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
          background: '#f3eef8', borderBottom: '1px solid #ddd',
          cursor: 'grab', userSelect: 'none', touchAction: 'none', flexShrink: 0,
          fontSize: 12, color: '#888',
        }}
      >
        <span>sound</span>
        <input
          value={doc.title}
          onChange={e => onChange({ title: e.target.value })}
          onPointerDown={e => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', outline: 'none',
            borderBottom: '1px dashed #888', fontFamily: 'inherit',
            fontSize: 'inherit', color: '#555', minWidth: 0, flex: 0.5,
          }}
        />
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={remove}
          style={{ border: 'none', background: 'transparent', padding: 4, marginLeft: 'auto' }}
        >
          <svg width="25" height="25" viewBox="0 0 18 18">
            <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
            <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12,
        display: 'flex', flexDirection: 'column', gap: 10 }}>
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
    </div>
  );
}