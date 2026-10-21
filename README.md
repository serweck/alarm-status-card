# Alarm Status Card

Tarjeta Lovelace para Home Assistant que enseña **solo el estado de la alarma**: un escudo grande con su color (armada, modo noche, desarmada, disparada parpadeando, armando o desarmando, sin conexión) y su texto.

- **Tocarla** abre una ventana con los tres modos (Armar total, Modo noche y Desarmar), con el actual marcado. Un toque cambia el modo.
- **Mantenerla pulsada** (medio segundo) abre el histórico de cambios de estado de los últimos días: cada estado con su escudo, cuándo empezó y cuánto duró. Los cortes de «sin conexión» de menos de 10 s (los que hace el panel al recargar las plantillas) no salen.
- **Pánico** dentro de la ventana y siempre en dos pasos: «Pánico» y después «Activar». Si se cancela o se cierra la ventana, no se lanza.

Pensada para un panel de alarma «envoltorio» (por ejemplo, un ayudante de plantilla que elija de qué integración sale el estado y con qué mandos se arma) y un script de pánico.

## Instalación (HACS)

1. HACS → menú ⋮ → *Repositorios personalizados* → `https://github.com/serweck/alarm-status-card`, tipo *Dashboard*.
2. Instala **Alarm Status Card** y recarga el navegador.

## Configuración

```yaml
type: custom:alarm-status-card
entity: alarm_control_panel.alarma_casa   # obligatorio
panic: script.alarma_panico               # opcional: sin él no sale el botón de pánico
name: Alarma casa                         # opcional: título de la ventana
history_days: 7                           # opcional: días del histórico (por defecto 7)
colors:                                   # opcional
  armed: "#e53935"
  night: "#42a5f5"
  disarmed: "#4caf50"
  triggered: "#ff1744"
  transition: "#ffb300"
  offline: "#9e9e9e"
```

Los modos llaman a `alarm_control_panel.alarm_arm_away`, `alarm_arm_night` y `alarm_disarm` sobre `entity`; el pánico, a `script.turn_on` sobre `panic`. El histórico se lee con `history/history_during_period` (el recorder de HA).

## Desarrollo

`npm install`, `npm test`, `npm run build` y `npm run preview` (abre `preview.html` con estados simulados).
