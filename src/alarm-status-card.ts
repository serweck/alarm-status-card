import { LitElement, html, nothing } from "lit";
import type { HomeAssistant } from "custom-card-helpers";
import { MODES, stateView, validateConfig } from "./state";
import { styles } from "./styles";
import type { CardConfig } from "./types";
import "./editor";

export const CARD_TAG = "alarm-status-card";
export const CARD_VERSION = "0.1.3";

const shield = (path: string, color: string) =>
  html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${path} style=${`fill: ${color}`}></path></svg>`;

export class AlarmStatusCard extends LitElement {
  static styles = styles;
  static properties = { hass: { attribute: false }, _config: { state: true }, _open: { state: true }, _confirm: { state: true } };

  hass?: HomeAssistant;
  private _config?: CardConfig;
  /** Ventana abierta. */
  private _open = false;
  /** Confirmación del pánico a la vista. */
  private _confirm = false;
  /** El pánico ya se ha lanzado en esta confirmación (un doble toque no lo repite). */
  private _fired = false;
  /** Los botones de la ventana no responden este tiempo tras abrirla o tras salir la confirmación: el segundo toque
   *  de un doble toque no cambia el modo ni activa el pánico. */
  armDelay = 500;
  private _openedAt = 0;
  private _confirmAt = 0;

  static getConfigElement(): HTMLElement { return document.createElement(`${CARD_TAG}-editor`); }
  static getStubConfig(): Partial<CardConfig> { return { entity: "", panic: "" }; }

  setConfig(config: CardConfig): void { this._config = validateConfig(config); }
  getCardSize(): number { return 3; }
  getGridOptions(): { columns: number; rows: number } { return { columns: 6, rows: 2 }; }

  private _show(): void { this._open = true; this._confirm = false; this._fired = false; this._openedAt = Date.now(); }
  private _settled(since: number): boolean { return Date.now() - since >= this.armDelay; }
  private _askPanic(): void {
    if (!this._settled(this._openedAt)) return;
    this._confirm = true;
    this._confirmAt = Date.now();
  }
  private _close(): void { this._open = false; this._confirm = false; }

  /** La ventana es un <dialog> nativo abierto con showModal: va a la capa superior y ninguna tarjeta la tapa. */
  protected updated(): void {
    const d = this.shadowRoot?.querySelector("dialog");
    if (d && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    }
  }

  private _mode(service: string): void {
    if (!this._settled(this._openedAt)) return;
    this.hass?.callService("alarm_control_panel", service, { entity_id: this._config!.entity });
    this._close();
  }

  private _panic(): void {
    if (this._fired || !this._config?.panic || !this._settled(this._confirmAt)) return;
    this._fired = true;
    this.hass?.callService("script", "turn_on", { entity_id: this._config.panic });
    this._close();
  }

  protected render() {
    const c = this._config;
    if (!c || !this.hass) return nothing;
    const st = this.hass.states[c.entity];
    if (!st) return html`<ha-card><div class="hint">Elige la entidad del panel</div></ha-card>`;
    const v = stateView(st.state, c.colors);
    return html`<ha-card>
      <div class=${`tile ${v.blink ? "blink" : ""}`} role="button" tabindex="0" @click=${() => this._show()}
        @keydown=${(e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && this._show()}>
        ${shield(v.icon, v.color)}<span class="label">${v.label}</span>
      </div>
      ${this._open ? this._dialog(st.state, v.label) : nothing}
    </ha-card>`;
  }

  private _dialog(state: string, label: string) {
    const c = this._config!;
    // tocar fuera (el propio <dialog>, que ocupa el fondo) o Esc cierran
    return html`<dialog class="dialog" aria-label=${c.name ?? "Alarma casa"} @close=${() => this._close()}
        @click=${(e: Event) => { if (e.target === e.currentTarget) this._close(); }}><div class="box">
        <button class="close" aria-label="Cerrar" @click=${() => this._close()}>✕</button>
        <h3>${c.name ?? "Alarma casa"}</h3>
        <div class="now">Ahora: ${label}</div>
        <div class="modes">
          ${MODES.map((m) => {
            const v = stateView(m.states[0], c.colors);
            const cls = `mode ${(m.states as readonly string[]).includes(state) ? "on" : ""} ${this._confirm ? "off" : ""}`;
            return html`<button class=${cls} ?disabled=${this._confirm} @click=${() => this._mode(m.service)}>${shield(v.icon, v.color)}<span>${m.label}</span></button>`;
          })}
        </div>
        ${c.panic ? (this._confirm
          ? html`<div class="confirm"><p><b>¿Activar el pánico?</b> Saltarán las sirenas y los avisos de la alarma.</p>
              <div class="btns"><button class="cancel" @click=${() => { this._confirm = false; }}>Cancelar</button>
                <button class="go" @click=${() => this._panic()}>Activar</button></div></div>`
          : html`<button class="panic" @click=${() => this._askPanic()}>⚠ Pánico</button>`) : nothing}
      </div></dialog>`;
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AlarmStatusCard);

const w = window as unknown as { customCards?: unknown[] };
w.customCards = w.customCards || [];
w.customCards.push({ type: CARD_TAG, name: "Alarm Status Card", description: "Estado de la alarma; al tocar, modos y pánico con confirmación", preview: false });
console.info(`%c ${CARD_TAG} %c ${CARD_VERSION} `, "background:#e53935;color:#fff", "background:#333;color:#fff");
