import * as THREE from 'three';
import Entity from './Entity';
import eventSystem from '../engine/EventSystem';
import renderer from '../engine/Renderer';

class Worker extends Entity {
  constructor(position) {
    const mesh = renderer.createWorkerMesh();
    super(position, mesh);
    
    // Load worker config
    const config = window.workerConfig.base;
    
    this.id = Date.now();
    this.targetRock = null;
    this.miningTimer = 0;
    this.miningInterval = config.miningInterval;
    this.goldPerMining = config.goldPerMining;
    this.isMoving = false;
    this.moveTarget = null;
    this.moveSpeed = config.speed;
  }
  
  update(delta) {
    super.update(delta);
    
    if (this.isMoving) {
      this.updateMovement(delta);
    } else if (this.targetRock) {
      this.updateMining(delta);
    }
  }
  
  updateMovement(delta) {
    if (!this.moveTarget) {
      this.isMoving = false;
      return;
    }
    
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(this.moveTarget, this.position).normalize();
    
    // Move in that direction
    const distance = this.moveSpeed * delta;
    this.position.add(direction.multiplyScalar(distance));
    
    // Check if reached target
    const distanceToTarget = this.position.distanceTo(this.moveTarget);
    if (distanceToTarget < 0.2) {
      this.position.copy(this.moveTarget);
      this.isMoving = false;
      this.moveTarget = null;
      
      // Emit event that worker reached destination
      eventSystem.emit('workerReachedDestination', { worker: this });
    }
  }
  
  updateMining(delta) {
    if (!this.targetRock) return;
    
    this.miningTimer += delta;
    if (this.miningTimer >= this.miningInterval) {
      this.miningTimer = 0;
      
      // Generate gold
      eventSystem.emit('workerMinedGold', { 
        worker: this,
        amount: this.goldPerMining,
        position: this.position.clone()
      });
    }
  }
  
  assignRock(rock) {
    if (rock) {
      this.targetRock = rock;
      
      // Move to rock position
      this.moveToPosition(rock.position.clone());
    }
  }
  
  moveToPosition(position) {
    this.moveTarget = position.clone();
    this.isMoving = true;
  }
  
  returnToCamp() {
    const campPosition = window.workerConfig.camp.position;
    this.moveToPosition(new THREE.Vector3(campPosition.x, 0, campPosition.z));
    this.targetRock = null;
  }
  
  getStatus() {
    if (this.isMoving) {
      return 'Moving';
    } else if (this.targetRock) {
      return 'Mining';
    } else {
      return 'Idle';
    }
  }
  
  destroy() {
    // Free up target rock if assigned
    if (this.targetRock) {
      this.targetRock.userData.isOccupied = false;
      this.targetRock = null;
    }
    
    super.destroy();
  }
}

// Make Worker class globally available
window.Worker = Worker;