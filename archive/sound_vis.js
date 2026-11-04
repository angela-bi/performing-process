import { getVolume } from 'mic-module';

let volHistoryLength = 400;
let volHistory = [];

export class SoundVisualizer {
  constructor(){
    this.x = 10;
    this.y = 10;
    this.width = volHistoryLength;
    this.height = 80;

    this.soundbarWidth = 1; 
  }

  drawSound(soundLevel){
    volHistory.push(soundLevel);
  if (volHistory.length > volHistoryLength) {
    volHistory.shift(); // remove oldest value
  }
    
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

  