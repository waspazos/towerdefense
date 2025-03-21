import { workerConfig } from "../config/workerConfig.js";

class PlayingState {
  constructor() {
    this.isActive = false;

    // Register event listeners
    window.game.eventSystem.on("canvasClick", this.handleCanvasClick.bind(this));
    window.game.eventSystem.on(
      "towerOptionClicked",
      this.handleTowerOptionClicked.bind(this),
    );
    window.game.eventSystem.on(
      "upgradeTowerClicked",
      this.handleUpgradeTowerClicked.bind(this),
    );
    window.game.eventSystem.on("sellTowerClicked", this.handleSellTowerClicked.bind(this));
    window.game.eventSystem.on(
      "cancelTowerActionClicked",
      this.handleCancelTowerActionClicked.bind(this),
    );
    window.game.eventSystem.on("buyWorkerClicked", this.handleBuyWorkerClicked.bind(this));
    window.game.eventSystem.on(
      "showTowerSlotRangeIndicator",
      this.showTowerSlotRangeIndicator.bind(this),
    );
    window.game.eventSystem.on(
      "hideTowerSlotRangeIndicator",
      this.hideTowerSlotRangeIndicator.bind(this),
    );
    window.game.eventSystem.on(
      "createTowerSlotMesh",
      this.handleCreateTowerSlotMesh.bind(this),
    );
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
      window.game.gameState.towerSlots
        .filter((slot) => !slot.occupied)
        .map((slot) => slot.mesh),
    );

    // Check for existing tower hits
    const towerIntersects = raycaster.intersectObjects(
      window.game.gameState.towers.map((tower) => tower.mesh),
    );

    // Clear selections if clicking on empty space
    if (towerSlotIntersects.length === 0 && towerIntersects.length === 0) {
      window.game.eventSystem.emit("towerSelected", { tower: null });
      window.game.eventSystem.emit("towerSlotSelected", { slot: null });
      window.game.eventSystem.emit("hideUI", { type: "towerActions" });
      window.game.eventSystem.emit("hideUI", { type: "towerSelection" });
      return;
    }

    // Handle tower slot selection
    if (towerSlotIntersects.length > 0) {
      const slotMesh = towerSlotIntersects[0].object;
      const slot = window.game.gameState.towerSlots.find((s) => s.mesh === slotMesh);
      if (slot && !slot.occupied) {
        window.game.eventSystem.emit("towerSlotSelected", { slot });
        window.game.eventSystem.emit("showUI", { type: "towerSelection" });
      }
      return;
    }

    // Handle tower selection
    if (towerIntersects.length > 0) {
      const towerMesh =
        towerIntersects[0].object.parent || towerIntersects[0].object;
      const tower = window.game.gameState.towers.find((t) => t.mesh === towerMesh);
      if (tower) {
        window.game.eventSystem.emit("towerSelected", { tower });
        window.game.eventSystem.emit("showUI", { type: "towerActions" });
      }
    }
  }

  handleTowerOptionClicked(data) {
    if (!this.isActive) return;

    const { towerType, event } = data;
    event.stopPropagation();

    if (!window.game.gameState.selectedTowerSlot) {
      return;
    }

    // Get tower cost
    const towerCost = window.towerConfig[towerType].ranks[0].cost;

    // Check if player can afford
    let canAfford = false;
    window.game.eventSystem.emit("checkGold", {
      amount: towerCost,
      callback: (result) => {
        canAfford = result;
      },
    });

    if (!canAfford) {
      return;
    }

    // Deduct gold
    window.game.eventSystem.emit("spendGold", { amount: towerCost });

    // Build tower
    const tower = new Tower(
      towerType,
      window.game.gameState.selectedTowerSlot.position.clone(),
      window.game.gameState.selectedTowerSlot.index,
    );

    // Add to scene
    window.game.eventSystem.emit("addToScene", { object: tower.mesh });

    // Emit tower built event
    window.game.eventSystem.emit("towerBuilt", {
      tower,
      slotIndex: window.game.gameState.selectedTowerSlot.index,
    });

    // Hide tower selection UI
    window.game.eventSystem.emit("hideUI", { type: "towerSelection" });
  }

  handleUpgradeTowerClicked() {
    if (!this.isActive || !window.game.gameState.selectedTower) return;

    // Upgrade the tower
    const upgraded = window.game.gameState.selectedTower.upgrade();

    if (upgraded) {
      // Update UI
      window.game.eventSystem.emit("towerDetailsUpdated", {
        tower: window.game.gameState.selectedTower,
      });
    }
  }

  handleSellTowerClicked() {
    if (!this.isActive || !window.game.gameState.selectedTower) return;

    // Sell the tower
    window.game.gameState.selectedTower.sell();

    // Hide tower actions UI
    window.game.eventSystem.emit("hideUI", { type: "towerActions" });
  }

  handleCancelTowerActionClicked() {
    if (!this.isActive) return;

    // Clear tower selection
    window.game.eventSystem.emit("towerSelected", { tower: null });

    // Hide tower actions UI
    window.game.eventSystem.emit("hideUI", { type: "towerActions" });
  }

  handleBuyWorkerClicked() {
    if (!this.isActive) return;

    // Check worker limit
    const maxWorkers = workerConfig.base.maxWorkers;
    if (window.game.gameState.workers.length >= maxWorkers) {
      return;
    }

    // Get worker cost
    const workerCost = workerConfig.base.cost;

    // Check if player can afford
    let canAfford = false;
    window.game.eventSystem.emit("checkGold", {
      amount: workerCost,
      callback: (result) => {
        canAfford = result;
      },
    });

    if (!canAfford) {
      return;
    }

    // Deduct gold
    window.game.eventSystem.emit("spendGold", { amount: workerCost });

    // Create new worker
    const campPosition = workerConfig.camp.position;
    const worker = new Worker(
      new window['THREE'].Vector3(campPosition.x, 0, campPosition.z),
    );

    // Add to scene
    window.game.eventSystem.emit("addToScene", { object: worker.mesh });

    // Add to game state
    window.game.gameState.workers.push(worker);

    // Find an available rock
    let availableRock = null;
    window.game.eventSystem.emit("getAvailableRock", {
      callback: (rock) => {
        availableRock = rock;
      },
    });

    if (availableRock) {
      worker.assignRock(availableRock);
    }

    // Emit worker hired event
    window.game.eventSystem.emit("workerHired", { worker });
  }

  showTowerSlotRangeIndicator(data) {
    if (!this.isActive) return;

    const { position } = data;

    // Remove existing indicator
    this.hideTowerSlotRangeIndicator();

    // Create new indicator
    this.towerSlotRangeIndicator = window.game.renderer.createRangeIndicator(position, 8);
    window.game.eventSystem.emit("addToScene", { object: this.towerSlotRangeIndicator });
  }

  hideTowerSlotRangeIndicator() {
    if (this.towerSlotRangeIndicator) {
      window.game.eventSystem.emit("removeFromScene", {
        object: this.towerSlotRangeIndicator,
      });
      this.towerSlotRangeIndicator = null;
    }
  }

  handleCreateTowerSlotMesh(data) {
    const { callback } = data;
    if (callback) {
      const mesh = window.game.renderer.createTowerSlotMesh();
      return callback(mesh);
    }
    return null;
  }
}

export default PlayingState;
