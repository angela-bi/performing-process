const defaultSketch = `// sensitivity also seems to influence the average brush size, which I may or may not want at times

let analyser, mic;
let started = false;
let brushX;
let brushY;
let lerpFactor = 0.1;
let steps = 10;
let slider;
let soundvis;
let brushvis;
let volHistory = [];
let brushSizeHistory = [];
let volHistoryLength = 400;
let brushSizeHistoryLength = 20;
let drawingBuffer;
const volumeData = new Uint8Array(2048);

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  return false;
}

async function mousePressed() {
  if (started) return;
  started = true;

  const audioCtx = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mic = audioCtx.createMediaStreamSource(stream);
  
  analyser = audioCtx.createAnalyser();
  mic.connect(analyser);
  analyser.fftSize = 2048;
}

function getVolume() {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(volumeData); // reuse instead of new each frame
  let sum = 0;
  for (let i = 0; i < volumeData.length; i++) {
    let val = (volumeData[i] - 128) / 128;
    sum += val * val;
  }
  return Math.sqrt(sum / volumeData.length);
  // can also implement based on getByteFrequencyData(data)
  // examples: https://therewasaguy.github.io/p5-music-viz/
}

function setup() {
  createCanvas(600, 700);
  drawingBuffer = createGraphics(600, 700);
  drawingBuffer.background(255);
  frameRate(60);
  // background(50,50,50)

  // slider = createSlider(1, 500, 50); // min max current
  // slider.position(10, 10); // where it is
  // slider.size(80); // how wide it is
  // slider is between 10,10 and 90,10

  soundvis = new SoundVisualizer();
  brushvis = new BrushSizeVisualizer();
  // slider not as important because i'm the only one using it. I want to show how the function maps sound to brush size.
}

function draw() {
  background(255);
  image(drawingBuffer, 0, 0);
  
  let vol = getVolume();
  volHistory.push(vol);
  if (volHistory.length > volHistoryLength) {
    volHistory.shift(); // remove oldest value
    brushSizeHistory.shift();
  }

  // slider box = (10,10), (90,10), (10,20), (90,20)
  // mouse can't be in the y-range 10-20 while its in the x-range 10-90
  let sensitivity = 400;
  let amplified = Math.pow(vol, 1/sensitivity); // vol to the 1/sensitivity
  let brush_size = vol*amplified*sensitivity;
  // console.log(brush_size)
  brushSizeHistory.push(brush_size)
  
  if (mouseIsPressed){
    drawingBuffer.noStroke();
    drawingBuffer.fill(0);

    for (let i = 0; i < steps; i++) {
      let ratio = i / steps // wherever ratio the i is in at the for loop
      let x = lerp(prevX, mouseX, ratio)
      let y = lerp(prevY, mouseY, ratio)
      drawingBuffer.circle(x, y, brush_size);
    }
  } else { // when hovering
    push();
    noFill();
    strokeWeight(0.5);
    circle(mouseX, mouseY, brush_size);
    pop();
  }
  prevX = mouseX;
  prevY = mouseY;

  // audio visualizer
  // draw visualizer near the slider
  // draw visualizer of vol*sensitivity?
  soundvis.drawSound(vol);
  // brushvis.drawBrushSize();
}

class SoundVisualizer {
  constructor(){
    this.x = 10;
    this.y = 10;
    this.width = volHistoryLength;
    this.height = 80;

    this.soundbarWidth = 1; 
  }

  drawSound(soundLevel){
    stroke('black');
    fill('white');
    rect(this.x, this.y, this.width, this.height);
    
    stroke('black');
    fill('black');

    // current sound
    let soundbarHeight;
    // soundbarHeight = map(soundLevel, 0, 0.1, 0, this.height);
    // rect(this.x , this.y + this.height - soundbarHeight, this.soundbarWidth, soundbarHeight) // x, y, w, h

    for (let i=0; i < volHistoryLength ; i++) {
      soundbarHeight = map(volHistory[i], 0, 0.7, 0, this.height/2);
      // rect(this.x + (i * this.soundbarWidth), this.y + this.height - soundbarHeight, this.soundbarWidth, soundbarHeight)
      // stroke('blue')
      line(
        this.x + (i * this.soundbarWidth), this.y + 
        (this.height/2) - (soundbarHeight), 
        this.x + (i * this.soundbarWidth), 
        this.y + (this.height/2) + soundbarHeight
      )
    };
    // want the sound level to be reflected across the horizontal/middle axis
    // the middle axis would be x: this.y + this.height - (soundbarHeight / 2)
  };
}

class BrushSizeVisualizer {
  constructor(){
    this.x = 410;
    this.y = 10;
    this.width = brushSizeHistoryLength;
    this.height = 80;

    this.brushBarWidth = 1; 
  }

  drawBrushSize(brushSize){
    stroke('black');
    fill('white');
    rect(this.x, this.y, this.width, this.height);
    
    stroke('black');
    fill('black');

    // current sound
    let brushBarHeight;

    for (let i=0; i < brushSizeHistoryLength ; i++) {
      brushBarHeight = map(brushSizeHistory[i], 0, 5, 0, this.height/2);
      // lowkey now it's not proportional to actual sound level no?
      // rect(this.x + (i * this.soundbarWidth), this.y + this.height - soundbarHeight, this.soundbarWidth, soundbarHeight)
      line(
        this.x + (i * this.brushBarWidth), this.y + 
        (this.height/2) - (brushBarHeight), 
        this.x + (i * this.brushBarWidth), 
        this.y + (this.height/2) + brushBarHeight
      )
    };
    // want the sound level to be reflected across the horizontal/middle axis
    // the middle axis would be x: this.y + this.height - (soundbarHeight / 2)
  };
}
`

export default defaultSketch;