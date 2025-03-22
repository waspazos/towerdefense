import { roundConfig } from "../config/roundConfig.js";

class GameState {
  constructor() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.maxRounds = roundConfig.settings.maxRounds;
    this.gameActive = false;
    this.isPaused = false;
    this.interRoundTimer = roundConfig.interRoundTimer;
    this.timerInterval = null;
    this.roundActive = false;
    this.towers = [];
    this.towerSlots = [];
    this.selectedTower = null;
    this.selectedTowerSlot = null;
    this.workers = [];

    // Register event listeners
    window.game.eventSystem.on(
      "creepReachedEnd",
      this.handleCreepReachedEnd.bind(this),
    );
    window.game.eventSystem.on(
      "roundCompleted",
      this.handleRoundCompleted.bind(this),
    );
    window.game.eventSystem.on(
      "getCurrentRound",
      this.handleGetCurrentRound.bind(this),
    );
    window.game.eventSystem.on(
      "getKingHealth",
      this.handleGetKingHealth.bind(this),
    );
    window.game.eventSystem.on(
      "getMaxRounds",
      this.handleGetMaxRounds.bind(this),
    );
    window.game.eventSystem.on(
      "getInterRoundTimer",
      this.handleGetInterRoundTimer.bind(this),
    );
    window.game.eventSystem.on(
      "getAllTowers",
      this.handleGetAllTowers.bind(this),
    );
    window.game.eventSystem.on(
      "getWorkers",
      this.handleGetWorkers.bind(this),
    );
    window.game.eventSystem.on(
      "getTowerCount",
      this.handleGetTowerCount.bind(this),
    );
    window.game.eventSystem.on(
      "freeTowerSlot",
      this.handleFreeTowerSlot.bind(this),
    );
    window.game.eventSystem.on(
      "kingHealthChanged",
      this.handleKingHealthChanged.bind(this),
    );
    window.game.eventSystem.on(
      "towerSelected",
      this.handleTowerSelected.bind(this),
    );
    window.game.eventSystem.on(
      "towerSlotSelected",
      this.handleTowerSlotSelected.bind(this),
    );
    window.game.eventSystem.on("towerBuilt", this.handleTowerBuilt.bind(this));
    window.game.eventSystem.on("towerSold", this.handleTowerSold.bind(this));
    window.game.eventSystem.on("escKeyPressed", this.togglePause.bind(this));
  }

  async initialize() {
    console.log("Initializing GameState...");
    
    this.reset();
    await this.createTowerSlots();
    this.gameActive = true;

    // Start first round with a delay to allow for scene setup
    setTimeout(() => {
      this.startInterRoundTimer();
    }, 1000);

    // Emit game started event
    window.game.eventSystem.emit("gameStarted");
    
    console.log("GameState initialized");
  }

  reset() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.gameActive = false;
    this.isPaused = false;
    this.interRoundTimer = roundConfig.interRoundTimer;
    this.roundActive = false;

    // Clear towers
    this.towers.forEach((tower) => tower.destroy());
    this.towers = [];

    // Clear tower slots
    this.towerSlots.forEach((slot) => {
      if (slot.mesh) {
        window.game.eventSystem.emit("removeFromScene", { object: slot.mesh });
      }
    });
    this.towerSlots = [];

    // Clear selection
    this.selectedTower = null;
    this.selectedTowerSlot = null;

    // Clear workers
    this.workers.forEach((worker) => worker.destroy());
    this.workers = [];

    // Clear any timers
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Emit reset event for other systems
    window.game.eventSystem.emit("reset");
    
    console.log("GameState reset");
  }

  async createTowerSlots() {
    console.log("Creating tower slots...");
    
    // Clear existing slots
    this.towerSlots.forEach((slot) => {
      if (slot.mesh) {
        window.game.eventSystem.emit("removeFromScene", { object: slot.mesh });
      }
    });
    this.towerSlots = [];

    // Create tower slots at exact coordinates
    const slotPositions = [
      // Left path slots
      { x: -15, z: -10 },
      { x: -15, z: -5 },
      { x: -15, z: 0 },
      { x: -15, z: 5 },

      // Center path slots
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: -5, z: -10 },
      { x: 5, z: -10 },

      // Right path slots
      { x: 15, z: -10 },
      { x: 15, z: -5 },
      { x: 15, z: 0 },
      { x: 15, z: 5 },
    ];

    for (const [index, position] of slotPositions.entries()) {
      // Create mesh for slot
      const slotMesh = window.game.renderer.createTowerSlotMesh();
      
      // Create slot object
      const slot = {
        index: index,
        position: new window["THREE"].Vector3(position.x, 0.1, position.z),
        occupied: false,
        mesh: slotMesh,
      };

      // Position the mesh
      slot.mesh.position.copy(slot.position);

      // Add to scene and game state
      window.game.eventSystem.emit("addToScene", { object: slot.mesh });
      this.towerSlots.push(slot);
    }
    
    console.log(`Created ${this.towerSlots.length} tower slots`);
  }

  update(delta) {
    // Update inter-round timer
    if (!this.roundActive && !this.isPaused && this.timerInterval === null) {
      this.interRoundTimer -= delta;

      if (this.interRoundTimer <= 0) {
        this.startRound();
      }

      // Emit timer update event
      window.game.eventSystem.emit("interRoundTimerUpdated", {
        timer: Math.max(0, this.interRoundTimer),
      });
    }
  }

  startInterRoundTimer() {
    // Reset timer
    this.interRoundTimer = roundConfig.interRoundTimer;

    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Emit timer update event
    window.game.eventSystem.emit("interRoundTimerUpdated", {
      timer: this.interRoundTimer,
    });
    
    console.log(`Inter-round timer started: ${this.interRoundTimer}s`);
  }

  startRound() {
    if (this.roundActive || !this.gameActive) return;

    this.currentRound++;
    this.roundActive = true;
    
    console.log(`Starting round ${this.currentRound}`);

    // Tell pathing system to start the round
    window.game.eventSystem.emit("startRound", {
      roundNumber: this.currentRound,
    });
  }

  handleRoundCompleted(data) {
    this.roundActive = false;

    // Check for victory
    if (this.currentRound >= this.maxRounds) {
      this.gameVictory();
      return;
    }

    // Start inter-round timer
    this.startInterRoundTimer();
  }

  handleCreepReachedEnd(data) {
    const { damageToKing } = data;
    this.kingHealth -= damageToKing;

    // Emit king health changed event
    window.game.eventSystem.emit("kingHealthChanged", {
      health: this.kingHealth,
      maxHealth: this.maxKingHealth,
    });

    // Check for game over
    if (this.kingHealth <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.gameActive = false;

    // Emit game over event
    window.game.eventSystem.emit("gameOver", { 
      victory: false,
      finalScore: this.currentRound * 100 + this.kingHealth,
      roundsSurvived: this.currentRound 
    });
    
    console.log("Game over!");
  }

  gameVictory() {
    this.gameActive = false;

    // Emit game victory event
    window.game.eventSystem.emit("gameOver", { 
      victory: true,
      finalScore: this.currentRound * 100 + this.kingHealth,
      roundsSurvived: this.currentRound 
    });
    
    console.log("Victory!");
  }

  togglePause() {
    if (!this.gameActive) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Store current time when paused
      this.pauseStartTime = Date.now();

      // Emit pause event
      window.game.eventSystem.emit("pause");
      console.log("Game paused");
    } else {
      // Calculate pause duration
      const pauseDuration = Date.now() - this.pauseStartTime;

      // Emit resume event
      window.game.eventSystem.emit("resume", { pauseDuration });
      console.log("Game resumed");
    }

    // Emit pause state changed event
    window.game.eventSystem.emit("pauseStateChanged", {
      isPaused: this.isPaused,
    });
  }

  handleKingHealthChanged(data) {
    const { health } = data;
    this.kingHealth = health;

    // Check for game over
    if (this.kingHealth <= 0) {
      this.gameOver();
    }
  }

  handleTowerSelected(data) {
    const { tower } = data;

    // Deselect previous tower or slot
    if (this.selectedTower) {
      this.selectedTower.hideRangeIndicator();
    }
    if (this.selectedTowerSlot) {
      window.game.eventSystem.emit("hideTowerSlotRangeIndicator");
      this.selectedTowerSlot = null;
    }

    // Select new tower
    this.selectedTower = tower;
    if (tower) {
      tower.showRangeIndicator();
    }

    // Emit selected tower changed event
    window.game.eventSystem.emit("selectedTowerChanged", { tower });
  }

  handleTowerSlotSelected(data) {
    const { slot } = data;

    // Deselect previous tower or slot
    if (this.selectedTower) {
      this.selectedTower.hideRangeIndicator();
      this.selectedTower = null;
    }
    if (this.selectedTowerSlot) {
      window.game.eventSystem.emit("hideTowerSlotRangeIndicator");
    }

    // Select new slot
    this.selectedTowerSlot = slot;
    if (slot) {
      window.game.eventSystem.emit("showTowerSlotRangeIndicator", {
        position: slot.position,
      });
    }

    // Emit selected slot changed event
    window.game.eventSystem.emit("selectedTowerSlotChanged", { slot });
  }

  handleTowerBuilt(data) {
    const { tower, slotIndex } = data;

    // Find the slot
    const slot = this.towerSlots.find((s) => s.index === slotIndex);
    if (slot) {
      slot.occupied = true;
    }

    // Add tower to list
    this.towers.push(tower);

    // Clear selection
    this.selectedTowerSlot = null;

    // Emit tower count changed event
    window.game.eventSystem.emit("towerCountChanged", {
      count: this.towers.length,
    });
    
    console.log(`Tower built: ${tower.type}, slot: ${slotIndex}`);
  }

  handleTowerSold(data) {
    const { tower } = data;

    // Find tower in the list
    const index = this.towers.indexOf(tower);
    if (index !== -1) {
      this.towers.splice(index, 1);
    }

    // Free up the slot
    window.game.eventSystem.emit("freeTowerSlot", { slotIndex: tower.slotIndex });

    // Deselect if this was the selected tower
    if (this.selectedTower === tower) {
      this.selectedTower = null;
      window.game.eventSystem.emit("selectedTowerChanged", { tower: null });
    }

    // Emit tower count changed event
    window.game.eventSystem.emit("towerCountChanged", {
      count: this.towers.length,
    });
    
    console.log(`Tower sold: ${tower.type}, slot: ${tower.slotIndex}`);
  }

  handleFreeTowerSlot(data) {
    const { slotIndex } = data;

    // Find the slot
    const slot = this.towerSlots.find((s) => s.index === slotIndex);
    if (slot) {
      slot.occupied = false;
    }
  }

  handleGetCurrentRound(data) {
    const { callback } = data;
    if (callback) {
      callback(this.currentRound);
    }
  }
  
  handleGetKingHealth(data) {
    const { callback } = data;
    if (callback) {
      callback(this.kingHealth, this.maxKingHealth);
    }
  }
  
  handleGetMaxRounds(data) {
    const { callback } = data;
    if (callback) {
      callback(this.maxRounds);
    }
  }
  
  handleGetInterRoundTimer(data) {
    const { callback } = data;
    if (callback) {
      callback(this.interRoundTimer);
    }
  }

  handleGetAllTowers(data) {
    const { callback } = data;
    if (callback) {
      callback(this.towers);
    }
  }
  
  handleGetWorkers(data) {
    const { callback } = data;
    if (callback) {
      callback(this.workers);
    }
  }
  
  handleGetTowerCount(data) {
    const { callback } = data;
    if (callback) {
      callback(this.towers.length);
    }
  }
}

export default GameState;