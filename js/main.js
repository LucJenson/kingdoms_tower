// ─────────────────────────────────────────────────────────────────────────────
// main.js – Bootstrap entry point
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const hasSave = Game.loadGame();

  if (hasSave) {
    document.getElementById('faction-select-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    // Delegate all wiring to the same path startGame() uses inside ui.js
    // We need to call the internal buildGameUI equivalent — expose it via a
    // lightweight resume function in UI.
    UI.resumeGame();
  } else {
    UI.buildFactionSelect();
  }
});
