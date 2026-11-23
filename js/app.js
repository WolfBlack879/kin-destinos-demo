/* App principal: configuración, íconos, mapa, pantallas (tótem/teléfono), navegación e inicio.
   Orden de carga en index.html: textos.js, tiempo.js, panel.js, analitica.js, app.js */

/* ======================= CONFIG ======================= */
// URL pública del artifact (para que el QR abra la ficha en el teléfono del turista).
const SHARE_URL = "";   // vacío = el QR usa la dirección donde esté publicada la página (GitHub Pages, subdominio, etc.)
const TZ = "America/Santiago";

/* ======================= CATEGORIES ======================= */
const ICON = {
  termas:'<path d="M5 20h14M7 16c0-2 2-2 2-4s-2-2-2-4M12 16c0-2 2-2 2-4s-2-2-2-4M17 16c0-2 2-2 2-4s-2-2-2-4"/>',
  naturaleza:'<path d="M4 4v16M4 4c3 0 3 3 6 3s3-3 6-3v8c-3 0-3 3-6 3s-3-3-6-3"/><path d="M14 18c1 1 2 2 4 2" />',
  parques:'<path d="M12 3l5 8h-3l4 6H6l4-6H7z"/><path d="M12 17v4"/>',
  aventura:'<path d="M3 6l18 4"/><path d="M12 8v5"/><circle cx="12" cy="15" r="2"/><path d="M10 19l2-2 2 2"/>',
  familia:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-6 5-6s5 2 5 6M13 20c0-3 2-5 4-5s4 2 4 5"/>',
  lago:'<path d="M3 16c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0"/><path d="M6 13h12l-2-4H8z"/><path d="M12 9V4l4 3"/>',
  cultura:'<path d="M4 20h16M6 20V10M18 20V10M12 20V10M3 10l9-6 9 6z"/>',
  bici:'<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/><path d="M6 16l4-8h5l3 8M10 8l2 8"/>',
  transporte:'<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M7 20l1-3M17 20l-1-3"/><circle cx="8" cy="14" r=".5"/><circle cx="16" cy="14" r=".5"/>',
  mapa:'<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  servicios:'<circle cx="12" cy="12" r="8"/><path d="M12 7v10M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.6-.6-3-1.5"/>'
};
const svgIcon = (id,s=26)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[id]}</svg>`;

/* ======================= STORE (demo merchant edits + analytics) ======================= */
const store = {
  get(k,def){ try{ const v=localStorage.getItem("pucon-proto-"+k); return v?JSON.parse(v):def; }catch(e){ return def; } },
  set(k,v){ try{ localStorage.setItem("pucon-proto-"+k,JSON.stringify(v)); }catch(e){} }
};
let EVENTS = store.get("events",[]);
const edits = store.get("edits",{});
function track(type,data){ EVENTS.push(Object.assign({type,at:Date.now(),sim:false},data||{})); if(EVENTS.length>5000) EVENTS=EVENTS.slice(-5000); store.set("events",EVENTS); }
const esc = s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const telHref = t=>"tel:"+t.replace(/[^\d+]/g,"");

/* ======================= MAP ======================= */
const ROADS = {  // unit direction (screen coords) + label
  villarrica:{dx:-.97,dy:.25,l:"Villarrica"}, volcan:{dx:-.12,dy:.99,l:"Volcán"},
  caburgua:{dx:.22,dy:-.97,l:"Caburgua"}, huife:{dx:.9,dy:-.44,l:"Huife"}, curarrehue:{dx:.95,dy:.3,l:"Curarrehue"}
};
const MC = {x:190,y:205}, SC = 4.6;
function mapPos(p){ if(!p.road) return null; if(p.road==="town") return {x:MC.x,y:MC.y};
  const r=ROADS[p.road]; return {x:MC.x+r.dx*p.km*SC, y:MC.y+r.dy*p.km*SC}; }
function mapSVG(focus,L){
  const fp = mapPos(focus);
  const roads = Object.entries(ROADS).map(([k,r])=>{
    const len = 40*SC; const x2=MC.x+r.dx*len, y2=MC.y+r.dy*len;
    return `<line x1="${MC.x}" y1="${MC.y}" x2="${x2}" y2="${y2}" style="stroke:var(--map-road)" stroke-width="3" stroke-linecap="round"/>
      <text x="${MC.x+r.dx*(len*0.72)+(r.dx>0?6:-6)}" y="${MC.y+r.dy*(len*0.72)-6}" style="fill:var(--map-label)" font-size="10.5" text-anchor="${r.dx>0.2?'start':(r.dx<-0.2?'end':'middle')}" font-family="Plus Jakarta Sans, sans-serif">${r.l}</text>`;
  }).join("");
  const others = PLACES.filter(p=>p!==focus && p.road && p.road!=="town").map(p=>{const q=mapPos(p);
    return `<circle cx="${q.x}" cy="${q.y}" r="3" fill="${catById[p.cat].c}" opacity=".45"/>`;}).join("");
  const vx = MC.x-14, vy = MC.y+15*SC*1.0+6;
  return `<svg viewBox="0 0 380 340" role="img" aria-label="${esc(T[L].map)}">
    <path d="M0 150 C 40 130, 110 150, 150 185 C 165 200, 160 240, 120 250 C 70 262, 20 245, 0 240 Z" style="fill:var(--map-water)"/>
    <text x="40" y="205" style="fill:var(--map-water-label)" font-size="11" font-family="Plus Jakarta Sans, sans-serif">Lago Villarrica</text>
    <ellipse cx="${MC.x+ROADS.caburgua.dx*27*SC+16}" cy="${MC.y+ROADS.caburgua.dy*27*SC-8}" rx="16" ry="22" style="fill:var(--map-water)"/>
    <path d="M${vx-22} ${vy+14} L${vx} ${vy-14} L${vx+22} ${vy+14} Z" style="fill:var(--map-volc)" stroke="#FF881B" stroke-width="1.2"/>
    <text x="${vx+28}" y="${vy+10}" style="fill:var(--map-volc-label)" font-size="10" font-family="Plus Jakarta Sans, sans-serif">Volcán Villarrica</text>
    ${roads}${others}
    <circle cx="${MC.x}" cy="${MC.y}" r="6" style="fill:var(--map-town)"/><text x="${MC.x-10}" y="${MC.y-10}" style="fill:var(--map-town)" font-size="12" font-weight="700" text-anchor="end" font-family="Plus Jakarta Sans, sans-serif">Pucón</text>
    ${fp?`<circle cx="${fp.x}" cy="${fp.y}" r="13" fill="${catById[focus.cat].c}" opacity=".25"><animate attributeName="r" values="9;16;9" dur="2s" repeatCount="indefinite"/></circle>
      <circle cx="${fp.x}" cy="${fp.y}" r="6.5" fill="${catById[focus.cat].c}" style="stroke:var(--basalt)" stroke-width="2"/>`:""}
  </svg>`;
}

/* ======================= APP (one instance per screen) ======================= */
class App{
  constructor(el,mode){ this.el=el; this.mode=mode; this.L="es"; this.view={name:mode==="totem"?"idle":"home"}; this.filters={open:false,pets:false,coupon:false}; this.q=""; this.mapCat="all";
    this.idleTimer=null; this.render(); if(mode==="totem") this.armIdle(); }
  armIdle(){ clearTimeout(this.idleTimer); this.idleTimer=setTimeout(()=>{ this.L="es"; this.go({name:"idle"}); },90000); }
  go(v){ this.view=v; this.render(); const s=this.el.querySelector(".scroll"); if(s) s.scrollTop=0; }
  setLang(L){ this.L=L; track("lang",{lang:L,src:this.mode}); this.render(); }
  t(k){ return T[this.L][k]; }
  render(){
    const L=this.L, v=this.view;
    if(this.lmap){ this.lmap.remove(); this.lmap=null; this.capaMarcadores=null; }
    if(v.name==="idle"){ this.el.innerHTML = this.idleHTML(); this.bind(); this.rotate(); return; }
    const n = nowCL();
    const dateStr = new Intl.DateTimeFormat({es:"es-CL",en:"en-GB",pt:"pt-BR"}[L],{timeZone:TZ,weekday:"long",day:"numeric",month:"long"}).format(new Date());
    let body="";
    if(v.name==="home") body=this.homeHTML(n);
    else if(v.name==="list") body=this.listHTML(n);
    else if(v.name==="place") body=this.placeHTML(n);
    else if(v.name==="map") body=this.mapHTML();
    else if(v.name==="clima") body=climaVistaHTML(this);
    this.el.innerHTML = `<div class="app app-${this.mode}">
      <div class="top"><div class="place"><h1>${this.t("place")}</h1><span>${this.t("sub")}</span></div>
        <div class="clock"><b class="num">${String(n.hh).padStart(2,"0")}:${String(n.mm).padStart(2,"0")}</b><span>${esc(dateStr)}</span></div></div>
      <div class="langs" role="group" aria-label="Idioma / Language">
        ${["es","en","pt"].map(x=>`<button data-lang="${x}" aria-pressed="${x===L}">${{es:"Español",en:"English",pt:"Português"}[x]}</button>`).join("")}
      </div>
      <div class="scroll">${body}</div>
      <div class="foot"><span>Prototipo · datos de muestra</span><span>by <b>KIN</b> Outdoor</span></div>
    </div>`;
    this.bind();
  }
  idleHTML(){
    return `<button class="idle" data-act="wake" aria-label="Comenzar">
      ${svgIcon("parques",56)}
      <h2>Pucón</h2>
      <div class="rot" id="rot-${this.mode}">Bienvenido · Welcome · Bem-vindo</div>
      <span class="tap">Toca para comenzar · Tap to start</span>
      <span class="brandmark" aria-label="KIN Destinos"><b>KIN</b> Destinos</span>
    </button>`;
  }
  rotate(){
    const msgs=["Termas, saltos y volcanes","Hot springs, waterfalls & volcanoes","Termas, cachoeiras e vulcões","Horarios de buses en vivo","Live bus times"];
    let i=0; clearInterval(this.rotT);
    this.rotT=setInterval(()=>{ const r=this.el.querySelector(".rot"); if(!r){clearInterval(this.rotT);return;} r.textContent=msgs[i++%msgs.length]; },2600);
  }
  homeHTML(n){
    const L=this.L, hf=busNext("huife",n), hq=busNext("huerquehue",n);
    const count=c=>PLACES.filter(p=>p.cat===c).length;
    return `
      <label class="search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="q-${this.mode}" type="search" placeholder="${esc(this.t("search"))}" value="${esc(this.q)}" aria-label="${esc(this.t("search"))}"></label>
      <div class="sectionlabel">${this.t("now")}</div>
      ${climaTarjetaHTML(this)}
      <div class="quick">
        <button class="qcard" data-place="bushuife"><span class="k">${this.t("nextHuife")}</span><span class="v num">${hf.next||"—"}</span><span class="s">${hf.next?"Terminal Pullman · Palguín 555":this.t("none")}</span></button>
        <button class="qcard" data-place="busherq"><span class="k">${this.t("nextHuer")}</span><span class="v num">${hq.next||"—"}</span><span class="s">${hq.next?"Terminal Caburgua · Uruguay 540":this.t("none")}</span></button>
      </div>
      <button class="mapcard" data-act="map">${svgIcon("mapa",28)}<span><b>${this.t("mapBtn")}</b><small>${this.t("mapSub")}</small></span><span aria-hidden="true">›</span></button>
      <div class="sectionlabel">${this.t("explore")}</div>
      <div class="cats">${CATS.map(c=>`<button class="cat" data-cat="${c.id}" style="--c:${c.c}">${svgIcon(c.id)}<b>${c.n[L]}</b><small class="num">${count(c.id)}</small></button>`).join("")}</div>
      <div class="sectionlabel">${this.t("emerg")}</div>
      <div class="emerg"><div><b>131</b><span>${this.t("amb")}</span></div><div><b>132</b><span>${this.t("fire")}</span></div><div><b>133</b><span>${this.t("police")}</span></div></div>`;
  }
  filtered(n){
    const L=this.L, q=this.q.trim().toLowerCase();
    return PLACES.filter(p=>{
      if(this.view.cat && p.cat!==this.view.cat) return false;
      if(q && !(p.n+" "+p.d[L]+" "+p.d.es+" "+(p.addr||"")).toLowerCase().includes(q)) return false;
      if(this.filters.open && isOpen(p,n)!==true) return false;
      if(this.filters.pets && !p.pets) return false;
      if(this.filters.coupon && !p.coupon) return false;
      return true;
    }).sort((a,b)=>(b.partner?1:0)-(a.partner?1:0) || (isOpen(b,n)?1:0)-(isOpen(a,n)?1:0));
  }
  pills(p,n){
    const o=isOpen(p,n), out=[];
    if(p.closed) out.push(`<span class="pill closed">${this.t("tempClosed")}</span>`);
    else if(o===true) out.push(`<span class="pill open">${this.t("open")}</span>`);
    else if(o===false) out.push(`<span class="pill closed">${this.t("closed")}</span>`);
    if(p.pets) out.push(`<span class="pill pet">${this.t("pets")}</span>`);
    if(p.coupon) out.push(`<span class="pill coupon">${this.t("coupon")}</span>`);
    if(p.road && p.road!=="town") out.push(`<span class="pill num">${String(p.km).replace(".",",")} km</span>`);
    return out.join("");
  }
  listHTML(n){
    const L=this.L, cat=this.view.cat?catById[this.view.cat]:null, items=this.filtered(n);
    const chip=(k)=>`<button class="chip" data-filter="${k}" aria-pressed="${this.filters[k]}">${this.t({open:"filterOpen",pets:"filterPets",coupon:"filterCoupon"}[k])}</button>`;
    return `<button class="back" data-act="home">‹ ${this.t("back")}</button>
      <h2 style="font-size:26px">${cat?cat.n[L]:"“"+esc(this.q)+"”"}</h2>
      <div class="chips">${chip("open")}${chip("pets")}${chip("coupon")}</div>
      <div class="sectionlabel num">${items.length} ${this.t("results")}</div>
      <div class="list">${items.length? items.map(p=>`<button class="item" data-place="${p.id}" style="--c:${catById[p.cat].c}">
          <h3>${esc(p.n)}</h3><span class="price num">${p.price!==undefined?(p.price===0?this.t("free"):(p.pn&&p.pn!=="adult"&&p.pn!=="perPerson"&&p.pn!=="card"?"":this.t("from")+" ")+money(p.price)):""}</span>
          <p>${esc(p.d[L])}</p><div class="meta">${this.pills(p,n)}</div></button>`).join("") : `<div class="empty">${this.t("noRes")}</div>`}</div>`;
  }
  placeHTML(n){
    const L=this.L, p=PLACES.find(x=>x.id===this.view.id); if(!p) return "";
    const c=catById[p.cat];
    const pay = (p.pay||[]).map(k=>this.t(k)).join(", ");
    const fact=(k,v)=>v?`<div class="fact"><dt>${this.t(k)}</dt><dd>${v}</dd></div>`:"";
    let bus="";
    if(p.bus){ const b=busNext(p.bus,n);
      bus=`<div class="sectionlabel">${this.t("busTitle")}</div><div class="times num">${b.list.length?b.list.map(t=>`<span class="${t===b.next?"next":(toMin(t)<=n.min?"past":"")}">${t}</span>`).join(""):`<span>${this.t("none")}</span>`}</div>`; }
    const coupon = p.coupon?`<div class="couponbox"><div><span class="pill coupon">${this.t("coupon")}</span><b>${esc(p.coupon.t[L])}</b><span style="font-size:13px;color:var(--fog)">${this.t("couponShow")}: </span><code>${esc(p.coupon.code)}</code>${p.demoCoupon?`<small>${this.t("demoCoupon")}</small>`:""}</div></div>`:"";
    const qr = this.mode==="totem" ? `<div class="qrrow"><div class="qr" id="qr-${p.id}"></div><div><b>${this.t("qrTitle")}</b><p style="color:var(--fog)">${this.t("qrText")}</p><button data-act="scan" data-id="${p.id}">${this.t("simScan")}</button></div></div>` : "";
    const where = p.road==="town"?this.t("town"):(p.road?`${String(p.km).replace(".",",")} ${this.t("kmFrom")}`:"");
    return `<button class="back" data-act="${this.view.from==="home"?"home":"list"}">‹ ${this.t("back")}</button>
      <div class="detail">
        <div style="display:flex;gap:10px;align-items:center;color:${c.c}">${svgIcon(p.cat,22)}<span class="sectionlabel" style="color:${c.c}">${c.n[L]}</span></div>
        <h2>${esc(p.n)}</h2>
        <div class="chips">${this.pills(p,n)}</div>
        <p class="lead">${esc(p.d[L])}</p>
        ${coupon}
        ${bus}
        <dl class="facts" style="margin:0">
          ${fact("price",fmtPrice(p,L))}${fact("hours",fmtHours(p,L)?`<span class="num">${fmtHours(p,L)}</span>`:"")}
          ${fact("address",esc(p.addr||"")+(where?`<br><small style="color:var(--fog)">${where}</small>`:""))}
          ${fact("phone",p.tel?`<a href="${telHref(p.tel)}" style="color:var(--lake)">${esc(p.tel)}</a>`:"")}
          ${fact("web",p.web?`<a href="https://${esc(p.web)}" style="color:var(--lake)">${esc(p.web)}</a>`:"")}
          ${fact("pay",pay)}
        </dl>
        ${(conCoords(p)||p.road)?`<div class="map"><div class="lmap lmap-mini"></div><div class="mapcap">${this.t("mapReal")}${p.geo==="aprox"?" · "+this.t("approx"):""}</div></div>`:""}
        ${qr}
      </div>`;
  }
  bind(){
    const el=this.el;
    el.onclick = (e)=>{
      if(this.mode==="totem") this.armIdle();
      const b=e.target.closest("button"); if(!b) return;
      if(b.dataset.lang) return this.setLang(b.dataset.lang);
      if(b.dataset.act==="wake"){ track("session",{src:this.mode}); return this.go({name:"home"}); }
      if(b.dataset.act==="home"){ this.q=""; return this.go({name:"home"}); }
      if(b.dataset.act==="list") return this.go(this.view.prev||{name:"home"});
      if(b.dataset.act==="clima"){ track("clima",{lang:this.L,src:this.mode}); return this.go({name:"clima"}); }
      if(b.dataset.act==="map"){ track("map",{lang:this.L,src:this.mode}); return this.go({name:"map"}); }
      if(b.dataset.mapcat){ this.mapCat=b.dataset.mapcat; this.el.querySelectorAll("[data-mapcat]").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); return dibujarMarcadores(this,true); }
      if(b.dataset.act==="scan"){ track("qr",{id:b.dataset.id,lang:this.L,src:this.mode}); return window.openPhone(b.dataset.id,this.L); }
      if(b.dataset.cat){ track("cat",{cat:b.dataset.cat,lang:this.L,src:this.mode}); this.q=""; return this.go({name:"list",cat:b.dataset.cat}); }
      if(b.dataset.filter){ this.filters[b.dataset.filter]=!this.filters[b.dataset.filter]; return this.render(); }
      if(b.dataset.place) return this.abrirLugar(b.dataset.place);
    };
    const inp=el.querySelector("input[type=search]");
    if(inp) inp.onkeydown=(e)=>{ if(e.key==="Enter" && inp.value.trim()){ this.q=inp.value; track("search",{q:this.q.slice(0,40),lang:this.L,src:this.mode}); this.go({name:"list"}); } };
    const qrEl = el.querySelector(".qr");
    if(qrEl && window.QRCode){ const base=(SHARE_URL||location.href.split("#")[0]); new QRCode(qrEl,{text:base+"#p-"+this.view.id,width:200,height:200,correctLevel:QRCode.CorrectLevel.M}); }
    if(this.view.name==="place"){ const p=PLACES.find(x=>x.id===this.view.id); if(p) mapaFicha(this,p); }
    if(this.view.name==="map") mapaCompleto(this);
    if(this.lmap){
      // los popups de Leaflet no dejan pasar el clic: conectamos su botón directamente
      this.lmap.on("popupopen", e=>{ const pb=e.popup.getElement().querySelector("button[data-place]"); if(pb) pb.onclick=(ev)=>{ ev.stopPropagation(); if(this.mode==="totem") this.armIdle(); this.abrirLugar(pb.dataset.place); }; });
      if(this.mode==="totem") this.lmap.on("movestart zoomstart", ()=>this.armIdle());
    }
  }
  abrirLugar(id){
    const p=PLACES.find(x=>x.id===id); if(!p) return;
    track("view",{id:p.id,cat:p.cat,lang:this.L,src:this.mode});
    this.go({name:"place",id:p.id,from:this.view.name,prev:this.view});
  }
  mapHTML(){
    const L=this.L, chip=(id,label)=>`<button class="chip" data-mapcat="${id}" aria-pressed="${this.mapCat===id}">${label}</button>`;
    return `<button class="back" data-act="home">‹ ${this.t("back")}</button>
      <h2 style="font-size:26px">${this.t("mapBtn")}</h2>
      <div class="chips">${chip("all",this.t("all"))}${CATS.filter(c=>PLACES.some(p=>p.cat===c.id&&conCoords(p))).map(c=>chip(c.id,c.n[L])).join("")}</div>
      <p class="mapnote" hidden>${this.t("mapOffline")}</p>
      <div class="map mapfull"><div class="lmap lmap-full"></div><div class="mapcap">${this.t("mapReal")} · ${this.t("mapHint")}</div></div>`;
  }
}

/* ======================= STAGE ======================= */
const state={view:"totem",totem:null,phone:null,merchant:"kin"};
const body=document.getElementById("stagebody");
const notes={
  totem:`<div class="note"><span class="tag">Demo</span><b>Pantalla del tótem.</b>Toca la pantalla, cambia de idioma y abre una ficha. Los horarios marcan "abierto ahora" y el próximo bus según la hora real de Pucón.<span>Cada ficha tiene un QR para seguir en el teléfono: prueba "Simular escaneo".</span></div>`,
  phone:`<div class="note"><span class="tag">Demo</span><b>Teléfono del turista.</b>Lo que ve el visitante al escanear el QR: la misma ficha, el mapa y el cupón, en su idioma, sin instalar nada.</div>`
};
function showView(v){
  state.view=v; document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===v)));
  clearTimeout(state.totem&&state.totem.idleTimer);
  if(v==="totem"){ body.innerHTML=`<div class="totem"><div class="screen" id="scr-totem"></div></div>${notes.totem}`;
    const prev=state.totem; state.totem=new App(document.getElementById("scr-totem"),"totem");
    if(prev){ state.totem.L=prev.L; if(prev.view.name!=="idle"){state.totem.view=prev.view;} state.totem.render(); } }
  else if(v==="phone"){ body.innerHTML=`<div class="phone"><div class="screen" id="scr-phone"></div></div>${notes.phone}`;
    const prev=state.phone; state.phone=new App(document.getElementById("scr-phone"),"phone");
    if(prev){ state.phone.L=prev.L; state.phone.view=prev.view; state.phone.render(); } }
  else if(v==="merchant"){ body.innerHTML=merchantHTML(state.merchant); bindMerchant(body); }
  else if(v==="analytics"){ body.innerHTML=analyticsHTML(); bindAnalytics(body); }
  applyDayMode();
}
window.openPhone=(id,L)=>{ showView("phone"); state.phone.L=L||"es"; state.phone.go({name:"place",id,from:"home"}); };

// Deep link from a scanned QR: #p-<id> opens the phone view full-screen.
function route(){
  const m=location.hash.match(/^#p-([a-z0-9-]+)$/);
  if(m && PLACES.some(p=>p.id===m[1])){ document.body.classList.add("solo"); showView("phone"); state.phone.go({name:"place",id:m[1],from:"home"}); track("qr-open",{id:m[1],src:"phone"}); return true; }
  return false;
}

/* ======================= CARGA DE DATOS E INICIO ======================= */
let PLACES = [], CATS = [], catById = {}, BUS = {};
async function cargarDatos(){
  const get = f => fetch(f).then(r => { if(!r.ok) throw new Error(f+" ("+r.status+")"); return r.json(); });
  [PLACES, CATS, BUS] = await Promise.all([get("datos/lugares.json"), get("datos/categorias.json"), get("datos/buses.json")]);
  catById = Object.fromEntries(CATS.map(c=>[c.id,c]));
  PLACES.forEach(p=>{ if(edits[p.id]) Object.assign(p, edits[p.id]); });   // cambios hechos en el panel (demo)
}
async function iniciar(){
  try { await cargarDatos(); }
  catch(e){
    body.innerHTML = `<div class="note" style="max-width:520px"><b>No se pudieron cargar los datos.</b><span>${esc(e.message)}</span><span>Abre el proyecto con un servidor local (por ejemplo Live Server en VS Code). Los navegadores no permiten leer los archivos JSON si abres index.html con doble clic.</span></div>`;
    return;
  }
  document.querySelectorAll("[data-dm]").forEach(b=>b.onclick=()=>{ dayMode=b.dataset.dm;
    document.querySelectorAll("[data-dm]").forEach(x=>x.setAttribute("aria-pressed",String(x===b))); applyDayMode(); });
  document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showView(b.dataset.view));
  if(!route()) showView("totem");
  cargarClima();
  setInterval(cargarClima, WX.cadaMin*60*1000);
  window.addEventListener("hashchange",route);
  // mantener al día el reloj, "abierto ahora" y el modo día/noche
  setInterval(()=>{ const a=state.view==="totem"?state.totem:(state.view==="phone"?state.phone:null);
    if(a && ["home","list","clima"].includes(a.view.name) && !document.activeElement.matches("input")) a.render(); applyDayMode(); },60000);
}
iniciar();
