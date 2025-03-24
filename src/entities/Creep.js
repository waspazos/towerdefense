import { creepConfig } from '/src/config/creepConfig.js';
import { Entity } from "/src/entities/Entity.js";

export class Creep extends Entity {
  constructor(type, pathIndex, difficulty = 1) {
    // Get creep type data from config
    const creepTypeDef = creepConfig.types[type];
    if (!creepTypeDef) {
      throw new Error(`Invalid creep type: ${type}`);
    }

    // Get path
    let path = null;
    window.game.eventSystem.emit('getPath', { pathIndex, callback: (result) => { path = result; }});

    if (!path || !path.spawnPoint) {
      throw new Error(`Invalid path index: ${pathIndex}`);
    }

    // Create mesh
    const mesh = window.game.renderer.createCreepMesh(type);

    // Initialize entity with position at spawn point
    const position = new window['THREE'].Vector3(path.spawnPoint.x, 0.5, path.spawnPoint.z);
    super(position, mesh);

    // Apply difficulty scaling
    const healthScale = Math.pow(creepConfig.difficultyScaling.health, difficulty - 1);
    const speedScale = Math.pow(creepConfig.difficultyScaling.speed, difficulty - 1);
    const goldScale = Math.pow(creepConfig.difficultyScaling.goldValue, difficulty - 1);

    // Creep properties
    this.type = type;
    this.pathIndex = pathIndex;
    this.currentWaypointIndex = 0;
    this.path = path;
    this.health = creepTypeDef.baseStats.health * healthScale;
    this.maxHealth = this.health;
    this.baseSpeed = creepTypeDef.baseStats.speed * speedScale; // Store base speed
    this.speed = this.baseSpeed; // Current speed (can be modified by slow effects)
    this.goldValue = Math.floor(creepTypeDef.baseStats.goldValue * goldScale);
    this.damageToKing = creepTypeDef.baseStats.damageToKing;
    this.progress = 0; // 0 to 1 for path progress
    this.reachedKing = false;

    // Slow effect tracking
    this.slowEffects = [];

    // Create health bar
    this.createHealthBar();
  }

