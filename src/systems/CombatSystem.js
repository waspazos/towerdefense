import { Projectile } from "/src/entities/Projectile.js";

export class CombatSystem {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.projectiles = [];

    // Register event listeners
    this.eventSystem.on("createProjectile", this.createProjectile.bind(this));
    this.eventSystem.on("projectileHit", this.handleProjectileHit.bind(this));
    
    console.log("CombatSystem: Initialized");
  }

  update(delta) {
    // Update all projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(delta);

      // Remove destroyed projectiles
      if (projectile.hasReachedTarget) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  createProjectile(data) {
    try {
      const projectile = new Projectile(data);
      this.projectiles.push(projectile);
      
      return projectile;
    } catch (error) {
      console.error("Error creating projectile:", error);
      return null;
    }
  }

  handleProjectileHit(data) {
    // This can be used to trigger additional effects when a projectile hits
    // Currently empty in the simplified version
  }
  
  reset() {
    // Clean up all projectiles
    this.projectiles.forEach(projectile => projectile.destroy());
    this.projectiles = [];
    
    console.log("CombatSystem: Reset");
  }
}