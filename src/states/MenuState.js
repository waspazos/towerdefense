import eventSystem from '../engine/EventSystem';

class MenuState {
  constructor() {
    this.isActive = false;
    
    // Register event listeners
    eventSystem.on('resumeGameClicked', this.handleResumeGameClicked.bind(this));
    eventSystem.on('restartGameClicked', this.handleRestartGameClicked.bind(this));
    eventSystem.on('restartFromPauseClicked', this.handleRestartFromPauseClicked.bind(this));
    eventSystem.on('gameOver', this.handleGameOver.bind(this));
    eventSystem.on('pauseStateChanged', this.handlePauseStateChanged.bind(this));
  }
  
  activate() {
    this.isActive = true;
  }
  
  deactivate() {
    this.isActive = false;
  }
  
  handleResumeGameClicked() {
    if (!this.isActive) return;
    
    // Toggle pause state
    eventSystem.emit('escKeyPressed');
    
    // Hide menu UI
    eventSystem.emit('hideUI', { type: 'pauseMenu' });
  }
  
  handleRestartGameClicked() {
    // Hide game over UI
    eventSystem.emit('hideUI', { type: 'gameOver' });
    
    // Restart the game
    eventSystem.emit('restartGame');
  }
  
  handleRestartFromPauseClicked() {
    // Hide pause menu UI
    eventSystem.emit('hideUI', { type: 'pauseMenu' });
    
    // Restart the game
    eventSystem.emit('restartGame');
  }
  
  handleGameOver(data) {
    const { victory } = data;
    
    // Activate this state
    this.activate();
    
    // Show game over UI
    eventSystem.emit('showUI', { 
      type: 'gameOver', 
      data: { victory }
    });
  }
  
  handlePauseStateChanged(data) {
    const { isPaused } = data;
    
    if (isPaused) {
      // Activate this state
      this.activate();
      
      // Show pause menu UI
      eventSystem.emit('showUI', { type: 'pauseMenu' });
    } else {
      // Deactivate this state
      this.deactivate();
      
      // Hide pause menu UI
      eventSystem.emit('hideUI', { type: 'pauseMenu' });
    }
  }
}

export default new MenuState();