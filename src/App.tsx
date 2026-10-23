import { useState, useRef, useEffect } from 'react';
import './App.css'
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';

import defaultSketch from './sketches/defaultSketch';

export interface Sketch {
  id: string;
  title: string;
  code: string;
  isRunning: boolean;
  runCount: number;
  editorPosition: { x: number; y: number; w: number; h: number };
  previewPosition: { x: number; y: number; w: number; h: number };
  keepDrawing: boolean;
  scrollTop: number;
}

export default function App() {
  //////////////////////
  // sketch functions //
  //////////////////////

  const [sketches, setSketches] = useState<Sketch[]>(() => {
    const saved = localStorage.getItem('sketches');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sketches', JSON.stringify(sketches));
  }, [sketches]);

  function addSketch(x: number, y: number) {
    const newSketch: Sketch = {
      id: crypto.randomUUID(),
      title: 'untitled',
      code: defaultSketch,
      isRunning: false,
      runCount: 0,
      editorPosition: { x, y, w: 500, h: 300 },
      previewPosition: { x: x + 520, y, w: 500, h: 600 },
      keepDrawing: false,
      scrollTop: 0
    };
    setSketches(prev => [...prev, newSketch]);
  }

  function updateSketch(id: string, changes: Partial<Sketch>) {
    setSketches(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  }

  function removeSketch(id: string) {
    setSketches(prev => prev.filter(s => s.id !== id));
  }

  //////////////////////
  // zIndex functions //
  //////////////////////

  const zIndexCounter = useRef(10);
  const zIndexMap = useRef<Record<string, number>>({});

  function bringToFront(id: string) {
    zIndexCounter.current += 1;
    zIndexMap.current[id] = zIndexCounter.current;
  }

  //////////////////
  // context menu //
  //////////////////

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleCreateEditor() {
    if (!contextMenu) return;
    addSketch(contextMenu.x, contextMenu.y);
    setContextMenu(null);
  }

  function handleCloseMenu() {
    setContextMenu(null);
  }

  return (
    <div
      className="canvas-background"
      onContextMenu={handleContextMenu}
      onClick={handleCloseMenu} // click anywhere to dismiss
    >
      {sketches.map(sketch => (
        <div key={sketch.id}>
          <Editor
            sketch={sketch}
            onChange={changes => updateSketch(sketch.id, changes)}
            onRun={() => updateSketch(sketch.id, { 
              isRunning: true, 
              runCount: sketch.runCount + 1
            })}
            onFocus={() => bringToFront(sketch.id)}
            onDelete={() => removeSketch(sketch.id)}
            zIndex={zIndexMap.current[sketch.id] ?? 1}
          />
          {sketch.isRunning && (
            <Preview
              sketch={sketch}
              onChange={changes => updateSketch(sketch.id, changes)}
              onFocus={() => bringToFront(sketch.id + '-preview')}
              onClear={() => updateSketch(sketch.id, { isRunning: false })}
              zIndex={zIndexMap.current[sketch.id + '-preview'] ?? 1}
            />
          )}
        </div>
      ))}
  
      {contextMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '13px',
          }}
        >
          <button
            onClick={handleCreateEditor}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#333',
              whiteSpace: 'nowrap',
              fontFamily: 'Montserrat, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            + Create new editor
          </button>
        </div>
      )}
      <button
      onClick={e => {
        e.stopPropagation();
        const offset = sketches.length * 30;
        addSketch(80 + offset, 80 + offset);
      }}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: '#ED225E',
        color: 'white',
        fontSize: 28,
        lineHeight: 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        zIndex: 9998,
      }}
      aria-label="Create new editor"
    >
      +
    </button>
    </div>
  );
}