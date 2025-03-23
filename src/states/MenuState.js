export class MenuState {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.isActive = false;

    // Register event listeners
    this.eventSystem.on('resumeGameClicked', this.handleResumeGameClicked.bind(this));
    this.eventSystem.on('restartGameClicked', this.handleRestartGameClicked.bind(this));
    this.eventSystem.on('restartFromPauseClicked', this.handleRestartFromPauseClicked.bind(this));
    this.eventSystem.on('gameOver', this.handleGameOver.bind(this));
    this.eventSystem.on('pauseStateChanged', this.handlePauseStateChanged.bind(this));
    
    console.log("MenuState: Initialized");
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
    this.eventSystem.emit('escKeyPressed');

    // Hide menu UI
    this.eventSystem.emit('hideUI', { type: 'pauseMenu' });
    
    console.log("MenuState: Resume game");
  }

  handleRestartGameClicked() {
    // Hide game over UI
    this.eventSystem.emit('hideUI', { type: 'gameOver' });

    // Restart the game
    this.eventSystem.emit('restartGame');
    
    console.log("MenuState: Restart game from game over");
  }

  handleRestartFromPauseClicked() {
    // Hide pause menu UI
    this.eventSystem.emit('hideUI', { type: 'pauseMenu' });

    // Restart the game
    this.eventSystem.emit('restartGame');
    
    console.log("MenuState: Restart game from pause menu");
  }

  handleGameOver(data) {
    const { victory } = data;

    // Activate this state
    this.activate();

    // Show game over UI
    this.eventSystem.emit('showUI', {
      type: 'gameOver',
      data: { victory }
    });
    
    console.log("MenuState: Game over menu shown, victory:", victory);
  }

  handlePauseStateChanged(data) {
    const { isPaused } = data;

    if (isPaused) {
      // Activate this state
      this.activate();

      // Show pause menu UI
      this.eventSystem.emit('showUI', { type: 'pauseMenu' });
      
      console.log("MenuState: Pause menu shown");
    } else {
      // Deactivate this state
      this.deactivate();

      // Hide pause menu UI
      this.eventSystem.emit('hideUI', { type: 'pauseMenu' });
      
      console.log("MenuState: Pause menu hidden");
    }
  }
}