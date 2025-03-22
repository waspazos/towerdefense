import {roundConfig} from '../config/roundConfig.js';
import {towerConfig} from "../config/towerConfig.js";

export class UIManager {
  constructor() {
    console.log('UIManager: Initializing');
    this.elements = {
      towerSelection: document.getElementById('tower-selection'),
      towerSelectionBackdrop: document.getElementById('tower-selection-backdrop'),
      towerActions: document.getElementById('tower-actions'),
      gameOver: document.getElementById('game-over'),
      pauseMenu: document.getElementById('esc-menu'),
      augmentModal: document.getElementById('augment-modal'),
      roundTracker: document.getElementById('round-tracker'),
      augmentTracker: document.getElementById('augment-tracker'),
      workerCamp: document.getElementById('worker-camp')
    };

    // Log which UI elements were found
    console.log('UIManager: UI elements found:', Object.entries(this.elements).reduce((acc, [key, value]) => {
      acc[key] = !!value;
      return acc;
    }, {}));

    // Register event listeners
    window.game.eventSystem.on('showUI', this.showUI.bind(this));
    window.game.eventSystem.on('hideUI', this.hideUI.bind(this));
    window.game.eventSystem.on('updateUI', this.updateUI.bind(this));
    window.game.eventSystem.on('goldChanged', this.updateGold.bind(this));
    window.game.eventSystem.on('kingHealthChanged', this.updateKingHealth.bind(this));
    window.game.eventSystem.on('towerCountChanged', this.updateTowerCount.bind(this));
    window.game.eventSystem.on('roundStarted', this.updateRoundCounter.bind(this));
    window.game.eventSystem.on('roundCompleted', this.updateRoundCounter.bind(this));
    window.game.eventSystem.on('interRoundTimerUpdated', this.updateRoundTimer.bind(this));
    window.game.eventSystem.on('towerDetailsUpdated', this.updateTowerDetails.bind(this));
    window.game.eventSystem.on('showAugmentSelection', this.showAugmentSelection.bind(this));
    window.game.eventSystem.on('augmentSelected', this.updateAugmentTracker.bind(this));
    window.game.eventSystem.on('workerHired', this.updateWorkerList.bind(this));
    window.game.eventSystem.on('gameStarted', this.handleGameStarted.bind(this));
  }

  handleGameStarted() {
    console.log('UIManager: Game started');
    // Hide any game over or pause screens
    this.hideUI({ type: 'gameOver' });
    this.hideUI({ type: 'pauseMenu' });
    
    // Update all UI elements to their initial state
    this.updateUI();
  }

  initialize() {
    console.log('UIManager: Running initial UI setup');
    // Initial UI setup
    this.updateRoundTracker();
    this.updateAugmentTracker();
    this.updateWorkerList();
    this.updateUI(); // Add this to ensure all UI elements are updated initially
  }

  showUI(data) {
    const { type, data: uiData } = data;

    if (!this.elements[type]) return;

    this.elements[type].classList.remove('hidden');

    // Additional setup based on UI type
    switch (type) {
      case 'towerSelection':
        this.elements.towerSelectionBackdrop.classList.remove('hidden');
        this.updateTowerOptionsAvailability();
        break;
      case 'towerActions':
        if (uiData && uiData.tower) {
          this.updateTowerDetails({ tower: uiData.tower });
        }
        break;
      case 'gameOver':
        this.setupGameOverScreen(uiData);
        break;
    }
  }

  hideUI(data) {
    const { type } = data;

    if (!this.elements[type]) return;

    this.elements[type].classList.add('hidden');

    // Additional cleanup based on UI type
    if (type === 'towerSelection') {
      this.elements.towerSelectionBackdrop.classList.add('hidden');
    }
  }

  updateUI() {
    console.log('UIManager: Updating all UI elements');
    this.updateGold();
    this.updateKingHealth();
    this.updateTowerCount();
    this.updateRoundCounter();
    this.updateRoundTimer();
    this.updateRoundTracker();
    this.updateAugmentTracker();
    this.updateWorkerList();
  }

  updateGold(data) {
    console.log('UIManager: Updating gold display');
    const goldElement = document.getElementById('gold');
    if (!goldElement) {
      console.warn('UIManager: Gold element not found');
      return;
    }

    let gold = 0;
    if (data && data.gold !== undefined) {
      gold = data.gold;
    } else {
      window.game.eventSystem.emit('getGold', { 
        callback: (value) => {
          console.log('UIManager: Received gold value:', value);
          gold = value;
          goldElement.textContent = gold;
        }
      });
    }

    // Update buyable states
    this.updateTowerOptionsAvailability();
    this.updateBuyWorkerButton();
  }

  updateKingHealth(data) {
    console.log('UIManager: Updating king health display');
    const healthElement = document.getElementById('king-health');
    if (!healthElement) {
      console.warn('UIManager: Health element not found');
      return;
    }

    if (data && data.health !== undefined) {
      healthElement.textContent = `${data.health}/${data.maxHealth}`;
    } else {
      window.game.eventSystem.emit('getKingHealth', {
        callback: (health) => {
          console.log('UIManager: Received king health:', health);
          healthElement.textContent = `${health.current}/${health.max}`;
        }
      });
    }
  }

