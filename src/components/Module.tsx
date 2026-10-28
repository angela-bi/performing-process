import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import type { ModuleDoc } from '../App';

const CustomHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: '#7A5B3A' },
  { tag: t.comment, color: '#747474' },
  { tag: t.string, color: '#48820B' },
  { tag: t.variableName, color: '#0A7CA9' },
  { tag: t.function(t.variableName), color: '#0A7CA9' },
  { tag: t.bool, color: '#D52889' },
]);

interface ModuleProps {
  module: ModuleDoc;
  allNames: string[];
  onChange: (changes: Partial<ModuleDoc>) => void;
  onFocus: () => void;
  onDelete: () => void;
  zIndex: number;
}

const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9-]/g, '-');

export function Module({ module, allNames, onChange, onFocus, onDelete, zIndex }: ModuleProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: module.position.x, y: module.position.y });
  const [size, setSize] = useState({ w: module.position.w, h: module.position.h });
  const posRef = useRef(pos);
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });

  // local draft so you can type freely; only valid, unique names get saved
  const [nameDraft, setNameDraft] = useState(module.name);
  const duplicate = allNames.filter(n => n === nameDraft).length > 0 && nameDraft !== module.name;
  const invalid = nameDraft === '' || duplicate;

  function commitName(value: string) {
    const clean = sanitize(value);
    setNameDraft(clean);
    if (clean && !allNames.some(n => n === clean && n !== module.name)) {
      onChange({ name: clean });
    }
  }

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
      y: dragStart.current.wy + (e.clientY - dragStart.current.my),
    };
    posRef.current = next;
    setPos(next);
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    onChange({ position: { ...module.position, ...posRef.current } });
  }

  useEffect(() => {
    const view = new EditorView({
      doc: module.code,
      extensions: [
        basicSetup,
        javascript(),
        EditorView.lineWrapping,
        syntaxHighlighting(CustomHighlightStyle),
        EditorView.theme({ '&': { height: '100%' }, '.cm-scroller': { overflow: 'auto' } }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChange({ code: update.state.doc.toString() });
        }),
      ],
      parent: editorRef.current!,
    });

    requestAnimationFrame(() => { view.scrollDOM.scrollTop = module.scrollTop ?? 0; });

    let timer: number | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => onChange({ scrollTop: view.scrollDOM.scrollTop }), 200);
    };
    view.scrollDOM.addEventListener('scroll', onScroll);

    return () => {
      clearTimeout(timer);
      view.scrollDOM.removeEventListener('scroll', onScroll);
      view.destroy();
    };
  }, []);

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute', left: pos.x, top: pos.y,
        width: size.w, height: size.h, zIndex,
        backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
          backgroundColor: '#eef3f8', borderBottom: '1px solid #ddd',
          cursor: 'grab', userSelect: 'none', flexShrink: 0, touchAction: 'none',
          fontFamily: 'Montserrat, sans-serif', fontSize: '12px', color: '#888',
        }}
      >
        <span>module</span>
        <input
          value={nameDraft}
          onChange={e => commitName(e.target.value)}
          onPointerDown={e => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', outline: 'none',
            borderBottom: `1px dashed ${invalid ? '#D52889' : '#888'}`,
            fontFamily: 'inherit', fontSize: 'inherit', color: '#555',
            minWidth: 0, flex: 0.4,
          }}
        />
        <span style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {invalid ? 'name taken' : `import … from '${nameDraft}'`}
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          style={{ border: 'none', background: 'transparent', padding: '4px' }}
        >
          <svg width="25" height="25" viewBox="0 0 18 18">
            <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
            <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <div ref={editorRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} />
    </div>
  );
}