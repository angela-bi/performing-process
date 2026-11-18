import { useRef, useEffect, useCallback, useState } from 'react';

export interface HSVA { h: number; s: number; v: number; a: number }

export interface ColorPickerProps {
  color?: string;
  onChange?: (hex: string, hsva: HSVA) => void;
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6;
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const map: [number, number, number][] = [
    [v, t, p], [q, v, p], [p, v, t],
    [p, q, v], [t, p, v], [v, p, q],
  ];
  return map[i].map(x => Math.round(x * 255)) as [number, number, number];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === r)      h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else                h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, v];
}

function toHex2(n: number) { return Math.round(n).toString(16).padStart(2, '0').toUpperCase(); }

function hsvaToHex(h: number, s: number, v: number, a: number) {
  const [r, g, b] = hsvToRgb(h, s, v);
  return '#' + toHex2(r) + toHex2(g) + toHex2(b) + (a < 1 ? toHex2(a * 255) : '');
}

function hexToHsva(hex: string): HSVA {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const [hh, s, v] = rgbToHsv(r, g, b);
  return { h: hh, s, v, a };
}

function drawSB(ctx: CanvasRenderingContext2D, w: number, hh: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `hsl(${hh},100%,50%)`;
  ctx.fillRect(0, 0, w, h);
  const wg = ctx.createLinearGradient(0, 0, w, 0);
  wg.addColorStop(0, '#fff');
  wg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, 'rgba(0,0,0,0)');
  bg.addColorStop(1, '#000');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
}

function useDrag(onMove: (e: PointerEvent) => void, onEnd?: () => void) {
  const ref = useRef<HTMLElement | null>(null);

  const start = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    onMove(e.nativeEvent);
    const move = (ev: PointerEvent) => onMove(ev);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      onEnd?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [onMove, onEnd]);

  return { onPointerDown: start };
}

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: PointerEvent) => {
    if (!trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - r.left) / r.width) * 360));
    onChange(h);
  }, [onChange]);

  const drag = useDrag(handleMove);

  return (
    <div
      ref={trackRef}
      style={{
        flex: 1, height: 12, borderRadius: 6, cursor: 'pointer', position: 'relative',
        background: 'linear-gradient(to right,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)',
      }}
      {...drag}
    >
      <div style={{
        position: 'absolute', top: '50%', left: `${(hue / 360) * 100}%`,
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.3)',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        background: `hsl(${hue},100%,50%)`,
      }} />
    </div>
  );
}

