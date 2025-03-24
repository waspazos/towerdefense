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
    this.eventSystem.on("upgradeTower", this.handleUpgradeTower.bind(this));
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

    // Check for existing tower hits - include all meshes in the scene
    const towerIntersects = raycaster.intersectObjects(
      window.game.gameState.towers.map((tower) => tower.mesh).flatMap(group => {
        return [group, ...group.children];
      }),
      true // Enable recursive search through child meshes
    );

    // Clear selections if clicking on empty space
    if (towerSlotIntersects.length === 0 && towerIntersects.length === 0) {
      // Clear tower selection and hide its range indicator
      if (window.game.gameState.selectedTower) {
        window.game.gameState.selectedTower.hideRangeIndicator();
      }
      this.eventSystem.emit("towerSelected", { tower: null });

      // Clear tower slot selection and hide its range indicator
      this.hideTowerSlotRangeIndicator();
      this.eventSystem.emit("towerSlotSelected", { slot: null });

      // Hide UI elements
      this.eventSystem.emit("hideUI", { type: "towerActions" });
      this.eventSystem.emit("hideUI", { type: "towerSelection" });
      return;
    }

    // Handle tower slot selection
    if (towerSlotIntersects.length > 0) {
      // Clear any existing tower selection and its range indicator
      if (window.game.gameState.selectedTower) {
        window.game.gameState.selectedTower.hideRangeIndicator();
        this.eventSystem.emit("towerSelected", { tower: null });
      }

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
      // Clear any existing tower slot selection and its range indicator
      this.hideTowerSlotRangeIndicator();
      this.eventSystem.emit("towerSlotSelected", { slot: null });

      // Find the first intersected object that is part of a tower
      const intersectedObject = towerIntersects[0].object;
      
      // Find the tower group by traversing up the parent hierarchy
      let towerMesh = intersectedObject;
      while (towerMesh && !towerMesh.userData.isTower) {
        towerMesh = towerMesh.parent;
      }

      if (towerMesh) {
        const tower = window.game.gameState.towers.find((t) => t.mesh === towerMesh);
        if (tower) {
          // Clear previous tower selection if different
          if (window.game.gameState.selectedTower && window.game.gameState.selectedTower !== tower) {
            window.game.gameState.selectedTower.hideRangeIndicator();
          }
          this.eventSystem.emit("towerSelected", { tower });
          this.eventSystem.emit("showUI", { type: "towerActions", data: { tower } });
        }
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
    console.log("PlayingState: handleUpgradeTowerClicked called");
    if (!this.isActive || !window.game.gameState.selectedTower) {
      console.log("PlayingState: Cannot handle upgrade - game not active or no tower selected");
      return;
    }

    // Get the selected tower
    const tower = window.game.gameState.selectedTower;
    console.log("PlayingState: Selected tower found, emitting towerDetailsUpdated event");

    // Show upgrade options
    this.eventSystem.emit("towerDetailsUpdated", { tower });
  }

  handleUpgradeTower(data) {
    if (!this.isActive || !data.tower) return;

    const tower = data.tower;
    
    // Apply the upgrade (Tower class handles gold check and spending)
    const success = tower.upgrade();
    
    if (success) {
      console.log("PlayingState: Tower upgraded to rank", tower.rank);
    } else {
      console.log("PlayingState: Tower upgrade failed");
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