[
    {
        "id": "7707263c-5e26-46cf-9c46-d93e0daa6942",
        "name": "mic-module",
        "code": "const channel = new BroadcastChannel('audio');\n\nlet waveform = new Uint8Array(2048).fill(128);  // 128 = silence\nlet spectrum = new Uint8Array(1024);\nlet sampleRate = 48000;\nlet lastSeen = 0;\n\nchannel.onmessage = e => {\n  waveform = e.data.waveform;\n  spectrum = e.data.spectrum;\n  sampleRate = e.data.sampleRate;\n  lastSeen = Date.now();\n};\n\nconst live = () => Date.now() - lastSeen < 500;\n\nexport const getWaveform = () => (live() ? waveform : new Uint8Array(2048).fill(128));\nexport const getSpectrum = () => (live() ? spectrum : new Uint8Array(1024));\n\nexport function getVolume() {\n  if (!live()) return 0;\n  let sum = 0;\n  for (let i = 0; i < waveform.length; i++) {\n    const v = (waveform[i] - 128) / 128;\n    sum += v * v;\n  }\n  return Math.sqrt(sum / waveform.length);\n}\n\n// can also implement based on getByteFrequencyData(data)\n// examples: https://therewasaguy.github.io/p5-music-viz/\n// https://editor.p5js.org/jonfroehlich/sketches/d2euV09i",
        "scrollTop": 0,
        "position": {
            "x": 881.17578125,
            "y": 72.0234375,
            "w": 387.85546875,
            "h": 177.08203125
        },
        "minimized": true
    },
    {
        "id": "67d2b423-e356-4f71-ad70-dc02d93683a4",
        "name": "sound-visualizer",
        "code": "import { getVolume } from 'mic-module';\n\nlet volHistoryLength = 400;\nlet volHistory = [];\n\nexport class SoundVisualizer {\n  constructor(){\n    this.x = 10;\n    this.y = 10;\n    this.width = volHistoryLength;\n    this.height = 80;\n\n    this.soundbarWidth = 1; \n  }\n\n  drawSound(soundLevel){\n    volHistory.push(soundLevel);\n  if (volHistory.length > volHistoryLength) {\n    volHistory.shift(); // remove oldest value\n  }\n    \n    stroke('black');\n    fill('white');\n    rect(this.x, this.y, this.width, this.height);\n    \n    stroke('black');\n    fill('black');\n\n    // current sound\n    let soundbarHeight;\n    // soundbarHeight = map(soundLevel, 0, 0.1, 0, this.height);\n    // rect(this.x , this.y + this.height - soundbarHeight, this.soundbarWidth, soundbarHeight) // x, y, w, h\n\n    for (let i=0; i < volHistoryLength ; i++) {\n      soundbarHeight = map(volHistory[i], 0, 0.7, 0, this.height/2);\n      // rect(this.x + (i * this.soundbarWidth), this.y + this.height - soundbarHeight, this.soundbarWidth, soundbarHeight)\n      // stroke('blue')\n      line(\n        this.x + (i * this.soundbarWidth), this.y + \n        (this.height/2) - (soundbarHeight), \n        this.x + (i * this.soundbarWidth), \n        this.y + (this.height/2) + soundbarHeight\n      )\n    };\n    // want the sound level to be reflected across the horizontal/middle axis\n    // the middle axis would be x: this.y + this.height - (soundbarHeight / 2)\n  };\n}\n\n  ",
        "scrollTop": 0,
        "position": {
            "x": 811.43359375,
            "y": 213.90625,
            "w": 460,
            "h": 320
        },
        "minimized": true
    },
    {
        "id": "80eb4170-7331-4036-a729-6a3c700cf4f6",
        "name": "pen",
        "code": "let pressure = 0;\nlet smoothed = 0;\nlet tiltX = 0;\nlet tiltY = 0;\nlet type = 'mouse';\nlet down = false;\n\nfunction read(e) {\n  type = e.pointerType;\n  tiltX = e.tiltX || 0;\n  tiltY = e.tiltY || 0;\n  pressure = e.pointerType === 'pen' ? e.pressure : (down ? 1 : 0);\n}\n\nwindow.addEventListener('pointerdown', e => {\n  down = true;\n  read(e);\n  smoothed = pressure;\n}, true);\n\nwindow.addEventListener('pointermove', e => {\n  read(e);\n  smoothed += (pressure - smoothed) * 0.35;\n}, true);\n\nfunction end() {\n  down = false;\n  pressure = 0;\n  smoothed = 0;\n}\nwindow.addEventListener('pointerup', end, true);\nwindow.addEventListener('pointercancel', end, true);\n\nexport const getPressure = () => pressure;            // raw, 0 to 1\nexport const getSmoothPressure = () => smoothed;      // steadier, better for brush size\nexport const getTilt = () => ({ x: tiltX, y: tiltY });  // degrees, -90 to 90\nexport const isPen = () => type === 'pen';\n  ",
        "scrollTop": 0,
        "position": {
            "x": 817.19140625,
            "y": 127.35546875,
            "w": 460,
            "h": 320
        },
        "minimized": true
    },
    {
        "id": "3518ae60-fa14-41da-99c1-77d6cb32613b",
        "name": "webcam",
        "code": "let video = null;\nlet ready = false;\nlet stream = null;\n\nconst isVirtual = label => /obs|virtual|manycam|snap camera|ndi/i.test(label);\n\nasync function open(constraints) {\n  if (stream) stream.getTracks().forEach(t => t.stop());\n  stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });\n  video.srcObject = stream;\n  await video.play();\n}\n\nexport async function startWebcam({ deviceId, facingMode = 'user', width = 640, height = 480 } = {}) {\n  if (video) return video;\n  video = document.createElement('video');\n  video.setAttribute('playsinline', '');\n  video.muted = true;\n\n  const size = { width: { ideal: width }, height: { ideal: height } };\n  try {\n    await open(deviceId ? { deviceId: { exact: deviceId }, ...size } : { facingMode, ...size });\n\n    // if the browser picked a virtual camera, switch to a real one\n    if (!deviceId && isVirtual(stream.getVideoTracks()[0].label)) {\n      const real = (await navigator.mediaDevices.enumerateDevices())\n        .filter(d => d.kind === 'videoinput' && !isVirtual(d.label));\n      if (real.length) await open({ deviceId: { exact: real[0].deviceId }, ...size });\n    }\n    ready = true;\n  } catch (err) {\n    console.error('webcam failed:', err);\n    video = null;\n  }\n  return video;\n}\n\n// see what the browser can use (names appear after permission is granted)\nexport async function listCameras() {\n  const all = await navigator.mediaDevices.enumerateDevices();\n  return all.filter(d => d.kind === 'videoinput').map(d => ({ id: d.deviceId, label: d.label }));\n}\n\nexport const isWebcamReady = () => ready && !!video && video.videoWidth > 0;\n\nexport function drawWebcam(x, y, w, h, mirror = true) {\n  if (!isWebcamReady()) return;\n  const ctx = window.drawingContext;\n  ctx.save();\n  if (mirror) {\n    ctx.translate(x + w, y);\n    ctx.scale(-1, 1);\n    ctx.drawImage(video, 0, 0, w, h);\n  } else {\n    ctx.drawImage(video, x, y, w, h);\n  }\n  ctx.restore();\n}\n\nexport const getVideo = () => video;",
        "scrollTop": 0,
        "position": {
            "x": 816.6875,
            "y": 310.02734375,
            "w": 460,
            "h": 320
        },
        "minimized": true
    },
    {
        "id": "7e3bb27e-8101-4fb2-a583-1ba32a97f890",
        "name": "palette-link",
        "code": "const channel = new BroadcastChannel('palette');\nconst KEY = 'palette-color';\n\n// start from the last color picked, so a sketch that loads\n// after the picker still has the right color\nlet current = '#000000';\ntry { current = localStorage.getItem(KEY) || current; } catch (err) {}\n\nchannel.onmessage = e => { current = e.data; };\n\nexport function setColor(color) {\n  current = color;\n  try { localStorage.setItem(KEY, color); } catch (err) {}\n  channel.postMessage(color);\n}\n\nexport function getColor() {\n  return current;\n}",
        "scrollTop": 134,
        "position": {
            "x": 820.375,
            "y": 260.9609375,
            "w": 460,
            "h": 320
        },
        "minimized": true
    }
]

