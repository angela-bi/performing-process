import { useEffect, useRef, useState } from 'react';
import { buildSketchHTML } from '../utils/useP5runner';
import type { Sketch } from '../App';
import type { ModuleDoc } from '../App';
import { findSyntaxError } from '../utils/syntax';

interface PreviewProps {
  sketch: Sketch;
  onChange: (changes: Partial<Sketch>) => void;
  onFocus: () => void;
  onClear: () => void;
  zIndex: number;
  modules: ModuleDoc[]
}

export function Preview({ sketch, onChange, onFocus, onClear, zIndex, modules }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pos, setPos] = useState({ x: sketch.previewPosition.x, y: sketch.previewPosition.y });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });
  const hasLoaded = useRef(false);
  const latest = useRef(sketch);
  latest.current = sketch;
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const modulesCode = modules.map(m => m.name + '\n' + m.code).join('\u0000');
  const lastCode = useRef(sketch.code + modulesCode);

  function onPointerDown(e: React.PointerEvent) {
    onFocus();
    dragging.current = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: pos.x, wy: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const x = dragStart.current.wx + (e.clientX - dragStart.current.mx);
    const y = dragStart.current.wy + (e.clientY - dragStart.current.my);
    setPos({ x, y });
  }

  function onPointerUp() {
    dragging.current = false;
    onChange({ previewPosition: { ...sketch.previewPosition, x: pos.x, y: pos.y } });
  }

  useEffect(() => {
    const current = sketch.code + modulesCode;
    if (current === lastCode.current) return;
    lastCode.current = current;
    if (!sketch.autoRefresh) return;
  
    const timer = window.setTimeout(() => {
      const files = [
        { name: sketch.title, code: sketch.code },
        ...modules.map(m => ({ name: m.name, code: m.code })),
      ];
      for (const f of files) {
        const line = findSyntaxError(f.code);
        if (line !== null) {
          setSyntaxError(`${f.name}, line ${line}`);
          return;
        }
      }
      setSyntaxError(null);
      onChange({ runCount: latest.current.runCount + 1 });
    }, 800);
    return () => clearTimeout(timer);
  }, [sketch.code, modulesCode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !sketch.isRunning) return;
  
    let launched = false;
    let timer: number | undefined;
  
    function launch(snapshot?: string) {
      if (launched) return;
      launched = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
  
      const html = buildSketchHTML(sketch.code, snapshot, modules);
      const blob = new Blob([html], { type: 'text/html' });
      const oldSrc = iframe!.src;
      iframe!.src = URL.createObjectURL(blob);
      if (oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
      hasLoaded.current = true;
    }
  
    function onMessage(e: MessageEvent) {
      if (e.source !== iframe!.contentWindow) return;
      if (e.data?.type === 'snapshot') launch(e.data.data ?? undefined);
    }
  
    if (!hasLoaded.current) {
      launch(); // first run, nothing to save
    } else {
      window.addEventListener('message', onMessage);
      iframe.contentWindow?.postMessage('snapshot', '*');
      timer = window.setTimeout(() => launch(), 500); // fallback if no reply
    }
  
    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [sketch.runCount]);

  useEffect(() => {
    const current = sketch.code + modulesCode;
    if (current === lastCode.current) return;
    lastCode.current = current;
    if (!sketch.autoRefresh) return;
  
    const timer = window.setTimeout(() => {
      onChange({ runCount: latest.current.runCount + 1 });
    }, 800);
    return () => clearTimeout(timer);
  }, [sketch.code, modulesCode]);

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: sketch.previewPosition.w,
        height: sketch.previewPosition.h,
        zIndex,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        resize: 'both',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 10px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          cursor: 'grab',
          userSelect: 'none',
          flexShrink: 0,
          fontSize: '12px',
          color: '#888',
          fontFamily: 'Montserrat, sans-serif',
        }}
      >
        {sketch.title}

        {syntaxError && (
          <span style={{ color: '#ED225E', marginLeft: 8, fontSize: 11 }}>
            paused: syntax error in {syntaxError}
          </span>
        )}

        <label
          onPointerDown={e => e.stopPropagation()}
          title="Re-run automatically when code changes"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#888',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={!!sketch.autoRefresh}
            onChange={e => onChange({ autoRefresh: e.target.checked })}
            style={{ cursor: 'pointer', accentColor: '#ED225E' }}
          />
          auto-refresh
        </label>

        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClear}
          style={{ border: 'none', background: 'transparent', padding: '4px'}}
        />

        <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onClear}
        style={{ border: "none", background: "transparent", padding: '4px 4px'}}
        >
            <svg width="25px" height="25px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
                <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
            </svg>
        </button>
      </div>

      <iframe
        allow="camera; microphone"
        ref={iframeRef}
        style={{ flex: 1, border: 'none', width: '100%' }}
        sandbox="allow-scripts allow-same-origin"
        title={sketch.title}
      />
    </div>
  );
}