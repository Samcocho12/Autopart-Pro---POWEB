// Genera ilustraciones técnicas SVG (originales) por tipo de repuesto en public/img/repuestos/
// Uso: node database/generate-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "img", "repuestos");
mkdirSync(out, { recursive: true });

// Paleta
const L = "#eef2f6";      // trazo principal
const M = "#9aa6b4";      // metal medio
const D = "#3a434f";      // metal oscuro
const A = "#ff6a1a";      // acento
const A2 = "#ffb37a";     // acento claro
const S = `stroke="${L}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const s = (w = 3, c = L) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

const defs = `<defs>
  <linearGradient id="met" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe5ec"/><stop offset=".5" stop-color="#9aa6b4"/><stop offset="1" stop-color="#5d6876"/></linearGradient>
  <linearGradient id="metH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5d6876"/><stop offset=".45" stop-color="#e6eaef"/><stop offset="1" stop-color="#5d6876"/></linearGradient>
  <linearGradient id="acc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5c"/><stop offset="1" stop-color="#d9500a"/></linearGradient>
  <linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a434f"/><stop offset="1" stop-color="#1b2027"/></linearGradient>
  <radialGradient id="glass" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".5" stop-color="#cfe6ff" stop-opacity=".35"/><stop offset="1" stop-color="#5cb8ff" stop-opacity=".15"/></radialGradient>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".45"/></filter>
</defs>`;

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" fill="none">${defs}<g filter="url(#sh)">${body}</g></svg>\n`;

