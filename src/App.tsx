import { useState, useRef } from 'react';
import './App.css'
import { Toolbar} from './components/Toolbar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { buildSketchHTML } from './utils/useP5runner';
import { Window } from './components/Window';

import defaultSketch from './sketches/defaultSketch';

export default function App() {
  const [code, setCode] = useState(defaultSketch);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [zIndexes, setZIndexes] = useState({ toolbar: 1, editor: 2, preview: 3 });

  function bringToFront(panel: 'toolbar' | 'editor' | 'preview') {
    setZIndexes(prev => ({
      ...prev,
      [panel]: Math.max(...Object.values(prev)) + 1,
    }));
  }

  function handleRun() {
    if (!iframeRef.current) return;
    const html = buildSketchHTML(code);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
  }
  
  function handleUndo() {
    iframeRef.current?.contentWindow?.postMessage('undo', '*');
  }
  
  function handleClear() {
    iframeRef.current?.contentWindow?.postMessage('clear', '*');
  }

  return (
    <div className="canvas-background">
      <Window title="Toolbar" defaultX={0} defaultY={0} defaultWidth={600} defaultHeight={60}
        zIndex={zIndexes.toolbar} onFocus={() => bringToFront('toolbar')}>
        <Toolbar
          onRun={handleRun}
          onUndo={handleUndo}
          onClear={handleClear}
        ></Toolbar>
      </Window>
      <Window title="Editor" defaultX={0} defaultY={80} defaultWidth={500} defaultHeight={600}
        zIndex={zIndexes.editor} onFocus={() => bringToFront('editor')}>
        <Editor value={code} onChange={setCode} />
      </Window>
      <Window title="Preview" defaultX={520} defaultY={80} defaultWidth={500} defaultHeight={600}
        zIndex={zIndexes.preview} onFocus={() => bringToFront('preview')}>
        <Preview iframeRef={iframeRef} />
      </Window>
    </div>
  );
}