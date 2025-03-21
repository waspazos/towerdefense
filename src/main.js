import { Game } from './Game.js';

// Start the game when page loads
window.addEventListener('load', () => {
  const game = new Game();
  game.initialize();
});