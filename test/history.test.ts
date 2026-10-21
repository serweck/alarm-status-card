import { describe, expect, it } from "vitest";
import { duration, historyRows, when } from "../src/history";

const t = (iso: string) => new Date(iso).getTime() / 1000;

describe("histórico", () => {
  it("de más reciente a más antiguo, con cuándo terminó cada estado", () => {
    const now = new Date("2026-10-20T23:00:00").getTime();
    const rows = historyRows([
      { s: "armed_away", lu: t("2026-10-20T19:14:54") },
      { s: "disarmed", lu: t("2026-10-20T15:20:14") },
      { s: "disarmed", lu: t("2026-10-20T22:21:44") },
    ], now);
    expect(rows.map((r) => r.state)).toEqual(["disarmed", "armed_away", "disarmed"]);
    expect(rows[0].to).toBeUndefined();
    expect(rows[1].to).toBe(t("2026-10-20T22:21:44") * 1000);
  });

  it("quita los sin conexión de milisegundos al recargar plantillas y junta los estados iguales", () => {
    const rows = historyRows([
      { s: "disarmed", lu: t("2026-10-21T11:00:00") },
      { s: "unavailable", lu: t("2026-10-21T11:25:51.251") },
      { s: "disarmed", lu: t("2026-10-21T11:25:51.254") },
    ], new Date("2026-10-21T12:00:00").getTime());
    expect(rows.map((r) => r.state)).toEqual(["disarmed"]);
  });

  it("un sin conexión largo sí sale", () => {
    const rows = historyRows([
      { s: "disarmed", lu: t("2026-10-21T10:00:00") },
      { s: "unavailable", lu: t("2026-10-21T11:00:00") },
      { s: "disarmed", lu: t("2026-10-21T11:05:00") },
    ], new Date("2026-10-21T12:00:00").getTime());
    expect(rows.map((r) => r.state)).toEqual(["disarmed", "unavailable", "disarmed"]);
  });

  it("usa lc cuando viene", () => {
    const [r] = historyRows([{ s: "disarmed", lc: 100, lu: 200 }], 300_000);
    expect(r.from).toBe(100_000);
  });

  it("fechas y duraciones en español", () => {
    const now = new Date("2026-10-21T12:00:00").getTime();
    expect(when(new Date("2026-10-21T11:39:00").getTime(), now)).toBe("hoy 11:39");
    expect(when(new Date("2026-10-20T22:21:00").getTime(), now)).toBe("ayer 22:21");
    expect(when(new Date("2026-10-19T18:51:00").getTime(), now)).toBe("lun 19 oct 18:51");
    expect(duration(45_000)).toBe("45 s");
    expect(duration(12 * 60_000)).toBe("12 min");
    expect(duration((3 * 60 + 6) * 60_000)).toBe("3 h 6 min");
    expect(duration(52 * 3_600_000)).toBe("2 d 4 h");
  });
});
