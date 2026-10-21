/** Un cambio de estado tal como lo devuelve `history/history_during_period` con minimal_response: `s` estado,
 *  `lc`/`lu` en segundos (lc solo viene cuando difiere de lu). */
export interface RawChange { s: string; lc?: number; lu: number }

export interface Change { state: string; from: number; to?: number }

/** Los «sin conexión» más cortos que esto no se enseñan: al recargar las plantillas el panel pasa por unavailable unos milisegundos. */
export const BLIP_MS = 10_000;

/** De más reciente a más antiguo, sin los parpadeos de sin conexión y con los estados seguidos iguales juntos.
 *  `to` es cuándo terminó cada estado (el actual no lo lleva). */
export function historyRows(raw: RawChange[], now = Date.now()): Change[] {
  const all = raw.map((r) => ({ state: r.s, from: (r.lc ?? r.lu) * 1000 })).sort((a, b) => a.from - b.from);
  const out: Change[] = [];
  all.forEach((c, i) => {
    const end = all[i + 1]?.from ?? now;
    if ((c.state === "unavailable" || c.state === "unknown") && end - c.from < BLIP_MS && i < all.length - 1) return;
    const last = out[out.length - 1];
    if (last && last.state === c.state) return;
    if (last) last.to = c.from;
    out.push({ state: c.state, from: c.from });
  });
  return out.reverse();
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** «hoy 11:39», «ayer 22:21» o «lun 19 oct 18:51». */
export function when(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date(now)) - day(d)) / 86_400_000);
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return diff === 0 ? `hoy ${hm}` : diff === 1 ? `ayer ${hm}` : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${hm}`;
}

/** «45 s», «12 min», «3 h 6 min», «2 d 4 h». */
export function duration(ms: number): string {
  const m = Math.floor(ms / 60_000);
  if (m < 1) return `${Math.max(0, Math.round(ms / 1000))} s`;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
  return h % 24 ? `${Math.floor(h / 24)} d ${h % 24} h` : `${Math.floor(h / 24)} d`;
}
