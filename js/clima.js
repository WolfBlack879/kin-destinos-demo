/* Clima de Pucón para el tótem de KIN Destinos.
   Fuente actual: Open-Meteo (sin clave). Ojo: su plan gratis es para uso no comercial;
   para producción hay que contratar su plan comercial o cambiar a otro proveedor (por ejemplo Windy).
   Para cambiar de proveedor basta con reescribir cargarClima() y devolver el mismo objeto WX. */

const WX = {
  lat: -39.282, lon: -71.954,
  cadaMin: 15,
  datos: null, guardadoEn: null, desdeCache: false, intentado: false,
  url(){
    return "https://api.open-meteo.com/v1/forecast"
      + `?latitude=${this.lat}&longitude=${this.lon}&timezone=${encodeURIComponent(TZ)}`
      + "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day"
      + "&hourly=temperature_2m,weather_code,precipitation_probability,is_day"
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset"
      + "&wind_speed_unit=kmh&forecast_days=4";
  }
};

/* Descripción de los códigos de clima (WMO) en los tres idiomas */
const WX_DESC = {
  es: {0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",45:"Niebla",48:"Niebla con escarcha",
       51:"Llovizna débil",53:"Llovizna",55:"Llovizna intensa",56:"Llovizna helada",57:"Llovizna helada",
       61:"Lluvia débil",63:"Lluvia",65:"Lluvia intensa",66:"Lluvia helada",67:"Lluvia helada",
       71:"Nieve débil",73:"Nieve",75:"Nieve intensa",77:"Granos de nieve",80:"Chubascos débiles",81:"Chubascos",82:"Chubascos fuertes",
       85:"Chubascos de nieve",86:"Chubascos de nieve",95:"Tormenta eléctrica",96:"Tormenta con granizo",99:"Tormenta con granizo"},
  en: {0:"Clear sky",1:"Mostly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Freezing fog",
       51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",56:"Freezing drizzle",57:"Freezing drizzle",
       61:"Light rain",63:"Rain",65:"Heavy rain",66:"Freezing rain",67:"Freezing rain",
       71:"Light snow",73:"Snow",75:"Heavy snow",77:"Snow grains",80:"Light showers",81:"Showers",82:"Heavy showers",
       85:"Snow showers",86:"Snow showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"},
  pt: {0:"Céu limpo",1:"Predominantemente limpo",2:"Parcialmente nublado",3:"Nublado",45:"Neblina",48:"Neblina com geada",
       51:"Garoa fraca",53:"Garoa",55:"Garoa forte",56:"Garoa congelante",57:"Garoa congelante",
       61:"Chuva fraca",63:"Chuva",65:"Chuva forte",66:"Chuva congelante",67:"Chuva congelante",
       71:"Neve fraca",73:"Neve",75:"Neve forte",77:"Grãos de neve",80:"Pancadas fracas",81:"Pancadas de chuva",82:"Pancadas fortes",
       85:"Pancadas de neve",86:"Pancadas de neve",95:"Trovoada",96:"Trovoada com granizo",99:"Trovoada com granizo"}
};

