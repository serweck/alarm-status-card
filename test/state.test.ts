import { describe, expect, it } from "vitest";
import { mdiShieldAlert, mdiShieldLock, mdiShieldMoon, mdiShieldOff, mdiShieldOffOutline, mdiShieldSync } from "@mdi/js";
import { MODES, stateView, validateConfig } from "../src/state";

describe("stateView", () => {
  it.each([
    ["armed_away", "armed", "Armada", "#e53935", false], ["armed_home", "armed", "Armada", "#e53935", false],
    ["armed_night", "night", "Modo noche", "#42a5f5", false], ["disarmed", "disarmed", "Desarmada", "#4caf50", false],
    ["triggered", "triggered", "¡Disparada!", "#ff1744", true],
    ["arming", "transition", "Armando…", "#ffb300", false], ["pending", "transition", "Armando…", "#ffb300", false],
    ["disarming", "transition", "Desarmando…", "#ffb300", false],
    ["unavailable", "offline", "Sin conexión", "#9e9e9e", false], ["unknown", "offline", "Sin conexión", "#9e9e9e", false],
    [undefined, "offline", "Sin conexión", "#9e9e9e", false],
  ])("stateView(%s)", (st, key, label, color, blink) => expect(stateView(st)).toMatchObject({ key, label, color, blink }));

  it("los colores se pueden cambiar", () => expect(stateView("disarmed", { disarmed: "#00ff00" }).color).toBe("#00ff00"));

  it("cada estado lleva su escudo", () => {
    expect(stateView("armed_away").icon).toBe(mdiShieldLock);
    expect(stateView("armed_night").icon).toBe(mdiShieldMoon);
    expect(stateView("disarmed").icon).toBe(mdiShieldOff);
    expect(stateView("triggered").icon).toBe(mdiShieldAlert);
    expect(stateView("arming").icon).toBe(mdiShieldSync);
    expect(stateView("unavailable").icon).toBe(mdiShieldOffOutline);
  });
});

describe("MODES", () => {
  it("armar total, modo noche y desarmar, con su servicio", () =>
    expect(MODES.map((m) => [m.label, m.service])).toEqual([["Armar total", "alarm_arm_away"], ["Modo noche", "alarm_arm_night"], ["Desarmar", "alarm_disarm"]]));
});

describe("validateConfig", () => {
  it("entity es obligatorio", () => expect(() => validateConfig({})).toThrow("entity es obligatorio"));
  it("acepta entity y panic", () => expect(validateConfig({ type: "custom:alarm-status-card", entity: "alarm_control_panel.alarma_casa", panic: "script.alarma_panico" }).panic).toBe("script.alarma_panico"));
});
