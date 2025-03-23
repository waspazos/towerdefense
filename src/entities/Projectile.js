import { Entity } from '/src/entities/Entity.js';

export class Projectile extends Entity {
    constructor(options) {
        const { position, target, damage, tower } = options;

        const mesh = window.game.renderer.createProjectileMesh();
        super(position, mesh);

        this.target = target;
        this.damage = damage;
        this.tower = tower;
        this.speed = 20;
        this.hasReachedTarget = false;
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

        // Create hit effect
        window.game.renderer.createHitEffect(this.position.clone());

        // Emit hit event
        window.game.eventSystem.emit('projectileHit', {
            position: this.position.clone(),
            target: this.target,
            damage: this.damage
        });

        // Destroy projectile
        this.destroy();
    }

    destroy() {
        super.destroy();
    }
}