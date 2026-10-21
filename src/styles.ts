import { css } from "lit";

export const styles = css`
  :host { display: block; }
  ha-card { position: relative; height: 100%; }
  .tile { height: 100%; min-height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
          padding: 12px; box-sizing: border-box; cursor: pointer; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .tile svg { width: 64px; height: 64px; }
  .tile .label { font-size: 18px; font-weight: 600; color: var(--primary-text-color); }
  /* Disparada: el escudo parpadea. */
  .tile.blink svg { animation: as-blink 0.9s ease-in-out infinite; }
  @keyframes as-blink { 50% { opacity: 0.25; } }
  .hint { padding: 16px; color: var(--secondary-text-color); }
  .dialog { width: min(340px, calc(100vw - 32px)); box-sizing: border-box; padding: 0; border: 0; border-radius: 16px;
            background: var(--ha-card-background, #232323); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); color: var(--primary-text-color); }
  .dialog::backdrop { background: rgba(0, 0, 0, 0.55); }
  .box { position: relative; padding: 18px; }
  .dialog h3 { margin: 0 0 4px; font-size: 17px; }
  .now { color: var(--secondary-text-color); font-size: 13px; margin-bottom: 14px; }
  .close { position: absolute; top: 10px; right: 10px; background: none; border: 0; color: var(--secondary-text-color); font-size: 18px; cursor: pointer; }
  .modes { display: grid; gap: 8px; }
  button { font: inherit; color: inherit; cursor: pointer; }
  .mode { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; border: 0; background: var(--secondary-background-color, #2c2c2c);
          font-size: 15px; text-align: left; }
  .mode svg { width: 26px; height: 26px; flex: none; }
  .mode.on { outline: 2px solid var(--primary-color, #4caf50); }
  .mode.off { opacity: 0.35; }
  .panic { width: 100%; margin-top: 16px; padding: 12px; border-radius: 12px; border: 1px solid rgba(229, 57, 53, 0.45);
           background: rgba(229, 57, 53, 0.13); color: #ef5350; font-weight: 600; }
  .confirm { margin-top: 16px; padding: 14px; border-radius: 12px; background: rgba(229, 57, 53, 0.2); border: 1px solid #e53935; }
  .confirm p { margin: 0 0 12px; color: #ffcdd2; }
  .btns { display: flex; gap: 8px; }
  .btns button { flex: 1; padding: 10px; border-radius: 10px; border: 0; font-weight: 600; }
  .cancel { background: var(--secondary-background-color, #3a3a3a); }
  .history .box { max-height: min(70vh, 560px); display: flex; flex-direction: column; }
  .hist { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
  .hist li { display: grid; grid-template-columns: 22px 1fr auto; grid-template-areas: "i w a" "i f f"; column-gap: 10px; align-items: center;
             padding: 8px 2px; border-top: 1px solid var(--divider-color, rgba(255, 255, 255, 0.08)); }
  .hist li:first-child { border-top: 0; }
  .hist svg { grid-area: i; width: 22px; height: 22px; }
  .hist .what { grid-area: w; font-weight: 600; font-size: 14px; }
  .hist .at { grid-area: a; font-size: 13px; color: var(--secondary-text-color); font-variant-numeric: tabular-nums; }
  .hist .for { grid-area: f; font-size: 12px; color: var(--secondary-text-color); }
  .empty { margin: 8px 0; color: var(--secondary-text-color); }
  .go { background: #e53935; color: #fff !important; }
`;