[
    {
        "id": "24c2fd94-a217-4b68-8aac-61fc90b8a7df",
        "title": "drawing software",
        "code": "import {getVolume} from 'mic-module';\nimport { getSmoothPressure, isPen } from 'pen';\nimport { getColor } from 'palette-link';\n\nlet prevX;\nlet prevY;\nlet brushX;\nlet brushY;\nlet lerpFactor = 0.1;\nlet steps = 10;\nlet drawingBuffer;\nlet myPicker;\nlet prevSize = 0;\n\nfunction setup() {\n  createCanvas(800, 1000);\n  drawingBuffer = createGraphics(600, 700);\n  drawingBuffer.noStroke();\n  drawingBuffer.fill(0);\n  frameRate(60);\n  // myPicker = createColorPicker('black');\n  // myPicker.position(10,10);\n  // background(50,50,50)\n\n  // slider = createSlider(1, 500, 50); // min max current\n  // slider.position(10, 10); // where it is\n  // slider.size(80); // how wide it is\n  // slider is between 10,10 and 90,10\n\n  // slider not as important because i'm the only one using it. I want to show how the function maps sound to brush size.\n}\n\nfunction draw() {\n  background(255);\n  image(drawingBuffer, 0, 0);\n  \n  let vol = getVolume();\n\n  let constant = 100;\n  // let amplified = Math.pow(vol, 1/sensitivity); // vol to the 1/sensitivity\n  // let brush_pressure = Math.pow(getSmoothPressure(),1.3);\n  let brush_pressure = isPen() ? 10*Math.pow(getSmoothPressure(),2) : 0.01;\n  // let brush_size = (1 + (vol*100))+ Math.pow(brush_pressure, 5) ;\n  let brush_size = (1 + (vol*10))+ 10*Math.pow(brush_pressure, 2); // old brush\n  //brush_size = (10 + (vol*100))+ Math.pow(brush_pressure, 5); // big brush\n  //let brush_size = 5 + 2 + vol + brush_pressure;\n  \n  if (mouseIsPressed){\n    for (let i = 0; i < steps; i++) {\n      let ratio = i / steps // wherever ratio the i is in at the for loop\n      let x = lerp(prevX, mouseX, ratio)\n      let y = lerp(prevY, mouseY, ratio)\n      // let c = myPicker.color();\n\n      drawingBuffer.fill(getColor());\n      drawingBuffer.circle(x, y, brush_size);\n      //drawingBuffer.circle(x, y, brush_size/2, brush_size*2)\n    }\n  } else { // when hovering\n    push();\n    noFill();\n    strokeWeight(0.5);\n    circle(mouseX, mouseY, brush_size);\n    pop();\n  }\n  prevX = mouseX;\n  prevY = mouseY;\n}\n",
        "isRunning": true,
        "editorPosition": {
            "x": 9.10546875,
            "y": 15.92578125,
            "w": 500,
            "h": 600
        },
        "previewPosition": {
            "x": 642.6328125,
            "y": 105.08984375,
            "w": 500,
            "h": 600
        },
        "runCount": 260,
        "keepDrawing": true,
        "scrollTop": 902,
        "autoRefresh": true
    },
    {
        "id": "1684e1e1-90a1-4bc3-a665-dfa3725bb98e",
        "title": "refactored sound visualizer",
        "code": "import { getVolume } from 'mic-module';\nimport { SoundVisualizer } from 'sound-visualizer';\n\nlet soundvis;\n\nfunction setup() {\n  createCanvas(420, 100);\n  soundvis = new SoundVisualizer();\n}\n\nfunction draw() {\n  background(255);\n  let soundLevel = getVolume();\n  soundvis.drawSound(soundLevel);\n}\n",
        "isRunning": true,
        "runCount": 30,
        "editorPosition": {
            "x": 775.6484375,
            "y": 7.7265625,
            "w": 500,
            "h": 300
        },
        "previewPosition": {
            "x": 838.01953125,
            "y": 531.4375,
            "w": 500,
            "h": 600
        },
        "keepDrawing": false,
        "scrollTop": 0,
        "minimized": true
    },
    {
        "id": "f0f5562d-2b5b-4db5-a036-291f6e09348c",
        "title": "webcam",
        "code": "import { startWebcam, drawWebcam, isWebcamReady, listCameras } from 'webcam';\n\nfunction setup() {\n  createCanvas(640, 480);\n  startWebcam();                    // use { facingMode: 'environment' } for the back camera\n}\n\nfunction draw() {\n  background(30);\n  if (!isWebcamReady()) {\n    fill(255);\n    text('waiting for camera…', 20, 30);\n    return;\n  }\n  drawWebcam(0, 0, width, height);\n  //listCameras().then(console.log)\n}",
        "isRunning": true,
        "runCount": 13,
        "editorPosition": {
            "x": 25.63671875,
            "y": 555.55078125,
            "w": 500,
            "h": 300
        },
        "previewPosition": {
            "x": 211.421875,
            "y": 69.41796875,
            "w": 500,
            "h": 600
        },
        "keepDrawing": false,
        "scrollTop": 110
    },
    {
        "id": "bf4a7a45-7beb-4ea0-84db-7b0d3e9b3172",
        "title": "color-picker",
        "code": "import { setColor, getColor } from 'palette-link';\n\nlet picker;\n\nfunction setup() {\n  createCanvas(200, 80);\n  picker = createColorPicker(getColor());\n  picker.position(20, 20);\n  picker.size(160, 40);\n  picker.input(() => setColor(picker.value()));\n}\n\nfunction draw() {\n  background(245);\n}",
        "isRunning": true,
        "runCount": 2,
        "editorPosition": {
            "x": 722.328125,
            "y": 46.56640625,
            "w": 500,
            "h": 300
        },
        "previewPosition": {
            "x": 587.33203125,
            "y": 691.50390625,
            "w": 500,
            "h": 600
        },
        "keepDrawing": false,
        "scrollTop": 0,
        "autoRefresh": false,
        "minimized": true
    }
]