const pernos = (cx, cy, r, n, rr = 7, fill = D) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="${rr}" fill="${fill}" ${s(2, M)}/>`;
  }).join("");

const ranuras = (x, y, w, h, n) => Array.from({ length: n }, (_, i) => `<line x1="${x + (w / (n + 1)) * (i + 1)}" y1="${y}" x2="${x + (w / (n + 1)) * (i + 1)}" y2="${y + h}" ${s(3, D)}/>`).join("");

const imgs = {
  // ---------------- Frenos
  "pastillas-freno": svg(`
    <path d="M40 150 Q40 80 120 70 L150 70 Q165 70 165 85 L165 160 Q165 175 150 175 L60 175 Q40 175 40 150Z" fill="url(#met)" ${S}/>
    <path d="M52 152 Q54 95 122 86 L150 86 L150 160 L64 160 Q52 160 52 152Z" fill="url(#dark)" ${s(2, M)}/>
    <line x1="100" y1="92" x2="100" y2="160" ${s(3, M)}/>
    <path d="M155 165 Q155 95 235 85 L265 85 Q280 85 280 100 L280 175 Q280 190 265 190 L175 190 Q155 190 155 165Z" fill="url(#met)" ${S}/>
    <path d="M167 167 Q169 110 237 101 L265 101 L265 175 L179 175 Q167 175 167 167Z" fill="url(#dark)" ${s(2, M)}/>
    <line x1="215" y1="107" x2="215" y2="175" ${s(3, M)}/>
    <path d="M150 70 l18 -14 h20" ${s(4, A)}/>`),
  "disco-freno": svg(`
    <circle cx="160" cy="120" r="98" fill="url(#metH)" ${S}/>
    <circle cx="160" cy="120" r="84" ${s(2, D)}/>
    ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2; return `<circle cx="${(160 + 72 * Math.cos(a)).toFixed(1)}" cy="${(120 + 72 * Math.sin(a)).toFixed(1)}" r="3.5" fill="${D}"/>`; }).join("")}
    <circle cx="160" cy="120" r="50" fill="url(#met)" ${S}/>
    <circle cx="160" cy="120" r="18" fill="${D}" ${s(3, L)}/>
    ${pernos(160, 120, 33, 5, 6)}
    <path d="M232 52 a98 98 0 0 1 22 30" ${s(6, A)}/>`),
  "bandas-freno": svg(`
    <path d="M70 175 A95 95 0 0 1 150 40" ${s(26, D)}/>
    <path d="M70 175 A95 95 0 0 1 150 40" ${s(16, "#c46a3a")}/>
    <path d="M250 175 A95 95 0 0 0 170 40" ${s(26, D)}/>
    <path d="M250 175 A95 95 0 0 0 170 40" ${s(16, "#c46a3a")}/>
    <path d="M95 168 A72 72 0 0 1 150 62" ${s(5, L)}/>
    <path d="M225 168 A72 72 0 0 0 170 62" ${s(5, L)}/>
    <path d="M110 120 q50 -30 100 0" ${s(4, M)}/>
    <path d="M100 196 h120" ${s(5, A)}/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${120 + i * 12} 190 l6 12" ${s(3, A)}/>`).join("")}`),
  "bomba-freno": svg(`
    <rect x="40" y="110" width="200" height="56" rx="14" fill="url(#met)" ${S}/>
    <rect x="240" y="122" width="40" height="32" rx="6" fill="url(#metH)" ${S}/>
    <rect x="70" y="50" width="120" height="60" rx="10" fill="rgba(255,255,255,.18)" ${S}/>
    <rect x="76" y="78" width="108" height="26" rx="6" fill="${A2}" opacity=".7"/>
    <rect x="110" y="34" width="40" height="18" rx="5" fill="url(#acc)" ${s(3, L)}/>
    <line x1="80" y1="70" x2="180" y2="70" ${s(2, L)}/>
    <circle cx="90" cy="180" r="10" fill="${D}" ${s(3, L)}/><circle cx="150" cy="180" r="10" fill="${D}" ${s(3, L)}/>
    <line x1="90" y1="166" x2="90" y2="172" ${s(4, L)}/><line x1="150" y1="166" x2="150" y2="172" ${s(4, L)}/>`),
  "liquido-frenos": svg(`
    <path d="M110 60 h100 v26 q30 10 30 40 v84 q0 14 -14 14 h-132 q-14 0 -14 -14 v-84 q0 -30 30 -40z" fill="rgba(255,255,255,.85)" ${S}/>
    <rect x="128" y="28" width="64" height="34" rx="6" fill="url(#acc)" ${S}/>
    <rect x="100" y="120" width="120" height="70" rx="6" fill="url(#acc)"/>
    <text x="160" y="152" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="22" fill="#fff">DOT 4</text>
    <text x="160" y="176" text-anchor="middle" font-family="Arial" font-weight="700" font-size="9.5" fill="#fff">LÍQUIDO DE FRENOS</text>`),
  // ---------------- Filtros
  "filtro-aceite": svg(`
    <rect x="95" y="48" width="130" height="150" rx="16" fill="url(#acc)" ${S}/>
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${108 + i * 13}" y1="58" x2="${108 + i * 13}" y2="188" ${s(2, "rgba(0,0,0,.25)")}/>`).join("")}
    <rect x="90" y="186" width="140" height="22" rx="6" fill="url(#metH)" ${S}/>
    <ellipse cx="160" cy="48" rx="65" ry="10" fill="url(#met)" ${S}/>
    <rect x="115" y="100" width="90" height="38" rx="5" fill="#fff" opacity=".92"/>
    <text x="160" y="125" text-anchor="middle" font-family="Arial Black,Arial" font-size="15" fill="${D}">OIL</text>`),
  "filtro-aire": svg(`
    <rect x="40" y="70" width="240" height="110" rx="14" fill="url(#acc)" ${S}/>
    <rect x="56" y="84" width="208" height="82" rx="6" fill="#f6efe3" ${s(2, D)}/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${64 + i * 12.5} 86 l6 40 l-6 38" ${s(2, "#b8ab96")}/>`).join("")}`),
  "filtro-combustible": svg(`
    <line x1="30" y1="120" x2="80" y2="120" ${s(10, M)}/><line x1="240" y1="120" x2="290" y2="120" ${s(10, M)}/>
    <path d="M80 112 h20 v16 h-20z" fill="url(#metH)" ${S}/><path d="M220 112 h20 v16 h-20z" fill="url(#metH)" ${S}/>
    <rect x="100" y="72" width="120" height="96" rx="20" fill="url(#metH)" ${S}/>
    <rect x="128" y="92" width="64" height="56" rx="4" fill="url(#acc)"/>
    <path d="M150 104 l20 16 l-20 16" ${s(5, "#fff")}/>`),
  "filtro-cabina": svg(`
    <path d="M60 90 L220 60 L270 140 L110 170Z" fill="#f2f5f8" ${S}/>
    ${Array.from({ length: 12 }, (_, i) => `<line x1="${72 + i * 13}" y1="${88 - i * 2.4}" x2="${120 + i * 13}" y2="${167 - i * 2.4}" ${s(2, "#9aa6b4")}/>`).join("")}
    <path d="M110 170 L270 140 L270 156 L110 186Z" fill="url(#dark)" ${S}/>
    <path d="M60 90 L110 170 L110 186 L60 106Z" fill="url(#dark)" ${S}/>
    <circle cx="245" cy="70" r="20" fill="url(#acc)" ${s(3, L)}/><path d="M237 70 q8 -12 16 0 q-8 12 -16 0" ${s(2.5, "#fff")}/>`),
  // ---------------- Encendido
  "bujias": svg(`
    ${[0, 1].map((k) => { const x = 110 + k * 100; return `
      <rect x="${x - 7}" y="24" width="14" height="22" rx="3" fill="url(#metH)" ${s(3, L)}/>
      <path d="M${x - 16} 46 h32 l-4 66 h-24z" fill="#f8fafc" ${S}/>
      ${[56, 70, 84, 98].map((y) => `<line x1="${x - 15}" y1="${y}" x2="${x + 15}" y2="${y}" ${s(2, M)}/>`).join("")}
      <path d="M${x - 24} 112 h48 l-6 30 h-36z" fill="url(#metH)" ${S}/>
      <rect x="${x - 14}" y="142" width="28" height="44" fill="url(#met)" ${S}/>
      ${[150, 160, 170, 180].map((y) => `<line x1="${x - 14}" y1="${y}" x2="${x + 14}" y2="${y - 4}" ${s(2, D)}/>`).join("")}
      <path d="M${x} 186 v12 h12 v-8" ${s(4, A)}/>`; }).join("")}`),
  "bobina": svg(`
    <rect x="100" y="34" width="120" height="50" rx="10" fill="url(#dark)" ${S}/>
    <rect x="200" y="48" width="44" height="26" rx="5" fill="url(#acc)" ${s(3, L)}/>
    <rect x="138" y="84" width="44" height="96" fill="url(#dark)" ${S}/>
    ${[100, 116, 132, 148].map((y) => `<line x1="138" y1="${y}" x2="182" y2="${y}" ${s(2, M)}/>`).join("")}
    <rect x="146" y="180" width="28" height="32" rx="6" fill="#f2f5f8" ${S}/>
    <path d="M112 58 h56" ${s(3, M)}/>`),
  "cables-bujia": svg(`
    ${[0, 1, 2, 3].map((k) => `<path d="M60 ${70 + k * 30} C130 ${30 + k * 30}, 170 ${130 + k * 22}, 250 ${80 + k * 26}" ${s(12, k % 2 ? "#e2442f" : "#c9351f")}/>
      <rect x="40" y="${62 + k * 30}" width="26" height="16" rx="5" fill="url(#dark)" ${s(2.5, L)}/>
      <path d="M244 ${72 + k * 26} l24 -6 v16 z" fill="url(#dark)" ${s(2.5, L)}/>`).join("")}`),
  // ---------------- Suspensión
  "amortiguador": svg(`
    <rect x="150" y="18" width="20" height="90" rx="4" fill="url(#metH)" ${S}/>
    <ellipse cx="160" cy="44" rx="58" ry="12" fill="url(#met)" ${S}/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M108 ${62 + i * 16} q52 14 104 0" ${s(7, A)}/>`).join("")}
    <rect x="132" y="104" width="56" height="100" rx="10" fill="url(#dark)" ${S}/>
    <ellipse cx="160" cy="158" rx="44" ry="9" fill="url(#met)" ${S}/>
    <circle cx="160" cy="214" r="14" fill="url(#met)" ${S}/><circle cx="160" cy="214" r="5" fill="${D}"/>`),
  "terminal-direccion": svg(`
    <rect x="30" y="110" width="150" height="22" rx="6" fill="url(#metH)" ${S}/>
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${40 + i * 10}" y1="110" x2="${46 + i * 10}" y2="132" ${s(2, D)}/>`).join("")}
    <path d="M176 96 h50 q40 0 40 30 q0 30 -40 30 h-50z" fill="url(#met)" ${S}/>
    <rect x="216" y="156" width="24" height="44" rx="5" fill="url(#metH)" ${S}/>
    <path d="M206 98 q20 -40 44 0" fill="url(#dark)" ${s(4, L)}/>
    <circle cx="228" cy="210" r="8" fill="${A}"/>`),
  "rotula": svg(`
    <circle cx="160" cy="110" r="52" fill="url(#met)" ${S}/>
    <path d="M118 84 q42 -40 84 0" fill="url(#dark)" ${s(4, L)}/>
    <rect x="148" y="40" width="24" height="42" rx="5" fill="url(#metH)" ${S}/>
    <path d="M100 150 h120 l-14 30 h-92z" fill="url(#metH)" ${S}/>
    ${pernos(160, 165, 42, 3, 5)}
    <circle cx="160" cy="34" r="8" fill="${A}"/>`),
  "bujes": svg(`
    ${[0, 1, 2].map((k) => { const x = 80 + k * 80, y = 120 + (k === 1 ? -20 : 10); return `
      <circle cx="${x}" cy="${y}" r="38" fill="url(#dark)" ${S}/>
      <circle cx="${x}" cy="${y}" r="24" fill="#20262e" ${s(3, M)}/>
      <circle cx="${x}" cy="${y}" r="12" fill="url(#metH)" ${s(3, L)}/>
      <path d="M${x - 38} ${y} h-6 M${x + 38} ${y} h6" ${s(4, A)}/>`; }).join("")}`),
  // ---------------- Motor
  "kit-distribucion": svg(`
    <path d="M90 70 L230 60 Q260 60 260 100 L250 160 Q246 190 210 190 L100 190 Q66 190 66 150 L66 100 Q66 72 90 70Z" ${s(14, D)}/>
    <path d="M90 70 L230 60 Q260 60 260 100 L250 160 Q246 190 210 190 L100 190 Q66 190 66 150 L66 100 Q66 72 90 70Z" ${s(6, "#5d6876")} stroke-dasharray="3 6"/>
    <circle cx="110" cy="110" r="36" fill="url(#met)" ${S}/>${pernos(110, 110, 22, 6, 4)}
    <circle cx="220" cy="105" r="36" fill="url(#met)" ${S}/>${pernos(220, 105, 22, 6, 4)}
    <circle cx="165" cy="170" r="20" fill="url(#acc)" ${S}/><circle cx="165" cy="170" r="6" fill="${D}"/>`),
  "correa": svg(`
    <ellipse cx="160" cy="120" rx="125" ry="70" ${s(18, D)}/>
    <ellipse cx="160" cy="120" rx="125" ry="70" ${s(4, "#5d6876")}/>
    ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="160" cy="120" rx="${125 - 6 + i * 3}" ry="${70 - 6 + i * 3}" ${s(1, "#20262e")}/>`).join("")}
    <rect x="128" y="40" width="64" height="16" rx="4" fill="url(#acc)"/>
    <text x="160" y="52" text-anchor="middle" font-family="Arial Black,Arial" font-size="11" fill="#fff">6PK</text>`),
  "bomba-agua": svg(`
    <path d="M70 70 h120 l40 40 v60 l-30 30 h-130z" fill="url(#met)" ${S}/>
    ${pernos(150, 135, 70, 6, 7)}
    <circle cx="150" cy="135" r="34" fill="url(#dark)" ${S}/>
    ${Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M150 135 q${(30 * Math.cos(a + 0.6)).toFixed(1)} ${(30 * Math.sin(a + 0.6)).toFixed(1)} ${(30 * Math.cos(a)).toFixed(1)} ${(30 * Math.sin(a)).toFixed(1)}" ${s(4, A)}/>`; }).join("")}
    <rect x="228" y="120" width="50" height="22" rx="8" fill="url(#metH)" ${S}/>`),
  "empaque-culata": svg(`
    <rect x="30" y="64" width="260" height="112" rx="14" fill="url(#metH)" ${S}/>
    ${[0, 1, 2, 3].map((k) => `<circle cx="${73 + k * 58}" cy="120" r="24" fill="#1b2027" ${s(4, A)}/>`).join("")}
    ${[44, 102, 160, 218, 276].map((x) => `<circle cx="${x}" cy="78" r="5" fill="${D}"/><circle cx="${x}" cy="162" r="5" fill="${D}"/>`).join("")}`),
  "termostato": svg(`
    <ellipse cx="160" cy="110" rx="80" ry="22" fill="url(#metH)" ${S}/>
    <path d="M120 110 v50 q0 30 40 30 q40 0 40 -30 v-50" fill="url(#met)" ${S}/>
    ${[0, 1, 2].map((k) => `<path d="M126 ${130 + k * 16} h68" ${s(4, A)}/>`).join("")}
    <path d="M130 108 L160 50 L190 108" ${s(6, L)}/>
    <circle cx="160" cy="50" r="10" fill="${A}" ${s(3, L)}/>`),
  "sensor-oxigeno": svg(`
    <path d="M40 60 C110 60, 120 120, 170 120" ${s(8, D)}/>
    <path d="M40 72 C110 72, 120 132, 170 132" ${s(8, "#5d6876")}/>
    <rect x="18" y="52" width="34" height="30" rx="6" fill="url(#dark)" ${s(3, L)}/>
    <rect x="168" y="108" width="40" height="36" rx="6" fill="url(#metH)" ${S}/>
    <path d="M208 102 h30 l8 24 l-8 24 h-30z" fill="url(#met)" ${S}/>
    <rect x="246" y="114" width="40" height="24" fill="url(#metH)" ${S}/>
    ${[256, 266, 276].map((x) => `<line x1="${x}" y1="114" x2="${x}" y2="138" ${s(2, D)}/>`).join("")}
    <path d="M286 120 h14 v12 h-14z" fill="${A}" ${s(2, L)}/>`),
  // ---------------- Eléctrico
  "alternador": svg(`
    <circle cx="170" cy="120" r="82" fill="url(#met)" ${S}/>
    ${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<line x1="${(170 + 50 * Math.cos(a)).toFixed(1)}" y1="${(120 + 50 * Math.sin(a)).toFixed(1)}" x2="${(170 + 76 * Math.cos(a)).toFixed(1)}" y2="${(120 + 76 * Math.sin(a)).toFixed(1)}" ${s(5, D)}/>`; }).join("")}
    <circle cx="170" cy="120" r="44" fill="url(#metH)" ${S}/>
    <circle cx="170" cy="120" r="30" fill="url(#dark)" ${s(3, L)}/>
    ${[0, 1, 2, 3, 4].map((k) => `<circle cx="170" cy="120" r="${28 - k * 4}" ${s(1.5, "#5d6876")}/>`).join("")}
    <circle cx="170" cy="120" r="6" fill="${A}"/>
    <rect x="40" y="96" width="42" height="22" rx="6" fill="url(#acc)" ${s(3, L)}/>`),
  "motor-arranque": svg(`
    <rect x="40" y="96" width="150" height="80" rx="20" fill="url(#met)" ${S}/>
    ${[70, 100, 130, 160].map((x) => `<line x1="${x}" y1="98" x2="${x}" y2="174" ${s(2, D)}/>`).join("")}
    <rect x="80" y="44" width="110" height="52" rx="18" fill="url(#metH)" ${S}/>
    <circle cx="100" cy="70" r="8" fill="${A}" ${s(2, L)}/><circle cx="170" cy="70" r="8" fill="${A}" ${s(2, L)}/>
    <rect x="190" y="110" width="40" height="52" fill="url(#metH)" ${S}/>
    <rect x="230" y="122" width="40" height="28" fill="url(#met)" ${S}/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${232 + i * 6.5}" y="116" width="4" height="40" fill="${D}"/>`).join("")}`),
  "sensor-ckp": svg(`
    <rect x="70" y="90" width="120" height="60" rx="10" fill="url(#dark)" ${S}/>
    <rect x="190" y="104" width="70" height="32" rx="6" fill="url(#metH)" ${S}/>
    <circle cx="262" cy="120" r="10" fill="${A}" ${s(3, L)}/>
    <rect x="90" y="150" width="40" height="34" rx="6" fill="url(#met)" ${S}/>
    <circle cx="110" cy="167" r="6" fill="${D}"/>
    <path d="M70 108 h-30 v24 h30" fill="url(#dark)" ${S}/>
    ${[46, 56, 64].map((x) => `<line x1="${x}" y1="112" x2="${x}" y2="128" ${s(2, A)}/>`).join("")}`),
  "bateria": svg(`
    <rect x="50" y="62" width="220" height="140" rx="12" fill="url(#dark)" ${S}/>
    <rect x="50" y="62" width="220" height="30" rx="10" fill="url(#acc)" ${S}/>
    <rect x="78" y="40" width="30" height="22" rx="4" fill="url(#metH)" ${S}/>
    <rect x="212" y="40" width="30" height="22" rx="4" fill="url(#metH)" ${S}/>
    <path d="M86 77 h14 M93 70 v14" ${s(4, "#fff")}/><path d="M220 77 h14" ${s(4, "#fff")}/>
    <path d="M150 112 l-22 40 h22 l-10 34 l36 -48 h-24 l12 -26z" fill="${A}" ${s(3, L)}/>
    <rect x="80" y="170" width="160" height="10" rx="4" fill="${D}"/>`),
  "bombillo": svg(`
    <circle cx="160" cy="92" r="58" fill="url(#glass)" ${S}/>
    <path d="M140 92 q10 -24 20 0 q10 24 20 0" ${s(4, A)}/>
    <path d="M140 92 v40 M180 92 v40" ${s(3, M)}/>
    <rect x="128" y="146" width="64" height="20" rx="4" fill="url(#metH)" ${S}/>
    <rect x="138" y="166" width="44" height="30" fill="url(#met)" ${S}/>
    <path d="M148 196 v18 M172 196 v18" ${s(6, M)}/>
    <path d="M100 40 l-14 -14 M220 40 l14 -14 M160 20 v-14" ${s(4, A2)}/>`),
  "led": svg(`
    ${[0, 1].map((k) => { const x = 110 + k * 100; return `
      <rect x="${x - 18}" y="40" width="36" height="80" rx="8" fill="url(#metH)" ${S}/>
      ${[56, 76, 96].map((y) => `<rect x="${x - 10}" y="${y}" width="20" height="12" rx="2" fill="#fff8e6" ${s(2, A)}/>`).join("")}
      <rect x="${x - 26}" y="120" width="52" height="16" rx="4" fill="url(#dark)" ${S}/>
      <rect x="${x - 22}" y="136" width="44" height="54" rx="6" fill="url(#dark)" ${S}/>
      ${[148, 160, 172].map((y) => `<line x1="${x - 22}" y1="${y}" x2="${x + 22}" y2="${y}" ${s(2, M)}/>`).join("")}
      <path d="M${x} 190 v20" ${s(4, A)}/>`; }).join("")}
    <path d="M160 40 v-20 M146 30 l-10 -10 M174 30 l10 -10" ${s(4, A2)}/>`),
  // ---------------- Transmisión
  "embrague": svg(`
    <circle cx="120" cy="125" r="90" fill="url(#met)" ${S}/>
    <circle cx="120" cy="125" r="62" fill="url(#dark)" ${s(3, L)}/>
    ${Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return `<path d="M${(120 + 22 * Math.cos(a)).toFixed(1)} ${(125 + 22 * Math.sin(a)).toFixed(1)} L${(120 + 58 * Math.cos(a + 0.25)).toFixed(1)} ${(125 + 58 * Math.sin(a + 0.25)).toFixed(1)}" ${s(6, M)}/>`; }).join("")}
    <circle cx="120" cy="125" r="18" fill="url(#metH)" ${S}/>
    <circle cx="240" cy="90" r="58" fill="#c46a3a" ${S}/>
    <circle cx="240" cy="90" r="40" fill="url(#metH)" ${s(3, L)}/>
    ${pernos(240, 90, 28, 4, 4, A)}
    <circle cx="240" cy="90" r="10" fill="${D}" ${s(3, L)}/>`),
  "rodamiento": svg(`
    <circle cx="160" cy="120" r="92" fill="url(#metH)" ${S}/>
    <circle cx="160" cy="120" r="72" fill="#1b2027" ${s(3, M)}/>
    ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${(160 + 60 * Math.cos(a)).toFixed(1)}" cy="${(120 + 60 * Math.sin(a)).toFixed(1)}" r="10" fill="url(#met)" ${s(2, L)}/>`; }).join("")}
    <circle cx="160" cy="120" r="48" fill="url(#metH)" ${S}/>
    <circle cx="160" cy="120" r="30" fill="url(#dark)" ${s(3, L)}/>
    <path d="M100 60 a85 85 0 0 1 40 -24" ${s(5, A)}/>`),
  "homocinetica": svg(`
    <rect x="20" y="108" width="120" height="24" rx="8" fill="url(#metH)" ${S}/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${130 + i * 18} ${94 - i * 2} q9 26 0 52" fill="url(#dark)" ${s(4, L)}/>`).join("")}
    <path d="M128 92 h98 v56 h-98z" fill="url(#dark)" opacity=".85"/>
    ${Array.from({ length: 5 }, (_, i) => `<ellipse cx="${138 + i * 20}" cy="120" rx="8" ry="${30 - i * 2}" ${s(3, M)}/>`).join("")}
    <circle cx="256" cy="120" r="40" fill="url(#met)" ${S}/>
    <rect x="290" y="108" width="24" height="24" rx="4" fill="url(#metH)" ${S}/>
    <circle cx="256" cy="120" r="12" fill="${A}"/>`),
  // ---------------- Carrocería
  "farola": svg(`
    <path d="M30 80 Q60 40 180 46 L290 70 Q300 120 260 180 L60 190 Q24 150 30 80Z" fill="url(#dark)" ${S}/>
    <path d="M44 86 Q70 56 178 60 L276 80 Q282 120 250 168 L70 174 Q40 140 44 86Z" fill="url(#glass)" ${s(2, M)}/>
    <circle cx="110" cy="118" r="36" fill="url(#metH)" ${s(3, L)}/><circle cx="110" cy="118" r="16" fill="#fff8e6" ${s(3, A)}/>
    <circle cx="210" cy="118" r="30" fill="url(#metH)" ${s(3, L)}/><circle cx="210" cy="118" r="13" fill="#fff8e6" ${s(3, A)}/>
    <path d="M70 160 Q160 150 250 154" ${s(6, A)}/>`),
  "stop": svg(`
    <path d="M40 60 L250 50 Q290 50 290 90 L270 190 L60 196 Q30 196 34 160Z" fill="url(#dark)" ${S}/>
    <path d="M54 72 L248 64 Q274 64 274 92 L258 180 L68 184 Q48 184 50 160Z" fill="#b3202a" ${s(2, M)}/>
    <rect x="90" y="96" width="120" height="30" rx="8" fill="#ff5a5f" opacity=".85"/>
    <rect x="90" y="134" width="60" height="30" rx="8" fill="#fff" opacity=".85"/>
    <rect x="156" y="134" width="54" height="30" rx="8" fill="${A}" opacity=".95"/>`),
  "espejo": svg(`
    <path d="M60 60 Q60 40 90 40 L250 50 Q290 54 284 100 L270 170 Q262 196 230 194 L90 186 Q56 184 58 150Z" fill="url(#dark)" ${S}/>
    <path d="M76 66 Q76 56 94 56 L246 64 Q270 68 266 100 L254 162 Q248 178 228 178 L94 170 Q74 168 74 148Z" fill="url(#glass)" ${s(2, M)}/>
    <path d="M100 80 L140 76 M100 96 L180 88" ${s(4, "#ffffff")} opacity=".7"/>
    <path d="M30 150 h44 v30 h-30 z" fill="url(#dark)" ${S}/>
    <path d="M230 186 l20 -6" ${s(6, A)}/>`),
  "plumillas": svg(`
    ${[0, 1].map((k) => `<g transform="rotate(${-14 + k * 10} 160 ${120 + k * 30})">
      <rect x="40" y="${100 + k * 34}" width="250" height="14" rx="6" fill="url(#dark)" ${S}/>
      <path d="M44 ${114 + k * 34} h242" ${s(4, "#1b2027")}/>
      <rect x="148" y="${92 + k * 34}" width="34" height="14" rx="4" fill="${k ? A : "url(#metH)"}" ${s(3, L)}/>
    </g>`).join("")}`),
  // ---------------- Lubricantes
  "aceite": svg(`
    <path d="M100 50 h90 l30 30 v120 q0 14 -14 14 h-120 q-14 0 -14 -14 v-120 q0 -16 14 -22z" fill="url(#acc)" ${S}/>
    <rect x="166" y="22" width="34" height="30" rx="5" fill="url(#dark)" ${S}/>
    <path d="M210 70 q24 0 24 30 v40 q0 14 -14 14" ${s(10, "#d9500a")}/>
    <rect x="100" y="104" width="100" height="70" rx="6" fill="#fff" opacity=".92"/>
    <text x="150" y="134" text-anchor="middle" font-family="Arial Black,Arial" font-size="18" fill="${D}">MOTOR</text>
    <text x="150" y="158" text-anchor="middle" font-family="Arial" font-weight="700" font-size="13" fill="${A}">OIL · 1 QT</text>`),
  "refrigerante": svg(`
    <path d="M80 70 h130 q30 0 30 30 v100 q0 14 -14 14 h-146 q-14 0 -14 -14 v-116 q0 -14 14 -14z" fill="#3ddc97" ${S}/>
    <path d="M200 70 v-22 h-30 v22" fill="url(#dark)" ${S}/>
    <path d="M220 90 q30 0 30 30 v36 q0 20 -24 20" ${s(9, "#2bb37a")}/>
    <rect x="86" y="110" width="120" height="70" rx="6" fill="#fff" opacity=".9"/>
    <text x="146" y="140" text-anchor="middle" font-family="Arial Black,Arial" font-size="14" fill="${D}">COOLANT</text>
    <text x="146" y="162" text-anchor="middle" font-family="Arial" font-weight="700" font-size="12" fill="#2bb37a">1 GALÓN</text>`),
  generico: svg(`
    <path d="M160 30 l78 45 v90 l-78 45 l-78 -45 v-90z" fill="url(#met)" ${S}/>
    <path d="M160 30 v180 M82 75 l78 45 l78 -45" ${s(3, D)}/>
    <circle cx="160" cy="120" r="14" fill="${A}"/>`),
};

for (const [nombre, contenido] of Object.entries(imgs)) writeFileSync(join(out, `${nombre}.svg`), contenido);
console.log(`${Object.keys(imgs).length} ilustraciones generadas en public/img/repuestos/`);
