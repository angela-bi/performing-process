import { useRef, useState } from 'react';

interface WindowProps {
  title: string;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  children: React.ReactNode;
  onFocus?: () => void;
  zIndex?: number;
}

export function Window({ title, defaultX = 0, defaultY = 0, defaultWidth = 400, defaultHeight = 400, children, onFocus, zIndex = 1 }: WindowProps) {
    const [pos, setPos] = useState({ x: defaultX, y: defaultY });
    const dragging = useRef(false);
    const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });
  
    function onPointerDown(e: React.PointerEvent) {
      onFocus?.();
      dragging.current = true;
      dragStart.current = { mx: e.clientX, my: e.clientY, wx: pos.x, wy: pos.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  
    function onPointerMove(e: React.PointerEvent) {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.wx + (e.clientX - dragStart.current.mx),
        y: dragStart.current.wy + (e.clientY - dragStart.current.my),
      });
    }
  
    function onPointerUp() {
      dragging.current = false;
    }
  
    return (
      <div
        onMouseDown={onFocus}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: defaultWidth,
          height: defaultHeight,
          zIndex,
          backgroundColor: '#fff',
          border: '2px solid ##7a7a7a',
          borderRadius: '6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          resize: 'both',
          fontFamily: "'Montserrat', sans-serif"
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            padding: '6px 10px',
            backgroundColor: '#f5f5f5',
            borderBottom: '1px dashed #ddd',
            cursor: 'grab',
            userSelect: 'none',
            fontSize: '12px',
            color: '#888',
            flexShrink: 0,
          }}
        >
          {title}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    );
  }