const WX_ICON = {
  sol: '<circle cx="32" cy="32" r="12" fill="#FF881B"/><g stroke="#FF881B" stroke-width="4" stroke-linecap="round"><path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5"/></g>',
  luna: '<path d="M40 10a22 22 0 1 0 14 34A18 18 0 0 1 40 10z" fill="#d9e2ea"/>',
  parcial: '<circle cx="24" cy="24" r="10" fill="#FF881B"/><g stroke="#FF881B" stroke-width="3.5" stroke-linecap="round"><path d="M24 5v5M5 24h5M10.6 10.6l3.5 3.5M37.4 10.6l-3.5 3.5"/></g><path d="M22 52h26a10 10 0 0 0 0-20 14 14 0 0 0-26 4 8 8 0 0 0 0 16z" fill="#a9b8bf"/>',
  nube: '<path d="M18 50h30a12 12 0 0 0 0-24 16 16 0 0 0-30 5 9.5 9.5 0 0 0 0 19z" fill="#a9b8bf"/>',
  niebla: '<path d="M18 36h30a12 12 0 0 0 0-24 16 16 0 0 0-30 5 9.5 9.5 0 0 0 0 19z" fill="#a9b8bf"/><g stroke="#a9b8bf" stroke-width="4" stroke-linecap="round"><path d="M12 46h40M18 55h28"/></g>',
  lluvia: '<path d="M18 40h30a12 12 0 0 0 0-24 16 16 0 0 0-30 5 9.5 9.5 0 0 0 0 19z" fill="#a9b8bf"/><g stroke="#2f74b5" stroke-width="4" stroke-linecap="round"><path d="M22 48l-3 8M34 48l-3 8M46 48l-3 8"/></g>',
  nieve: '<path d="M18 40h30a12 12 0 0 0 0-24 16 16 0 0 0-30 5 9.5 9.5 0 0 0 0 19z" fill="#a9b8bf"/><g fill="#8fbbe6"><circle cx="22" cy="51" r="3"/><circle cx="34" cy="55" r="3"/><circle cx="46" cy="51" r="3"/></g>',
  tormenta: '<path d="M18 38h30a12 12 0 0 0 0-24 16 16 0 0 0-30 5 9.5 9.5 0 0 0 0 19z" fill="#a9b8bf"/><path d="M34 40l-8 12h7l-4 10 12-15h-7l4-7z" fill="#FF881B"/>'
};
function wxGrupo(code, esDia){
  if(code === 0 || code === 1) return esDia ? "sol" : "luna";
  if(code === 2) return esDia ? "parcial" : "nube";
  if(code === 45 || code === 48) return "niebla";
  if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "lluvia";
  if((code >= 71 && code <= 77) || code === 85 || code === 86) return "nieve";
  if(code >= 95) return "tormenta";
  return "nube";
}
const wxSvg = (code, esDia, s) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">${WX_ICON[wxGrupo(code, esDia)]}</svg>`;
const wxHora = iso => iso ? iso.slice(11, 16) : "--";

async function cargarClima(){
  try{
    const r = await fetch(WX.url());
    if(!r.ok) throw new Error("HTTP " + r.status);
    WX.datos = await r.json(); WX.guardadoEn = Date.now(); WX.desdeCache = false;
    try{ localStorage.setItem("kin-clima", JSON.stringify({ d: WX.datos, t: WX.guardadoEn })); }catch(e){}
  }catch(e){
    try{ const c = JSON.parse(localStorage.getItem("kin-clima") || "null"); if(c){ WX.datos = c.d; WX.guardadoEn = c.t; WX.desdeCache = true; } }catch(e2){}
  }
  WX.intentado = true;
  [state.totem, state.phone].forEach(a => { if(a && ["home", "clima"].includes(a.view.name)) a.render(); });
}

/* Tarjeta corta para la pantalla de inicio */
function climaTarjetaHTML(app){
  const L = app.L, D = WX.datos;
  if(!D) return `<button class="wxcard" data-act="clima"><span class="wx-t">${WX.intentado ? app.t("wxNone") : app.t("wxLoading")}</span></button>`;
  const c = D.current, d = D.daily;
  return `<button class="wxcard" data-act="clima">
    ${wxSvg(c.weather_code, c.is_day === 1, 52)}
    <span class="wx-temp num">${Math.round(c.temperature_2m)}°</span>
    <span class="wx-t"><b>${WX_DESC[L][c.weather_code] || ""}</b><small class="num">${app.t("hiLo")} ${Math.round(d.temperature_2m_max[0])}° / ${Math.round(d.temperature_2m_min[0])}° · ${app.t("rain")} ${d.precipitation_probability_max[0] ?? "--"}%</small></span>
    <span aria-hidden="true" class="wx-go">›</span>
  </button>`;
}

