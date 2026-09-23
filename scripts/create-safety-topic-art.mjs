// Editable SVG inspection details. Captions live in HTML, not in the artwork.
import { writeFile } from 'node:fs/promises';
const folder = new URL('../public/training-samples/safety/assets/img/', import.meta.url);
const drawings = {
  '4a': `<path class="structure" d="M90 330H550M360 330V140H555M360 156H555"/><path class="muted" d="M385 165V330M475 165V330"/>
    <path class="gold heavy" d="M294 328 365 44M314 333 385 49"/><path class="gold" d="M300 306 320 311M306 282 326 287M312 258 332 263M318 234 338 239M324 210 344 215M330 186 350 191M336 162 356 167M342 138 362 143M348 114 368 119M354 90 374 95M360 66 380 71"/>
    <path class="guide" d="M268 330V140H360M400 44H440M400 140H440M430 44V140M294 357H360"/><path class="gold" d="M425 51 430 44 435 51M425 133 430 140 435 133M348 140H385"/>
    <circle class="point" cx="354" cy="140" r="6"/><circle class="point" cx="304" cy="330" r="6"/>`,
  '4b': `<path class="muted" d="M75 350H575M100 368H545"/><path class="structure heavy" d="M100 320H180V282H260V244H340V206H420V168H540"/>
    <path class="gold heavy" d="M145 199 465 47"/><path class="gold" d="M180 282V182M260 244V144M340 206V106M420 168V68"/>
    <path class="blue" d="M193 330 273 292 353 254 433 216 506 216M491 206 506 216 491 226"/><path class="guide" d="M180 300H231M260 262H311M340 224H391M420 186H471"/>`,
  '4c': `<path class="structure" d="M105 314V58H532V314M263 314V116H404V314"/><path class="muted" d="M85 315H558M404 116 457 139V308L404 314"/>
    <rect class="gold" x="288" y="68" width="92" height="28" rx="3"/><path class="gold" d="M310 82H355M347 75 355 82 347 89"/>
    <path class="blue heavy" d="M333 357V176M320 193 333 176 346 193"/><path class="guide" d="M230 350V195M435 350V325"/><path class="muted" d="M128 310V245H198V310M143 245V213H181V245"/><circle class="point" cx="333" cy="313" r="6"/>`,
  '5a': `<path class="structure" d="M80 281 439 211 570 258 211 335Z"/><path class="muted" d="M80 281V312L211 367 570 290V258M211 335V367"/>
    <path class="gold heavy" d="M96 270V122M209 314V166M365 284V136M548 248V100M96 122 209 166 548 100"/>
    <path class="gold" d="M96 194 209 238 548 172M96 256 209 300 548 234"/><path class="guide" d="M132 110 201 137M378 113 510 87"/>
    <circle class="point" cx="365" cy="136" r="6"/><circle class="point" cx="365" cy="202" r="6"/><circle class="point" cx="365" cy="264" r="6"/>`,
  '5b': `<path class="muted" d="M75 300H565M190 338 307 93M345 355 448 126"/><path class="blue" d="M239 292 310 148M296 156 310 148 312 164"/>
    <path class="structure" d="M90 267V81H168V267M104 97H154V161H104ZM114 181H144"/><path class="gold heavy" d="M135 195V219Q135 232 151 232L215 229M412 267H460Q480 267 480 250V241Q480 232 489 232"/>
    <path class="structure" d="M206 243 225 215 422 253 403 281ZM206 243V254L403 292 403 281M403 281 422 253V264L403 292"/><path class="gold" stroke-dasharray="7 7" d="M215 229 412 267"/>
    <path class="gold" d="M489 232V214H518V246H489M518 221H530M518 239H530"/>`,
  '5c': `<rect class="structure" x="194" y="54" width="220" height="282" rx="9"/><path class="muted" d="M212 72H396V317H212Z"/><path class="structure heavy" d="M261 117H348M305 117 330 157"/>
    <rect class="gold" x="275" y="174" width="74" height="83" rx="8"/><path class="gold heavy" d="M292 174V156a20 20 0 0 1 40 0V174"/><circle class="point" cx="312" cy="207" r="6"/><path class="gold" d="M312 213V230"/>
    <path class="blue" d="M352 170 371 148 405 177 405 245 352 245ZM368 181H390M368 194H390M368 207H384"/><circle class="blue" cx="374" cy="164" r="4"/>
    <path class="guide" d="M134 128H173M134 181H173M134 234H173M134 287H173"/>`,
  '6a': `<path class="muted" d="M83 323H559M160 356 265 81M365 356 457 111"/><path class="blue heavy" d="M278 323 344 137M330 148 344 137 346 155"/>
    <path class="structure" d="M93 153H208L194 294H110ZM85 141H217V153H85ZM120 132V120H183V132"/><path class="muted" d="M134 177V263M166 177V263"/>
    <path class="gold" d="M440 240 500 224 532 246 472 262ZM456 274 516 258 537 273 477 289ZM432 300 492 284 523 306 463 322Z"/>
    <path class="guide" d="M210 307Q230 314 246 309M462 170Q450 182 447 203"/>`,
  '6b': `<path class="muted" d="M73 323H558M89 345H548"/><path class="structure" d="M122 278 360 223 519 270 281 325ZM122 278V294L281 342 519 287V270M281 325V342"/>
    <path class="structure" d="M139 254 359 203 496 244 277 295ZM139 232 359 181 496 222 277 273ZM139 210 359 159 496 200 277 251ZM139 188 359 137 496 178 277 229Z"/>
    <path class="gold heavy" d="M202 172 340 213V281M304 149 442 193V257"/><path class="gold" d="M120 304 143 299 161 312 138 319ZM471 295 494 288 512 303 489 310Z"/>
    <path class="guide" d="M109 119 351 64 527 116M535 139V227"/>`,
  '6c': `<path class="structure" d="M242 169V205Q246 262 320 279Q394 262 398 205V169M279 267V291M361 267V291M200 355V333Q211 302 279 291L320 321 361 291Q429 302 440 333V355"/>
    <path class="gold heavy" d="M223 160H417M240 156Q240 67 301 63M339 63Q400 67 400 156M302 138V56H338V138"/>
    <path class="blue" d="M250 186H310V216H263L250 203ZM330 186H390V203L377 216H330ZM310 193H330M241 187H250M390 187H399"/>
    <path class="gold" d="M257 302 279 355M383 302 361 355M215 335H270M371 335H426"/><path class="muted" d="M298 242Q320 250 342 242"/>
    <circle class="point" cx="428" cy="109" r="5"/><path class="guide" d="M438 109H510M420 202H510M458 326H510"/>`
};
for (const [id, drawing] of Object.entries(drawings)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400" width="640" height="400">
  <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#293637" stroke-width="1"/></pattern><radialGradient id="light"><stop stop-color="#2d3b3a"/><stop offset="1" stop-color="#152020"/></radialGradient></defs>
  <style>path,rect,circle{stroke-linecap:round;stroke-linejoin:round}.structure{fill:none;stroke:#d4dbd4;stroke-width:2.5}.muted{fill:none;stroke:#657873;stroke-width:2}.gold{fill:none;stroke:#edca70;stroke-width:3}.blue{fill:none;stroke:#9dc7c4;stroke-width:3}.guide{fill:none;stroke:#82978d;stroke-width:1.5;stroke-dasharray:5 7}.heavy{stroke-width:5}.point{fill:#edca70;stroke:#152020;stroke-width:3}</style>
  <path fill="url(#light)" d="M0 0H640V400H0Z"/><path fill="url(#grid)" opacity=".5" d="M0 0H640V400H0Z"/>
  <g>${drawing}</g><path d="M22 42V22H42M598 22H618V42M22 358V378H42M598 378H618V358" fill="none" stroke="#64796e"/>
  </svg>`;
  await writeFile(new URL(`topic-${id}.svg`, folder), svg);
}
console.log(`Created ${Object.keys(drawings).length} SVG inspection details.`);
