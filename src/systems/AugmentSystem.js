import { augmentConfig } from '../config/augmentConfig.js';

export class AugmentSystem {
  constructor() {
    this.activeAugments = [];
    this.availableAugments = [];

    // Register event listeners
    window.game.eventSystem.on('towerAttacked', this.handleTowerAttacked.bind(this));
    window.game.eventSystem.on('roundCompleted', this.handleRoundCompleted.bind(this));
    window.game.eventSystem.on('towerBuilt', this.applyAugmentsToTower.bind(this));
    window.game.eventSystem.on('selectAugment', this.selectAugment.bind(this));
    window.game.eventSystem.on('getActiveAugments', this.handleGetActiveAugments.bind(this));
    window.game.eventSystem.on('reset', this.reset.bind(this));
  }

  initialize() {
    console.log("Initializing AugmentSystem...");
    
    // Load augments from config
    this.availableAugments = augmentConfig.available;
    
    if (!this.availableAugments || this.availableAugments.length === 0) {
      console.error("No available augments found in configuration!");
    } else {
      console.log(`Loaded ${this.availableAugments.length} available augments`);
    }
  }

  handleTowerAttacked(data) {
    const { tower } = data;

    // Apply the "Towers of Rage" augment effect if active
    const rageAugment = this.activeAugments.find(a => a.id === 'towers-of-rage');
    if (rageAugment) {
      rageAugment.effect(tower);
    }
  }

  handleRoundCompleted(data) {
    // Reset round-specific augments
    this.resetRoundAugments();

    // Check if it's time for augment selection
    const selectionRounds = augmentConfig.selection.rounds;
    const nextRound = this.getCurrentRound() + 1;

    if (selectionRounds.includes(nextRound)) {
      console.log(`Round ${nextRound} completed. Showing augment selection.`);
      this.showAugmentSelection();
    }
  }

  getCurrentRound() {
    let currentRound = 0;
    window.game.eventSystem.emit('getCurrentRound', { callback: (round) => { currentRound = round; } });
    return currentRound;
  }

  selectAugment(data) {
    const { augment } = data;
    console.log(`Augment selected: ${augment.name}`);

    // Add augment to active augments
    this.activeAugments.push(augment);

    // Apply to all existing towers
    window.game.eventSystem.emit('getAllTowers', { callback: (towers) => {
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
    window.game.eventSystem.emit('augmentSelected', { augment });
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
      window.game.eventSystem.emit('getAllTowers', { callback: (towers) => {
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
      console.log("Maximum augments reached or no available choices.");
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
    window.game.eventSystem.emit('showAugmentSelection', { augments: selectedAugments });
  }
  
  handleGetActiveAugments(data) {
    const { callback } = data;
    if (callback) {
      callback(this.activeAugments);
    }
  }

  getActiveAugments() {
    return [...this.activeAugments];
  }

  reset() {
    this.activeAugments = [];
    console.log("AugmentSystem reset");
  }
}