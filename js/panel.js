/* Panel del comercio: editar ficha y cupón (en la demo se guarda solo en este navegador). */

function merchantHTML(sel){
  const p=PLACES.find(x=>x.id===sel)||PLACES[0];
  const views=EVENTS.filter(e=>e.type==="view"&&e.id===p.id).length, qrs=EVENTS.filter(e=>e.type==="qr"&&e.id===p.id).length;
  return `<div class="panel"><header><h2>Panel del comercio</h2><p>Cada negocio actualiza su ficha y la ve publicada al instante en todos los tótems y teléfonos.</p></header>
    <div class="cols">
      <form class="form" id="mform">
        <label for="m-sel">Comercio<select id="m-sel">${PLACES.filter(x=>!x.bus).map(x=>`<option value="${x.id}" ${x.id===p.id?"selected":""}>${esc(x.n)}</option>`).join("")}</select></label>
        <label for="m-d">Descripción (español)<textarea id="m-d">${esc(p.d.es)}</textarea></label>
        <div class="row2">
          <label for="m-price">Precio desde (CLP)<input id="m-price" type="number" min="0" step="500" value="${p.price??""}"></label>
          <label for="m-tel">Teléfono<input id="m-tel" value="${esc(p.tel||"")}"></label>
        </div>
        <div class="row2">
          <label for="m-ccode">Código de cupón<input id="m-ccode" value="${esc(p.coupon?p.coupon.code:"")}" placeholder="Ej. VERANO10"></label>
          <label for="m-ctxt">Beneficio del cupón<input id="m-ctxt" value="${esc(p.coupon?p.coupon.t.es:"")}" placeholder="Ej. 10% de descuento"></label>
        </div>
        <label style="display:flex;gap:8px;align-items:center;flex-direction:row"><input id="m-closed" type="checkbox" ${p.closed?"checked":""}> Marcar como cerrado temporalmente</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" type="submit">Publicar cambios</button><button class="btn ghost" type="button" id="m-see">Ver en el tótem</button><span class="saved" id="m-saved" role="status"></span></div>
        <p class="srcnote">En la demo los cambios se guardan solo en este navegador. Las traducciones al inglés y portugués se generarían automáticamente.</p>
      </form>
      <div class="preview">
        <div class="tiles" style="grid-template-columns:1fr 1fr">
          <div class="tile"><span class="k">Vistas de la ficha</span><span class="v num">${views}</span><span class="s">en esta demo</span></div>
          <div class="tile"><span class="k">QR escaneados</span><span class="v num">${qrs}</span><span class="s">en esta demo</span></div>
        </div>
        <div class="sectionlabel">Vista previa</div>
        <div class="item" style="--c:${catById[p.cat].c}"><h3>${esc(p.n)}</h3><span class="price num">${p.price!==undefined?money(p.price):""}</span><p>${esc(p.d.es)}</p><div class="meta">${p.coupon?`<span class="pill coupon">Cupón: ${esc(p.coupon.code)}</span>`:""}${p.closed?`<span class="pill closed">Cerrado temporalmente</span>`:""}</div></div>
      </div>
    </div></div>`;
}
function bindMerchant(root){
  const f=root.querySelector("#mform");
  root.querySelector("#m-sel").onchange=(e)=>{ state.merchant=e.target.value; showView("merchant"); };
  root.querySelector("#m-see").onclick=()=>{ const id=root.querySelector("#m-sel").value; showView("totem"); state.totem.go({name:"place",id,from:"home"}); };
  f.onsubmit=(e)=>{ e.preventDefault();
    const p=PLACES.find(x=>x.id===root.querySelector("#m-sel").value);
    const d=root.querySelector("#m-d").value.trim(); const pr=root.querySelector("#m-price").value;
    const code=root.querySelector("#m-ccode").value.trim().toUpperCase(), ct=root.querySelector("#m-ctxt").value.trim();
    const ed={ d:Object.assign({},p.d,{es:d}), tel:root.querySelector("#m-tel").value.trim(), closed:root.querySelector("#m-closed").checked };
    if(pr!=="") ed.price=Number(pr);
    ed.coupon = code&&ct ? {code,t:{es:ct,en:ct,pt:ct}} : undefined;
    if(d!==p.d.es){ ed.d.en=d; ed.d.pt=d; }
    Object.assign(p,ed); p.demoCoupon=false; edits[p.id]=ed; store.set("edits",edits);
    track("edit",{id:p.id,src:"merchant"});
    state.merchant=p.id; showView("merchant"); document.getElementById("m-saved").textContent="Publicado ✓ ya aparece en el tótem";
  };
}
