import type { ModuleDoc } from '../App';

const P5_HANDLERS = [
  'preload', 'setup', 'draw', 'mousePressed', 'mouseReleased', 'mouseMoved',
  'mouseDragged', 'keyPressed', 'keyReleased', 'touchStarted', 'touchMoved',
  'touchEnded', 'windowResized',
];

const customFunctions = `
  window.createCustomColorPicker = function(defaultColor) {
    const color = defaultColor ?? '#FF0000';
    window.parent.postMessage({ type: 'OPEN_COLOR_PICKER', color }, '*');

    let _color = color;
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'COLOR_UPDATE') _color = e.data.hex;
    });

    return {
      color: () => _color,
      value: () => _color,
      remove: () => window.parent.postMessage({ type: 'CLOSE_COLOR_PICKER' }, '*'),
    };
  };

  window.createCustomMic = function() {
    window.parent.postMessage({ type: 'OPEN_MIC' }, '*');
    return {
      getLevel: () => window.__micLevel ?? 0,
    };
  };
`;

export function buildSketchHTML(code: string, snapshot?: string, modules: ModuleDoc[] = []): string {
  const imports: Record<string, string> = {};
  for (const m of modules) {
    imports[m.name] = URL.createObjectURL(new Blob([m.code], { type: 'text/javascript' }));
  }

  const expose = P5_HANDLERS
    .map(n => `if (typeof ${n} === 'function') window.${n} = ${n};`)
    .join('\n');

  return `<!DOCTYPE html>
<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"><\/script>
    <script type="importmap">${JSON.stringify({ imports })}<\/script>
    <style>
      html, body { margin: 0; overflow: hidden; overscroll-behavior: none; touch-action: none; }
      canvas { display: block; touch-action: none; }
    </style>
  </head>
  <body>
    <!-- 1. the sketch itself, as a module -->
    <script>${customFunctions}<\/script>
    <script type="module">
${code}
;${expose}
// module variables aren't globals, so expose drawingBuffer with a getter
Object.defineProperty(window, 'drawingBuffer', {
  get: () => (typeof drawingBuffer !== 'undefined' ? drawingBuffer : undefined),
});
    <\/script>

    <!-- 2. helper module: runs after the sketch module, no nested script tags -->
    <script type="module">
      window.addEventListener('message', (e) => {
        if (e.data === 'snapshot') {
          let data = null;
          try {
            if (window.drawingBuffer) data = window.drawingBuffer.elt.toDataURL();
          } catch (err) {}
          window.parent.postMessage({ type: 'snapshot', data }, '*');
        }
        if (e.data === 'clear' && window.drawingBuffer) {
          window.drawingBuffer.background(255);
        }
      });

      const __snapshot = ${JSON.stringify(snapshot ?? null)};
      if (__snapshot && typeof window.setup === 'function') {
        const __origSetup = window.setup;
        window.setup = function () {
          __origSetup();
          const buf = window.drawingBuffer;
          if (!buf) return;
          const img = new Image();
          img.onload = () => {
            buf.drawingContext.drawImage(img, 0, 0, buf.width, buf.height);
          };
          img.src = __snapshot;
        };
      }
    <\/script>
  </body>
</html>`;
}