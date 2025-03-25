import { roundConfig } from "/src/config/roundConfig.js";

export class GameState {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.maxRounds = roundConfig.maxRounds;
    this.gameActive = false;
    this.isPaused = false;
    this.interRoundTimer = roundConfig.interRoundTimer;
    this.roundActive = false;
    this.towers = [];
    this.towerSlots = [];
    this.selectedTower = null;
    this.selectedTowerSlot = null;

    // Register event listeners
    this.eventSystem.on("creepReachedEnd", this.handleCreepReachedEnd.bind(this));
    this.eventSystem.on("roundCompleted", this.handleRoundCompleted.bind(this));
    this.eventSystem.on("getCurrentRound", this.handleGetCurrentRound.bind(this));
    this.eventSystem.on("getKingHealth", this.handleGetKingHealth.bind(this));
    this.eventSystem.on("getMaxRounds", this.handleGetMaxRounds.bind(this));
    this.eventSystem.on("getInterRoundTimer", this.handleGetInterRoundTimer.bind(this));
    this.eventSystem.on("getAllTowers", this.handleGetAllTowers.bind(this));
    this.eventSystem.on("getTowerCount", this.handleGetTowerCount.bind(this));
    this.eventSystem.on("freeTowerSlot", this.handleFreeTowerSlot.bind(this));
    this.eventSystem.on("kingHealthChanged", this.handleKingHealthChanged.bind(this));
    this.eventSystem.on("towerSelected", this.handleTowerSelected.bind(this));
    this.eventSystem.on("towerSlotSelected", this.handleTowerSlotSelected.bind(this));
    this.eventSystem.on("towerBuilt", this.handleTowerBuilt.bind(this));
    this.eventSystem.on("towerSold", this.handleTowerSold.bind(this));
    this.eventSystem.on("escKeyPressed", this.togglePause.bind(this));
    this.eventSystem.on("createTowerSlotMesh", this.handleCreateTowerSlotMesh.bind(this));
    
