import { useEffect, useRef, useState } from 'react';
import type { Sketch } from '../App';
import { buildSketchHTML } from '../utils/useP5runner';

interface PreviewProps {
  sketch: Sketch;
  onChange: (changes: Partial<Sketch>) => void;
  onFocus: () => void;
  zIndex: number;
}

export function Preview({ sketch, onChange, onFocus, zIndex }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pos, setPos] = useState({ x: sketch.previewPosition.x, y: sketch.previewPosition.y });
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
    const x = dragStart.current.wx + (e.clientX - dragStart.current.mx);
    const y = dragStart.current.wy + (e.clientY - dragStart.current.my);
    setPos({ x, y });
  }

  function onPointerUp() {
    dragging.current = false;
    onChange({ previewPosition: { ...sketch.previewPosition, x: pos.x, y: pos.y } });
  }

  useEffect(() => {
    if (!iframeRef.current || !sketch.isRunning) return;
    const html = buildSketchHTML(sketch.code);
    const blob = new Blob([html], { type: 'text/html' });
    iframeRef.current.src = URL.createObjectURL(blob);
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
        borderRadius: '6px',
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