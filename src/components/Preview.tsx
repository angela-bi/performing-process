import { useEffect, useRef, useState } from 'react';
import type { Sketch } from '../App';
import { buildSketchHTML } from '../utils/useP5runner';

interface PreviewProps {
  sketch: Sketch;
  onChange: (changes: Partial<Sketch>) => void;
  onFocus: () => void;
  onClear: () => void;
  zIndex: number;
}

export function Preview({ sketch, onChange, onFocus, onClear, zIndex }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pos, setPos] = useState({ x: sketch.previewPosition.x, y: sketch.previewPosition.y });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });
  const hasLoaded = useRef(false);

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
    const iframe = iframeRef.current;
    if (!iframe || !sketch.isRunning) return;
  
    let launched = false;
    let timer: number | undefined;
  
    function launch(snapshot?: string) {
      if (launched) return;
      launched = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
  
      const html = buildSketchHTML(sketch.code, snapshot);
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
          padding: '4px 8px',
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
        <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onClear}
        style={{ border: "none", background: "transparent", padding: '4px 4px', marginLeft: 'auto' }}
        >
            <svg width="25px" height="25px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
                <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
            </svg>
        </button>
      </div>

      <iframe
        ref={iframeRef}
        style={{ flex: 1, border: 'none', width: '100%' }}
        sandbox="allow-scripts allow-same-origin"
        title={sketch.title}
      />
    </div>
  );
}