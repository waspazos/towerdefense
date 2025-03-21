import eventSystem from '../engine/EventSystem';

class HUD {
  constructor() {
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
    eventSystem.on('damageDealt', this.handleDamageDealt.bind(this));
    eventSystem.on('updateDPS', this.updateDPS.bind(this));
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
  
  update() {
    // Most UI updates are handled via events in UIManager
    // This method is just for any frame-by-frame updates that might be needed
    
    // Check if we need to get updated values
    let kingHealth = 0;
    eventSystem.emit('getKingHealth', { 
      callback: (value) => { kingHealth = value; } 
    });
    
    let gold = 0;
    eventSystem.emit('getGold', { 
      callback: (value) => { gold = value; } 
    });
    
    // Update elements if needed (only if values changed)
    if (this.lastKingHealth !== kingHealth && this.elements.kingHealth) {
      this.elements.kingHealth.textContent = Math.max(0, Math.floor(kingHealth));
      this.lastKingHealth = kingHealth;
    }
    
    if (this.lastGold !== gold && this.elements.gold) {
      this.elements.gold.textContent = gold;
      this.lastGold = gold;
    }
  }
}

export default new HUD();