import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { buildSketchHTML } from '../utils/useP5runner';
import { findSyntaxError } from '../utils/syntax';
import type { Sketch, ModuleDoc } from '../App';

const CustomHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#7A5B3A" },
  { tag: t.comment, color: "#747474" },
  { tag: t.string, color: "#48820B" },
  { tag: t.variableName, color: "#0A7CA9" },
  { tag: t.function(t.variableName), color: "#0A7CA9" },
  { tag: t.bool, color: "#D52889" },
]);

interface DrawingSoftwareProps {
  sketch: Sketch;
  onChange: (changes: Partial<Sketch>) => void;
  onRun: () => void;
  onFocus: () => void;
  onDelete: () => void;
  zIndex: number;
  modules: ModuleDoc[];
}

export function DrawingSoftware({ sketch, onChange, onRun, onFocus, onDelete, zIndex, modules }: DrawingSoftwareProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pos, setPos] = useState({ x: sketch.editorPosition.x, y: sketch.editorPosition.y });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, wx: 0, wy: 0 });
  const hasLoaded = useRef(false);
  const latest = useRef(sketch);
  latest.current = sketch;

  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const modulesCode = modules.map(m => m.name + '\n' + m.code).join('\u0000');
  const lastCode = useRef(sketch.code + modulesCode);

  // ── Drag ──────────────────────────────────────────────────────────────────

  function onPointerDown(e: React.PointerEvent) {
    onFocus();
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
    onChange({ editorPosition: { ...sketch.editorPosition, x: pos.x, y: pos.y } });
  }

  // ── CodeMirror ────────────────────────────────────────────────────────────

  useEffect(() => {
    const view = new EditorView({
      doc: sketch.code,
      extensions: [
        basicSetup,
        javascript(),
        EditorView.lineWrapping,
        syntaxHighlighting(CustomHighlightStyle),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
        EditorView.updateListener.of(update => {
          if (update.docChanged) onChange({ code: update.state.doc.toString() });
        }),
      ],
      parent: editorRef.current!,
    });
    viewRef.current = view;

    requestAnimationFrame(() => { view.scrollDOM.scrollTop = sketch.scrollTop ?? 0; });

    let timer: number | undefined;
    const onScroll = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => { onChange({ scrollTop: view.scrollDOM.scrollTop }); }, 200);
    };
    view.scrollDOM.addEventListener('scroll', onScroll);

    return () => {
      clearTimeout(timer);
      view.scrollDOM.removeEventListener('scroll', onScroll);
      view.destroy();
    };
  }, []);

  // ── Auto-refresh + syntax check ───────────────────────────────────────────

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
        if (line !== null) { setSyntaxError(`${f.name}, line ${line}`); return; }
      }
      setSyntaxError(null);
      onChange({ runCount: latest.current.runCount + 1 });
    }, 800);

    return () => clearTimeout(timer);
  }, [sketch.code, modulesCode]);

  // ── iframe launch ─────────────────────────────────────────────────────────

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
      launch();
    } else {
      window.addEventListener('message', onMessage);
      iframe.contentWindow?.postMessage('snapshot', '*');
      timer = window.setTimeout(() => launch(), 500);
    }

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
    };
  }, [sketch.runCount]);

  // ── Render ────────────────────────────────────────────────────────────────

  const panelW = (sketch.editorPosition.w ?? 400) + (sketch.previewPosition.w ?? 400) + 1; // +1 for the divider

  return (
    <div
      onMouseDown={onFocus}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: panelW,
        height: sketch.minimized ? 'auto' : sketch.editorPosition.h,
        zIndex,
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {/* ── Shared header ── */}
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
        {/* Run */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRun}
          style={{ border: 'none', background: 'transparent', padding: '2px 0px' }}
        >
          <svg width="40px" height="40px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <circle r="8" cx="9" cy="9" fill="#ED225E" />
            <polygon points="5.5 5 13 9 5 14" fill="white" />
          </svg>
        </button>

        {/* Title */}
        <input
          value={sketch.title}
          onChange={e => onChange({ title: e.target.value })}
          onPointerDown={e => e.stopPropagation()}
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '12px', color: '#888',
            flex: 0.4, cursor: 'text', minWidth: 0,
            borderBottom: '1px dashed',
          }}
        />

        {/* Syntax error (from preview side) */}
        {syntaxError && (
          <span style={{ color: '#ED225E', fontSize: 11 }}>
            paused: syntax error in {syntaxError}
          </span>
        )}

        {/* Keep drawing */}
        <label
          onPointerDown={e => e.stopPropagation()}
          title="Keep the drawing when re-running"
          style={{
            display: 'flex', alignItems: 'center',
            marginLeft: 'auto', gap: '4px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '11px', color: '#888',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={!!sketch.keepDrawing}
            onChange={e => onChange({ keepDrawing: e.target.checked })}
            style={{ cursor: 'pointer', accentColor: '#ED225E' }}
          />
          keep drawing?
        </label>

        {/* Auto-refresh */}
        <label
          onPointerDown={e => e.stopPropagation()}
          title="Re-run automatically when code changes"
          style={{
            display: 'flex', alignItems: 'center',
            gap: '4px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '11px', color: '#888',
            cursor: 'pointer', whiteSpace: 'nowrap',
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

        {/* Minimize */}
        {/* <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onChange({ minimized: !sketch.minimized })}
          title={sketch.minimized ? 'Show code' : 'Hide code'}
          style={{ border: 'none', background: 'transparent', padding: '4px' }}
        >
          <svg width="25" height="25" viewBox="0 0 18 18">
            {sketch.minimized ? (
              <polyline points="5,7 9,11 13,7" fill="none" stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <line x1="5" y1="9" x2="13" y2="9" stroke="#bdbdbd" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button> */}

        {/* Delete */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onDelete}
          style={{ border: 'none', background: 'transparent', padding: '4px' }}
        >
          <svg width="25px" height="25px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <line x1="6" y1="6" x2="12" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
            <line x1="12" y1="6" x2="6" y2="12" stroke="#bdbdbd" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* ── Body: editor + preview side by side ── */}
      <div style={{ flex: 1, display: sketch.minimized ? 'none' : 'flex', minHeight: 0 }}>
        {/* Editor pane */}
        <div
          ref={editorRef}
          style={{ width: sketch.editorPosition.w, flexShrink: 0, overflow: 'hidden' }}
        />

        {/* Divider */}
        <div style={{ width: 1, background: '#ddd', flexShrink: 0 }} />

        {/* Preview pane */}
        <iframe
          allow="camera; microphone"
          ref={iframeRef}
          style={{ flex: 1, border: 'none', width: '100%' }}
          sandbox="allow-scripts allow-same-origin"
          title={sketch.title}
        />
      </div>
    </div>
  );
}