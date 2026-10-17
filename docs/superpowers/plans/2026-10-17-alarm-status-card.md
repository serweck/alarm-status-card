# Alarma en el Resumen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una tarjeta de alarma en el Resumen (solo estado; al tocar, ventana con los modos y el pánico en dos pasos), con el estado y los mandos elegidos por dos selectores de Seguridad.

**Architecture:** La lógica vive en HA: un selector nuevo, un panel de alarma de plantilla que elige estado y mandos, y un script de pánico. La tarjeta `alarm-status-card` (Lit) solo enseña el estado del panel y llama a sus servicios y al script. Seguridad (V2) y Resumen se cambian con el procedimiento de siempre.

**Tech Stack:** Lit 3 + TypeScript, rollup, vitest + jsdom, custom-card-helpers, @mdi/js; HA (ayudantes por WebSocket desde Chrome); Python + pytest en Paneles.

**Spec:** `D:/0-Proyectos/0-Obsidian/Obsidian-ClaudeCode/02-Projects/2026-10-17-alarma-resumen-diseno.md`

## Global Constraints

- **Nunca armar, desarmar ni lanzar el pánico de la alarma real para probar.** En HA se comprueba con plantillas (`ha_eval_template`) y leyendo la configuración; en la tarjeta, con `hass.callService` simulado.
- Repo nuevo `D:/0-Proyectos/Domotica/Homeassistant/Componentes Visuales/alarm-status-card`, con la misma estructura que `energy-flow-tree-card` (`package.json`, rollup, `tsconfig` ES2020, vitest + jsdom, `hacs.json`, `dist/` incluido en el repo). Etiqueta `alarm-status-card`, versión `0.1.0`. Textos en español.
- Commits con `git -c user.name=serweck -c user.email=serweck@gmail.com` y el trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push con `GH_TOKEN=$(gh auth token -u serweck)`, URL con token y `timeout 60`.
- Copia de seguridad del Resumen antes de editarlo. El V2 se despliega según `tools/deploy.md` y se para si hay ediciones hechas desde la interfaz.
- Los tres modos van con un solo toque y sin confirmación. El pánico, siempre en dos pasos.

## Review Focus

1. Panel en `unavailable` o `unknown` (o la fuente elegida caída): la tarjeta enseña «Sin conexión» en gris y la ventana deja los modos utilizables, sin fallar. → test en Task 2.
2. Estados de transición (`arming`, `pending`, `disarming`): «Armando…» o «Desarmando…» en ámbar, sin quedarse en blanco. → test en Task 2.
3. Ventana cerrada a mitad del pánico (con la confirmación abierta): al reabrirla, sale sin la confirmación y no se ha llamado al script. → test en Task 3.
4. Doble toque rápido en «Activar»: el script se llama una sola vez. → test en Task 3.
5. Entidad del panel que no existe en `hass.states`: aviso «Elige la entidad del panel» en vez de excepción. → test en Task 2.

---

### Task 1: Ayudantes en HA (selector, script de pánico y panel de plantilla)

**Files (en HA, desde Chrome con `hass.connection.sendMessagePromise`):**
- `input_select.mandos_alarma`: nombre «Mandos de la alarma», opciones `aegis`, `esp` y `jeedom`, valor inicial `esp`, icono `mdi:remote`. Crear con `input_select/create` y poner `esp` con `input_select.select_option`.
- `script.alarma_panico`: «Alarma: pánico», modo `single`, `choose`:
  - `input_select.mandos_alarma == aegis` → `aegis_ajax.press_panic_button` con `target: {entity_id: alarm_control_panel.salon_hub}` y `data: {confirm: true}`;
  - si no → `button.press` sobre `button.esphome_web_ae3f90_panico_ajax`.

  Se crea con `config/script/config/alarma_panico` (POST por `hass.callApi`).
- `alarm_control_panel.alarma_casa`: ayudante de plantilla «Alarma casa», sin código (`code_arm_required: false`). Se crea con el flujo `config_entries/flow` (handler `template`, menú `alarm_control_panel`).
  - `value_template`: el de abajo.
  - `arm_away`, `arm_night` y `disarm`: un `choose` sobre `input_select.mandos_alarma` con las acciones de la tabla «Mandos» del diseño. aegis → `alarm_control_panel.alarm_arm_away`, `alarm_arm_night` o `alarm_disarm` sobre `salon_hub`; esp y jeedom → `button.press` sobre sus botones.

