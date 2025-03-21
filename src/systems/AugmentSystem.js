import { eventSystem } from '../engine/EventSystem';
import { augmentConfig } from '../config/augmentConfig';

export class AugmentSystem {
  constructor() {
    this.activeAugments = [];
    this.availableAugments = [];
    
    // Register event listeners
    eventSystem.on('towerAttacked', this.handleTowerAttacked.bind(this));
    eventSystem.on('roundCompleted', this.handleRoundCompleted.bind(this));
    eventSystem.on('towerBuilt', this.applyAugmentsToTower.bind(this));
    eventSystem.on('selectAugment', this.selectAugment.bind(this));
    eventSystem.on('reset', this.reset.bind(this));
  }
  
  initialize() {
    // Load augments from config
    this.availableAugments = augmentConfig.available;
  }
  
  handleTowerAttacked(data) {
    const { tower } = data;
    
    // Apply the "Towers of Rage" augment effect if active
    const rageAugment = this.activeAugments.find(a => a.id === 'towers-of-rage');
    if (rageAugment) {
      rageAugment.effect(tower);
    }
  }
  
  handleRoundCompleted() {
    // Reset round-specific augments
    this.resetRoundAugments();
    
    // Check if it's time for augment selection
    const selectionRounds = augmentConfig.selection.rounds;
    const nextRound = this.getCurrentRound() + 1;
    
    if (selectionRounds.includes(nextRound)) {
      this.showAugmentSelection();
    }
  }
  
  getCurrentRound() {
    let currentRound = 0;
    eventSystem.emit('getCurrentRound', { callback: (round) => { currentRound = round; } });
    return currentRound;
  }
  
  selectAugment(data) {
    const { augment } = data;
    
    // Add augment to active augments
    this.activeAugments.push(augment);
    
    // Apply to all existing towers
    eventSystem.emit('getAllTowers', { callback: (towers) => {
      towers.forEach(tower => {
        if (augment.effect) {
          augment.effect(tower);
        }
      });
    }});
    
    // Apply global augment effects
    if (augment.id === 'golden-towers') {
      augment.effect();
    }
    
    // Emit event for UI update
    eventSystem.emit('augmentSelected', { augment });
  }
  
  applyAugmentsToTower(data) {
    const { tower } = data;
    
    // Apply all active augments to the new tower
    this.activeAugments.forEach(augment => {
      if (augment.effect && augment.id !== 'golden-towers') {
        augment.effect(tower);
      }
    });
  }
  
  resetRoundAugments() {
    // Reset "Towers of Rage" augment on all towers
    const rageAugment = this.activeAugments.find(a => a.id === 'towers-of-rage');
    if (rageAugment && rageAugment.reset) {
      eventSystem.emit('getAllTowers', { callback: (towers) => {
        towers.forEach(tower => {
          rageAugment.reset(tower);
        });
      }});
    }
  }
  
  showAugmentSelection() {
    // Get available augments (exclude already active ones)
    const activeAugmentIds = this.activeAugments.map(a => a.id);
    const availableChoices = this.availableAugments.filter(a => !activeAugmentIds.includes(a.id));
    
    // Check if we have the max number of augments
    if (this.activeAugments.length >= augmentConfig.selection.maxActive || availableChoices.length === 0) {
      return;
    }
    
    // Randomly select augments to show
    const numChoices = Math.min(augmentConfig.selection.choicesPerSelection, availableChoices.length);
    const selectedAugments = [];
    
    const tempChoices = [...availableChoices];
    while (selectedAugments.length < numChoices && tempChoices.length > 0) {
      const randomIndex = Math.floor(Math.random() * tempChoices.length);
      const augment = tempChoices.splice(randomIndex, 1)[0];
      selectedAugments.push(augment);
    }
    
    // Emit event to show augment selection UI
    eventSystem.emit('showAugmentSelection', { augments: selectedAugments });
  }
  
  getActiveAugments() {
    return [...this.activeAugments];
  }
  
  reset() {
    this.activeAugments = [];
  }
}