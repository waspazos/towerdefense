// src/Game.js
import { EventSystem } from "/src/engine/EventSystem.js";
import { InputManager } from "/src/engine/InputManager.js";
import { Renderer } from "/src/engine/Renderer.js";
import { GameState } from "/src/states/GameState.js";
import { MenuState } from "/src/states/MenuState.js";
import { PlayingState } from "/src/states/PlayingState.js";
import { PathingSystem } from "/src/systems/PathingSystem.js";
import { CombatSystem } from "/src/systems/CombatSystem.js";
import { EconomySystem } from "/src/systems/EconomySystem.js";
import { UIManager } from "/src/ui/UIManager.js";
import HUD from "/src/ui/HUD.js";
import { King } from "/src/entities/King.js";
import { roundConfig } from "/src/config/roundConfig.js";
import { towerConfig } from "/src/config/towerConfig.js";

export class Game {
  constructor() {
    // Game systems
    this.eventSystem = new EventSystem();
    this.renderer = new Renderer(this.eventSystem);
    this.inputManager = new InputManager(this.eventSystem, this.renderer);
    this.gameState = new GameState(this.eventSystem);
    this.menuState = new MenuState(this.eventSystem);
    this.playingState = new PlayingState(this.eventSystem);
    this.pathingSystem = new PathingSystem(this.eventSystem, this.renderer);
    this.combatSystem = new CombatSystem(this.eventSystem);
    this.economySystem = new EconomySystem(this.eventSystem);
    this.uiManager = new UIManager(this.eventSystem);
    this.hud = new HUD(this.eventSystem);
    
    // Game properties
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.king = null;
    this.selectedFaction = null; // New property for faction
    
    // Make config globally available
    window.towerConfig = towerConfig;
    window.roundConfig = roundConfig;
    
    // Register event handlers
    this.eventSystem.on("addToScene", this.handleAddToScene.bind(this));
    this.eventSystem.on("removeFromScene", this.handleRemoveFromScene.bind(this));
    this.eventSystem.on("restartGame", this.restart.bind(this));
    this.eventSystem.on("pause", this.pause.bind(this));
    this.eventSystem.on("resume", this.resume.bind(this));
    this.eventSystem.on("selectFaction", this.selectFaction.bind(this)); // New event handler
    this.eventSystem.on("getRenderer", this.handleGetRenderer.bind(this)); // New event handler
    
    console.log("Game: Constructed");
  }

  setup() {
    // Initialize renderer
    this.renderer.initialize("canvas-container");
    
    // Create the king at the new position
    const kingPosition = new window["THREE"].Vector3(20, 0, 20);
    this.king = new King(kingPosition);
    
    // Initialize input manager
    this.inputManager.initialize();
    this.inputManager.addDOMListeners();
    
    // Show faction selection UI
    this.eventSystem.emit("showFactionSelection");
    
    console.log("Game: Setup complete");
  }

  async initialize() {
    console.log("Game: Initializing");
    
    // Initialize systems
    this.pathingSystem.initialize();
    roundConfig.initialize();
    
    // Initialize UI
    this.uiManager.initialize();
    
    // Initialize game state
    await this.gameState.initialize();
    
    // Activate playing state
    this.playingState.activate();
    
    // Start game loop
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
    
    console.log("Game: Initialization complete");
  }

  selectFaction(data) {
    const { faction } = data;
    if (towerConfig.factions[faction]) {
      // Show loading state
      this.eventSystem.emit("showLoadingState", { type: "faction" });
      
      this.selectedFaction = faction;
      console.log(`Game: Faction '${faction}' selected`);
      
      // Initialize economy with faction starting gold
      const startingGold = towerConfig.factions[faction].startingGold || 20;
      this.eventSystem.emit("initializeEconomy", { startingGold });
      
      // Continue with game initialization
      setTimeout(async () => {
        await this.initialize();
        // Hide loading state after initialization
        this.eventSystem.emit("hideLoadingState", { type: "faction" });
        // Hide faction selection UI
        this.eventSystem.emit("hideFactionSelection");
      }, 300);
    }
  }

  gameLoop(timestamp) {
    // Calculate delta time in seconds
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    // Skip update if paused, but still render
    if (!this.isPaused && this.isRunning) {
      this.update(delta);
    }
    
    // Always render with the same delta time
    this.render(delta);
    
    // Continue game loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  update(delta) {
    // Update game systems
    this.gameState.update(delta);
    this.pathingSystem.update(delta);
    this.combatSystem.update(delta);
    
    // Update DPS calculation
    this.eventSystem.emit("updateDPS", { 
      delta, 
      currentTime: performance.now() / 1000 
    });
  }

  render(delta) {
    // Render with the provided delta time
    this.renderer.render(delta);
  }

  pause() {
    this.isPaused = true;
    console.log("Game: Paused");
  }

  resume() {
    this.isPaused = false;
    console.log("Game: Resumed");
  }

  async restart() {
    console.log("Game: Restarting");
    
    // Reset faction selection
    this.selectedFaction = null;
    
    // Show faction selection screen
    this.eventSystem.emit("showUI", { type: "factionSelection" });
    
    // Reset game state
    await this.gameState.initialize();
    
    // Resume if paused
    this.isPaused = false;
    
    console.log("Game: Restart complete");
  }

  handleAddToScene(data) {
    const { object } = data;
    if (object) {
      this.renderer.scene.add(object);
    }
  }

  handleRemoveFromScene(data) {
    const { object } = data;
    if (object) {
      this.renderer.scene.remove(object);
    }
  }

  handleGetRenderer(data) {
    const { callback } = data;
    if (callback) {
      callback(this.renderer);
    }
  }
}