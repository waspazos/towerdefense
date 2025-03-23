class HUD {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    
    // UI element references
    this.elements = {
      kingHealth: document.getElementById('king-health'),
      gold: document.getElementById('gold'),
      towerCount: document.getElementById('tower-count'),
      totalDamage: document.getElementById('total-damage'),
      roundCounter: document.getElementById('round-counter'),
      roundTimer: document.getElementById('round-timer')
    };

    // DPS calculation
    this.damageInCurrentSecond = 0;
    this.currentDPS = 0;
    this.lastDPSUpdateTime = 0;

    // Register event listeners
    this.eventSystem.on('damageDealt', this.handleDamageDealt.bind(this));
    this.eventSystem.on('updateDPS', this.updateDPS.bind(this));
    this.eventSystem.on('goldChanged', this.updateGold.bind(this));
    this.eventSystem.on('kingHealthChanged', this.updateKingHealth.bind(this));
    this.eventSystem.on('towerCountChanged', this.updateTowerCount.bind(this));
    this.eventSystem.on('roundStarted', this.updateRoundCounter.bind(this));
    this.eventSystem.on('interRoundTimerUpdated', this.updateRoundTimer.bind(this));
    
    console.log("HUD: Initialized");
  }

  handleDamageDealt(data) {
    const { amount } = data;
    this.damageInCurrentSecond += amount;
  }

  updateDPS(data) {
    const { delta, currentTime } = data;

    // Update DPS every second
    if (currentTime - this.lastDPSUpdateTime >= 1.0) {
      this.currentDPS = this.damageInCurrentSecond;
      this.damageInCurrentSecond = 0;
      this.lastDPSUpdateTime = currentTime;

      if (this.elements.totalDamage) {
        this.elements.totalDamage.textContent = Math.round(this.currentDPS);
      }
    }
  }

  updateGold(data) {
    const { gold } = data;
    if (this.elements.gold) {
      this.elements.gold.textContent = gold;
    }
  }

  updateKingHealth(data) {
    const { health, maxHealth } = data;
    if (this.elements.kingHealth) {
      this.elements.kingHealth.textContent = `${Math.max(0, Math.floor(health))}/${maxHealth}`;
    }
  }

  updateTowerCount(data) {
    const { count } = data;
    if (this.elements.towerCount) {
      this.elements.towerCount.textContent = count;
    }
  }

  updateRoundCounter(data) {
    const { roundNumber } = data;
    if (this.elements.roundCounter) {
      this.eventSystem.emit('getMaxRounds', { 
        callback: (maxRounds) => {
          this.elements.roundCounter.textContent = `Round: ${roundNumber}/${maxRounds}`;
        }
      });
    }
  }

  updateRoundTimer(data) {
    const { timer } = data;
    if (this.elements.roundTimer) {
      this.eventSystem.emit('isRoundActive', {
        callback: (active) => {
          if (active) {
            this.elements.roundTimer.textContent = 'Round in progress';
          } else {
            const seconds = Math.max(0, Math.ceil(timer));
            this.elements.roundTimer.textContent = `Next round in: ${seconds}s`;
          }
        }
      });
    }
  }

  reset() {
    // Reset DPS calculation
    this.damageInCurrentSecond = 0;
    this.currentDPS = 0;
    this.lastDPSUpdateTime = 0;
    
    // Update all UI elements
    if (this.elements.totalDamage) {
      this.elements.totalDamage.textContent = '0';
    }
  }
}

export default HUD;