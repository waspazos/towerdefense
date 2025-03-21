import { EventSystem } from './engine/EventSystem.js';
import { Renderer } from './engine/Renderer.js';
import { InputManager } from './engine/InputManager.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { PathingSystem } from './systems/PathingSystem.js';
import { AugmentSystem } from './systems/AugmentSystem.js';
import { UIManager } from './ui/UIManager.js';
import GameState from './states/GameState.js';
import PlayingState from './states/PlayingState.js';
import MenuState from './states/MenuState.js';
import HUD from './ui/HUD.js';

export class Game {
  constructor() {
    this.lastTime = 0;
    this.isRunning = false;
  }

  setup() {
    // Initialize systems
    this.eventSystem = new EventSystem();
    this.renderer = new Renderer();
    this.inputManager = new InputManager(this.eventSystem, this.renderer);
    this.combatSystem = new CombatSystem(this.eventSystem, this.renderer);
    this.pathingSystem = new PathingSystem(this.eventSystem, this.renderer);
    this.augmentSystem = new AugmentSystem();
    this.uiManager = new UIManager();
    this.gameState = new GameState();
    this.playingState = new PlayingState();
    this.menuState = new MenuState();
    this.hud = new HUD();

    // Register event listeners
    this.eventSystem.on('restartGame', this.restart.bind(this));
    this.eventSystem.on('addToScene', this.handleAddToScene.bind(this));
    this.eventSystem.on('removeFromScene', this.handleRemoveFromScene.bind(this));
  }

  initialize() {
    // Initialize renderer
    this.renderer.initialize('canvas-container');

    // Initialize input manager
    this.inputManager.initialize();

    // Initialize systems
    this.pathingSystem.initialize();
    this.augmentSystem.initialize();

    // Initialize UI
    this.uiManager.initialize();
    this.inputManager.addDOMListeners();

    // Initialize game state
    this.gameState.initialize();

    // Activate playing state
    this.playingState.activate();

    // Start game loop
    this.isRunning = true;
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    // Calculate delta time
    const currentTime = timestamp / 1000; // Convert to seconds
    const delta = this.lastTime ? currentTime - this.lastTime : 0;
    this.lastTime = currentTime;

    // Skip update if paused
    if (!this.gameState.isPaused) {
      // Update game state
      this.gameState.update(delta);

      // Update systems
      this.combatSystem.update(delta);
      this.pathingSystem.update(delta);

      // Update HUD
      this.eventSystem.emit('updateDPS', { delta, currentTime });
      this.hud.update();
    }

    // Render scene
    this.renderer.render();

    // Continue loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  restart() {
    // Reset game state
    this.gameState.reset();

    // Re-initialize game
    this.gameState.initialize();

    // Make sure we're in playing state
    this.playingState.activate();
    this.menuState.deactivate();

    // Reset clock
    this.lastTime = 0;

    // Resume game loop if not running
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(this.gameLoop.bind(this));
    }
  }

  handleAddToScene(data) {
    const { object } = data;
    if (object && this.renderer.scene) {
      this.renderer.scene.add(object);
    }
  }

  handleRemoveFromScene(data) {
    const { object } = data;
    if (object && this.renderer.scene) {
      this.renderer.scene.remove(object);
    }
  }
}