  updateTowerCount(data) {
    const towerCountElement = document.getElementById('tower-count');
    if (!towerCountElement) return;

    let count = 0;
    if (data && data.count !== undefined) {
      count = data.count;
    } else {
      window.game.eventSystem.emit('getTowerCount', { callback: (value) => { count = value; } });
    }

    towerCountElement.textContent = count;
  }

  updateRoundCounter(data) {
    const roundCounterElement = document.getElementById('round-counter');
    if (!roundCounterElement) return;

    let round = 0;
    let maxRounds = 20;

    if (data) {
      round = data.roundNumber;
    } else {
      window.game.eventSystem.emit('getCurrentRound', { callback: (value) => { round = value; } });
    }

    window.game.eventSystem.emit('getMaxRounds', { callback: (value) => { maxRounds = value; } });

    roundCounterElement.textContent = `Round: ${round}/${maxRounds}`;

    // Also update round tracker
    this.updateRoundTracker(round);
  }

  updateRoundTimer(data) {
    console.log('UIManager: Updating round timer');
    const timerElement = document.getElementById('round-timer');
    if (!timerElement) {
      console.warn('UIManager: Timer element not found');
      return;
    }

    // Check round active status
    window.game.eventSystem.emit('isRoundActive', { 
      callback: (isActive) => { 
        console.log('UIManager: Round active status:', isActive);
        
        if (isActive) {
          timerElement.textContent = 'Round in progress';
          return;
        }

        // Handle timer value
        const updateTimerDisplay = (timerValue) => {
          console.log('UIManager: Processing timer value:', timerValue);
          
          // Ensure we have a valid number
          if (typeof timerValue !== 'number' || isNaN(timerValue)) {
            console.warn('UIManager: Invalid timer value:', timerValue);
            timerElement.textContent = 'Preparing...';
            return;
          }

          // Format and display the timer
          const displayTime = Math.max(0, Math.floor(timerValue));
          timerElement.textContent = `Next round in: ${displayTime}s`;
        };

        // If we have timer data directly from the event
        if (data && typeof data.timer === 'number') {
          console.log('UIManager: Using timer value from event:', data.timer);
          updateTimerDisplay(data.timer);
        } else {
          // Otherwise fetch the current timer value
          console.log('UIManager: Requesting current timer value');
          window.game.eventSystem.emit('getInterRoundTimer', {
            callback: (value) => {
              console.log('UIManager: Received timer value:', value);
              updateTimerDisplay(value);
            }
          });
        }
      }
    });
  }

  updateRoundTracker(currentRound) {
    // Get current round if not provided
    if (currentRound === undefined) {
      window.game.eventSystem.emit('getCurrentRound', { callback: (value) => { currentRound = value; } });
    }

    const previousRound = currentRound - 1;
    const nextRound = currentRound + 1;
    const futureRound = currentRound + 2;

    let maxRounds = 20;
    window.game.eventSystem.emit('getMaxRounds', { callback: (value) => { maxRounds = value; } });

    // Update previous round
    const previousRoundElem = document.getElementById('previous-round');
    const previousRoundDetailsElem = document.getElementById('previous-round-details');

    if (previousRound >= 1) {
      previousRoundElem.textContent = previousRound.toString();

      // Get round type
      const roundDef = roundConfig.rounds[previousRound - 1];
      if (roundDef) {
        previousRoundDetailsElem.textContent = roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1);
      } else {
        previousRoundDetailsElem.textContent = 'N/A';
      }
    } else {
      previousRoundElem.textContent = '-';
      previousRoundDetailsElem.textContent = 'N/A';
    }

    // Update current round
    const currentRoundElem = document.getElementById('current-round');
    const currentRoundDetailsElem = document.getElementById('current-round-details');

    currentRoundElem.textContent = currentRound;

