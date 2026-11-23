# Datos del tótem

Los tres archivos de esta carpeta son todo el contenido de la guía. Para agregar o corregir un lugar no hace falta tocar el código. En el producto real, estos mismos datos los va a entregar la API de WordPress con el mismo formato.

## lugares.json

Un objeto por lugar. Campos:

| Campo | Qué es | Ejemplo |
| --- | --- | --- |
| `id` | Identificador único, en minúsculas y sin espacios. Se usa en el QR (`#p-<id>`) | `"quimeyco"` |
| `cat` | Categoría (un `id` de `categorias.json`) | `"termas"` |
| `n` | Nombre | `"Termas Quimey-co"` |
| `d` | Descripción en `es`, `en` y `pt` | `{"es": "...", "en": "...", "pt": "..."}` |
| `h` | Horarios: `[díaDesde, díaHasta, "apertura", "cierre"]`. 1 = lunes … 7 = domingo. Puede haber varios tramos | `[[1, 6, "10:30", "19:30"]]` |
| `price` | Precio desde, en pesos. `0` = gratis | `35000` |
| `pn` | Nota del precio (`adult`, `perPerson`, `perHour`, `per2h`, `chileanAdult`, `card`, `entry`, `perTrip`, `flight25`) | `"adult"` |
| `road` / `km` | Posición en el mapa esquemático: camino (`huife`, `caburgua`, `curarrehue`, `volcan`, `villarrica`, `town`) y kilómetro desde Pucón | `"huife"`, `30` |
| `lat` / `lng` | Coordenadas reales para el mapa (OpenStreetMap). Sin ellas, el lugar no aparece en el mapa de atractivos | `-39.21895`, `-71.69626` |
| `geo` | `"aprox"` si la ubicación es aproximada: el punto se dibuja con borde punteado | `"aprox"` |
| `addr` | Dirección como la escribiría la gente | `"Camino a Huife km 30"` |
| `tel`, `web` | Contacto (opcionales) | `"+56 9 4682 1360"` |
| `pay` | Formas de pago (`cash`, `debit`, `credit`, `transfer`) | `["cash", "transfer"]` |
| `pets` | `true` si aceptan mascotas | `true` |
| `closed` | `true` si está cerrado temporalmente | `true` |
| `seasonal` | `true` si solo abre en temporada (no se calcula "abierto ahora") | `true` |
| `partner` | `true` si es comercio socio (sale primero en su categoría) | `true` |
| `coupon` | Cupón: `{"code": "...", "t": {"es": "...", "en": "...", "pt": "..."}}` | |
| `bus` | Solo transporte: muestra los horarios de `buses.json` (`huife` o `huerquehue`) | `"huife"` |

## categorias.json

Las 10 categorías: `id`, color (`c`) y nombre en los tres idiomas (`n`). El ícono de cada categoría está en `js/app.js` (`ICON`).

## buses.json

Horarios de salida desde Pucón. `huife`: `wk` = lunes a sábado, `su` = domingos y festivos. `huerquehue`: días que opera (`days`) y salidas (`t`).

Fuente original: guía "Servicios Turísticos Pucón". Los precios y horarios son aproximados y pueden cambiar.

## Cómo obtener coordenadas

Abre "Mapa de atractivos" en el tótem, mantén **Alt** y haz clic en el punto exacto. Aparece el texto `"lat": …, "lng": …` listo para copiar en el lugar. Después borra `"geo": "aprox"` si lo tenía.
