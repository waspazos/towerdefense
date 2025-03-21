import eventSystem from '../engine/EventSystem';

class EconomySystem {
  constructor() {
    this.gold = 10;
    this.goldPerKill = 1;
    
    // Register event listeners
    eventSystem.on('creepKilled', this.handleCreepKilled.bind(this));
    eventSystem.on('workerMinedGold', this.handleWorkerMinedGold.bind(this));
    eventSystem.on('spendGold', this.spendGold.bind(this));
    eventSystem.on('addGold', this.addGold.bind(this));
    eventSystem.on('checkGold', this.checkGold.bind(this));
    eventSystem.on('setGoldPerKill', this.setGoldPerKill.bind(this));
    eventSystem.on('reset', this.reset.bind(this));
  }
  
  reset() {
    this.gold = 10;
    this.goldPerKill = 1;
    eventSystem.emit('goldChanged', this.gold);
  }
  
  handleCreepKilled(data) {
    const { goldValue } = data;
    this.addGold({ amount: goldValue * this.goldPerKill });
  }
  
  handleWorkerMinedGold(data) {
    const { amount } = data;
    this.addGold({ amount });
  }
  
  spendGold(data) {
    const { amount } = data;
    if (this.gold >= amount) {
      this.gold -= amount;
      eventSystem.emit('goldChanged', this.gold);
      return true;
    }
    return false;
  }
  
  addGold(data) {
    const { amount } = data;
    this.gold += amount;
    eventSystem.emit('goldChanged', this.gold);
  }
  
  checkGold(data) {
    const { amount, callback } = data;
    if (callback) {
      callback(this.gold >= amount);
    }
    return this.gold >= amount;
  }
  
  setGoldPerKill(data) {
    const { amount } = data;
    this.goldPerKill = amount;
  }
  
  getGold() {
    return this.gold;
  }
}

export default new EconomySystem();