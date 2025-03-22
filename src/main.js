import { Game } from "./Game.js";
import { towerConfig } from "./config/towerConfig.js";
import { augmentConfig } from "./config/augmentConfig.js";
import { roundConfig } from "./config/roundConfig.js";
import { creepConfig } from "./config/creepConfig.js";
import { pathConfig } from "./config/pathConfig.js";

// Start the game when page loads
window.addEventListener("load", async () => {
  console.log("Page loaded, initializing game...");
  
  // Make key configs globally available
  window.towerConfig = towerConfig;
  window.augmentConfig = augmentConfig;
  window.roundConfig = roundConfig;
  window.creepConfig = creepConfig;
  window.pathConfig = pathConfig;
  
  // Create and initialize the game
  window.game = new Game();
  window.game.setup();
  await window.game.initialize();
  
  console.log("Game initialization complete");
});