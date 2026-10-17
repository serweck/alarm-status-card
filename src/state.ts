import { mdiShieldAlert, mdiShieldLock, mdiShieldMoon, mdiShieldOff, mdiShieldOffOutline, mdiShieldSync } from "@mdi/js";
import type { CardConfig, StateKey } from "./types";

const VIEWS: Record<StateKey, { color: string; icon: string }> = {
  armed: { color: "#e53935", icon: mdiShieldLock },
  night: { color: "#42a5f5", icon: mdiShieldMoon },
  disarmed: { color: "#4caf50", icon: mdiShieldOff },
  triggered: { color: "#ff1744", icon: mdiShieldAlert },
  transition: { color: "#ffb300", icon: mdiShieldSync },
  offline: { color: "#9e9e9e", icon: mdiShieldOffOutline },
};

/** Cómo se enseña cada estado del panel: texto, color, escudo y si parpadea. */
export function stateView(state: string | undefined, colors?: CardConfig["colors"]) {
  const [key, label]: [StateKey, string] =
    state === "armed_away" || state === "armed_home" || state === "armed_vacation" || state === "armed_custom_bypass" ? ["armed", "Armada"]
    : state === "armed_night" ? ["night", "Modo noche"]
    : state === "disarmed" ? ["disarmed", "Desarmada"]
    : state === "triggered" ? ["triggered", "¡Disparada!"]
    : state === "arming" || state === "pending" ? ["transition", "Armando…"]
    : state === "disarming" ? ["transition", "Desarmando…"]
    : ["offline", "Sin conexión"];
  return { key, label, color: colors?.[key] ?? VIEWS[key].color, icon: VIEWS[key].icon, blink: key === "triggered" };
}

/** Los tres modos de la ventana, con el servicio del panel y los estados en que se marcan. */
export const MODES = [
  { id: "arm_away", label: "Armar total", service: "alarm_arm_away", states: ["armed_away"] },
  { id: "arm_night", label: "Modo noche", service: "alarm_arm_night", states: ["armed_night"] },
  { id: "disarm", label: "Desarmar", service: "alarm_disarm", states: ["disarmed"] },
] as const;

export function validateConfig(c?: Partial<CardConfig>): CardConfig {
  if (!c?.entity) throw new Error("entity es obligatorio");
  return c as CardConfig;
}
