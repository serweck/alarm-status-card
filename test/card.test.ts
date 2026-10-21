import { describe, expect, it, vi } from "vitest";
import "../src/alarm-status-card";

type El = HTMLElement & { setConfig(c: unknown): void; hass: unknown; updateComplete: Promise<boolean> };
const CONFIG = { type: "custom:alarm-status-card", entity: "alarm_control_panel.alarma_casa", panic: "script.alarma_panico" };

// Los botones de la ventana no responden el primer medio segundo (anti doble toque): los tests lo saltan con ARM_DELAY_MS = 0.
async function mount(state = "disarmed", config: Record<string, unknown> = CONFIG, delay = 0) {
  const callService = vi.fn();
  const card = document.createElement("alarm-status-card") as El;
  card.setConfig(config);
  (card as unknown as { armDelay: number }).armDelay = delay;
  card.hass = { states: state === "missing" ? {} : { "alarm_control_panel.alarma_casa": { state, attributes: {} } }, callService };
  document.body.appendChild(card);
  await card.updateComplete;
  const root = card.shadowRoot!;
  const $ = (s: string) => root.querySelector(s) as HTMLElement | null;
  const $$ = (s: string) => Array.from(root.querySelectorAll(s)) as HTMLElement[];
  const click = async (s: string) => { $(s)!.click(); await card.updateComplete; };
  return { card, $, $$, click, callService };
}
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim();

