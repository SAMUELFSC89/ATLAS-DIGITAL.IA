import sharp from 'sharp';
import { CAMERA_COLUMNS, CAMERA_ROWS } from '../../src/lib/siteBuilder.js';
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 288;
const FRAME_COUNT = CAMERA_COLUMNS * CAMERA_ROWS;
const MAX_BYTES = 750 * 1024;

/** Render a camera pullback from one photograph, keeping the subject consistent. */
export async function renderCameraSequence(photo:Buffer) {
  const base=await sharp(photo,{limitInputPixels:36_000_000}).rotate()
    .resize(1152,648,{fit:'cover',position:'attention'}).removeAlpha().toBuffer();
  const rows:Buffer[]=[];
  for(let row=0;row<CAMERA_ROWS;row++){
    const frames=await Promise.all(Array.from({length:CAMERA_COLUMNS},async(_,column)=>{
      const t=(row*CAMERA_COLUMNS+column)/(FRAME_COUNT-1);
      const progress=t*t*(3-2*t);
      const scale=1.43-.43*progress;
      const width=Math.round(1152/scale);
      const height=Math.round(648/scale);
      const frame=await sharp(base).extract({
        left:Math.round((1152-width)*.74),top:Math.round((648-height)*.44),width,height,
      }).resize(FRAME_WIDTH,FRAME_HEIGHT,{fit:'fill'})
        .modulate({brightness:.8+.2*progress}).png().toBuffer();
      return {input:frame,left:column*FRAME_WIDTH,top:0};
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
