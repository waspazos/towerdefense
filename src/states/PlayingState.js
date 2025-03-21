import eventSystem from '../engine/EventSystem';
import renderer from '../engine/Renderer';
import gameState from './GameState';
import Tower from '../entities/Tower';
import Worker from '../entities/Worker';

class PlayingState {
  constructor() {
    this.isActive = false;
    
    // Register event listeners
    eventSystem.on('canvasClick', this.handleCanvasClick.bind(this));
    eventSystem.on('towerOptionClicked', this.handleTowerOptionClicked.bind(this));
    eventSystem.on('upgradeTowerClicked', this.handleUpgradeTowerClicked.bind(this));
    eventSystem.on('sellTowerClicked', this.handleSellTowerClicked.bind(this));
    eventSystem.on('cancelTowerActionClicked', this.handleCancelTowerActionClicked.bind(this));
    eventSystem.on('buyWorkerClicked', this.handleBuyWorkerClicked.bind(this));
    eventSystem.on('showTowerSlotRangeIndicator', this.showTowerSlotRangeIndicator.bind(this));
    eventSystem.on('hideTowerSlotRangeIndicator', this.hideTowerSlotRangeIndicator.bind(this));
    eventSystem.on('createTowerSlotMesh', this.handleCreateTowerSlotMesh.bind(this));
  }
  
  activate() {
    this.isActive = true;
  }
  
  deactivate() {
    this.isActive = false;
  }
  
  handleCanvasClick(data) {
    if (!this.isActive) return;
    
    const { raycaster } = data;
    
    // Check for tower slot hits
    const towerSlotIntersects = raycaster.intersectObjects(
      gameState.towerSlots.filter(slot => !slot.occupied).map(slot => slot.mesh)
    );
    
    // Check for existing tower hits
    const towerIntersects = raycaster.intersectObjects(
      gameState.towers.map(tower => tower.mesh)
    );
    
    // Clear selections if clicking on empty space
    if (towerSlotIntersects.length === 0 && towerIntersects.length === 0) {
      eventSystem.emit('towerSelected', { tower: null });
      eventSystem.emit('towerSlotSelected', { slot: null });
      eventSystem.emit('hideUI', { type: 'towerActions' });
      eventSystem.emit('hideUI', { type: 'towerSelection' });
      return;
    }
    
    // Handle tower slot selection
    if (towerSlotIntersects.length > 0) {
      const slotMesh = towerSlotIntersects[0].object;
      const slot = gameState.towerSlots.find(s => s.mesh === slotMesh);
      if (slot && !slot.occupied) {
        eventSystem.emit('towerSlotSelected', { slot });
        eventSystem.emit('showUI', { type: 'towerSelection' });
      }
      return;
    }
    
    // Handle tower selection
    if (towerIntersects.length > 0) {
      const towerMesh = towerIntersects[0].object.parent || towerIntersects[0].object;
      const tower = gameState.towers.find(t => t.mesh === towerMesh);
      if (tower) {
        eventSystem.emit('towerSelected', { tower });
        eventSystem.emit('showUI', { type: 'towerActions' });
      }
    }
  }
  
  handleTowerOptionClicked(data) {
    if (!this.isActive) return;
    
    const { towerType, event } = data;
    event.stopPropagation();
    
    if (!gameState.selectedTowerSlot) {
      return;
    }
    
    // Get tower cost
    const towerCost = window.towerConfig[towerType].ranks[0].cost;
    
    // Check if player can afford
    let canAfford = false;
    eventSystem.emit('checkGold', { 
      amount: towerCost, 
      callback: (result) => { canAfford = result; }
    });
    
    if (!canAfford) {
      return;
    }
    
    // Deduct gold
    eventSystem.emit('spendGold', { amount: towerCost });
    
    // Build tower
    const tower = new Tower(
      towerType, 
      gameState.selectedTowerSlot.position.clone(), 
      gameState.selectedTowerSlot.index
    );
    
    // Add to scene
    eventSystem.emit('addToScene', { object: tower.mesh });
    
    // Emit tower built event
    eventSystem.emit('towerBuilt', { 
      tower, 
      slotIndex: gameState.selectedTowerSlot.index 
    });
    
    // Hide tower selection UI
    eventSystem.emit('hideUI', { type: 'towerSelection' });
  }
  
  handleUpgradeTowerClicked() {
    if (!this.isActive || !gameState.selectedTower) return;
    
    // Upgrade the tower
    const upgraded = gameState.selectedTower.upgrade();
    
    if (upgraded) {
      // Update UI
      eventSystem.emit('towerDetailsUpdated', { tower: gameState.selectedTower });
    }
  }
  
  handleSellTowerClicked() {
    if (!this.isActive || !gameState.selectedTower) return;
    
    // Sell the tower
    gameState.selectedTower.sell();
    
    // Hide tower actions UI
    eventSystem.emit('hideUI', { type: 'towerActions' });
  }
  
  handleCancelTowerActionClicked() {
    if (!this.isActive) return;
    
    // Clear tower selection
    eventSystem.emit('towerSelected', { tower: null });
    
    // Hide tower actions UI
    eventSystem.emit('hideUI', { type: 'towerActions' });
  }
  
  handleBuyWorkerClicked() {
    if (!this.isActive) return;
    
    // Check worker limit
    const maxWorkers = window.workerConfig.base.maxWorkers;
    if (gameState.workers.length >= maxWorkers) {
      return;
    }
    
    // Get worker cost
    const workerCost = window.workerConfig.base.cost;
    
    // Check if player can afford
    let canAfford = false;
    eventSystem.emit('checkGold', { 
      amount: workerCost, 
      callback: (result) => { canAfford = result; }
    });
    
    if (!canAfford) {
      return;
    }
    
    // Deduct gold
    eventSystem.emit('spendGold', { amount: workerCost });
    
    // Create new worker
    const campPosition = window.workerConfig.camp.position;
    const worker = new Worker(new THREE.Vector3(campPosition.x, 0, campPosition.z));
    
    // Add to scene
    eventSystem.emit('addToScene', { object: worker.mesh });
    
    // Add to game state
    gameState.workers.push(worker);
    
    // Find an available rock
    let availableRock = null;
    eventSystem.emit('getAvailableRock', { 
      callback: (rock) => { availableRock = rock; }
    });
    
    if (availableRock) {
      worker.assignRock(availableRock);
    }
    
    // Emit worker hired event
    eventSystem.emit('workerHired', { worker });
  }
  
  showTowerSlotRangeIndicator(data) {
    if (!this.isActive) return;
    
    const { position } = data;
    
    // Remove existing indicator
    this.hideTowerSlotRangeIndicator();
    
    // Create new indicator
    this.towerSlotRangeIndicator = renderer.createRangeIndicator(position, 8);
    eventSystem.emit('addToScene', { object: this.towerSlotRangeIndicator });
  }
  
  hideTowerSlotRangeIndicator() {
    if (this.towerSlotRangeIndicator) {
      eventSystem.emit('removeFromScene', { object: this.towerSlotRangeIndicator });
      this.towerSlotRangeIndicator = null;
    }
  }
  
  handleCreateTowerSlotMesh(data) {
    const { callback } = data;
    if (callback) {
      const mesh = renderer.createTowerSlotMesh();
      return callback(mesh);
    }
    return null;
  }
}

export default new PlayingState();