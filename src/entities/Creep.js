import { creepConfig } from '../config/creepConfig.js';
import {Entity} from "./Entity.js";

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
    this.speed = creepTypeDef.baseStats.speed * speedScale;
    this.baseSpeed = this.speed;
    this.goldValue = Math.floor(creepTypeDef.baseStats.goldValue * goldScale);
    this.damageToKing = creepTypeDef.baseStats.damageToKing;
    this.progress = 0; // 0 to 1 for path progress
    this.reachedKing = false;

    // Effects
    this.slowEffects = [];
    this.burnEffect = null;
    this.slowEffectVisual = null;

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

    // Update burn effect
    this.updateBurnEffect(delta);

    // Move along path
    this.moveAlongPath(delta);

    // Update health bar
    this.updateHealthBar();
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
    const distance = this.speed * delta;
    this.position.add(direction.multiplyScalar(distance));

    // Check if we reached the next waypoint
    const distanceToWaypoint = this.position.distanceTo(nextWaypoint);
    if (distanceToWaypoint < 0.1) {
      this.currentWaypointIndex++;

      // Calculate progress along path
      if (this.path.waypoints.length > 1) {
        this.progress = this.currentWaypointIndex / (this.path.waypoints.length - 1);
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

  takeDamage(amount, damageType = 'normal') {
    this.health -= amount;

    // Create floating damage number
    window.game.eventSystem.emit('createFloatingDamage', {
      position: this.position.clone(),
      damage: amount,
      isCritical: damageType === 'critical'
    });

    // Check if dead
    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  die() {
    // Emit death event before removing
    window.game.eventSystem.emit('creepKilled', {
      creep: this,
      goldValue: this.goldValue,
      position: this.position.clone()
    });

    // Destroy this creep
    this.destroy();
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

  applySlowEffect(amount, duration = 5.0, source = 1) {
    // Add slow effect
    this.slowEffects.push({
      amount: amount,
      remainingTime: duration,
      source: source
    });

    // Update speed
    this.updateSpeed();

    // Add visual effect if not already present
    if (this.slowEffects.length > 0 && !this.slowEffectVisual) {
      this.addSlowVisualEffect();
    }
  }

  updateSlowEffects(delta) {
    let needsUpdate = false;

    // Update remaining time on all slow effects
    for (let i = this.slowEffects.length - 1; i >= 0; i--) {
      const effect = this.slowEffects[i];
      effect.remainingTime -= delta;

      // Remove expired effects
      if (effect.remainingTime <= 0) {
        this.slowEffects.splice(i, 1);
        needsUpdate = true;
      }
    }

    // Update creep speed if any effects were removed
    if (needsUpdate) {
      this.updateSpeed();
    }
  }

  updateSpeed() {
    // Reset to base speed
    this.speed = this.baseSpeed;

    // Find the strongest slow effect
    let strongestSlowAmount = 0;

    for (const effect of this.slowEffects) {
      if (effect.amount > strongestSlowAmount) {
        strongestSlowAmount = effect.amount;
      }
    }

    // Apply the slow effect
    if (strongestSlowAmount > 0) {
      this.speed = this.baseSpeed * (1 - strongestSlowAmount);
    }

    // Remove visual effect if no longer slowed
    if (this.slowEffects.length === 0 && this.slowEffectVisual) {
      this.removeSlowVisualEffect();
    }
  }

  addSlowVisualEffect() {
    this.slowEffectVisual = window.game.renderer.createSlowEffect(this.mesh);
  }

  removeSlowVisualEffect() {
    if (this.slowEffectVisual) {
      window.game.renderer.removeSlowEffect(this.slowEffectVisual);
      this.slowEffectVisual = null;
    }
  }

  applyBurnEffect(damagePerSecond, duration = 5.0) {
    this.burnEffect = {
      damagePerSecond: damagePerSecond,
      remainingTime: duration,
      timeSinceLastTick: 0
    };

    // Add visual effect
    this.addBurnVisualEffect();
  }

  updateBurnEffect(delta) {
    if (!this.burnEffect) return;

    // Update remaining time
    this.burnEffect.remainingTime -= delta;
    this.burnEffect.timeSinceLastTick += delta;

    // Apply damage every second
    if (this.burnEffect.timeSinceLastTick >= 1.0) {
      this.takeDamage(this.burnEffect.damagePerSecond);
      this.burnEffect.timeSinceLastTick = 0;
    }

    // Remove effect if expired
    if (this.burnEffect.remainingTime <= 0) {
      this.burnEffect = null;
      this.removeBurnVisualEffect();
    }
  }

  addBurnVisualEffect() {
    this.burnEffectVisual = window.game.renderer.createBurnEffect(this.mesh);
  }

  removeBurnVisualEffect() {
    if (this.burnEffectVisual) {
      window.game.renderer.removeBurnEffect(this.burnEffectVisual);
      this.burnEffectVisual = null;
    }
  }

  destroy() {
    // Clean up effects
    this.removeSlowVisualEffect();
    this.removeBurnVisualEffect();

    // Call parent destroy
    super.destroy();
  }
}
