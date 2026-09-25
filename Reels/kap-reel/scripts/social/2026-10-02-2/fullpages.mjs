import { chromium } from "playwright";
const base = "https://thrillers.ka-testing2.com";
const out = process.argv[2];
const dsf = Number(process.argv[3]||1);
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:dsf, isMobile:true, hasTouch:true,
 userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1" });
const p = await c.newPage();
for (const [r,slug] of [["/","home"],["/experiences","experiences"],["/pricing","pricing"],["/book","book"],["/about","about"]]) {
  await p.goto(base+r,{waitUntil:"networkidle"});
  await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,150));}});
  await p.waitForTimeout(2000); await p.evaluate(()=>scrollTo(0,0)); await p.waitForTimeout(500);
  await p.screenshot({path:`${out}/full-${slug}.png`, fullPage:true});
  console.log(slug);
}
await b.close();
