export type StateKey = "armed" | "night" | "disarmed" | "triggered" | "transition" | "offline";

export interface CardConfig {
  type: string;
  /** El panel de alarma (en casa: alarm_control_panel.alarma_casa, que elige estado y mandos según los selectores de Seguridad). */
  entity: string;
  /** Script del pánico; sin él no sale el botón. */
  panic?: string;
  name?: string;
  /** Días del histórico que sale al mantener pulsada la tarjeta (por defecto 7). */
  history_days?: number;
  colors?: Partial<Record<StateKey, string>>;
}
