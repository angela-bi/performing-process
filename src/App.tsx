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
  editorPosition: { x: number; y: number; w: number; h: number };
  previewPosition: { x: number; y: number; w: number; h: number };
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
      editorPosition: { x, y, w: 500, h: 600 },
      previewPosition: { x: x + 520, y, w: 500, h: 600 },
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

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    addSketch(e.clientX, e.clientY);
  }

  return (
    <div className="canvas-background" onContextMenu={handleContextMenu}>
      {sketches.map(sketch => (
        <div key={sketch.id}>
          <Editor
            sketch={sketch}
            onChange={changes => updateSketch(sketch.id, changes)}
            onRun={() => updateSketch(sketch.id, { isRunning: true })}
            onClear={() => updateSketch(sketch.id, { isRunning: false })}
            onFocus={() => bringToFront(sketch.id)}
            zIndex={zIndexMap.current[sketch.id] ?? 1}
          />
          {sketch.isRunning && (
            <Preview
              sketch={sketch}
              onChange={changes => updateSketch(sketch.id, changes)}
              onFocus={() => bringToFront(sketch.id + '-preview')}
              zIndex={zIndexMap.current[sketch.id + '-preview'] ?? 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}