```jinja
{% set src = states('input_select.integracion_alarma_ajax') %}
{% if src == 'aegis' %}{% set s = states('alarm_control_panel.salon_hub') %}
{% elif src == 'sia' %}{% set s = states('alarm_control_panel.8124_aaa_zone_1_alarm') %}
{% else %}{% set j = states('sensor.alarma_ajax_estado_alarma_ajax') | lower %}
  {% set s = 'armed_night' if 'noche' in j else 'disarmed' if 'desarm' in j else 'armed_away' if 'arm' in j
     else 'triggered' if ('dispar' in j or 'alarm' in j) else 'unknown' %}{% endif %}
{{ s if s in ['armed_away','armed_night','armed_home','disarmed','triggered','arming','pending','disarming'] else 'unknown' }}
```

- [ ] **Step 1: Comprobar la plantilla antes de crear nada.** Con `ha_eval_template` sobre el texto de arriba, el resultado debe ser igual a `states('alarm_control_panel.salon_hub')`, porque el selector está ahora en `aegis`.
- [ ] **Step 2:** Crear el selector, el script y el panel. Ninguno se ejecuta.
- [ ] **Step 3: Verificar sin ejecutar.**
  - `ha_get_state` de los tres: existen, el selector vale `esp` y el estado del panel coincide con el del Step 1.
  - `config/script/config/alarma_panico` (GET) devuelve el `choose` previsto.
  - Las opciones del ayudante de plantilla (`config_entries/get` y sus `options`) tienen las tres acciones.
- [ ] **Step 4:** Apuntar en el registro los IDs creados.

### Task 2: Tarjeta: modelo de estado y validación

**Files:**
- Create: `package.json` y el resto de la estructura (Global Constraints); `src/types.ts`, `src/state.ts`
- Test: `test/state.test.ts`, `test/fixtures.ts`

**Interfaces:**
- Produces:
  - `interface CardConfig { type: string; entity: string; panic?: string; name?: string; colors?: Partial<Record<StateKey, string>> }`
  - `type StateKey = "armed" | "night" | "disarmed" | "triggered" | "transition" | "offline"`
  - `function stateView(state: string | undefined, colors?: CardConfig["colors"]): { key: StateKey; label: string; color: string; icon: string; blink: boolean }`
  - `function validateConfig(c?: Partial<CardConfig>): CardConfig` (lanza «entity es obligatorio» si falta)
  - `const MODES = [{ id: "arm_away", label: "Armar total", service: "alarm_arm_away", states: ["armed_away"] }, { id: "arm_night", label: "Modo noche", service: "alarm_arm_night", states: ["armed_night"] }, { id: "disarm", label: "Desarmar", service: "alarm_disarm", states: ["disarmed"] }]`

- [ ] **Step 1: Write the failing tests**

```ts
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
it("cada estado lleva su escudo", ...);   // icon = mdiShieldLock / mdiShieldMoon / mdiShieldOff / mdiShieldAlert / mdiShieldSync / mdiShieldOffOutline
it("entity es obligatorio", () => expect(() => validateConfig({})).toThrow("entity es obligatorio"));
```

