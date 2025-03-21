import { Game } from "./Game.js";

// Start the game when page loads
window.addEventListener("load", async () => {
  window.game = new Game();
  window.game.setup();
  await window.game.initialize();
});
