import eventSystem from '../engine/EventSystem';
import Tower from '../entities/Tower';

class GameState {
  constructor() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.maxRounds = window.roundConfig.maxRounds;
    this.gameActive = false;
    this.isPaused = false;
    this.interRoundTimer = window.roundConfig.interRoundTimer;
    this.timerInterval = null;
    this.roundActive = false;
    this.towers = [];
    this.towerSlots = [];
    this.selectedTower = null;
    this.selectedTowerSlot = null;
    this.workers = [];
    
    // Register event listeners
    eventSystem.on('creepReachedEnd', this.handleCreepReachedEnd.bind(this));
    eventSystem.on('roundCompleted', this.handleRoundCompleted.bind(this));
    eventSystem.on('getCurrentRound', this.handleGetCurrentRound.bind(this));
    eventSystem.on('getAllTowers', this.handleGetAllTowers.bind(this));
    eventSystem.on('freeTowerSlot', this.handleFreeTowerSlot.bind(this));
    eventSystem.on('kingHealthChanged', this.handleKingHealthChanged.bind(this));
    eventSystem.on('towerSelected', this.handleTowerSelected.bind(this));
    eventSystem.on('towerSlotSelected', this.handleTowerSlotSelected.bind(this));
    eventSystem.on('towerBuilt', this.handleTowerBuilt.bind(this));
    eventSystem.on('towerSold', this.handleTowerSold.bind(this));
    eventSystem.on('escKeyPressed', this.togglePause.bind(this));
  }
  
  initialize() {
    this.reset();
    this.createTowerSlots();
    this.gameActive = true;
    
    // Start first round with a delay to allow for scene setup
    setTimeout(() => {
      this.startInterRoundTimer();
    }, 1000);
    
    // Emit game started event
    eventSystem.emit('gameStarted');
  }
  
  reset() {
    this.kingHealth = 100;
    this.maxKingHealth = 100;
    this.currentRound = 0;
    this.gameActive = false;
    this.isPaused = false;
    this.interRoundTimer = window.roundConfig.interRoundTimer;
    this.roundActive = false;
    
    // Clear towers
    this.towers.forEach(tower => tower.destroy());
    this.towers = [];
    
    // Clear tower slots
    this.towerSlots.forEach(slot => {
      if (slot.mesh) {
        eventSystem.emit('removeFromScene', { object: slot.mesh });
      }
    });
    this.towerSlots = [];
    
    // Clear selection
    this.selectedTower = null;
    this.selectedTowerSlot = null;
    
    // Clear workers
    this.workers.forEach(worker => worker.destroy());
    this.workers = [];
    
    // Clear any timers
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Emit reset event for other systems
    eventSystem.emit('reset');
  }
  
  createTowerSlots() {
    // Clear existing slots
    this.towerSlots.forEach(slot => {
      if (slot.mesh) {
        eventSystem.emit('removeFromScene', { object: slot.mesh });
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
      { x: 20, z: -7.5 }
    ];
    
    slotPositions.forEach((position, index) => {
      // Create tower slot mesh
      const slotMesh = eventSystem.emit('createTowerSlotMesh', { callback: (mesh) => { return mesh; } });
      
      // Create slot object
      const slot = {
        index: index,
        position: new THREE.Vector3(position.x, 0.1, position.z),
        occupied: false,
        mesh: slotMesh
      };
      
      // Position the mesh
      slot.mesh.position.copy(slot.position);
      
      // Add to scene and game state
      eventSystem.emit('addToScene', { object: slot.mesh });
      this.towerSlots.push(slot);
    });
  }
  
  update(delta) {
    // Update inter-round timer
    if (!this.roundActive && !this.isPaused && this.timerInterval === null) {
      this.interRoundTimer -= delta;
      
      if (this.interRoundTimer <= 0) {
        this.startRound();
      }
      
      // Emit timer update event
      eventSystem.emit('interRoundTimerUpdated', { timer: Math.max(0, this.interRoundTimer) });
    }
  }
  
  startInterRoundTimer() {
    // Reset timer
    this.interRoundTimer = window.roundConfig.interRoundTimer;
    
    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Emit timer update event
    eventSystem.emit('interRoundTimerUpdated', { timer: this.interRoundTimer });
  }
  
  startRound() {
    if (this.roundActive || !this.gameActive) return;
    
    this.currentRound++;
    this.roundActive = true;
    
    // Tell pathing system to start the round
    eventSystem.emit('startRound', { roundNumber: this.currentRound });
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
    eventSystem.emit('kingHealthChanged', { health: this.kingHealth, maxHealth: this.maxKingHealth });
    
    // Check for game over
    if (this.kingHealth <= 0) {
      this.gameOver();
    }
  }
  
  gameOver() {
    this.gameActive = false;
    
    // Emit game over event
    eventSystem.emit('gameOver', { victory: false });
  }
  
  gameVictory() {
    this.gameActive = false;
    
    // Emit game victory event
    eventSystem.emit('gameOver', { victory: true });
  }
  
  togglePause() {
    if (!this.gameActive) return;
    
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Store current time when paused
      this.pauseStartTime = Date.now();
      
      // Emit pause event
      eventSystem.emit('pause');
    } else {
      // Calculate pause duration
      const pauseDuration = Date.now() - this.pauseStartTime;
      
      // Emit resume event
      eventSystem.emit('resume', { pauseDuration });
    }
    
    // Emit pause state changed event
    eventSystem.emit('pauseStateChanged', { isPaused: this.isPaused });
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
      eventSystem.emit('hideTowerSlotRangeIndicator');
      this.selectedTowerSlot = null;
    }
    
    // Select new tower
    this.selectedTower = tower;
    if (tower) {
      tower.showRangeIndicator();
    }
    
    // Emit selected tower changed event
    eventSystem.emit('selectedTowerChanged', { tower });
  }
  
  handleTowerSlotSelected(data) {
    const { slot } = data;
    
    // Deselect previous tower or slot
    if (this.selectedTower) {
      this.selectedTower.hideRangeIndicator();
      this.selectedTower = null;
    }
    if (this.selectedTowerSlot) {
      eventSystem.emit('hideTowerSlotRangeIndicator');
    }
    
    // Select new slot
    this.selectedTowerSlot = slot;
    if (slot) {
      eventSystem.emit('showTowerSlotRangeIndicator', { position: slot.position });
    }
    
    // Emit selected slot changed event
    eventSystem.emit('selectedTowerSlotChanged', { slot });
  }
  
  handleTowerBuilt(data) {
    const { tower, slotIndex } = data;
    
    // Find the slot
    const slot = this.towerSlots.find(s => s.index === slotIndex);
    if (slot) {
      slot.occupied = true;
    }
    
    // Add tower to list
    this.towers.push(tower);
    
    // Clear selection
    this.selectedTowerSlot = null;
    
    // Emit tower count changed event
    eventSystem.emit('towerCountChanged', { count: this.towers.length });
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
      eventSystem.emit('selectedTowerChanged', { tower: null });
    }
    
    // Emit tower count changed event
    eventSystem.emit('towerCountChanged', { count: this.towers.length });
  }
  
  handleFreeTowerSlot(data) {
    const { slotIndex } = data;
    
    // Find the slot
    const slot = this.towerSlots.find(s => s.index === slotIndex);
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
}

export default new GameState();