/* Vista completa del clima */
function climaVistaHTML(app){
  const L = app.L, D = WX.datos, t = k => app.t(k);
  const head = `<button class="back" data-act="home">‹ ${t("back")}</button><h2 style="font-size:26px">${t("wxTitle")}</h2>`;
  if(!D) return head + `<p class="empty">${WX.intentado ? t("wxNone") : t("wxLoading")}</p>`;
  const c = D.current, d = D.daily, h = D.hourly, uv = d.uv_index_max[0];
  const uvTxt = uv == null ? "--" : `${Math.round(uv)} · ${t("uvLevels")[uv < 3 ? 0 : uv < 6 ? 1 : uv < 8 ? 2 : uv < 11 ? 3 : 4]}`;
  const consejos = [];
  if(uv != null && uv >= 6) consejos.push(t("tipUV"));
  if((d.precipitation_probability_max[0] ?? 0) >= 50) consejos.push(t("tipRain"));
  const desde = h ? h.time.findIndex(x => x >= (c.time || "").slice(0, 13) + ":00") : -1;
  const horas = desde < 0 ? [] : [0, 2, 4, 6, 8, 10].map(k => desde + k).filter(i => i < h.time.length);
  const fmtDia = new Intl.DateTimeFormat({ es: "es-CL", en: "en-GB", pt: "pt-BR" }[L], { weekday: "long", timeZone: "UTC" });
  const hhmm = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date(WX.guardadoEn));
  return head + `
    <div class="wxnow">
      ${wxSvg(c.weather_code, c.is_day === 1, 96)}
      <div><div class="wxbig num">${Math.round(c.temperature_2m)}°</div>
        <b class="wxdesc">${WX_DESC[L][c.weather_code] || ""}</b>
        <small class="wxfeel">${t("feels")} ${Math.round(c.apparent_temperature)}°</small></div>
    </div>
    ${consejos.length ? `<div class="wxtips">${consejos.map(x => `<span>${x}</span>`).join("")}</div>` : ""}
    <dl class="wxdata">
      <div><dt>${t("hiLo")}</dt><dd class="num">${Math.round(d.temperature_2m_max[0])}° / ${Math.round(d.temperature_2m_min[0])}°</dd></div>
      <div><dt>${t("rainProb")}</dt><dd class="num">${d.precipitation_probability_max[0] ?? "--"}%</dd></div>
      <div><dt>${t("wind")}</dt><dd class="num">${Math.round(c.wind_speed_10m)} km/h</dd></div>
      <div><dt>${t("uvIdx")}</dt><dd class="num">${uvTxt}</dd></div>
      <div><dt>${t("sunTimes")}</dt><dd class="num">${wxHora(d.sunrise[0])} – ${wxHora(d.sunset[0])}</dd></div>
    </dl>
    ${horas.length ? `<div class="sectionlabel">${t("nextHours")}</div>
    <ol class="wxhours">${horas.map(i => `<li><span class="num">${wxHora(h.time[i])}</span>${wxSvg(h.weather_code[i], h.is_day[i] === 1, 34)}<b class="num">${Math.round(h.temperature_2m[i])}°</b><small class="num">${h.precipitation_probability[i] ?? ""}%</small></li>`).join("")}</ol>` : ""}
    <div class="sectionlabel">${t("nextDays")}</div>
    <ol class="wxdays">${d.time.slice(1, 4).map((dia, i) => { const k = i + 1;
      return `<li><span class="wxday">${k === 1 ? t("tomorrow") : fmtDia.format(new Date(dia + "T12:00:00Z"))}</span>${wxSvg(d.weather_code[k], true, 36)}
        <span class="wxdd">${WX_DESC[L][d.weather_code[k]] || ""}</span><span class="num"><b>${Math.round(d.temperature_2m_max[k])}°</b> ${Math.round(d.temperature_2m_min[k])}°</span>
        <small class="num">${d.precipitation_probability_max[k] ?? ""}%</small></li>`; }).join("")}</ol>
    <p class="wxsrc">${t("wxSource")} · ${WX.desdeCache ? t("wxCached") : t("wxUpdated")} ${hhmm}</p>`;
}
