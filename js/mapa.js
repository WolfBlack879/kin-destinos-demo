/* Mapa real con OpenStreetMap (Leaflet, en vendor/leaflet).
   - En la ficha: mapa pequeño centrado en el lugar, con los demás atractivos de fondo.
   - En "Mapa de atractivos": todos los lugares con coordenadas, filtrables por categoría.
   - Si el mapa base no carga (sin internet o en una vista que bloquea imágenes externas),
     la ficha vuelve al mapa esquemático y el mapa completo avisa con un mensaje.
   - Alt + clic en el mapa completo muestra las coordenadas del punto, para copiarlas en datos/lugares.json.
   Nota para producción: tile.openstreetmap.org no permite uso intensivo (por ejemplo, tótems todo el día).
   En el producto real hay que usar un proveedor de mapas (MapTiler, Stadia, Thunderforest) o servidor propio. */

const MAPA = {
  centro: [-39.282, -71.954],                       // Pucón
  tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  atrib: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  disponible: null                                  // null = sin probar · true · false
};

const conCoords = p => typeof p.lat === "number" && typeof p.lng === "number";

function crearMapaBase(el, alFallar){
  const map = L.map(el, { zoomControl: true, attributionControl: true });
  const capa = L.tileLayer(MAPA.tiles, { maxZoom: 18, attribution: MAPA.atrib });
  let cargo = false, errores = 0, avisado = false;
  capa.on("tileload", () => { cargo = true; MAPA.disponible = true; });
  capa.on("tileerror", () => {
    errores++;
    if(!cargo && errores >= 4 && !avisado){ avisado = true; MAPA.disponible = false; if(alFallar) alFallar(); }
  });
  capa.addTo(map);
  return map;
}

function marcador(p, destacado){
  const c = catById[p.cat].c;
  return L.circleMarker([p.lat, p.lng], {
    radius: destacado ? 11 : 7, color: "#ffffff", weight: destacado ? 3 : 2,
    fillColor: c, fillOpacity: destacado ? 1 : .9,
    dashArray: p.geo === "aprox" ? "3 3" : null
  });
}

function popupHTML(app, p){
  const n = nowCL(), o = isOpen(p, n);
  const estado = p.closed ? `<span class="pill closed">${app.t("tempClosed")}</span>`
    : o === true ? `<span class="pill open">${app.t("open")}</span>`
    : o === false ? `<span class="pill closed">${app.t("closed")}</span>` : "";
  return `<div class="pop"><b>${esc(p.n)}</b><span>${esc(catById[p.cat].n[app.L])}</span>${estado}
    ${p.geo === "aprox" ? `<small>${app.t("approx")}</small>` : ""}
    <button data-place="${p.id}">${app.t("seeMore")} ›</button></div>`;
}

/* Mapa pequeño dentro de la ficha de un lugar */
function mapaFicha(app, p){
  const cont = app.el.querySelector(".lmap");
  if(!cont) return;
  const esquema = () => {
    const box = cont.closest(".map");
    if(box) box.innerHTML = p.road ? `${mapSVG(p, app.L)}<div class="mapcap">${app.t("map")}</div>` : "";
  };
  if(!window.L || MAPA.disponible === false || !conCoords(p)) return esquema();
  const map = crearMapaBase(cont, esquema);
  app.lmap = map;
  PLACES.filter(x => x !== p && conCoords(x)).forEach(x =>
    marcador(x, false).setStyle({ fillOpacity: .45, opacity: .6 }).addTo(map).bindPopup(() => popupHTML(app, x)));
  marcador(p, true).addTo(map);
  map.setView([p.lat, p.lng], p.road === "town" ? 15 : 13);
}

/* Mapa completo de atractivos */
function mapaCompleto(app){
  const cont = app.el.querySelector(".lmap");
  if(!cont) return;
  if(!window.L){ cont.innerHTML = `<p class="empty">${app.t("mapOffline")}</p>`; return; }
  const aviso = () => { const a = app.el.querySelector(".mapnote"); if(a) a.hidden = false; };
  const map = crearMapaBase(cont, aviso);
  if(MAPA.disponible === false) aviso();
  app.lmap = map;
  app.capaMarcadores = L.layerGroup().addTo(map);
  dibujarMarcadores(app, true);
  map.on("click", e => {
    if(!e.originalEvent.altKey) return;
    const t = `"lat": ${e.latlng.lat.toFixed(5)}, "lng": ${e.latlng.lng.toFixed(5)}`;
    L.popup().setLatLng(e.latlng).setContent(`<code>${t}</code>`).openOn(map);
  });
}

function dibujarMarcadores(app, ajustar){
  const capa = app.capaMarcadores, map = app.lmap;
  if(!capa || !map) return;
  capa.clearLayers();
  const vis = PLACES.filter(p => conCoords(p) && (app.mapCat === "all" || p.cat === app.mapCat));
  vis.forEach(p => marcador(p, false).addTo(capa).bindPopup(() => popupHTML(app, p)));
  if(ajustar){
    if(vis.length) map.fitBounds(L.latLngBounds(vis.map(p => [p.lat, p.lng])).pad(.12), { maxZoom: 14 });
    else map.setView(MAPA.centro, 11);
  }
}
