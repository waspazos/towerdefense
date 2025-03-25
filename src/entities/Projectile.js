// src/entities/Projectile.js
import { Entity } from '/src/entities/Entity.js';

export class Projectile extends Entity {
    constructor(options) {
        const { position, target, damage, tower, type } = options;

        // Use faction-specific projectile type or default to tower type
        const projectileType = type || (tower ? tower.type : 'amazonians');
        
        const mesh = window.game.renderer.createProjectileMesh(projectileType);
        super(position, mesh);

        this.target = target;
        this.damage = damage;
        this.tower = tower;
        this.type = projectileType;
        this.speed = 20;
        this.hasReachedTarget = false;
        
        // Faction-specific projectile properties
        if (projectileType.includes('ironclad')) {
            this.speed = 15; // Slower but heavier projectiles
        } else if (projectileType.includes('arcanists')) {
            this.speed = 25; // Faster magical projectiles
        }
    }

    update(delta) {
        super.update(delta);

        if (this.hasReachedTarget) return;

        // Check if target still exists
        if (!this.target || !this.target.position) {
            this.destroy();
            return;
        }

        // Calculate direction to target
        const direction = new window['THREE'].Vector3();
        direction.subVectors(this.target.position, this.position).normalize();

        // Move toward target
        const distance = this.speed * delta;
        this.position.add(direction.multiplyScalar(distance));

        // Check if reached target
        const distanceToTarget = this.position.distanceTo(this.target.position);
        if (distanceToTarget < 0.5) {
            this.hitTarget();
        }
    }

    hitTarget() {
        if (this.hasReachedTarget) return;

        this.hasReachedTarget = true;

        // Apply damage to target
        if (this.target.takeDamage) {
            this.target.takeDamage(this.damage);
        }

        // Create hit effect based on faction
        if (this.type.includes('ironclad') && this.tower && this.tower.hasUpgrade('reinforced_frame')) {
            // Create splash effect
            window.game.eventSystem.emit('createSplashEffect', {
                position: this.target.position.clone(),
                radius: 2,
                damage: this.damage * 0.5
            });
        } else {
            // Standard hit effect
            window.game.renderer.createHitEffect(this.position.clone(), this.type);
        }

        // Emit hit event
        window.game.eventSystem.emit('projectileHit', {
            position: this.position.clone(),
            target: this.target,
            damage: this.damage,
            type: this.type
        });

        // Destroy projectile
        this.destroy();
    }

    destroy() {
        super.destroy();
    }
}