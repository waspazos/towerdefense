import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
import { EventSystem } from './EventSystem.js';
import { Renderer } from './Renderer.js';

export class InputManager {
  constructor(eventSystem, renderer) {
    this.eventSystem = eventSystem;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isInitialized = false;
  }
  
  initialize() {
    if (this.isInitialized) return;
    
    // Add canvas click event for tower placement and selection
    this.renderer.renderer.domElement.addEventListener('click', this.handleCanvasClick.bind(this));
    
    // Add ESC key for menu
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    this.isInitialized = true;
  }
  
  handleCanvasClick(event) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update raycaster with mouse position and camera
    this.raycaster.setFromCamera(this.mouse, this.renderer.camera);
    
    // Emit the click event with raycaster information
    this.eventSystem.emit('canvasClick', {
      raycaster: this.raycaster,
      mouse: this.mouse.clone(),
      event: event
    });
  }
  
  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.eventSystem.emit('escKeyPressed');
    }
  }
  
  addDOMListeners() {
    // Tower selection events
    const towerOptions = document.querySelectorAll('.tower-option');
    towerOptions.forEach(option => {
      const towerType = option.getAttribute('data-type');
      option.addEventListener('click', (event) => {
        event.stopPropagation();
        this.eventSystem.emit('towerOptionClicked', { towerType, event });
      });
    });
    
    // Tower action buttons
    document.getElementById('upgrade-tower')?.addEventListener('click', () => {
      this.eventSystem.emit('upgradeTowerClicked');
    });
    
    document.getElementById('sell-tower')?.addEventListener('click', () => {
      this.eventSystem.emit('sellTowerClicked');
    });
    
    document.getElementById('cancel-tower-action')?.addEventListener('click', () => {
      this.eventSystem.emit('cancelTowerActionClicked');
    });
    
    // Restart game button
    document.getElementById('restart-game')?.addEventListener('click', () => {
      this.eventSystem.emit('restartGameClicked');
    });
    
    // Resume game button
    document.getElementById('resume-game')?.addEventListener('click', () => {
      this.eventSystem.emit('resumeGameClicked');
    });
    
    // Restart from pause button
    document.getElementById('restart-from-pause')?.addEventListener('click', () => {
      this.eventSystem.emit('restartFromPauseClicked');
    });
    
    // Buy worker button
    document.getElementById('buy-worker')?.addEventListener('click', () => {
      this.eventSystem.emit('buyWorkerClicked');
    });
  }
}