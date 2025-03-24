export class UIManager {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    
    // UI element references
    this.elements = {
      towerSelection: document.getElementById('tower-selection'),
      towerSelectionBackdrop: document.getElementById('tower-selection-backdrop'),
      towerActions: document.getElementById('tower-actions'),
      gameOver: document.getElementById('game-over'),
      pauseMenu: document.getElementById('esc-menu'),
      roundTracker: document.getElementById('round-tracker')
    };
    
    // Register event listeners
    this.eventSystem.on('showUI', this.showUI.bind(this));
    this.eventSystem.on('hideUI', this.hideUI.bind(this));
    this.eventSystem.on('updateUI', this.updateUI.bind(this));
    this.eventSystem.on('goldChanged', this.updateGold.bind(this));
    this.eventSystem.on('kingHealthChanged', this.updateKingHealth.bind(this));
    this.eventSystem.on('towerCountChanged', this.updateTowerCount.bind(this));
    this.eventSystem.on('roundStarted', this.updateRoundCounter.bind(this));
    this.eventSystem.on('roundCompleted', this.updateRoundCounter.bind(this));
    this.eventSystem.on('interRoundTimerUpdated', this.updateRoundTimer.bind(this));
    this.eventSystem.on('towerDetailsUpdated', this.updateTowerDetails.bind(this));
    this.eventSystem.on('gameStarted', this.handleGameStarted.bind(this));

    // Add click handler for backdrop
    this.elements.towerSelectionBackdrop.addEventListener('click', (event) => {
      // Only hide if clicking directly on the backdrop (not its children)
      if (event.target === this.elements.towerSelectionBackdrop) {
        this.hideUI({ type: 'towerSelection' });
        this.eventSystem.emit('cancelTowerPlacement');
      }
    });

    // Add click handler for upgrade button
    const upgradeButton = document.getElementById('upgrade-tower');
    if (upgradeButton) {
      upgradeButton.addEventListener('click', () => {
        console.log("UIManager: Upgrade button clicked, emitting upgradeTowerClicked event");
        this.eventSystem.emit('upgradeTowerClicked');
      });
    } else {
      console.warn("UIManager: Upgrade button not found!");
    }
    
    console.log("UIManager: Initialized");
  }

  initialize() {
    // Initial UI setup
    this.updateRoundTracker();
    this.updateUI();
    
    console.log("UIManager: UI elements initialized");
  }

  handleGameStarted() {
    // Hide any game over or pause screens
    this.hideUI({ type: 'gameOver' });
    this.hideUI({ type: 'pauseMenu' });
    
    // Update all UI elements to their initial state
    this.updateUI();
    
    console.log("UIManager: Game started, UI reset");
  }

  showUI(data) {
    const { type, data: uiData } = data;

    if (!this.elements[type]) {
      console.warn(`UIManager: Element "${type}" not found`);
      return;
    }

    console.log(`UIManager: Showing UI element "${type}" with data:`, uiData);
    this.elements[type].classList.remove('hidden');

    // Additional setup based on UI type
    switch (type) {
      case 'towerSelection':
        this.elements.towerSelectionBackdrop.classList.remove('hidden');
        this.updateTowerOptionsAvailability();
        // Ensure backdrop is behind the selection modal but above the game
        this.elements.towerSelectionBackdrop.style.zIndex = '2';
        this.elements.towerSelection.style.zIndex = '3';
        break;
      case 'towerActions':
        if (uiData && uiData.tower) {
          console.log("UIManager: Updating tower details for tower:", uiData.tower);
          this.updateTowerDetails({ tower: uiData.tower });
        }
        break;
      case 'gameOver':
        this.setupGameOverScreen(uiData);
        break;
    }
    
    console.log(`UIManager: Showing UI element "${type}"`);
  }

  hideUI(data) {
    const { type } = data;

    if (!this.elements[type]) {
      console.warn(`UIManager: Element "${type}" not found`);
      return;
    }

    this.elements[type].classList.add('hidden');

    // Additional cleanup based on UI type
    if (type === 'towerSelection') {
      this.elements.towerSelectionBackdrop.classList.add('hidden');
    }
    
    console.log(`UIManager: Hiding UI element "${type}"`);
  }

  updateUI() {
    this.updateGold();
    this.updateKingHealth();
    this.updateTowerCount();
    this.updateRoundCounter();
    this.updateRoundTimer();
    this.updateRoundTracker();
    
    console.log("UIManager: All UI elements updated");
  }

  updateGold() {
    const goldElement = document.getElementById('gold');
    if (!goldElement) return;

    this.eventSystem.emit('getGold', { 
      callback: (gold) => {
        goldElement.textContent = gold;
      }
    });

    // Update tower affordability
    this.updateTowerOptionsAvailability();
  }

  updateKingHealth() {
    const healthElement = document.getElementById('king-health');
    if (!healthElement) return;

    this.eventSystem.emit('getKingHealth', {
      callback: (health, maxHealth) => {
        healthElement.textContent = `${Math.max(0, Math.floor(health))}/${maxHealth}`;
      }
    });
  }

  updateTowerCount() {
    const towerCountElement = document.getElementById('tower-count');
    if (!towerCountElement) return;

    this.eventSystem.emit('getTowerCount', { 
      callback: (count) => {
        towerCountElement.textContent = count;
      }
    });
  }

  updateRoundCounter(data) {
    const roundCounterElement = document.getElementById('round-counter');
    if (!roundCounterElement) return;

    let round = 0;
    if (data && data.roundNumber) {
      round = data.roundNumber;
    } else {
      this.eventSystem.emit('getCurrentRound', { 
        callback: (currentRound) => {
          round = currentRound;
        }
      });
    }

    this.eventSystem.emit('getMaxRounds', { 
      callback: (maxRounds) => {
        roundCounterElement.textContent = `Round: ${round}/${maxRounds}`;
      }
    });

    // Also update round tracker
    this.updateRoundTracker(round);
  }

  updateRoundTimer(data) {
    const timerElement = document.getElementById('round-timer');
    if (!timerElement) return;

    // Check if a round is active
    this.eventSystem.emit('isRoundActive', { 
      callback: (isActive) => {
        if (isActive) {
          timerElement.textContent = 'Round in progress';
          return;
        }

        // Display timer
        let timerValue = 0;
        if (data && typeof data.timer === 'number') {
          timerValue = data.timer;
        } else {
          this.eventSystem.emit('getInterRoundTimer', {
            callback: (value) => {
              timerValue = value;
            }
          });
        }

        const seconds = Math.max(0, Math.ceil(timerValue));
        timerElement.textContent = `Next round in: ${seconds}s`;
      }
    });
  }

  updateRoundTracker(currentRound) {
    // Get current round if not provided
    if (currentRound === undefined) {
      this.eventSystem.emit('getCurrentRound', { 
        callback: (value) => {
          currentRound = value;
        }
      });
    }

    // Update the round tracker UI
    const previousRound = Math.max(0, currentRound - 1);
    const nextRound = currentRound + 1;
    const futureRound = currentRound + 2;

    let maxRounds = 20;
    this.eventSystem.emit('getMaxRounds', { 
      callback: (value) => {
        maxRounds = value;
      }
    });

    // Update previous round
    const previousRoundElem = document.getElementById('previous-round');
    const previousRoundDetailsElem = document.getElementById('previous-round-details');

    if (previousRound >= 1) {
      previousRoundElem.textContent = previousRound.toString();
      // Get round type from config
      const roundDef = window.roundConfig.rounds[previousRound - 1];
      previousRoundDetailsElem.textContent = roundDef ? roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1) : 'N/A';
    } else {
      previousRoundElem.textContent = '-';
      previousRoundDetailsElem.textContent = 'N/A';
    }

    // Update current round
    const currentRoundElem = document.getElementById('current-round');
    const currentRoundDetailsElem = document.getElementById('current-round-details');

    currentRoundElem.textContent = currentRound.toString();
    if (currentRound >= 1 && currentRound <= maxRounds) {
      const roundDef = window.roundConfig.rounds[currentRound - 1];
      currentRoundDetailsElem.textContent = roundDef ? roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1) : 'Preparing';
    } else {
      currentRoundDetailsElem.textContent = 'Preparing';
    }

    // Update next round
    const nextRoundElem = document.getElementById('next-round');
    const nextRoundDetailsElem = document.getElementById('next-round-details');

    if (nextRound <= maxRounds) {
      nextRoundElem.textContent = nextRound.toString();
      const roundDef = window.roundConfig.rounds[nextRound - 1];
      nextRoundDetailsElem.textContent = roundDef ? roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1) : 'N/A';
    } else {
      nextRoundElem.textContent = '-';
      nextRoundDetailsElem.textContent = 'N/A';
    }

    // Update future round
    const futureRoundElem = document.getElementById('future-round');
    const futureRoundDetailsElem = document.getElementById('future-round-details');

    if (futureRound <= maxRounds) {
      futureRoundElem.textContent = futureRound.toString();
      const roundDef = window.roundConfig.rounds[futureRound - 1];
      futureRoundDetailsElem.textContent = roundDef ? roundDef.type.charAt(0).toUpperCase() + roundDef.type.slice(1) : 'N/A';
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

    // Tower name and rank
    const towerDetailsName = document.getElementById('tower-details-name');
    const towerDetailsRank = document.getElementById('tower-details-rank');
    if (towerDetailsName) towerDetailsName.textContent = 'Tower';
    if (towerDetailsRank) towerDetailsRank.textContent = `Rank: ${tower.rank}`;

    // Tower stats
    const towerDetailsDamage = document.getElementById('tower-details-damage');
    const towerDetailsSpeed = document.getElementById('tower-details-speed');
    if (towerDetailsDamage) towerDetailsDamage.textContent = `Damage: ${tower.damage}`;
    if (towerDetailsSpeed) towerDetailsSpeed.textContent = `Attack Speed: ${tower.attackSpeed.toFixed(1)}s`;

    // Get upgrade options for current rank
    const currentRank = tower.rank;
    const nextRank = tower.rank + 1;
    const upgradeOptions = window.towerConfig.basic.ranks[currentRank]?.upgrades || [];
    const upgradeOptionsContainer = document.querySelector('.upgrade-options-container');
    const upgradeOptionsDiv = document.getElementById('upgrade-options');
    const towerActions = document.getElementById('tower-actions');

    console.log("UIManager: Current tower rank:", currentRank);
    console.log("UIManager: Next rank:", nextRank);
    console.log("UIManager: Available upgrade options:", upgradeOptions);

    // Update upgrade button text and state
    const upgradeButton = document.getElementById('upgrade-tower');
    if (upgradeButton) {
        if (tower.rank >= 5) {
            upgradeButton.textContent = 'MAX RANK';
            upgradeButton.disabled = true;
        } else {
            upgradeButton.textContent = 'Choose Upgrade';
            upgradeButton.disabled = false;
        }
    }

    // Clear previous upgrade options
    if (upgradeOptionsContainer) {
        upgradeOptionsContainer.innerHTML = '';
    }

    // Show upgrade options if available
    if (upgradeOptions.length > 0 && tower.rank < 5) {
        console.log("UIManager: Showing upgrade options for tower rank", currentRank);
        if (upgradeOptionsDiv) {
            upgradeOptionsDiv.classList.remove('hidden');
            console.log("UIManager: Upgrade options div shown");
        }
        if (towerActions) towerActions.classList.add('showing-upgrades');

        // Get upgrade cost for current rank
        const upgradeCost = window.towerConfig.basic.ranks[currentRank].cost;
        
        // Check if player can afford
        this.eventSystem.emit('checkGold', {
            amount: upgradeCost,
            callback: (canAfford) => {
                console.log("UIManager: Can afford upgrade:", canAfford);
                // Create upgrade option elements
                upgradeOptions.forEach((upgrade) => {
                    // Skip if this upgrade is already selected
                    if (tower.selectedUpgrades && tower.selectedUpgrades.includes(upgrade.id)) {
                        return;
                    }

                    const optionElement = document.createElement('div');
                    optionElement.className = 'upgrade-option';
                    
                    // Create the button structure
                    optionElement.innerHTML = `
                        <div class="upgrade-option-header">
                            <div class="upgrade-option-name">${upgrade.name}</div>
                            <div class="upgrade-option-cost">${upgradeCost} Gold</div>
                        </div>
                        <div class="upgrade-option-description">${upgrade.description}</div>
                        <button class="upgrade-button" ${!canAfford ? 'disabled' : ''}>
                            Select Upgrade
                        </button>
                    `;

                    // Add click handler to the button
                    const button = optionElement.querySelector('.upgrade-button');
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        tower.selectedUpgrade = upgrade;
                        if (!tower.selectedUpgrades) tower.selectedUpgrades = [];
                        tower.selectedUpgrades.push(upgrade.id);
                        this.eventSystem.emit('upgradeTower', { tower });
                        // Hide the tower actions after upgrading
                        this.hideUI({ type: 'towerActions' });
                    });

                    if (upgradeOptionsContainer) {
                        upgradeOptionsContainer.appendChild(optionElement);
                        console.log("UIManager: Added upgrade option:", upgrade.name);
                    }
                });

                // Show selected upgrades at the bottom
                if (tower.selectedUpgrades && tower.selectedUpgrades.length > 0) {
                    const selectedUpgradesDiv = document.createElement('div');
                    selectedUpgradesDiv.className = 'selected-upgrades';
                    selectedUpgradesDiv.innerHTML = '<div class="selected-upgrades-title">Selected Upgrades:</div>';
                    
                    tower.selectedUpgrades.forEach(upgradeId => {
                        const upgrade = window.towerConfig.basic.ranks
                            .flatMap(rank => rank.upgrades || [])
                            .find(u => u.id === upgradeId);
                        
                        if (upgrade) {
                            const selectedUpgradeElement = document.createElement('div');
                            selectedUpgradeElement.className = 'selected-upgrade';
                            selectedUpgradeElement.textContent = upgrade.name;
                            selectedUpgradesDiv.appendChild(selectedUpgradeElement);
                        }
                    });

                    if (upgradeOptionsContainer) {
                        upgradeOptionsContainer.appendChild(selectedUpgradesDiv);
                    }
                }
            }
        });
    } else {
        console.log("UIManager: No upgrade options available or tower at max rank");
        // Hide upgrade options if none available
        if (upgradeOptionsDiv) upgradeOptionsDiv.classList.add('hidden');
        if (towerActions) towerActions.classList.remove('showing-upgrades');
    }

    // Sell button
    const sellButton = document.getElementById('sell-tower');
    if (sellButton) {
        const sellValue = Math.floor(tower.totalCost * 0.5);
        sellButton.textContent = `Sell (${sellValue} Gold)`;
    }
  }

  updateTowerOptionsAvailability() {
    const towerOptions = document.querySelectorAll('.tower-option');
    let gold = 0;
    
    this.eventSystem.emit('getGold', { 
      callback: (value) => {
        gold = value;
      }
    });

    towerOptions.forEach(option => {
      const cost = window.towerConfig.basic.ranks[0].cost;
      const canAfford = gold >= cost;

      option.classList.toggle('affordable', canAfford);
      option.classList.toggle('unaffordable', !canAfford);
    });
  }

  setupGameOverScreen(data) {
    const { victory, finalScore, roundsSurvived } = data || {};
    
    // Set title based on victory/defeat
    const resultTitle = document.getElementById('game-result-title');
    const resultMessage = document.getElementById('game-result-message');
    
    if (resultTitle) {
      resultTitle.textContent = victory ? 'Victory!' : 'Game Over';
    }
    
    if (resultMessage) {
      resultMessage.textContent = victory ? 
        'You successfully defended the king!' : 
        'The king has fallen!';
    }
    
    // Update stats
    const roundsElement = document.getElementById('rounds-survived');
    if (roundsElement && roundsSurvived !== undefined) {
      roundsElement.textContent = roundsSurvived;
    }
  }
}