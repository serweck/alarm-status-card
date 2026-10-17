import { LitElement, html, nothing } from "lit";
import type { HomeAssistant } from "custom-card-helpers";
import type { CardConfig } from "./types";

export const EDITOR_TAG = "alarm-status-card-editor";

const SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "alarm_control_panel" } } },
  { name: "panic", selector: { entity: { domain: "script" } } },
  { name: "name", selector: { text: {} } },
];
const LABELS: Record<string, string> = { entity: "Panel de alarma", panic: "Script del pánico", name: "Título de la ventana" };

/** Editor visual: el panel, el script del pánico y el título de la ventana. */
export class AlarmStatusCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, _config: { state: true } };
  hass?: HomeAssistant;
  private _config?: CardConfig;

  setConfig(config: CardConfig): void { this._config = config; }

  protected render() {
    if (!this._config) return nothing;
    return html`<ha-form .hass=${this.hass} .data=${this._config} .schema=${SCHEMA} .computeLabel=${(s: { name: string }) => LABELS[s.name] ?? s.name}
      @value-changed=${(e: CustomEvent) => {
        this._config = { ...this._config!, ...e.detail.value };
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
      }}></ha-form>`;
  }
}

if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, AlarmStatusCardEditor);