    if (currentRound >= 1 && currentRound <= maxRounds) {
      const roundDef = roundConfig.rounds[currentRound - 1];
      if (roundDef) {
        currentRoundDetailsElem.textContent = roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1);
      } else {
        currentRoundDetailsElem.textContent = 'Preparing';
      }
    } else {
      currentRoundDetailsElem.textContent = 'Preparing';
    }

    // Update next round
    const nextRoundElem = document.getElementById('next-round');
    const nextRoundDetailsElem = document.getElementById('next-round-details');

    if (nextRound <= maxRounds) {
      nextRoundElem.textContent = nextRound;

      const roundDef = roundConfig.rounds[nextRound - 1];
      if (roundDef) {
        nextRoundDetailsElem.textContent = roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1);
      } else {
        nextRoundDetailsElem.textContent = 'N/A';
      }
    } else {
      nextRoundElem.textContent = '-';
      nextRoundDetailsElem.textContent = 'N/A';
    }

    // Update future round
    const futureRoundElem = document.getElementById('future-round');
    const futureRoundDetailsElem = document.getElementById('future-round-details');

    if (futureRound <= maxRounds) {
      futureRoundElem.textContent = futureRound;

      const roundDef = roundConfig.rounds[futureRound - 1];
      if (roundDef) {
        futureRoundDetailsElem.textContent = roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1);
      } else {
        futureRoundDetailsElem.textContent = 'N/A';
      }
    } else {
      futureRoundElem.textContent = '-';
      futureRoundDetailsElem.textContent = 'N/A';
    }

    // Reset all active classes
    document.querySelectorAll('.round-item').forEach(item => item.classList.remove('active'));

    // Only highlight current round when game has started
    if (currentRound >= 1) {
      document.querySelector('.round-item.current').classList.add('active');
    }
  }

  updateTowerDetails(data) {
    const { tower } = data;
    if (!tower) return;

    // Update tower name and rank
    const nameElement = document.getElementById('tower-name');
    const rankElement = document.getElementById('tower-rank');
    if (nameElement) nameElement.textContent = tower.type.charAt(0).toUpperCase() + tower.type.slice(1) + ' Tower';
    if (rankElement) rankElement.textContent = `Rank ${tower.rank}`;

    // Update tower stats
    const damageElement = document.getElementById('tower-damage');
    const speedElement = document.getElementById('tower-speed');
    const rangeElement = document.getElementById('tower-range');

    if (damageElement) damageElement.textContent = tower.damage;
    if (speedElement) speedElement.textContent = (1 / tower.attackSpeed).toFixed(1);
    if (rangeElement) rangeElement.textContent = tower.range;

    // Update upgrade cost
    const upgradeCostElement = document.getElementById('upgrade-cost');
    if (upgradeCostElement) {
      if (tower.rank < 5) {
        const upgradeCost = towerConfig[tower.type].ranks[tower.rank].cost;
        upgradeCostElement.textContent = upgradeCost;
      } else {
        upgradeCostElement.textContent = 'MAX';
      }
    }

    // Update sell value
    const sellValueElement = document.getElementById('sell-value');
    if (sellValueElement) {
      sellValueElement.textContent = Math.floor(tower.totalCost * 0.5);
    }
  }

  updateTowerOptionsAvailability() {
    const towerOptions = document.querySelectorAll('.tower-option');
    let gold = 0;
    window.game.eventSystem.emit('getGold', { callback: (value) => { gold = value; } });

    towerOptions.forEach(option => {
      const towerType = option.getAttribute('data-type');
      const cost = towerConfig[towerType].ranks[0].cost;
      const canAfford = gold >= cost;

      option.classList.toggle('affordable', canAfford);
      option.classList.toggle('unaffordable', !canAfford);
    });
  }

  showAugmentSelection(data) {
    const { augments } = data;
    if (!augments || augments.length === 0) return;

    // Clear previous options
    const container = document.getElementById('augment-options');
    if (!container) return;
    container.innerHTML = '';

    // Create augment options
    augments.forEach(augment => {
      const option = document.createElement('div');
      option.className = 'augment-option';
      option.innerHTML = `
        <h3>${augment.name}</h3>
        <p>${augment.description}</p>
      `;

      option.addEventListener('click', () => {
        window.game.eventSystem.emit('selectAugment', { augment });
        this.hideUI({ type: 'augmentModal' });
      });

      container.appendChild(option);
    });

    // Show modal
    this.showUI({ type: 'augmentModal' });
  }

  updateAugmentTracker() {
    const container = document.getElementById('augment-list');
    if (!container) return;

    // Clear previous augments
    container.innerHTML = '';

    // Get active augments
    let activeAugments = [];
    window.game.eventSystem.emit('getActiveAugments', { callback: (augments) => { activeAugments = augments; } });

    // Create augment elements
    activeAugments.forEach(augment => {
      const element = document.createElement('div');
      element.className = 'augment-item';
      element.innerHTML = `
        <h4>${augment.name}</h4>
        <p>${augment.description}</p>
      `;
      container.appendChild(element);
    });
  }

  updateBuyWorkerButton() {
    const button = document.getElementById('buy-worker');
    if (!button) return;

    let gold = 0;
    window.game.eventSystem.emit('getGold', { callback: (value) => { gold = value; } });

    const workerCost = 10; // TODO: Move to config
    const canAfford = gold >= workerCost;

    button.classList.toggle('affordable', canAfford);
    button.classList.toggle('unaffordable', !canAfford);
  }

  updateWorkerList() {
    const container = document.getElementById('worker-list');
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Get workers
    let workers = [];
    window.game.eventSystem.emit('getWorkers', { callback: (workerList) => { workers = workerList; } });

    // Create worker count display
    const element = document.createElement('div');
    element.className = 'worker-count';
    element.innerHTML = `
      <div class="worker-icon"></div>
      <div class="worker-count-text">x${workers.length}</div>
    `;
    container.appendChild(element);
  }

  setupGameOverScreen(data) {
    const { finalScore, roundsSurvived } = data;

    // Update score
    const scoreElement = document.getElementById('final-score');
    if (scoreElement) {
      scoreElement.textContent = finalScore;
    }

    // Update rounds survived
    const roundsElement = document.getElementById('rounds-survived');
    if (roundsElement) {
      roundsElement.textContent = roundsSurvived;
    }
  }
}
