/* Cálculos de tiempo: "abierto ahora", próximo bus, salida/puesta de sol (modo día/noche).
   Depende de: TZ (app.js), T (textos.js), BUS (datos/buses.json, cargado por app.js). */

/* ======================= TIME HELPERS ======================= */
function nowCL(){
  const parts = new Intl.DateTimeFormat("en-GB",{timeZone:TZ,weekday:"short",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  const g = t=>parts.find(p=>p.type===t).value;
  const wd = {Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7}[g("weekday")];
  const hh = parseInt(g("hour"),10)%24, mm = parseInt(g("minute"),10);
  return {wd, min:hh*60+mm, hh, mm};
}
const toMin = s=>{const [h,m]=s.split(":").map(Number);return h*60+m;};
function isOpen(p,n=nowCL()){
  if(p.closed || p.seasonal || !p.h) return null;
  return p.h.some(([a,b,s,e])=> n.wd>=a && n.wd<=b && n.min>=toMin(s) && n.min<toMin(e));
}
function fmtDays(a,b,L){ const d=T[L].days; return a===b? d[a-1] : `${d[a-1]}–${d[b-1]}`; }
function fmtHours(p,L){ if(!p.h) return null; return p.h.map(([a,b,s,e])=>`${fmtDays(a,b,L)} ${s}–${e}`).join(" · "); }
const money = n=> "$"+n.toLocaleString("es-CL");
function fmtPrice(p,L){
  if(p.price===undefined) return null;
  if(p.price===0) return T[L].free;
  return `${money(p.price)}${p.pn?` <small>${T[L][p.pn]||""}</small>`:""}`;
}
function busNext(key,n=nowCL()){
  let list;
  if(key==="huife") list = n.wd===7 ? BUS.huife.su : BUS.huife.wk;
  else list = BUS.huerquehue.days.includes(n.wd) ? BUS.huerquehue.t : [];
  const next = list.find(t=>toMin(t)>n.min);
  return {list,next};
}

/* ======================= DAY / NIGHT ======================= */
// Sunrise/sunset for Pucón (NOAA approximation), returned in minutes of Santiago local time.
const LAT=-39.28, LON=-71.95;
function sunTimes(date=new Date()){
  const rad=Math.PI/180, start=Date.UTC(date.getUTCFullYear(),0,0), doy=Math.floor((date-start)/864e5);
  const g=2*Math.PI/365*(doy-1);
  const eqt=229.18*(0.000075+0.001868*Math.cos(g)-0.032077*Math.sin(g)-0.014615*Math.cos(2*g)-0.040849*Math.sin(2*g));
  const dec=0.006918-0.399912*Math.cos(g)+0.070257*Math.sin(g)-0.006758*Math.cos(2*g)+0.000907*Math.sin(2*g)-0.002697*Math.cos(3*g)+0.00148*Math.sin(3*g);
  const ha=Math.acos(Math.cos(90.833*rad)/(Math.cos(LAT*rad)*Math.cos(dec))-Math.tan(LAT*rad)*Math.tan(dec))/rad;
  const riseUTC=720-4*(LON+ha)-eqt, setUTC=720-4*(LON-ha)-eqt;
  // Santiago UTC offset (handles DST) from Intl
  const p=new Intl.DateTimeFormat("en-US",{timeZone:TZ,timeZoneName:"shortOffset"}).formatToParts(date).find(x=>x.type==="timeZoneName").value;
  const m=p.match(/GMT([+-]\d+)(?::(\d+))?/); const off=m?(parseInt(m[1],10)*60+(m[2]?Math.sign(parseInt(m[1],10))*parseInt(m[2],10):0)):-180;
  const wrap=x=>((x%1440)+1440)%1440;
  return {rise:wrap(riseUTC+off), set:wrap(setUTC+off)};
}
const hm=m=>`${String(Math.floor(m/60)).padStart(2,"0")}:${String(Math.round(m%60)).padStart(2,"0")}`;
let dayMode="auto";
function isNight(){ if(dayMode!=="auto") return dayMode==="night"; const s=sunTimes(), n=nowCL().min; return n<s.rise || n>=s.set; }
function applyDayMode(){
  const night=isNight(); document.querySelectorAll(".screen").forEach(el=>el.classList.toggle("night",night));
  const s=sunTimes(); const info=document.getElementById("dm-info");
  if(info) info.textContent=dayMode==="auto"?`☀ ${hm(s.rise)} · ☾ ${hm(s.set)}`:"";
}
