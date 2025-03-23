import { Tower } from "/src/entities/Tower.js";

export class PlayingState {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.isActive = false;
    this.towerSlotRangeIndicator = null;

    // Register event listeners
    this.eventSystem.on("canvasClick", this.handleCanvasClick.bind(this));
    this.eventSystem.on("towerOptionClicked", this.handleTowerOptionClicked.bind(this));
    this.eventSystem.on("upgradeTowerClicked", this.handleUpgradeTowerClicked.bind(this));
    this.eventSystem.on("sellTowerClicked", this.handleSellTowerClicked.bind(this));
    this.eventSystem.on("cancelTowerActionClicked", this.handleCancelTowerActionClicked.bind(this));
    this.eventSystem.on("showTowerSlotRangeIndicator", this.showTowerSlotRangeIndicator.bind(this));
    this.eventSystem.on("hideTowerSlotRangeIndicator", this.hideTowerSlotRangeIndicator.bind(this));
    
    console.log("PlayingState: Initialized");
  }

  activate() {
    this.isActive = true;
    console.log("PlayingState: Activated");
  }

  deactivate() {
    this.isActive = false;
    console.log("PlayingState: Deactivated");
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
      this.eventSystem.emit("towerSelected", { tower: null });
      this.eventSystem.emit("towerSlotSelected", { slot: null });
      this.eventSystem.emit("hideUI", { type: "towerActions" });
      this.eventSystem.emit("hideUI", { type: "towerSelection" });
      return;
    }

    // Handle tower slot selection
    if (towerSlotIntersects.length > 0) {
      const slotMesh = towerSlotIntersects[0].object;
      const slot = window.game.gameState.towerSlots.find((s) => s.mesh === slotMesh);
      if (slot && !slot.occupied) {
        this.eventSystem.emit("towerSlotSelected", { slot });
        this.eventSystem.emit("showUI", { type: "towerSelection" });
      }
      return;
    }

    // Handle tower selection
    if (towerIntersects.length > 0) {
      const towerMesh = towerIntersects[0].object.parent || towerIntersects[0].object;
      const tower = window.game.gameState.towers.find((t) => t.mesh === towerMesh);
      if (tower) {
        this.eventSystem.emit("towerSelected", { tower });
        this.eventSystem.emit("showUI", { type: "towerActions", data: { tower } });
      }
    }
  }

  handleTowerOptionClicked(data) {
    if (!this.isActive) return;

    const { towerType } = data;

    if (!window.game.gameState.selectedTowerSlot) {
      return;
    }

    // Get tower cost from tower config
    const towerCost = window.towerConfig.basic.ranks[0].cost;

    // Check if player can afford
    let canAfford = false;
    this.eventSystem.emit("checkGold", {
      amount: towerCost,
      callback: (result) => {
        canAfford = result;
      },
    });

    if (!canAfford) {
      console.log(`Cannot afford tower: ${towerType}, cost: ${towerCost}`);
      return;
    }

    // Store the selected slot index before we lose the reference
    const selectedSlotIndex = window.game.gameState.selectedTowerSlot.index;
    const selectedSlotPosition = window.game.gameState.selectedTowerSlot.position.clone();

    // Deduct gold
    this.eventSystem.emit("spendGold", { amount: towerCost });

    // Build tower
    const tower = new Tower(selectedSlotPosition, selectedSlotIndex);

    // Emit tower built event
    this.eventSystem.emit("towerBuilt", {
      tower,
      slotIndex: selectedSlotIndex,
    });

    // Hide tower selection UI and clear selection
    this.eventSystem.emit("hideUI", { type: "towerSelection" });
    this.eventSystem.emit("towerSlotSelected", { slot: null });
    
    console.log("PlayingState: Tower built at slot", selectedSlotIndex);
  }

  handleUpgradeTowerClicked() {
    if (!this.isActive || !window.game.gameState.selectedTower) return;

    // Upgrade the tower
    const upgraded = window.game.gameState.selectedTower.upgrade();

    if (upgraded) {
      // Update UI
      this.eventSystem.emit("towerDetailsUpdated", {
        tower: window.game.gameState.selectedTower,
      });
      
      console.log("PlayingState: Tower upgraded to rank", window.game.gameState.selectedTower.rank);
    }
  }

  handleSellTowerClicked() {
    if (!this.isActive || !window.game.gameState.selectedTower) return;

    // Sell the tower
    window.game.gameState.selectedTower.sell();

    // Hide tower actions UI
    this.eventSystem.emit("hideUI", { type: "towerActions" });
    
    console.log("PlayingState: Tower sold");
  }

  handleCancelTowerActionClicked() {
    if (!this.isActive) return;

    // Clear tower selection
    this.eventSystem.emit("towerSelected", { tower: null });

    // Hide tower actions UI
    this.eventSystem.emit("hideUI", { type: "towerActions" });
    
    console.log("PlayingState: Tower action canceled");
  }

  showTowerSlotRangeIndicator(data) {
    if (!this.isActive) return;

    const { position } = data;

    // Remove existing indicator
    this.hideTowerSlotRangeIndicator();

    // Create new indicator
    this.towerSlotRangeIndicator = window.game.renderer.createRangeIndicator(position, 8);
    this.eventSystem.emit("addToScene", { object: this.towerSlotRangeIndicator });
  }

  hideTowerSlotRangeIndicator() {
    if (this.towerSlotRangeIndicator) {
      this.eventSystem.emit("removeFromScene", {
        object: this.towerSlotRangeIndicator,
      });
      this.towerSlotRangeIndicator = null;
    }
  }
}