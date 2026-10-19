export const P5_GLOBALS = new Set([
    // environment
    'mouseX', 'mouseY', 'pmouseX', 'pmouseY',
    'mouseIsPressed', 'mouseButton',
    'keyIsPressed', 'key', 'keyCode',
    'width', 'height', 'frameCount', 'frameRate',
    'windowWidth', 'windowHeight',
    // setup/draw
    'setup', 'draw',
    // shape
    'ellipse', 'circle', 'rect', 'line', 'point',
    'triangle', 'quad', 'arc', 'bezier',
    'beginShape', 'endShape', 'vertex',
    // color
    'background', 'fill', 'noFill', 'stroke', 'noStroke',
    'color', 'colorMode', 'lerpColor',
    // canvas
    'createCanvas', 'resizeCanvas',
    'createGraphics', 'image',
    // math
    'random', 'noise', 'map', 'lerp', 'constrain',
    'dist', 'abs', 'floor', 'ceil', 'round',
    'min', 'max', 'sqrt', 'pow', 'log',
    'sin', 'cos', 'tan', 'atan2',
    'radians', 'degrees',
    // transform
    'push', 'pop', 'translate', 'rotate', 'scale',
    // text
    'text', 'textSize', 'textAlign', 'textFont',
    'LEFT', 'RIGHT', 'CENTER', 'TOP', 'BOTTOM',
    // input
    'mousePressed', 'mouseReleased', 'mouseMoved',
    'keyPressed', 'keyReleased',
    'touchStarted', 'touchMoved', 'touchEnded',
    // typography
    'loadFont', 'loadImage', 'loadJSON',
    // misc
    'print', 'noCursor', 'cursor',
  ]);