- [ ] **Step 2:** `npm install`, después `npx vitest run test/state.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementar `src/types.ts` y `src/state.ts`.
- [ ] **Step 4:** `npx vitest run`. Expected: PASS.
- [ ] **Step 5:** `git init` y commit «feat: estado de la alarma y validación de la configuración».

### Task 3: Tarjeta: elemento, ventana de modos y pánico en dos pasos

**Files:**
- Create: `src/alarm-status-card.ts`, `src/styles.ts`, `src/editor.ts` (un `ha-form` con `entity` del dominio `alarm_control_panel`, `panic` del dominio `script` y `name`)
- Test: `test/card.test.ts`

**Interfaces:**
- Consumes: `stateView`, `MODES` y `validateConfig` (Task 2).
- Produces:
  - el elemento `alarm-status-card`, con `setConfig`, `hass`, `getCardSize()` (3), `getGridOptions()` (`{columns: 6, rows: 2}`), `getConfigElement()` y `getStubConfig()`;
  - `CARD_VERSION = "0.1.0"`, y registro en `window.customCards`.

Comportamiento:
- **Tarjeta:**
  - el escudo (path MDI) y el texto del estado, centrados, sin nada más;
  - la clase `blink` si `blink`;
  - si la entidad no existe en `hass.states`, el aviso «Elige la entidad del panel».
- **Tocar la tarjeta** abre la ventana (un `<div class="dialog">` dentro del propio shadow DOM, con fondo que tapa y se cierra tocando fuera o con «✕»):
  - el título (`name` o «Alarma casa») y «Ahora: <label>»;
  - los tres botones de `MODES`; el que coincide con el estado lleva la clase `on`;
  - el botón «Pánico», solo si hay `panic`.
- **Tocar un modo** → `hass.callService("alarm_control_panel", service, { entity_id })` y cierra la ventana.
- **Tocar «Pánico»** → los modos con la clase `off` y el bloque `.confirm`, con el texto «¿Activar el pánico? Saltarán las sirenas y los avisos de la alarma.» y los botones «Cancelar» y «Activar».
  - «Activar» → `hass.callService("script", "turn_on", { entity_id: panic })` una sola vez, y cierra.
  - «Cancelar» → quita la confirmación.

- [ ] **Step 1: Write the failing tests** (jsdom; `hass` con `callService = vi.fn()`)

```ts
it("la tarjeta solo enseña el escudo y el estado", ...);            // text = "Desarmada"; ningún <button> visible fuera de la ventana
it("tocar abre la ventana con los tres modos y el actual marcado", ...);   // .dialog existe; 3 .mode; .mode.on = "Desarmar"
it("un modo llama al servicio del panel y cierra", ...);           // callService("alarm_control_panel","alarm_arm_night",{entity_id:"alarm_control_panel.alarma_casa"}); .dialog ya no está
it("pánico: el primer toque solo pide confirmación", ...);         // tras tocar .panic: callService no llamado; .confirm con el texto exacto; modos .off
it("pánico: «Activar» llama al script una sola vez aunque se pulse dos veces", ...);  // dos clics → 1 llamada ("script","turn_on",{entity_id:"script.alarma_panico"})
it("pánico: «Cancelar» o cerrar la ventana no llaman a nada y al reabrir no queda la confirmación", ...);
it("sin panic no sale el botón Pánico", ...);
it("disparada parpadea", ...);                                      // la tarjeta lleva la clase blink con "triggered"
it("con la entidad inexistente enseña el aviso y no lanza", ...);
```

- [ ] **Step 2:** `npx vitest run test/card.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementar `src/alarm-status-card.ts`, `src/styles.ts` y `src/editor.ts`. Colores de la ventana como el boceto `alarma.html`: fondo `#232323`, modos `#2c2c2c` y el pánico en `#e53935`.
- [ ] **Step 4:** `npm test && npx tsc --noEmit && npm run build`. Expected: todo en verde.
- [ ] **Step 5:** Commit «feat: tarjeta alarm-status-card con ventana de modos y pánico en dos pasos».

### Task 4: Publicar e instalar

- [ ] **Step 1:** `README.md` (qué hace y configuración `entity` y `panic`), `CHANGELOG.md`, `preview.html` con estados simulados. Comprobarlo a la vista en el navegador: la tarjeta, la ventana y la confirmación.
- [ ] **Step 2:** Commit; `gh repo create serweck/alarm-status-card --public`; push; `gh release create v0.1.0 dist/alarm-status-card.js`.
- [ ] **Step 3:** En HA, `hacs/repositories/add` (plugin) y `hacs/repository/download` v0.1.0. Comprobar que el recurso está en los recursos de Lovelace.

### Task 5: Selector en Seguridad (V2)

**Files (repo Paneles):** Modify `serweck-v2/views/seguridad.yaml` (sección «Integración de la alarma») y `tests/test_views.py` (`test_seguridad_joins_ajax_esp_remotes_and_integration`).

- [ ] **Step 1: Test que falla:** en la sección de integración, después de las tarjetas del fixture de Admin, una tile `input_select.mandos_alarma` llamada «Mandos de la alarma», con `features: [{type: select-options}]` y `grid_options: {columns: 12, rows: 2}`, igual que la del selector de estado.
- [ ] **Step 2:** `python -m pytest tests -q`. Expected: FAIL en ese test.
- [ ] **Step 3:** Añadir la tile al YAML.
- [ ] **Step 4:** `python -m pytest tests -q` y `python tools/build.py`. Expected: todo en verde.
- [ ] **Step 5:** Desplegar (deploy.md) y comprobarlo en pantalla. Commit.

### Task 6: Tarjeta en el Resumen

- [ ] **Step 1:** Copia de seguridad del Resumen con el receptor (`backups/resumen-<fecha>-antes-alarma.json`).
- [ ] **Step 2:** En la vista `home`, sección 0, quitar las tarjetas 0, 1 y 2 (los bloques de estado de Jeedom, SIA y Aegis) y la 3 (la fila de cuatro botones). En su lugar, en la posición 0: `{type: "custom:alarm-status-card", entity: "alarm_control_panel.alarma_casa", panic: "script.alarma_panico", name: "Alarma casa"}`. Antes de quitarlas, comprobar sus tipos y entidades (son los del plan).
- [ ] **Step 3:** Revisar en pantalla, en escritorio y a 412 px. **Sin tocar ningún modo ni el pánico:** basta con abrir y cerrar la ventana. Commit de la copia en Paneles.