describe("tarjeta", () => {
  it("la tarjeta solo enseña el escudo y el estado", async () => {
    const { $, $$ } = await mount();
    expect(text($(".tile"))).toBe("Desarmada");
    expect($(".tile svg path")).not.toBeNull();
    expect($(".dialog")).toBeNull();
    expect($$("button")).toHaveLength(0);
  });

  it("tocar abre la ventana con los tres modos y el actual marcado", async () => {
    const { $, $$, click } = await mount();
    await click(".tile");
    expect($(".dialog")).not.toBeNull();
    expect(text($(".dialog h3"))).toBe("Alarma casa");
    expect(text($(".dialog .now"))).toBe("Ahora: Desarmada");
    expect($$(".mode").map((b) => text(b))).toEqual(["Armar total", "Modo noche", "Desarmar"]);
    expect(text($(".mode.on"))).toBe("Desarmar");
  });

  it("la ventana es un <dialog> nativo abierto con showModal, para quedar por encima de todas las tarjetas", async () => {
    const show = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
    const proto = HTMLDialogElement.prototype as unknown as { showModal?: () => void };
    const original = proto.showModal;
    proto.showModal = show;
    const { $, click } = await mount();
    await click(".tile");
    expect($(".dialog")!.tagName).toBe("DIALOG");
    expect(show).toHaveBeenCalledTimes(1);
    proto.showModal = original;
  });

  it("un modo llama al servicio del panel y cierra", async () => {
    const { $, $$, click, callService, card } = await mount();
    await click(".tile");
    $$(".mode")[1].click();
    await card.updateComplete;
    expect(callService).toHaveBeenCalledWith("alarm_control_panel", "alarm_arm_night", { entity_id: "alarm_control_panel.alarma_casa" });
    expect($(".dialog")).toBeNull();
  });

  it("pánico: el primer toque solo pide confirmación", async () => {
    const { $, $$, click, callService } = await mount();
    await click(".tile");
    await click(".panic");
    expect(callService).not.toHaveBeenCalled();
    expect(text($(".confirm p"))).toBe("¿Activar el pánico? Saltarán las sirenas y los avisos de la alarma.");
    expect($$(".mode.off")).toHaveLength(3);
  });

  it("pánico: «Activar» llama al script una sola vez aunque se pulse dos veces", async () => {
    const { $, click, callService, card } = await mount();
    await click(".tile");
    await click(".panic");
    const go = $(".confirm .go")!;
    go.click();
    go.click();
    await card.updateComplete;
    expect(callService).toHaveBeenCalledTimes(1);
    expect(callService).toHaveBeenCalledWith("script", "turn_on", { entity_id: "script.alarma_panico" });
    expect($(".dialog")).toBeNull();
  });

  it("pánico: «Cancelar» o cerrar la ventana no llaman a nada y al reabrir no queda la confirmación", async () => {
    const { $, click, callService } = await mount();
    await click(".tile");
    await click(".panic");
    await click(".confirm .cancel");
    expect($(".confirm")).toBeNull();
    await click(".panic");
    await click(".close");
    expect($(".dialog")).toBeNull();
    await click(".tile");
    expect($(".confirm")).toBeNull();
    expect(callService).not.toHaveBeenCalled();
  });

  it("un doble toque en la tarjeta no cambia el modo: los botones no responden el primer medio segundo", async () => {
    vi.useFakeTimers();
    const { $$, click, callService, card } = await mount("disarmed", CONFIG, 500);
    await click(".tile");
    $$(".mode")[2].click();           // el segundo toque del doble toque cae en «Desarmar»
    await card.updateComplete;
    expect(callService).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    $$(".mode")[2].click();
    expect(callService).toHaveBeenCalledWith("alarm_control_panel", "alarm_disarm", { entity_id: "alarm_control_panel.alarma_casa" });
    vi.useRealTimers();
  });

  it("un doble toque en «Pánico» no lo activa: «Activar» no responde el primer medio segundo", async () => {
    vi.useFakeTimers();
    const { $, click, callService } = await mount("disarmed", CONFIG, 500);
    await click(".tile");
    vi.advanceTimersByTime(600);
    await click(".panic");
    $(".confirm .go")!.click();      // el segundo toque cae en «Activar»
    expect(callService).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    $(".confirm .go")!.click();
    expect(callService).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("sin panic no sale el botón Pánico", async () => {
    const { $, click } = await mount("disarmed", { type: "custom:alarm-status-card", entity: "alarm_control_panel.alarma_casa" });
    await click(".tile");
    expect($(".panic")).toBeNull();
  });

  it("disparada parpadea", async () => {
    const { $ } = await mount("triggered");
    expect($(".tile")!.classList.contains("blink")).toBe(true);
    expect(text($(".tile"))).toBe("¡Disparada!");
  });

  it("sin conexión: gris y la ventana sigue dejando usar los modos", async () => {
    const { $, $$, click } = await mount("unavailable");
    expect(text($(".tile"))).toBe("Sin conexión");
    await click(".tile");
    expect($$(".mode")).toHaveLength(3);
    expect($(".mode.on")).toBeNull();
  });

  it("mantener pulsado abre el histórico nativo de HA y al soltar no se abren los modos", async () => {
    vi.useFakeTimers();
    const { card, $ } = await mount();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", (e) => moreInfo((e as CustomEvent).detail));
    const tile = $(".tile")!;
    tile.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
    await vi.advanceTimersByTimeAsync(600);
    tile.dispatchEvent(new MouseEvent("pointerup"));
    tile.click();
    await card.updateComplete;
    vi.useRealTimers();
    expect(moreInfo).toHaveBeenCalledWith({ entityId: "alarm_control_panel.alarma_casa", view: "history" });
    expect($(".dialog")).toBeNull();
  });

  it("un toque corto abre los modos y no el histórico", async () => {
    vi.useFakeTimers();
    const { $, card } = await mount();
    const moreInfo = vi.fn();
    card.addEventListener("hass-more-info", moreInfo);
    const tile = $(".tile")!;
    tile.dispatchEvent(new MouseEvent("pointerdown", { button: 0 }));
    await vi.advanceTimersByTimeAsync(100);
    tile.dispatchEvent(new MouseEvent("pointerup"));
    tile.click();
    await vi.advanceTimersByTimeAsync(1000);
    await card.updateComplete;
    vi.useRealTimers();
    expect(moreInfo).not.toHaveBeenCalled();
    expect($(".mode")).not.toBeNull();
  });

  it("con la entidad inexistente enseña el aviso y no lanza", async () => {
    const { $ } = await mount("missing");
    expect(text($(".hint"))).toBe("Elige la entidad del panel");
  });
});
