import { Entity } from '/src/entities/Entity.js';
import { towerConfig } from '/src/config/towerConfig.js';

export class Tower extends Entity {
    constructor(position, slotIndex, rank = 1) {
        const mesh = window.game.renderer.createTowerMesh(rank);
        super(position, mesh);

        this.type = 'basic';
        this.rank = rank;
        this.slotIndex = slotIndex;

        // Load configuration
        const config = towerConfig.basic.ranks[rank-1];
        this.damage = config.damage;
        this.attackSpeed = config.attackSpeed;
        this.range = 8; // Default range for all towers
        this.attackTimer = 0;
        this.totalCost = config.cost;

        // Range indicator (hidden by default)
        this.rangeIndicator = null;
    }

    update(delta) {
        super.update(delta);

        // Update attack timer
        this.attackTimer += delta;

        // Check if tower can attack
        if (this.attackTimer >= this.attackSpeed) {
            const targets = this.findTargets();

            if (Array.isArray(targets) && targets.length > 0) {
                // Basic tower can hit multiple targets
                targets.forEach(target => {
                    if (target) this.fireProjectile(target);
                });
                this.attackTimer = 0;
            }
        }
    }

    findTargets() {
        // Get all creeps from event system
        const creeps = [];
        window.game.eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            creeps.push(...targets);
        }});

        // Find up to 2 targets
        const targets = [];
        const sortedCreeps = [...creeps].sort((a, b) => b.progress - a.progress);

        for (let i = 0; i < sortedCreeps.length && targets.length < 2; i++) {
            const creep = sortedCreeps[i];
            const distance = this.getDistanceTo(creep.position);

            if (distance <= this.range) {
                targets.push(creep);
            }
        }

        return targets;
    }

    fireProjectile(target) {
        // Create projectile via event system
        window.game.eventSystem.emit('createProjectile', {
            position: this.position.clone(),
            target: target,
            damage: this.damage,
            tower: this
        });
    }

    upgrade() {
        // Check if max rank reached
        if (this.rank >= 5) return false;

        // Get upgrade cost
        const upgradeCost = towerConfig.basic.ranks[this.rank].cost;
        let canAfford = false;

        // Check if player can afford upgrade
        window.game.eventSystem.emit('checkGold', { 
            amount: upgradeCost, 
            callback: (result) => {
                canAfford = result;
            }
        });

        if (!canAfford) return false;

        // Deduct cost
        window.game.eventSystem.emit('spendGold', { amount: upgradeCost });

        // Upgrade tower
        this.rank++;
        const newConfig = towerConfig.basic.ranks[this.rank-1];

        // Update properties
        this.damage = newConfig.damage;
        this.attackSpeed = newConfig.attackSpeed;
        this.totalCost += upgradeCost;

        // Update mesh
        if (this.mesh) {
            window.game.eventSystem.emit('removeFromScene', { object: this.mesh });
        }
        this.mesh = window.game.renderer.createTowerMesh(this.rank);
        this.mesh.position.copy(this.position);
        window.game.eventSystem.emit('addToScene', { object: this.mesh });

        // Update range indicator if visible
        if (this.rangeIndicator) {
            this.hideRangeIndicator();
            this.showRangeIndicator();
        }

        // Emit upgrade event
        window.game.eventSystem.emit('towerUpgraded', { tower: this });

        return true;
    }

    sell() {
        // Calculate sell value (50% of total cost)
        const sellValue = Math.floor(this.totalCost * 0.5);

        // Give gold to player
        window.game.eventSystem.emit('addGold', { amount: sellValue });

        // Free tower slot
        window.game.eventSystem.emit('freeTowerSlot', { slotIndex: this.slotIndex });

        // Emit sell event
        window.game.eventSystem.emit('towerSold', { tower: this, value: sellValue });

        // Destroy tower
        this.destroy();
    }

    showRangeIndicator() {
        if (this.rangeIndicator) return;
        
        this.rangeIndicator = window.game.renderer.createRangeIndicator(this.position, this.range);
        window.game.eventSystem.emit('addToScene', { object: this.rangeIndicator });
    }

    hideRangeIndicator() {
        if (this.rangeIndicator) {
            window.game.eventSystem.emit('removeFromScene', { object: this.rangeIndicator });
            this.rangeIndicator = null;
        }
    }

    getDistanceTo(position) {
        // Calculate horizontal distance only (y/height is ignored)
        const dx = this.position.x - position.x;
        const dz = this.position.z - position.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    destroy() {
        this.hideRangeIndicator();
        super.destroy();
    }
}