# Changelog

## 0.2.0 · 2026-10-21

- Mantener pulsada la tarjeta abre el histórico de cambios de estado (últimos `history_days`, 7 por defecto), con cuándo empezó y cuánto duró cada estado. Sin los cortes de «sin conexión» de milisegundos al recargar plantillas.

## 0.1.3 · 2026-10-17

- Modo noche con la luna (mdi:weather-night), en la tarjeta y en el botón de la ventana.

## 0.1.2 · 2026-10-17

- Anti doble toque: los botones de la ventana no responden el primer medio segundo tras abrirla, y «Activar» tampoco tras salir la confirmación del pánico (`armDelay`).

## 0.1.1 · 2026-10-17

- La ventana es un <dialog> nativo: queda por encima de todas las tarjetas (antes otras tarjetas podían taparla). Se cierra también con Esc.

## 0.1.0 · 2026-10-17

- Primera versión: escudo con el estado, ventana con los tres modos y pánico en dos pasos.
