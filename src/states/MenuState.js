
class MenuState {
  constructor() {
    this.isActive = false;

    // Register event listeners
    window.game.eventSystem.on('resumeGameClicked', this.handleResumeGameClicked.bind(this));
    window.game.eventSystem.on('restartGameClicked', this.handleRestartGameClicked.bind(this));
    window.game.eventSystem.on('restartFromPauseClicked', this.handleRestartFromPauseClicked.bind(this));
    window.game.eventSystem.on('gameOver', this.handleGameOver.bind(this));
    window.game.eventSystem.on('pauseStateChanged', this.handlePauseStateChanged.bind(this));
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
    window.game.eventSystem.emit('escKeyPressed');

    // Hide menu UI
    window.game.eventSystem.emit('hideUI', { type: 'pauseMenu' });
  }

  handleRestartGameClicked() {
    // Hide game over UI
    window.game.eventSystem.emit('hideUI', { type: 'gameOver' });

    // Restart the game
    window.game.eventSystem.emit('restartGame');
  }

  handleRestartFromPauseClicked() {
    // Hide pause menu UI
    window.game.eventSystem.emit('hideUI', { type: 'pauseMenu' });

    // Restart the game
    window.game.eventSystem.emit('restartGame');
  }

  handleGameOver(data) {
    const { victory } = data;

    // Activate this state
    this.activate();

    // Show game over UI
    window.game.eventSystem.emit('showUI', {
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
      window.game.eventSystem.emit('showUI', { type: 'pauseMenu' });
    } else {
      // Deactivate this state
      this.deactivate();

      // Hide pause menu UI
      window.game.eventSystem.emit('hideUI', { type: 'pauseMenu' });
    }
  }
}

export default MenuState;
