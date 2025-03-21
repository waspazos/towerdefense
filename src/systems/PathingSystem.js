import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
import { EventSystem } from '../engine/EventSystem.js';
import { Renderer } from '../engine/Renderer.js';
import { Creep } from '../entities/Creep.js';
import { pathConfig } from '../config/pathConfig.js';
import { roundConfig } from '../config/roundConfig.js';

export class PathingSystem {
  constructor(eventSystem, renderer) {
    this.eventSystem = eventSystem;
    this.renderer = renderer;
    this.paths = [];
    this.creeps = [];
    this.spawnTimer = null;
    this.roundActive = false;
    this.currentRound = 0;
    this.creepsSpawned = 0;
    this.creepsKilled = 0;
    this.creepsReachedEnd = 0;
    
    // Register event listeners
    this.eventSystem.on('getPath', this.handleGetPath.bind(this));
    this.eventSystem.on('startRound', this.startRound.bind(this));
    this.eventSystem.on('spawnCreep', this.spawnCreep.bind(this));
    this.eventSystem.on('creepKilled', this.handleCreepKilled.bind(this));
    this.eventSystem.on('creepReachedEnd', this.handleCreepReachedEnd.bind(this));
    this.eventSystem.on('getTowerTargets', this.handleGetTowerTargets.bind(this));
    this.eventSystem.on('reset', this.reset.bind(this));
    this.eventSystem.on('pause', this.pause.bind(this));
    this.eventSystem.on('resume', this.resume.bind(this));
  }
  
  initialize() {
    // Load paths from config
    this.paths = pathConfig.paths.map(pathConfig => {
      return {
        spawnPoint: new THREE.Vector3(pathConfig.spawnPoint.x, pathConfig.spawnPoint.y, pathConfig.spawnPoint.z),
        waypoints: pathConfig.waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z))
      };
    });
    
    // Visualize paths
    this.renderer.createPath(this.paths);
  }
  
  update(delta) {
    // Update all creeps
    for (let i = this.creeps.length - 1; i >= 0; i--) {
      const creep = this.creeps[i];
      creep.update(delta);
    }
    
    // Check if round is complete
    if (this.roundActive && this.creepsSpawned > 0 && 
        this.creepsSpawned === (this.creepsKilled + this.creepsReachedEnd) &&
        this.creeps.length === 0) {
      this.endRound();
    }
  }
  
  handleGetPath(data) {
    const { pathIndex, callback } = data;
    if (callback && this.paths[pathIndex]) {
      callback(this.paths[pathIndex]);
    }
  }
  
  handleGetTowerTargets(data) {
    const { tower, callback } = data;
    if (callback) {
      callback(this.creeps);
    }
  }
  
  startRound(data) {
    const { roundNumber } = data;
    
    if (this.roundActive) return;
    
    this.currentRound = roundNumber;
    this.roundActive = true;
    this.creepsSpawned = 0;
    this.creepsKilled = 0;
    this.creepsReachedEnd = 0;
    
    // Get round definition
    const roundDef = roundConfig.rounds[this.currentRound - 1];
    if (!roundDef) {
      console.error('Invalid round definition for round:', this.currentRound);
      return;
    }
    
    // Get spawn pattern for this round type
    const spawnPattern = roundConfig.spawnPatterns[roundDef.type];
    if (!spawnPattern) {
      console.error('No spawn pattern found for round type:', roundDef.type);
      return;
    }
    
    // Start spawning creeps
    this.startSpawning(roundDef, spawnPattern);
    
    // Emit round started event
    this.eventSystem.emit('roundStarted', { roundNumber: this.currentRound });
  }
  
  startSpawning(roundDef, spawnPattern) {
    // Clear any existing spawn timer
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
    }
    
    // Spawn first creep immediately
    this.spawnCreep({ 
      type: roundDef.type, 
      difficulty: roundDef.difficulty 
    });
    
    // Schedule remaining creeps
    if (spawnPattern.totalCreeps > 1) {
      this.spawnTimer = setInterval(() => {
        if (this.creepsSpawned < spawnPattern.totalCreeps) {
          this.spawnCreep({ 
            type: roundDef.type, 
            difficulty: roundDef.difficulty 
          });
        } else {
          clearInterval(this.spawnTimer);
          this.spawnTimer = null;
        }
      }, spawnPattern.spawnInterval * 1000);
    }
  }
  
  spawnCreep(data) {
    const { type, difficulty, pathIndex } = data;
    
    // Select random path if not specified
    const path = pathIndex !== undefined 
      ? pathIndex 
      : Math.floor(Math.random() * this.paths.length);
    
    try {
      // Create new creep
      const creep = new Creep(type, path, difficulty);
      
      // Add to scene
      this.eventSystem.emit('addToScene', { object: creep.mesh });
      
      // Add to creeps array
      this.creeps.push(creep);
      
      // Increment counter
      this.creepsSpawned++;
      
      // Emit creep spawned event
      this.eventSystem.emit('creepSpawned', { creep });
      
      return creep;
    } catch (error) {
      console.error('Error spawning creep:', error);
      return null;
    }
  }
  
  handleCreepKilled(data) {
    const { creep } = data;
    
    // Remove from creeps array
    const index = this.creeps.indexOf(creep);
    if (index !== -1) {
      this.creeps.splice(index, 1);
    }
    
    // Increment killed counter
    this.creepsKilled++;
  }
  
  handleCreepReachedEnd(data) {
    const { creep } = data;
    
    // Remove from creeps array
    const index = this.creeps.indexOf(creep);
    if (index !== -1) {
      this.creeps.splice(index, 1);
    }
    
    // Increment reached end counter
    this.creepsReachedEnd++;
  }
  
  endRound() {
    this.roundActive = false;
    
    // Clear any remaining spawn timer
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
    
    // Emit round complete event
    this.eventSystem.emit('roundCompleted', { 
      roundNumber: this.currentRound,
      creepsKilled: this.creepsKilled,
      creepsReachedEnd: this.creepsReachedEnd
    });
  }
  
  pause() {
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
  }
  
  resume() {
    if (this.roundActive && this.creepsSpawned < this.totalCreeps) {
      // Get round definition again
      const roundDef = roundConfig.rounds[this.currentRound - 1];
      const spawnPattern = roundConfig.spawnPatterns[roundDef.type];
      
      // Resume spawning at the current point
      this.spawnTimer = setInterval(() => {
        if (this.creepsSpawned < spawnPattern.totalCreeps) {
          this.spawnCreep({ 
            type: roundDef.type, 
            difficulty: roundDef.difficulty 
          });
        } else {
          clearInterval(this.spawnTimer);
          this.spawnTimer = null;
        }
      }, spawnPattern.spawnInterval * 1000);
    }
  }
  
  reset() {
    // Clear all creeps
    this.creeps.forEach(creep => creep.destroy());
    this.creeps = [];
    
    // Reset state
    this.roundActive = false;
    this.currentRound = 0;
    this.creepsSpawned = 0;
    this.creepsKilled = 0;
    this.creepsReachedEnd = 0;
    
    // Clear any timers
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }
  }
}