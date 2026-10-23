export function buildSketchHTML(code: string, snapshot?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
        <style>
          html, body { margin: 0; overflow: hidden; overscroll-behavior: none; touch-action: none; }
          canvas { display: block; touch-action: none; }
        </style>
      </head>
      <body>
        <script>${code}</script>
        <script>
          // reply to the parent with the current drawing
          window.addEventListener('message', (e) => {
            if (e.data === 'snapshot') {
              let data = null;
              try {
                if (typeof drawingBuffer !== 'undefined') {
                  data = drawingBuffer.elt.toDataURL();
                }
              } catch (err) {}
              window.parent.postMessage({ type: 'snapshot', data }, '*');
            }
            if (e.data === 'clear' && typeof drawingBuffer !== 'undefined') {
              drawingBuffer.background(255);
            }
          });

          // restore the previous drawing after the user's setup() runs
          const __snapshot = ${JSON.stringify(snapshot ?? null)};
          if (__snapshot && typeof window.setup === 'function') {
            const __origSetup = window.setup;
            window.setup = function () {
              __origSetup();
              if (typeof drawingBuffer === 'undefined') return;
              const img = new Image();
              img.onload = () => {
                drawingBuffer.drawingContext.drawImage(
                  img, 0, 0, drawingBuffer.width, drawingBuffer.height
                );
              };
              img.src = __snapshot;
            };
          }
        </script>
      </body>
    </html>
  `;
}