import { useState, useRef, useEffect } from 'react';
import './App.css'
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { Module } from './components/Module';

import defaultSketch from './defaults/defaultSketch';
import defaultModule from './defaults/defaultModule';

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

export interface ModuleDoc {
  id: string;
  name: string;
  code: string;
  scrollTop: number;
  position: { x: number; y: number; w: number; h: number };
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
    const id = crypto.randomUUID();
    setSketches(prev => [...prev, {
      id: id,
      title: nextName('editor', prev.map(s => s.title)),
      code: defaultSketch,
      isRunning: false,
      runCount: 0,
      editorPosition: { x, y, w: 500, h: 300 },
      previewPosition: { x: x + 520, y, w: 500, h: 600 },
      keepDrawing: false,
      scrollTop: 0
    }]);
    bringToFront(id);
  }

  function updateSketch(id: string, changes: Partial<Sketch>) {
    setSketches(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  }

  function removeSketch(id: string) {
    setSketches(prev => prev.filter(s => s.id !== id));
  }

  //////////////////////
  // module functions //
  //////////////////////

  const [modules, setModules] = useState<ModuleDoc[]>(() => {
    const saved = localStorage.getItem('modules');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('modules', JSON.stringify(modules));
  }, [modules]);
  
  function addModule(x: number, y: number) {
    setModules(prev => [...prev, {
      id: crypto.randomUUID(),
      name: `module-${prev.length + 1}`,
      code: defaultModule,
      scrollTop: 0,
      position: { x, y, w: 460, h: 320 },
    }]);
  }
  
  function updateModule(id: string, changes: Partial<ModuleDoc>) {
    setModules(prev => prev.map(m => m.id === id ? { ...m, ...changes } : m));
  }
  
  function removeModule(id: string) {
    setModules(prev => prev.filter(m => m.id !== id));
  }

  ///////////////////////////////
  // zIndex + naming functions //
  ///////////////////////////////

  function nextName(prefix: string, existing: string[], sep = ' ') {
    let n = 1;
    while (existing.includes(`${prefix}${sep}${n}`)) n++;
    return `${prefix}${sep}${n}`;
  }

  const zIndexCounter = useRef(10);
  const zIndexMap = useRef<Record<string, number>>({});

  function bringToFront(id: string) {
    zIndexCounter.current += 1;
    zIndexMap.current[id] = zIndexCounter.current;
  }

  //////////
  // menu //
  //////////

  const [menuOpen, setMenuOpen] = useState(false);

  function nextSpot() {
    const n = (sketches.length + modules.length) % 8;
    return { x: 60 + n * 30, y: 60 + n * 30 };
  }
  
  function handleAddEditor() {
    const { x, y } = nextSpot();
    addSketch(x, y);
    setMenuOpen(false);
  }
  
  function handleAddModule() {
    const { x, y } = nextSpot();
    addModule(x, y);
    setMenuOpen(false);
  }

  const menuItemStyle: React.CSSProperties = {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    color: '#333',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      className="canvas-background"
      // onContextMenu={handleContextMenu}
      onClick={() => setMenuOpen(false)}
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
              modules={modules}
            />
          )}
        </div>
      ))}
  
      {modules.map(m => (
        <Module
          key={m.id}
          module={m}
          allNames={modules.map(x => x.name)}
          onChange={changes => updateModule(m.id, changes)}
          onFocus={() => bringToFront(m.id)}
          onDelete={() => removeModule(m.id)}
          zIndex={zIndexMap.current[m.id] ?? 1}
        />
      ))}

    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}
    >
      {menuOpen && (
        <>
          <button onClick={handleAddModule} style={menuItemStyle}>+ New module</button>
          <button onClick={handleAddEditor} style={menuItemStyle}>+ New editor</button>
        </>
      )}

      <button
        onClick={() => setMenuOpen(o => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Add editor or module'}
        aria-expanded={menuOpen}
        style={{
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
          transform: menuOpen ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.15s',
        }}
      >
        +
      </button>
    </div>
    </div>
  );
}