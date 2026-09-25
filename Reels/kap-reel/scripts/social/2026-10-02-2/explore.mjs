import { chromium } from "playwright";
const base = "https://thrillers.ka-testing2.com";
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:1, isMobile:true, hasTouch:true });
const p = await c.newPage();
await p.goto(base+"/", {waitUntil:"networkidle"});
const links = await p.evaluate(()=>[...new Set([...document.querySelectorAll("a")].map(a=>a.getAttribute("href")))]);
console.log(links);
for (const r of ["/","/experiences","/pricing","/book","/about","/faq","/contact"]) {
  const resp = await p.goto(base+r,{waitUntil:"networkidle"}).catch(e=>null);
  console.log("\n=====",r, resp&&resp.status());
  const t = await p.evaluate(()=>{const out=[];document.querySelectorAll("h1,h2,h3,label,button,summary").forEach(e=>out.push(e.tagName+": "+e.textContent.replace(/\s+/g," ").trim().slice(0,100)));return out.join("\n")+"\nH="+document.documentElement.scrollHeight});
  console.log(t);
}
await b.close();
