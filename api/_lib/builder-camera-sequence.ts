import sharp from 'sharp';
import { CAMERA_COLUMNS, CAMERA_ROWS } from '../../src/lib/siteBuilder.js';
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 288;
const FRAME_COUNT = CAMERA_COLUMNS * CAMERA_ROWS;
const MAX_BYTES = 750 * 1024;
const CATCH_FRAME=12;
const FRAME_BASE={width:1152,height:648} as const;

function fitPhoto(photo:Buffer){
  return sharp(photo,{limitInputPixels:36_000_000}).rotate()
    .resize(FRAME_BASE.width,FRAME_BASE.height,{fit:'cover',position:'attention'}).removeAlpha().toBuffer();
}

function lightningAtCatch(strength:number){
  return Buffer.from(`<svg width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" viewBox="0 0 512 288">
    <defs><filter id="halo"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${strength}">
      <path d="M488 -5l-48 42 19 9-44 23 9 10-39 21 9 9-44 22m72-51 32 11-19 11 23 8m-76-6-23-9 9-11-30-10m31 53-24 18 12 5-14 13"
        stroke="#eb9360" stroke-width="9" filter="url(#halo)"/>
      <path d="M488 -5l-48 42 19 9-44 23 9 10-39 21 9 9-44 22" stroke="#fff3db" stroke-width="2.1"/>
      <path d="M422 80l32 11-19 11 23 8m-76-6-23-9 9-11-30-10m31 53-24 18 12 5-14 13" stroke="#ffd2a1" stroke-width="1.15"/>
    </g></svg>`);
}

export async function renderCameraSequence(photo:Buffer,options:{action?:Buffer;lightning?:boolean}={}) {
  const [base,action]=await Promise.all([fitPhoto(photo),options.action?fitPhoto(options.action):null]);
  const rows:Buffer[]=[];
  for(let row=0;row<CAMERA_ROWS;row++){
    const frames=await Promise.all(Array.from({length:CAMERA_COLUMNS},async(_,column)=>{
      const index=row*CAMERA_COLUMNS+column;
      const t=index/(FRAME_COUNT-1);
      const progress=t*t*(3-2*t);
      const scale=1.43-.43*progress;
      const width=Math.round(FRAME_BASE.width/scale);
      const height=Math.round(FRAME_BASE.height/scale);
      const pose=index>=CATCH_FRAME&&action?action:base;
      const frame=sharp(pose).extract({
        left:Math.round((FRAME_BASE.width-width)*.74),top:Math.round((FRAME_BASE.height-height)*.44),width,height,
      }).resize(FRAME_WIDTH,FRAME_HEIGHT,{fit:'fill'})
        .modulate({brightness:.8+.2*progress});
      if(options.lightning&&index>=CATCH_FRAME&&index<=CATCH_FRAME+2){
        frame.composite([{input:lightningAtCatch([.94,.57,.28][index-CATCH_FRAME])}]);
      }
      return {input:await frame.png().toBuffer(),left:column*FRAME_WIDTH,top:0};
    }));
    rows.push(await sharp({create:{width:CAMERA_COLUMNS*FRAME_WIDTH,height:FRAME_HEIGHT,channels:3,background:'#000'}})
      .composite(frames).png().toBuffer());
  }
  const sprite=sharp({create:{width:CAMERA_COLUMNS*FRAME_WIDTH,height:CAMERA_ROWS*FRAME_HEIGHT,channels:3,background:'#000'}})
    .composite(rows.map((input,row)=>({input,left:0,top:row*FRAME_HEIGHT})));
  for(const quality of [76,60,43]){
    const bytes=await sprite.clone().webp({quality,effort:3}).toBuffer();
    if(bytes.length<=MAX_BYTES)return bytes;
  }
  throw new Error('A sequência excede o tamanho permitido.');
}
