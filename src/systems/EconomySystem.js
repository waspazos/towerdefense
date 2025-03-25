// src/systems/EconomySystem.js
export class EconomySystem {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.gold = 20; // Default starting gold
    this.goldPerKill = 1;

    // Register event listeners
    this.eventSystem.on('creepKilled', this.handleCreepKilled.bind(this));
    this.eventSystem.on('spendGold', this.spendGold.bind(this));
    this.eventSystem.on('addGold', this.addGold.bind(this));
    this.eventSystem.on('checkGold', this.checkGold.bind(this));
    this.eventSystem.on('getGold', this.handleGetGold.bind(this));
    this.eventSystem.on('initializeEconomy', this.initializeEconomy.bind(this));
    this.eventSystem.on('reset', this.reset.bind(this));
    
    console.log("EconomySystem: Initialized with", this.gold, "gold");
  }

  initializeEconomy(data) {
    const { startingGold } = data;
    if (startingGold) {
      this.gold = startingGold;
      this.eventSystem.emit('goldChanged', { gold: this.gold });
      console.log(`EconomySystem: Set starting gold to ${startingGold}`);
    }
  }

  handleCreepKilled(data) {
    const { goldValue } = data;
    this.addGold({ amount: goldValue * this.goldPerKill });
  }

  spendGold(data) {
    const { amount } = data;
    if (this.gold >= amount) {
      this.gold -= amount;
      this.eventSystem.emit('goldChanged', { gold: this.gold });
      return true;
    }
    return false;
  }

  addGold(data) {
    const { amount } = data;
    this.gold += amount;
    this.eventSystem.emit('goldChanged', { gold: this.gold });
  }

  checkGold(data) {
    const { amount, callback } = data;
    if (callback) {
      callback(this.gold >= amount);
    }
    return this.gold >= amount;
  }

  handleGetGold(data) {
    const { callback } = data;
    if (callback) {
      callback(this.gold);
    }
  }
  
  reset() {
    // Reset to default gold (will be overridden by faction selection)
    this.gold = 20;
    this.goldPerKill = 1;
    this.eventSystem.emit('goldChanged', { gold: this.gold });
    
    console.log("EconomySystem: Reset to", this.gold, "gold");
  }
}