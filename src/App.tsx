import { useState, useRef, useEffect } from 'react';
import './App.css'
// import { Editor } from './components/Editor';
// import { Preview } from './components/Preview';
import { Module } from './components/Module';

import defaultSketch from './defaults/defaultSketch';
import defaultModule from './defaults/defaultModule';

import { SoundWindow } from './components/SoundWindow';
import { CameraWindow } from './components/CameraWindow';
import { DrawingSoftware } from './components/DrawingSoftware';
import { ColorPicker } from './components/ColorPicker';

export type PanelKey = 'sound' | 'camera' | 'drawing' | 'brush' | 'colorpicker';

const DEFAULT_PANELS: Record<PanelKey, PanelDoc> = {
  sound:   { position: { x: 40,  y: 40,  w: 420, h: 520 } },
  camera:  { position: { x: 480, y: 40,  w: 400, h: 340 } },
  drawing: { position: { x: 900, y: 40,  w: 640, h: 700 } },
  brush:   { position: { x: 480, y: 400, w: 400, h: 360 } },
  colorpicker: { position: { x: 100, y: 100, w: 400, h: 360 } }
};

const PANEL_KEYS = Object.keys(DEFAULT_PANELS) as PanelKey[];

export interface PanelDoc {
  position: { x: number; y: number; w: number; h: number };
  deviceId?: string;   // chosen microphone or camera
}

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
  minimized?: boolean;
  autoRefresh?: boolean;
}

export interface ModuleDoc {
  id: string;
  name: string;
  code: string;
  scrollTop: number;
  position: { x: number; y: number; w: number; h: number };
  minimized?: boolean;
}

export default function App() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerColor, setPickerColor] = useState('#FF0000');   // initial color the picker opens with
  const [liveColor, setLiveColor] = useState<string | null>(null); // latest color chosen in the picker
  const [colorPickerOwner, setColorPickerOwner] = useState<string | null>(null); // sketch id that opened the picker
  const [showMic, setShowMic] = useState(false);

  const [panels, setPanels] = useState<Record<PanelKey, PanelDoc>>(() => {
    let saved: Partial<Record<PanelKey, Partial<PanelDoc>>> = {};
    try { saved = JSON.parse(localStorage.getItem('panels') ?? '{}') ?? {}; } catch { /* ignore */ }
    const out = {} as Record<PanelKey, PanelDoc>;
    for (const k of PANEL_KEYS) out[k] = { ...DEFAULT_PANELS[k], ...saved[k] };
    return out;
  });

  useEffect(() => {
    localStorage.setItem('panels', JSON.stringify(panels));
  }, [panels]);

  const updatePanel = (key: PanelKey, changes: Partial<PanelDoc>) =>
    setPanels(prev => ({ ...prev, [key]: { ...prev[key], ...changes } }));

  //////////////////////
  // sketch functions //
  //////////////////////

  const [sketches, setSketches] = useState<Sketch[]>(() => {
  const saved = localStorage.getItem('sketches');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed.length > 0) return parsed;
  }
  const id = crypto.randomUUID();
  return [{
    id,
    title: 'drawing 1',
    code: defaultSketch,
    isRunning: false,
    runCount: 0,
    editorPosition: { x: 60, y: 60, w: 500, h: 600 },
    previewPosition: { x: 580, y: 60, w: 500, h: 600 },
    keepDrawing: false,
    scrollTop: 0,
  }];
});

  useEffect(() => {
    localStorage.setItem('sketches', JSON.stringify(sketches));
  }, [sketches]);

  function addSketch(x: number, y: number) {
    const id = crypto.randomUUID();
    setSketches(prev => [...prev, {
      id: id,
      title: nextName('drawing', prev.map(s => s.title)),
      code: defaultSketch,
      isRunning: false,
      runCount: 0,
      editorPosition: { x, y, w: 500, h: 600 },
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
  const [zIndexMap, setZIndexMap] = useState<Record<string, number>>({});

  function bringToFront(id: string) {
    zIndexCounter.current += 1;
    const next = zIndexCounter.current;
    setZIndexMap(prev => ({ ...prev, [id]: next }));
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

  ///////////////////
  // communicating between components
  /////////////////

  return (
    <div
      className="canvas-background"
      // onContextMenu={handleContextMenu}
      onClick={() => setMenuOpen(false)}
    >

      { showColorPicker && (
        <ColorPicker
        color={pickerColor}
        onChange={hex => setLiveColor(hex)}
        zIndex={zIndexMap['colorpicker'] ?? 1}
        onFocus={() => bringToFront('colorpicker')}
        setPickerColor={setPickerColor}
        showColorPicker={showColorPicker}
      />
      )
      }
    
      {sketches.map(sketch => (
        <DrawingSoftware
          key={sketch.id}
          sketch={sketch}
          onChange={changes => updateSketch(sketch.id, changes)}
          onRun={() => updateSketch(sketch.id, { isRunning: true, runCount: sketch.runCount + 1 })}
          onFocus={() => bringToFront(sketch.id)}
          onDelete={() => removeSketch(sketch.id)}
          zIndex={zIndexMap[sketch.id] ?? 1}
          modules={modules}
          setShowColorPicker={setShowColorPicker}
          setPickerColor={setPickerColor}
          setLiveColor={setLiveColor}
          liveColor={liveColor}
          isColorPickerOwner={colorPickerOwner === sketch.id}
          setColorPickerOwner={setColorPickerOwner}
          setShowMic={setShowMic}
        />
      ))}
  
      {/* {modules.map(m => (
        <Module
          key={m.id}
          module={m}
          allNames={modules.map(x => x.name)}
          onChange={changes => updateModule(m.id, changes)}
          onFocus={() => bringToFront(m.id)}
          onDelete={() => removeModule(m.id)}
          zIndex={zIndexMap.current[m.id] ?? 1}
        />
      ))} */}

      <SoundWindow
        doc={panels.sound}
        onChange={c => updatePanel('sound', c)}
        onFocus={() => bringToFront('sound')}
        zIndex={zIndexMap['sound'] ?? 1}
      />
      <CameraWindow
        doc={panels.camera}
        onChange={c => updatePanel('camera', c)}
        onFocus={() => bringToFront('camera')}
        zIndex={zIndexMap['camera'] ?? 1}
      />

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
          {/* <button onClick={handleAddModule} style={menuItemStyle}>+ New module</button> */}
          <button onClick={handleAddEditor} style={menuItemStyle}>+ New drawing</button>
          {/* <button onClick={() => { const { x, y } = nextSpot(); addSound(x, y); setMenuOpen(false); }} style={menuItemStyle}>+ New sound</button> */}
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