  createHealthBar() {
    const healthBarWidth = 1;
    const healthBarHeight = 0.1;

    // Background for health bar
    const healthBarBgGeometry = new window['THREE'].PlaneGeometry(healthBarWidth, healthBarHeight);
    const healthBarBgMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0x000000,
      side: window['THREE'].DoubleSide
    });
    this.healthBarBg = new window['THREE'].Mesh(healthBarBgGeometry, healthBarBgMaterial);
    this.healthBarBg.position.y = 1.2;
    this.healthBarBg.rotation.x = Math.PI / 2;
    this.mesh.add(this.healthBarBg);

    // Health bar
    const healthBarGeometry = new window['THREE'].PlaneGeometry(healthBarWidth, healthBarHeight);
    const healthBarMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0x00ff00,
      side: window['THREE'].DoubleSide
    });
    this.healthBar = new window['THREE'].Mesh(healthBarGeometry, healthBarMaterial);
    this.healthBar.position.y = 1.2;
    this.healthBar.rotation.x = Math.PI / 2;
    this.mesh.add(this.healthBar);
  }

  update(delta) {
    super.update(delta);

    // Skip if reached the end
    if (this.reachedKing) return;

    // Update slow effects
    this.updateSlowEffects(delta);

    // Move along path
    this.moveAlongPath(delta);

    // Update health bar
    this.updateHealthBar();
  }

  updateSlowEffects(delta) {
    // Update and remove expired slow effects
    this.slowEffects = this.slowEffects.filter(effect => {
      effect.duration -= delta;
      return effect.duration > 0;
    });

    // Calculate total slow amount (effects stack additively)
    let totalSlow = 0;
    this.slowEffects.forEach(effect => {
      totalSlow += effect.amount;
    });

    // Cap total slow at 90%
    totalSlow = Math.min(0.9, totalSlow);

    // Apply slow to speed
    this.speed = this.baseSpeed * (1 - totalSlow);
  }

  applySlowEffect(amount, duration) {
    // Add new slow effect
    this.slowEffects.push({
      amount: amount,
      duration: duration
    });

    // Immediately update speed
    let totalSlow = Math.min(0.9, this.slowEffects.reduce((sum, effect) => sum + effect.amount, 0));
    this.speed = this.baseSpeed * (1 - totalSlow);
  }

  moveAlongPath(delta) {
    // Get current and next waypoint
    const currentWaypoint = this.path.waypoints[this.currentWaypointIndex];
    const nextWaypoint = this.path.waypoints[this.currentWaypointIndex + 1];

    // If no next waypoint, we've reached the end
    if (!nextWaypoint) {
      this.reachEnd();
      return;
    }

    // Calculate direction to next waypoint
    const direction = new window['THREE'].Vector3();
    direction.subVectors(nextWaypoint, this.position).normalize();

    // Move in that direction
    const moveDistance = this.speed * delta;
    const movement = direction.clone().multiplyScalar(moveDistance);
    this.position.add(movement);

    // Check if we reached the next waypoint
    const distanceToWaypoint = this.position.distanceTo(nextWaypoint);
    if (distanceToWaypoint < 0.25) {
      // Snap to waypoint to prevent drift
      this.position.copy(nextWaypoint);
      this.currentWaypointIndex++;

      // Calculate progress along path
      if (this.path.waypoints.length > 1) {
        this.progress = this.currentWaypointIndex / (this.path.waypoints.length - 1);
      }
    } else {
      // Check if we're too far from the path
      const pathDirection = new window['THREE'].Vector3().subVectors(nextWaypoint, currentWaypoint);
      const pathLength = pathDirection.length();
      const normalizedPathDir = pathDirection.clone().normalize();
      
      // Get vector from current waypoint to creep
      const toCreep = new window['THREE'].Vector3().subVectors(this.position, currentWaypoint);
      
      // Project creep position onto path segment
      const dot = toCreep.dot(normalizedPathDir);
      const projectionAmount = Math.max(0, Math.min(dot, pathLength));
      const projectedPoint = new window['THREE'].Vector3()
        .copy(currentWaypoint)
        .add(normalizedPathDir.multiplyScalar(projectionAmount));
      
      // If we're too far from the path, correct position
      const distanceFromPath = this.position.distanceTo(projectedPoint);
      if (distanceFromPath > 0.5) {
        this.position.lerp(projectedPoint, 0.1);
      }
    }
  }

  updateHealthBar() {
    if (this.healthBar) {
      const healthPercent = Math.max(0, this.health / this.maxHealth);
      this.healthBar.scale.x = Math.max(0.01, healthPercent);

      // Change color based on health percentage
      this.healthBar.material.color.setHex(
        healthPercent > 0.6 ? 0x00ff00 : // Green
        healthPercent > 0.3 ? 0xffff00 : // Yellow
        0xff0000                         // Red
      );
    }
  }

  takeDamage(amount) {
    this.health -= amount;

    // Create floating damage number
    window.game.eventSystem.emit('createFloatingDamage', {
      position: this.position.clone(),
      damage: amount
    });

    // Check if dead
    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  die() {
    // Emit death event and let PathingSystem handle destruction
    window.game.eventSystem.emit('creepKilled', {
      creep: this,
      goldValue: this.goldValue,
      position: this.position.clone()
    });
  }

  reachEnd() {
    if (!this.reachedKing) {
      this.reachedKing = true;

      // Emit event that creep reached the end
      window.game.eventSystem.emit('creepReachedEnd', {
        creep: this,
        damageToKing: this.damageToKing
      });

      // Destroy creep
      this.destroy();
    }
  }

  destroy() {
    super.destroy();
  }
}