    console.log("GameState: Initialized");
  }

  async initialize() {
    this.reset();
    await this.createTowerSlots();
    this.gameActive = true;
    
    // Start first round with a delay to allow for scene setup
    setTimeout(() => {
      this.startInterRoundTimer();
    }, 1000);

    // Emit game started event
    this.eventSystem.emit("gameStarted");
    
    console.log("GameState: Game started");
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
        this.eventSystem.emit("removeFromScene", { object: slot.mesh });
      }
    });
    this.towerSlots = [];

    // Clear selection
    this.selectedTower = null;
    this.selectedTowerSlot = null;

    // Emit reset event for other systems
    this.eventSystem.emit("reset");
    
    console.log("GameState: Reset");
  }

  async createTowerSlots() {
    // Clear existing slots
    this.towerSlots.forEach((slot) => {
      if (slot.mesh) {
        this.eventSystem.emit("removeFromScene", { object: slot.mesh });
      }
    });
    this.towerSlots = [];

    // Create tower slots at exact coordinates
    const slotPositions = [
      // Row 1 (top)
      { x: -15, z: -17.5 },
      { x: -5, z: -17.5 },
      { x: 5, z: -17.5 },
      { x: 15, z: -17.5 },

      // Row 2
      { x: -15, z: -12.5 },
      { x: -5, z: -12.5 },
      { x: 5, z: -12.5 },
      { x: 15, z: -12.5 },

      // Row 3
      { x: -15, z: -7.5 },
      { x: -5, z: -7.5 },
      { x: 5, z: -7.5 },
      { x: 15, z: -7.5 },

      // Row 4
      { x: -15, z: -2.5 },
      { x: -5, z: -2.5 },
      { x: 5, z: -2.5 },
      { x: 15, z: -2.5 },

      // Row 5
      { x: -15, z: 2.5 },
      { x: -5, z: 2.5 },
      { x: 5, z: 2.5 },
      { x: 15, z: 2.5 },

      // Row 6
      { x: -15, z: 7.5 },
      { x: -5, z: 7.5 },
      { x: 5, z: 7.5 },
      { x: 15, z: 7.5 },

      // Row 7
      { x: -15, z: 12.5 },
      { x: -5, z: 12.5 },
      { x: 5, z: 12.5 },
      { x: 15, z: 12.5 },

      // Row 8 (bottom)
      { x: -15, z: 17.5 },
      { x: -5, z: 17.5 },
      { x: 5, z: 17.5 },
      { x: 15, z: 17.5 },
    ];

    // Create slots
    for (const [index, position] of slotPositions.entries()) {
      // Create mesh for slot
      let slotMesh = null;
      await new Promise(resolve => {
        this.eventSystem.emit("createTowerSlotMesh", {
          position: position,
          callback: (mesh) => {
            slotMesh = mesh;
            resolve();
          }
        });
      });
      
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
      this.eventSystem.emit("addToScene", { object: slot.mesh });
      this.towerSlots.push(slot);
    }
    
    console.log("GameState: Created", this.towerSlots.length, "tower slots");
    return this.towerSlots;
  }

  update(delta) {
    // Update inter-round timer
    if (!this.roundActive && !this.isPaused && this.gameActive && this.interRoundTimer > 0) {
      this.interRoundTimer -= delta;

      if (this.interRoundTimer <= 0) {
        this.startRound();
      }

      // Emit timer update event
      this.eventSystem.emit("interRoundTimerUpdated", {
        timer: Math.max(0, this.interRoundTimer)
      });
    }

    // Update all towers
    this.towers.forEach(tower => tower.update(delta));
  }

  startInterRoundTimer() {
    // Reset timer
    this.interRoundTimer = roundConfig.interRoundTimer;

    // Emit timer update event
    this.eventSystem.emit("interRoundTimerUpdated", {
      timer: this.interRoundTimer
    });
    
    console.log("GameState: Inter-round timer started, duration:", this.interRoundTimer);
  }

  startRound() {
    if (this.roundActive || !this.gameActive) return;

    this.currentRound++;
    this.roundActive = true;

    // Tell pathing system to start the round
    this.eventSystem.emit("startRound", {
      roundNumber: this.currentRound
    });
    
    console.log("GameState: Starting round", this.currentRound);
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
    
    console.log("GameState: Round", this.currentRound, "completed");
  }

  handleCreepReachedEnd(data) {
    const { damageToKing } = data;
    this.kingHealth -= damageToKing;

    // Emit king health changed event
    this.eventSystem.emit("kingHealthChanged", {
      health: this.kingHealth,
      maxHealth: this.maxKingHealth
    });

    // Check for game over
    if (this.kingHealth <= 0) {
      this.gameOver();
    }
    
    console.log("GameState: King took damage, health:", this.kingHealth);
  }

  gameOver() {
    this.gameActive = false;

    // Emit game over event
    this.eventSystem.emit("gameOver", { 
      victory: false,
      finalScore: this.currentRound * 100,
      roundsSurvived: this.currentRound 
    });
    
    console.log("GameState: Game over");
  }

  gameVictory() {
    this.gameActive = false;

    // Emit game victory event
    this.eventSystem.emit("gameOver", { 
      victory: true,
      finalScore: this.currentRound * 100 + this.kingHealth,
      roundsSurvived: this.currentRound 
    });
    
    console.log("GameState: Victory!");
  }

  togglePause() {
    if (!this.gameActive) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Emit pause event
      this.eventSystem.emit("pause");
    } else {
      // Emit resume event
      this.eventSystem.emit("resume");
    }

    // Emit pause state changed event
    this.eventSystem.emit("pauseStateChanged", {
      isPaused: this.isPaused
    });
    
    console.log("GameState: Pause toggled, isPaused:", this.isPaused);
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
      this.eventSystem.emit("hideTowerSlotRangeIndicator");
      this.selectedTowerSlot = null;
    }

    // Select new tower
    this.selectedTower = tower;
    if (tower) {
      tower.showRangeIndicator();
    }

    // Emit selected tower changed event
    this.eventSystem.emit("selectedTowerChanged", { tower });
  }

  handleTowerSlotSelected(data) {
    const { slot } = data;

    // Deselect previous tower or slot
    if (this.selectedTower) {
      this.selectedTower.hideRangeIndicator();
      this.selectedTower = null;
    }
    if (this.selectedTowerSlot) {
      this.eventSystem.emit("hideTowerSlotRangeIndicator");
    }

    // Select new slot
    this.selectedTowerSlot = slot;
    if (slot) {
      this.eventSystem.emit("showTowerSlotRangeIndicator", {
        position: slot.position
      });
    }

    // Emit selected slot changed event
    this.eventSystem.emit("selectedTowerSlotChanged", { slot });
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
    this.eventSystem.emit("towerCountChanged", {
      count: this.towers.length
    });
    
    console.log("GameState: Tower built at slot", slotIndex);
  }

  handleTowerSold(data) {
    const { tower } = data;

    // Find tower in the list
    const index = this.towers.indexOf(tower);
    if (index !== -1) {
      this.towers.splice(index, 1);
    }

    // Free up the slot
    this.eventSystem.emit("freeTowerSlot", { slotIndex: tower.slotIndex });

    // Deselect if this was the selected tower
    if (this.selectedTower === tower) {
      this.selectedTower = null;
      this.eventSystem.emit("selectedTowerChanged", { tower: null });
    }

    // Emit tower count changed event
    this.eventSystem.emit("towerCountChanged", {
      count: this.towers.length
    });
    
    console.log("GameState: Tower sold at slot", tower.slotIndex);
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
      callback(Math.max(0, this.interRoundTimer));
    }
  }

  handleGetAllTowers(data) {
    const { callback } = data;
    if (callback) {
      callback(this.towers);
    }
  }
  
  handleGetTowerCount(data) {
    const { callback } = data;
    if (callback) {
      callback(this.towers.length);
    }
  }
  
  handleCreateTowerSlotMesh(data) {
    const { position, callback } = data;
    if (callback) {
      // Get the renderer instance from the event system
      this.eventSystem.emit("getRenderer", {
        callback: (renderer) => {
          const mesh = renderer.createTowerSlot(position);
          callback(mesh);
        }
      });
    }
  }
}