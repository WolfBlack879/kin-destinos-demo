/* Analítica del destino: eventos anónimos agregados (categoría, lugar, idioma, hora). */

function simulate(){
  // Clearly-labelled simulated week of usage, to show what the destination dashboard would look like.
  const langs=["es","es","es","es","en","en","pt","pt","pt"], w={termas:9,naturaleza:7,parques:5,aventura:4,lago:4,familia:3,transporte:6,bici:2,cultura:2,servicios:1};
  const pool=[]; Object.entries(w).forEach(([c,k])=>{for(let i=0;i<k;i++)pool.push(c);});
  const rnd=a=>a[Math.floor(Math.random()*a.length)], now=Date.now();
  for(let i=0;i<420;i++){
    const hour = 9+Math.floor(Math.abs((Math.random()+Math.random()+Math.random())/3*14)); const at=now-Math.floor(Math.random()*7)*864e5;
    const dt=new Date(at); dt.setHours(Math.min(hour,23),Math.floor(Math.random()*60));
    const cat=rnd(pool), lang=rnd(langs), cands=PLACES.filter(p=>p.cat===cat), p=rnd(cands);
    EVENTS.push({type:"cat",cat,lang,at:+dt,sim:true});
    if(Math.random()<.8) EVENTS.push({type:"view",id:p.id,cat,lang,at:+dt,sim:true});
    if(Math.random()<.18) EVENTS.push({type:"qr",id:p.id,lang,at:+dt,sim:true});
  }
  store.set("events",EVENTS);
}
function analyticsHTML(){
  const ev=EVENTS, simN=ev.filter(e=>e.sim).length, realN=ev.length-simN;
  const views=ev.filter(e=>e.type==="view"), qrs=ev.filter(e=>e.type==="qr"), cats=ev.filter(e=>e.type==="cat");
  const langEv=ev.filter(e=>e.lang);
  const by=(arr,f)=>{const m={};arr.forEach(e=>{const k=f(e);if(k!=null)m[k]=(m[k]||0)+1;});return Object.entries(m).sort((a,b)=>b[1]-a[1]);};
  const catRank=by(views.concat(cats),e=>e.cat), placeRank=by(views,e=>e.id).slice(0,6), langRank=by(langEv,e=>e.lang);
  const foreign = langEv.length? Math.round(100*langEv.filter(e=>e.lang!=="es").length/langEv.length):0;
  const hrs=new Array(15).fill(0); views.forEach(e=>{const h=parseInt(new Intl.DateTimeFormat("en-GB",{timeZone:TZ,hour:"2-digit",hour12:false}).format(new Date(e.at)),10);if(h>=9&&h<=23)hrs[h-9]++;});
  const hmax=Math.max(1,...hrs);
  const bars=(rank,label)=>{const mx=Math.max(1,...rank.map(r=>r[1]));return rank.length?`<div class="bars">${rank.map(([k,v])=>`<div class="bar"><span>${esc(label(k))}</span><span class="t"><i style="width:${100*v/mx}%"></i></span><span class="n num">${v}</span></div>`).join("")}</div>`:`<p class="empty" style="padding:10px">Sin datos todavía. Usa el tótem o carga datos simulados.</p>`;};
  const pname=id=>(PLACES.find(p=>p.id===id)||{n:id}).n;
  return `<div class="panel"><header><h2>Analítica del destino</h2><p>Lo que buscan los visitantes: el producto que se vende a municipios, cámaras de turismo y comercios.</p></header>
    <div class="srcnote"><span class="pill">Fuente: interacciones registradas en este navegador</span><span class="num">${realN} reales · ${simN} simuladas</span>
      <button class="btn ghost" id="a-sim" type="button">Cargar semana simulada</button><button class="btn ghost" id="a-clear" type="button">Borrar datos</button></div>
    <div class="tiles">
      <div class="tile"><span class="k">Fichas vistas</span><span class="v num">${views.length}</span><span class="s">turistas abriendo un lugar</span></div>
      <div class="tile"><span class="k">QR escaneados</span><span class="v num">${qrs.length}</span><span class="s">continúan en su teléfono</span></div>
      <div class="tile"><span class="k">Uso en otro idioma</span><span class="v num">${foreign}%</span><span class="s">inglés + portugués</span></div>
      <div class="tile"><span class="k">Sesiones en tótem</span><span class="v num">${ev.filter(e=>e.type==="session").length}</span><span class="s">toques en pantalla de inicio</span></div>
    </div>
    <div class="charts">
      <div class="chart"><h3>Categorías más buscadas</h3>${bars(catRank,k=>catById[k]?catById[k].n.es:k)}</div>
      <div class="chart"><h3>Lugares más vistos</h3>${bars(placeRank,pname)}</div>
      <div class="chart"><h3>Idioma</h3>${bars(langRank,k=>({es:"Español",en:"Inglés",pt:"Portugués"})[k])}</div>
      <div class="chart"><h3>Fichas vistas por hora del día</h3>
        <div class="hours">${hrs.map(v=>`<i style="height:${100*v/hmax}%" title="${v}"></i>`).join("")}</div>
        <div class="hlabels num">${hrs.map((_,i)=>`<span>${(i+9)%3===0?i+9:""}</span>`).join("")}</div></div>
    </div></div>`;
}
function bindAnalytics(root){
  root.querySelector("#a-sim").onclick=()=>{ simulate(); showView("analytics"); };
  root.querySelector("#a-clear").onclick=()=>{ EVENTS=[]; store.set("events",EVENTS); showView("analytics"); };
}
