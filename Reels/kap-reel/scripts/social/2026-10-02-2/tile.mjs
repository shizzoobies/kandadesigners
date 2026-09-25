import sharp from "sharp";
const dir = process.argv[2];
for (const s of ["home","experiences","pricing","book","about"]) {
  const f = `${dir}/full-${s}.png`;
  const m = await sharp(f).metadata();
  const H=1800, cols=Math.ceil(m.height/H);
  const comps=[];
  for(let i=0;i<cols;i++){
    const h=Math.min(H,m.height-i*H);
    comps.push({input: await sharp(f).extract({left:0,top:i*H,width:m.width,height:h}).toBuffer(), left:i*(m.width+12), top:0});
  }
  await sharp({create:{width:cols*(m.width+12),height:H,channels:3,background:"#888"}}).composite(comps).png().toFile(`${dir}/sheet-${s}.png`);
  console.log(s,m.width,m.height,cols);
}
