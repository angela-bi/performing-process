import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Sketch } from '../App';

const CustomHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: "#7A5B3A"},
    { tag: t.comment, color: "#747474"},
    { tag: t.string, color: "#48820B" },
    { tag: t.variableName, color: "#0A7CA9" },
    { tag: t.function(t.variableName), color: "#0A7CA9" },
    { tag: t.bool, color: "#D52889" },
]);

interface EditorProps {
  sketch: Sketch;
  onChange: (changes: Partial<Sketch>) => void;
  onRun: () => void;
  onFocus: () => void;
  onClear: () => void;
  onDelete: () => void;
  zIndex: number;
}

export function Editor({ sketch, onChange, onRun, onFocus, onClear, onDelete, zIndex }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);
  const [pos, setPos] = useState({ x: sketch.editorPosition.x, y: sketch.editorPosition.y });
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
    onChange({ editorPosition: { ...sketch.editorPosition, x: pos.x, y: pos.y } });
  }

  useEffect(() => {
    viewRef.current = new EditorView({
      doc: sketch.code,
      extensions: [
        basicSetup,
        javascript(),
        EditorView.lineWrapping,
        syntaxHighlighting(CustomHighlightStyle),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            onChange({ code: update.state.doc.toString() });
          }
        })
      ],
      parent: editorRef.current!
    });
  
    return () => viewRef.current?.destroy();
  }, []);

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: sketch.editorPosition.w,
        height: sketch.editorPosition.h,
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
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRun}
          style={{ border: "none", background: "transparent", padding: '2px 0px' }}
        >
          <svg width="40px" height="40px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <circle r="8" cx="9" cy="9" fill="#ED225E"/>
            <polygon points="5.5 5 13 9 5 14" fill="white"/>
          </svg>
        </button>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onClear}
          style={{ border: "none", background: "transparent", padding: '2px 2px' }}
        >
          <svg width="40px" height="40px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <circle r="8" cx="9" cy="9" fill="#bdbdbd"/>
            <rect width="7" height="7" x="5.5" y="5.5" fill="#474747"/>
          </svg>
        </button>
        <input
          value={sketch.title}
          onChange={e => onChange({ title: e.target.value })}
          onPointerDown={e => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '12px', color: '#888',
            flex: 1, cursor: 'text', minWidth: 0,
          }}
        />

        <button
        onPointerDown={e => e.stopPropagation()}
        onClick={onDelete}
        style={{ border: "none", background: "transparent", padding: '4px 4px', marginLeft: 'auto' }}
        >
            <svg width="25px" height="25px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
                <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5"/>
            </svg>
        </button>
      </div>

      <div ref={editorRef} style={{ flex: 1, overflow: 'auto' }} />
    </div>
  );
}