function AlphaSlider({
  alpha, hue, sat, val, onChange,
}: { alpha: number; hue: number; sat: number; val: number; onChange: (a: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [r, g, b] = hsvToRgb(hue, sat, val);

  const handleMove = useCallback((e: PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const a = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(a);
  }, [onChange]);

  const drag = useDrag(handleMove);

  return (
    <div
      ref={trackRef}
      style={{ flex: 1, height: 12, borderRadius: 6, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
      {...drag}
    >
      {/* checkerboard */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(45deg,#ccc 25%,transparent 25%),
          linear-gradient(-45deg,#ccc 25%,transparent 25%),
          linear-gradient(45deg,transparent 75%,#ccc 75%),
          linear-gradient(-45deg,transparent 75%,#ccc 75%)`,
        backgroundSize: '6px 6px',
        backgroundPosition: '0 0,0 3px,3px -3px,-3px 0',
      }} />
      {/* color gradient */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 6,
        background: `linear-gradient(to right,rgba(${r},${g},${b},0),rgba(${r},${g},${b},1))`,
      }} />
      {/* thumb */}
      <div style={{
        position: 'absolute', top: '50%', left: `${alpha * 100}%`,
        width: 16, height: 16, borderRadius: '50%',
        border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.3)',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        background: `rgba(${r},${g},${b},${alpha})`,
      }} />
    </div>
  );
}

function SatValCanvas({
  hue, sat, val,
  onChange,
}: { hue: number; sat: number; val: number; onChange: (s: number, v: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    drawSB(ctx, canvas.width, hue, canvas.height);
  }, [hue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
      const ctx = canvas.getContext('2d')!;
      drawSB(ctx, r.width, hue, r.height);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [hue]);

  const handleMove = useCallback((e: PointerEvent) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    onChange(s, v);
  }, [onChange]);

  const drag = useDrag(handleMove);

  const [r, g, b] = hsvToRgb(hue, sat, val);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: 160, cursor: 'crosshair' }} {...drag}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute',
        left: `${sat * 100}%`,
        top: `${(1 - val) * 100}%`,
        width: 14, height: 14, borderRadius: '50%',
        border: '2px solid #fff',
        boxShadow: `0 0 0 1px rgba(0,0,0,${luma > 128 ? 0.4 : 0.2})`,
        transform: 'translate(-50%,-50%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

const MAX_HISTORY = 12;

export function ColorPicker({ color = '#FF0000', onChange }: ColorPickerProps) {
  const [hsva, setHsva] = useState<HSVA>(() => hexToHsva(color));
  const [hexField, setHexField] = useState(color.toUpperCase());
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // sync when prop changes externally
  useEffect(() => {
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(color)) return;
    const next = hexToHsva(color);
    setHsva(next);
    setHexField(color.toUpperCase());
  }, [color]);

  const { h, s, v, a } = hsva;
  const hex = hsvaToHex(h, s, v, a);
  const [r, g, b] = hsvToRgb(h, s, v);

  const commit = useCallback((next: HSVA) => {
    setHsva(next);
    const nextHex = hsvaToHex(next.h, next.s, next.v, next.a);
    setHexField(nextHex);
    onChange?.(nextHex, next);
  }, [onChange]);

  const pushHistory = useCallback((hex: string) => {
    setHistory(prev => [hex, ...prev.filter(x => x !== hex)].slice(0, MAX_HISTORY));
  }, []);

  // ── input handlers ──

  const onHueChange = useCallback((hh: number) => {
    commit({ ...hsva, h: hh });
  }, [hsva, commit]);

  const onAlphaChange = useCallback((aa: number) => {
    commit({ ...hsva, a: aa });
  }, [hsva, commit]);

  const onSVChange = useCallback((ss: number, vv: number) => {
    commit({ ...hsva, s: ss, v: vv });
  }, [hsva, commit]);

  const onHexCommit = useCallback(() => {
    let val = hexField.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(val)) {
      setHexField(hex); // revert
      return;
    }
    const next = hexToHsva(val);
    pushHistory(val.toUpperCase());
    commit(next);
  }, [hexField, hex, commit, pushHistory]);

  const onRGBCommit = useCallback(() => {
    const rr = Math.max(0, Math.min(255, parseInt(String(r)) || 0));
    const gg = Math.max(0, Math.min(255, parseInt(String(g)) || 0));
    const bb = Math.max(0, Math.min(255, parseInt(String(b)) || 0));
    const [hh, ss, vv] = rgbToHsv(rr, gg, bb);
    pushHistory(hsvaToHex(hh, ss, vv, a));
    commit({ h: hh, s: ss, v: vv, a });
  }, [r, g, b, a, commit, pushHistory]);

  const onCopy = useCallback(() => {
    navigator.clipboard?.writeText(hex);
    pushHistory(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [hex, pushHistory]);

  const onEyeDrop = useCallback(async () => {
    if (typeof (window as any).EyeDropper === 'undefined') return;
    try {
      const result = await new (window as any).EyeDropper().open();
      const next = hexToHsva(result.sRGBHex);
      pushHistory(result.sRGBHex.toUpperCase());
      commit(next);
    } catch { /* user cancelled */ }
  }, [commit, pushHistory]);


  const row: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
  };
  const circleBtn: React.CSSProperties = {
    width: 30, height: 30, borderRadius: '50%', border: '1px solid #ccc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: '#f5f5f5', flexShrink: 0,
    color: '#666',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', fontFamily: 'monospace', fontSize: 11, textAlign: 'center',
    background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6,
    padding: '4px 2px', color: '#333', outline: 'none',
  };

  return (
    <div
        // onMouseDown={onFocus}
        style={{
            width: '260px',
            position: 'absolute',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}
    >
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                padding: '4px 8px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #ddd',
                gap: '8px',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '12px', color: '#888',
            }}
        >
            color picker
            <button
                onPointerDown={e => e.stopPropagation()}
                // onClick={onDelete}
                style={{ border: 'none', background: 'transparent', padding: '4px', marginLeft: 'auto' }}
                >
                <svg width="25px" height="25px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
                    <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
                </svg>
            </button>
        </div>

        {/* gradient stuff */}
        <SatValCanvas hue={h} sat={s} val={v} onChange={onSVChange} />
    
        <div style={{ padding: '12px 14px 0' }}>
            <div style={{ ...row, marginBottom: 10 }}>
            <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                border: '1px solid #ccc',
                background: `rgba(${r},${g},${b},${a})`,
            }} />
            <button style={{backgroundColor: 'transparent', border: 'none'}} onClick={onEyeDrop} title="Pick color from screen">
                <svg width="20" height="20" viewBox="0 0 214 340" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M144.051 89.9872L29.8706 150.019" stroke-width="37" stroke-linecap="round" stroke="#535252"/>
                <path d="M5.75395 75.1397C-7.09667 50.6978 2.29993 20.4662 26.7419 7.61555L30.2823 5.75411C54.7243 -7.09652 84.9558 2.30009 97.8065 26.742L134.105 95.7814L42.0522 144.179L5.75395 75.1397Z" fill="#535252"/>
                <path d="M188.27 311.62C197.314 306.866 200.791 295.68 196.036 286.636C191.281 277.593 180.095 274.116 171.052 278.871L179.661 295.246L188.27 311.62ZM69.1091 160.175L52.7343 168.785C70.5181 202.61 90.7793 241.866 110.747 270.365C120.644 284.491 131.515 297.538 143.137 305.906C154.947 314.408 171.4 320.49 188.27 311.62L179.661 295.246L171.052 278.871C170.902 278.95 170.985 278.978 170.581 278.903C169.8 278.758 167.885 278.132 164.755 275.878C158.281 271.217 150.278 262.306 141.049 249.134C122.765 223.037 103.765 186.338 85.4838 151.566L69.1091 160.175Z" fill="#535252"/>
                <path d="M190.926 310.224C181.882 314.979 170.697 311.502 165.942 302.459C161.187 293.415 164.664 282.229 173.707 277.475L182.317 293.849L190.926 310.224ZM133.715 126.208L150.089 117.599C167.873 151.424 188.727 190.369 200.886 222.973C206.913 239.135 211.498 255.486 211.803 269.803C212.113 284.352 207.796 301.354 190.926 310.224L182.317 293.849L173.707 277.475C173.858 277.396 173.834 277.48 174.001 277.105C174.324 276.38 174.894 274.447 174.812 270.591C174.642 262.615 171.837 250.971 166.218 235.901C155.084 206.045 135.622 169.589 117.34 134.818L133.715 126.208Z" fill="#535252"/>
                <path d="M183.804 300.976L194.508 321.334" stroke-width="37" stroke-linecap="round" stroke="#535252"/>
                </svg>
            </button>
            <HueSlider hue={h} onChange={onHueChange} />
            </div>

            <div style={{ ...row, marginBottom: 10 }}>
            <div style={{ width: 30, flexShrink: 0 }} />
            <div style={{ width: 30, flexShrink: 0 }} />
            <AlphaSlider alpha={a} hue={h} sat={s} val={v} onChange={onAlphaChange} />
            </div>
      </div>

      {/* history */}
      {history.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 14px 0' }}>
          {history.map(hex => (
            <div
              key={hex}
              title={hex}
              onClick={() => { const next = hexToHsva(hex); commit(next); }}
              style={{
                width: 22, height: 22, borderRadius: '25%',
                background: hex, 
                // border: '2px dashed #ccc',
                cursor: 'pointer', flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>

  );
}