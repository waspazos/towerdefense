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

        // Upgrade tracking
        this.selectedUpgrade = null;
        this.upgrades = [];
        this.shotCounter = 0;
        this.multiShotCount = 0;

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
                // Get number of targets based on multi-shot ability
                const targetCount = 1 + this.multiShotCount;
                const validTargets = targets.slice(0, targetCount);

                // Attack each valid target
                validTargets.forEach(target => {
                    if (target) this.fireProjectile(target);
                });

                // Handle Forest Echoes upgrade (20% chance for extra shot)
                if (this.hasUpgrade('forest_echoes')) {
                    if (Math.random() < 0.2) {
                        setTimeout(() => {
                            validTargets.forEach(target => {
                                if (target && target.health > 0) this.fireProjectile(target);
                            });
                        }, 200); // 0.2 second delay
                    }
                }

                this.attackTimer = 0;
                this.shotCounter++;

                // Handle Sharpened Tools upgrade
                if (this.hasUpgrade('sharpened_tools') && this.shotCounter >= 30) {
                    this.shotCounter = 0;
                    this.grantDamageBonus();
                }
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
        let damage = this.damage;

        // Apply Night Witch effect
        if (this.hasUpgrade('night_witch')) {
            // Add percentage health damage
            damage += target.maxHealth * 0.005;
            // Apply slow effect
            target.applySlowEffect(0.15, 1.0); // 15% slow for 1 second
        }

        // Calculate projectile spawn position (from turret)
        const spawnPosition = this.position.clone();
        spawnPosition.y += 2.25; // Height of the turret

        // Calculate direction to target
        const direction = new window['THREE'].Vector3()
            .subVectors(target.position, spawnPosition)
            .normalize();

        // Rotate turret to face target
        if (this.mesh) {
            const turret = this.mesh.children.find(child => 
                child.geometry instanceof window['THREE'].CylinderGeometry);
            if (turret) {
                const angle = Math.atan2(direction.x, direction.z);
                turret.rotation.y = angle;
            }
        }

        // Create projectile via event system
        window.game.eventSystem.emit('createProjectile', {
            position: spawnPosition,
            target: target,
            damage: damage,
            tower: this
        });
    }

    hasUpgrade(upgradeId) {
        return this.upgrades.some(upgrade => upgrade.id === upgradeId);
    }

    grantDamageBonus() {
        // Get all towers
        const towers = [];
        window.game.eventSystem.emit('getAllTowers', {
            callback: (allTowers) => {
                towers.push(...allTowers);
            }
        });

        // Filter to nearby towers (including self)
        const nearbyTowers = towers.filter(tower => {
            return this.position.distanceTo(tower.position) <= this.range;
        });

        if (nearbyTowers.length > 0) {
            // Select random tower
            const luckyTower = nearbyTowers[Math.floor(Math.random() * nearbyTowers.length)];
            luckyTower.damage += 2;
        }
    }

    upgrade() {
        // Check if max rank reached
        if (this.rank >= 5) return false;

        // If no upgrade is selected, just return true to show options
        if (!this.selectedUpgrade) return true;

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

        // Store the selected upgrade
        this.upgrades.push(this.selectedUpgrade);

        // Handle Sky Talker upgrade
        if (this.selectedUpgrade.id === 'sky_talker') {
            this.multiShotCount = this.selectedUpgrade.effects.baseMultiShot;
            // Listen for round completion to increase multi-shot
            window.game.eventSystem.on('roundCompleted', () => {
                if (this.roundsSinceLastShot >= 5) {
                    this.multiShotCount++;
                    this.roundsSinceLastShot = 0;
                }
                this.roundsSinceLastShot++;
            });
        }

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

        // Reset selected upgrade
        this.selectedUpgrade = null;

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