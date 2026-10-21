export function buildSketchHTML(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            html, body {
              margin: 0;
              overflow: hidden;
              overscroll-behavior: none;
              touch-action: none;
            }
            canvas { display: block; touch-action: none; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/p5@1.9.4/lib/p5.min.js"></script>
          <style>body { margin: 0; }</style>
        </head>
        <body>
          <script>${code}</script>
        </body>
      </html>
    `;
  }
  