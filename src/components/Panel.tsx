import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PanelDoc } from '../App';

interface PanelProps {
  label: string;
  headerColor: string;
  doc: PanelDoc;
  onChange: (changes: Partial<PanelDoc>) => void;
  onFocus: () => void;
  zIndex: number;
  minW?: number;
  minH?: number;
  actions?: ReactNode;
  children: ReactNode;
}

export function Panel({
  label, headerColor, doc, onChange, onFocus, zIndex,
  minW = 260, minH = 160, actions, children,
}: PanelProps) {
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

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: doc.position.w, height: doc.position.h, zIndex,
        boxSizing: 'border-box', resize: 'both', overflow: 'hidden',
        minWidth: minW, minHeight: minH,
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
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
          background: headerColor, borderBottom: '1px solid #ddd',
          cursor: 'grab', userSelect: 'none', touchAction: 'none', flexShrink: 0,
          fontSize: 12, color: '#888',
        }}
      >
        <span>{label}</span>
        <span
          onPointerDown={e => e.stopPropagation()}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {actions}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
    </div>
  );
}