import { roundConfig } from "../config/roundConfig.js";

class GameState {
  constructor() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.maxRounds = roundConfig.maxRounds;
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
    this.gold = 100; // Initial gold amount
    this.activeAugments = [];

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
      "getAllTowers",
      this.handleGetAllTowers.bind(this),
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

    // Add missing event listeners
    window.game.eventSystem.on("getGold", this.handleGetGold.bind(this));
    window.game.eventSystem.on("getKingHealth", this.handleGetKingHealth.bind(this));
    window.game.eventSystem.on("isRoundActive", this.handleIsRoundActive.bind(this));
    window.game.eventSystem.on("getMaxRounds", this.handleGetMaxRounds.bind(this));
    window.game.eventSystem.on("getActiveAugments", this.handleGetActiveAugments.bind(this));
    window.game.eventSystem.on("getWorkers", this.handleGetWorkers.bind(this));
    window.game.eventSystem.on("getTowerCount", this.handleGetTowerCount.bind(this));
    window.game.eventSystem.on("getInterRoundTimer", this.handleGetInterRoundTimer.bind(this));
  }

  async initialize() {
    console.log('GameState: Initializing');
    this.reset();
    await this.createTowerSlots();
    this.gameActive = true;
    
    // Ensure timer is properly initialized
    console.log('GameState: Setting initial timer value:', roundConfig.interRoundTimer);
    this.interRoundTimer = roundConfig.interRoundTimer;

    // Start first round with a delay to allow for scene setup
    console.log('GameState: Setting up first round timer');
    setTimeout(() => {
      console.log('GameState: Starting inter-round timer');
      this.startInterRoundTimer();
    }, 1000);

    // Emit game started event
    console.log('GameState: Emitting gameStarted event');
    window.game.eventSystem.emit("gameStarted");
  }

  reset() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.gameActive = false;
    this.isPaused = false;
    // Reset timer with validation
    this.interRoundTimer = typeof roundConfig.interRoundTimer === 'number' ? roundConfig.interRoundTimer : 10;
    this.roundActive = false;
    this.gold = 100;

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
  }

  async createTowerSlots() {
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
      { x: -20, z: -17.5 },
      { x: -20, z: -7.5 },
      { x: -20, z: 0 },
      { x: -7.5, z: 7 },

      // Center path slots
      { x: -5, z: 0 },
      { x: 5, z: 0 },
      { x: -5, z: -7.5 },
      { x: 5, z: -7.5 },
      { x: -5, z: -17.5 },
      { x: 5, z: -17.5 },

      // Right path slots
      { x: 7.5, z: 7 },
      { x: 20, z: 0 },
      { x: 20, z: -17.5 },
      { x: 20, z: -7.5 },
    ];

    const createSlots = async () => {
      // Use a for...of loop instead of forEach to allow awaiting
      for (const [index, position] of slotPositions.entries()) {
        // Create a Promise to handle the async mesh creation
        const slotMeshPromise = new Promise((resolve) => {
          window.game.eventSystem.emit("createTowerSlotMesh", {
            callback: (mesh) => {
              resolve(mesh);
            },
          });
        });

        // Wait for the mesh to be created
        const slotMesh = await slotMeshPromise;

        // Create slot object with the mesh we received
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
    };

    // Call the async function
    await createSlots();
  }

  update(delta) {
    // Update inter-round timer
    if (!this.roundActive && !this.isPaused && this.timerInterval === null) {
      // Ensure delta is a valid number
      const validDelta = typeof delta === 'number' && !isNaN(delta) ? delta : 0;
      
      // Store previous timer value
      const previousTimer = typeof this.interRoundTimer === 'number' ? this.interRoundTimer : roundConfig.interRoundTimer;
      
      // Calculate new timer value
      this.interRoundTimer = Math.max(0, previousTimer - validDelta);
      
      console.log('GameState: Timer update', {
        previousTimer,
        validDelta,
        newTimer: this.interRoundTimer,
        roundActive: this.roundActive,
        isPaused: this.isPaused
      });

      if (this.interRoundTimer <= 0) {
        console.log('GameState: Timer expired, starting round');
        this.startRound();
      }

      // Only emit timer update if the value has changed and is valid
      if (previousTimer !== this.interRoundTimer && !isNaN(this.interRoundTimer)) {
        window.game.eventSystem.emit("interRoundTimerUpdated", {
          timer: this.interRoundTimer
        });
      }
    }
  }

  startInterRoundTimer() {
    console.log('GameState: startInterRoundTimer called');
    // Reset timer with validation
    const initialTimer = typeof roundConfig.interRoundTimer === 'number' ? roundConfig.interRoundTimer : 10;
    this.interRoundTimer = initialTimer;
    console.log('GameState: Timer reset to:', this.interRoundTimer);

    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Emit timer update event with validation
    console.log('GameState: Emitting interRoundTimerUpdated event with timer:', this.interRoundTimer);
    window.game.eventSystem.emit("interRoundTimerUpdated", {
      timer: this.interRoundTimer
    });
  }

  startRound() {
    console.log('GameState: startRound called', {
      roundActive: this.roundActive,
      gameActive: this.gameActive
    });
    
    if (this.roundActive || !this.gameActive) {
      console.log('GameState: Cannot start round - game inactive or round already active');
      return;
    }

    this.currentRound++;
    this.roundActive = true;

    // Tell pathing system to start the round
    console.log('GameState: Emitting startRound event');
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
    window.game.eventSystem.emit("gameOver", { victory: false });
  }

  gameVictory() {
    this.gameActive = false;

    // Emit game victory event
    window.game.eventSystem.emit("gameOver", { victory: true });
  }

  togglePause() {
    if (!this.gameActive) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Store current time when paused
      this.pauseStartTime = Date.now();

      // Emit pause event
      window.game.eventSystem.emit("pause");
    } else {
      // Calculate pause duration
      const pauseDuration = Date.now() - this.pauseStartTime;

      // Emit resume event
      window.game.eventSystem.emit("resume", { pauseDuration });
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
  }

  handleTowerSold(data) {
    const { tower } = data;

    // Find tower in the list
    const index = this.towers.indexOf(tower);
    if (index !== -1) {
      this.towers.splice(index, 1);
    }

    // Deselect if this was the selected tower
    if (this.selectedTower === tower) {
      this.selectedTower = null;
      window.game.eventSystem.emit("selectedTowerChanged", { tower: null });
    }

    // Emit tower count changed event
    window.game.eventSystem.emit("towerCountChanged", {
      count: this.towers.length,
    });
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

  handleGetAllTowers(data) {
    const { callback } = data;
    if (callback) {
      callback(this.towers);
    }
  }

  // Add new event handlers
  handleGetGold(data) {
    const { callback } = data;
    if (callback) {
      callback(this.gold);
    }
  }

  handleGetKingHealth(data) {
    const { callback } = data;
    if (callback) {
      callback({
        current: this.kingHealth,
        max: this.maxKingHealth
      });
    }
  }

  handleIsRoundActive(data) {
    const { callback } = data;
    if (callback) {
      callback(this.roundActive);
    }
  }

  handleGetMaxRounds(data) {
    const { callback } = data;
    if (callback) {
      callback(this.maxRounds);
    }
  }

  handleGetActiveAugments(data) {
    const { callback } = data;
    if (callback) {
      callback(this.activeAugments);
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

  handleGetInterRoundTimer(data) {
    console.log('GameState: Getting inter-round timer:', this.interRoundTimer);
    const { callback } = data;
    if (callback) {
      const timerValue = Math.max(0, this.interRoundTimer || 0);
      console.log('GameState: Returning timer value:', timerValue);
      callback(timerValue);
    }
  }
}

export default GameState;
