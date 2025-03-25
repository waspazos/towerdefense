// src/entities/Tower.js
import { Entity } from '/src/entities/Entity.js';
import { towerConfig } from '/src/config/towerConfig.js';

export class Tower extends Entity {
    constructor(position, slotIndex, rank = 1) {
        // Get the faction-based tower type
        const faction = window.game.selectedFaction || 'amazonians'; // Default fallback
        
        const mesh = window.game.renderer.createTowerMesh(rank, faction);
        super(position, mesh);

        this.type = faction;
        this.rank = rank;
        this.slotIndex = slotIndex;

        // Load configuration from the faction-specific tower config
        const config = towerConfig[faction].ranks[rank-1];
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
        this.criticalHitCounter = 0; // For Ironclad Metalworking
        this.lastInfusionTime = 0; // For Arcanists Mana Infusion

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

                // Handle faction-specific upgrade effects
                this.handleFactionUpgradeEffects(validTargets, delta);

                this.attackTimer = 0;
                this.shotCounter++;
            }
        }
    }

    handleFactionUpgradeEffects(targets, delta) {
        const faction = this.type;

        // Amazonians upgrades
        if (faction === 'amazonians') {
            // Forest Echoes - chance for extra shot
            if (this.hasUpgrade('forest_echoes')) {
                if (Math.random() < 0.4) {
                    setTimeout(() => {
                        targets.forEach(target => {
                            if (target && target.health > 0) this.fireProjectile(target);
                        });
                    }, 200);
                }
            }

            // Sharpened Tools - bonus damage to nearby tower
            if (this.hasUpgrade('sharpened_tools') && this.shotCounter >= 30) {
                this.shotCounter = 0;
                this.grantDamageBonus();
            }
        }
        
        // Ironclad upgrades
        else if (faction === 'ironclad') {
            // Metalworking - every 5th shot does triple damage
            if (this.hasUpgrade('metalworking')) {
                this.criticalHitCounter = (this.criticalHitCounter + 1) % 5;
            }
            
            // Fortification - slow aura
            if (this.hasUpgrade('fortification')) {
                this.applySlowAura();
            }
        }
        
        // Arcanist upgrades
        else if (faction === 'arcanists') {
            // Mana Infusion - powered attack every 10 seconds
            if (this.hasUpgrade('mana_infusion')) {
                this.lastInfusionTime += delta;
                if (this.lastInfusionTime >= 10) {
                    this.lastInfusionTime = 0;
                }
            }
            
            // Chain Lightning effect handled in fireProjectile
        }
    }

    findTargets() {
        // Get all creeps from event system
        const creeps = [];
        window.game.eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            creeps.push(...targets);
        }});

        // Find up to 2 targets (or more with multi-shot)
        const targets = [];
        const maxTargets = 1 + this.multiShotCount;
        const sortedCreeps = [...creeps].sort((a, b) => b.progress - a.progress);

        for (let i = 0; i < sortedCreeps.length && targets.length < maxTargets; i++) {
            const creep = sortedCreeps[i];
            const distance = this.getDistanceTo(creep.position);

            if (distance <= this.range) {
                targets.push(creep);
            }
        }

        return targets;
    }

    fireProjectile(target) {
        const faction = this.type;
        let damage = this.damage;
        let projectileType = faction;

        // Apply faction-specific damage modifications
        if (faction === 'amazonians') {
            // Night Witch upgrade
            if (this.hasUpgrade('night_witch')) {
                damage += target.maxHealth * 0.005; // Add percentage health damage
                target.applySlowEffect(0.15, 1.0); // 15% slow for 1 second
            }
        }
        else if (faction === 'ironclad') {
            // Metalworking - Critical hit
            if (this.hasUpgrade('metalworking') && this.criticalHitCounter === 0) {
                damage *= 3; // Triple damage on critical hits
                projectileType = 'ironclad_critical';
            }
            
            // Siege Master - Double damage to armored
            if (this.hasUpgrade('siege_master') && target.type === 'armored') {
                damage *= 2;
            }
            
            // Reinforced Frame - Damage boost
            if (this.hasUpgrade('reinforced_frame')) {
                damage *= 1.2; // 20% damage increase
            }
        }
        else if (faction === 'arcanists') {
            // Mana Infusion - Powered attack
            if (this.hasUpgrade('mana_infusion') && this.lastInfusionTime === 0) {
                damage *= 3;
                projectileType = 'arcanists_powered';
            }
            
            // Frost Magic - Apply slow
            if (this.hasUpgrade('frost_magic')) {
                target.applySlowEffect(0.25, 2.0); // 25% slow for 2 seconds
            }
            
            // Arcane Resonance - Damage amplification debuff
            if (this.hasUpgrade('arcane_resonance')) {
                // Apply damage amp debuff
                if (!target.damageAmplification) {
                    target.damageAmplification = 0;
                }
                target.damageAmplification = Math.max(target.damageAmplification, 0.1);
                target.damageAmpTimer = 3; // 3 seconds duration
            }
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
            tower: this,
            type: projectileType
        });
        
        // Handle Chain Lightning for Arcanists
        if (faction === 'arcanists' && this.hasUpgrade('chain_lightning')) {
            this.applyChainLightning(target, damage);
        }
        
        // Handle splash damage for Ironclad
        if (faction === 'ironclad' && this.hasUpgrade('reinforced_frame')) {
            this.applySplashDamage(target, damage);
        }
    }
    
    applyChainLightning(primaryTarget, baseDamage) {
        // Find additional targets within chain range
        const chainTargets = [];
        const chainRange = 5; // Range for chain to jump
        const maxChains = 2; // Chain to up to 2 additional targets
        
        window.game.eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            // Filter out the primary target and find nearby enemies
            const nearbyTargets = targets.filter(creep => 
                creep !== primaryTarget && 
                creep.position.distanceTo(primaryTarget.position) <= chainRange
            );
            
            // Sort by proximity to primary target
            nearbyTargets.sort((a, b) => 
                a.position.distanceTo(primaryTarget.position) - 
                b.position.distanceTo(primaryTarget.position)
            );
            
            // Get up to maxChains targets
            chainTargets.push(...nearbyTargets.slice(0, maxChains));
        }});
        
        // Apply chain damage to additional targets
        const chainDamage = baseDamage * 0.5; // 50% damage to chained targets
        chainTargets.forEach((target, index) => {
            setTimeout(() => {
                // Create chain lightning visual effect
                const chainPosition = primaryTarget.position.clone();
                window.game.eventSystem.emit('createChainLightning', {
                    startPosition: chainPosition,
                    endPosition: target.position.clone(),
                    delay: index * 0.1
                });
                
                // Apply damage
                target.takeDamage(chainDamage);
            }, 200 + (index * 100)); // Staggered timing for visual effect
        });
    }
    
    applySplashDamage(target, baseDamage) {
        const splashRadius = 2;
        const splashDamage = baseDamage * 0.5; // 50% damage to splash targets
        
        window.game.eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            // Find enemies in splash radius (excluding primary target)
            const splashTargets = targets.filter(creep => 
                creep !== target && 
                creep.position.distanceTo(target.position) <= splashRadius
            );
            
            // Apply splash damage
            splashTargets.forEach(splashTarget => {
                splashTarget.takeDamage(splashDamage);
                
                // Create visual effect for splash
                window.game.eventSystem.emit('createSplashEffect', {
                    position: target.position.clone(),
                    radius: splashRadius
                });
            });
        }});
    }
    
    applySlowAura() {
        if (!this.hasUpgrade('fortification')) return;
        
        const slowRadius = 5;
        const slowAmount = 0.1; // 10% slow
        const slowDuration = 0.5; // Reapplied frequently, so short duration
        
        window.game.eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            // Find all enemies in slow aura radius
            const auraTargets = targets.filter(creep => 
                this.getDistanceTo(creep.position) <= slowRadius
            );
            
            // Apply slow effect
            auraTargets.forEach(target => {
                target.applySlowEffect(slowAmount, slowDuration);
            });
        }});
    }

    hasUpgrade(upgradeId) {
        // Return false if upgrade ID doesn't match faction pattern
        if (this.type === 'amazonians' && !['sharpened_tools', 'forest_echoes', 'night_witch', 'sky_talker'].includes(upgradeId)) {
          return false;
        }
        if (this.type === 'ironclad' && !['reinforced_frame', 'metalworking', 'siege_master', 'fortification'].includes(upgradeId)) {
          return false;
        }
        if (this.type === 'arcanists' && !['frost_magic', 'mana_infusion', 'chain_lightning', 'arcane_resonance'].includes(upgradeId)) {
          return false;
        }
        
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
        const faction = this.type;
        
        // Check if max rank reached
        if (this.rank >= 5) return false;
      
        // If no upgrade is selected, just return true to show options
        if (!this.selectedUpgrade) return true;
      
        // Validate faction config exists
        if (!towerConfig[faction] || !towerConfig[faction].ranks || !towerConfig[faction].ranks[this.rank]) {
          console.error(`Invalid tower configuration for ${faction} rank ${this.rank}`);
          return false;
        }
      
        // Get upgrade cost
        const upgradeCost = towerConfig[faction].ranks[this.rank].cost;
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

        // Handle special upgrade effects
        this.applyUpgradeEffects();

        // Upgrade tower
        this.rank++;
        const newConfig = towerConfig[faction].ranks[this.rank-1];

        // Update properties
        this.damage = newConfig.damage;
        this.attackSpeed = newConfig.attackSpeed;
        this.totalCost += upgradeCost;
        
        // Apply range bonus for Ironclad Fortification
        if (faction === 'ironclad' && this.hasUpgrade('fortification')) {
            this.range = Math.floor(this.range * 1.25); // 25% range increase
        }

        // Update mesh
        if (this.mesh) {
            window.game.eventSystem.emit('removeFromScene', { object: this.mesh });
        }
        this.mesh = window.game.renderer.createTowerMesh(this.rank, faction);
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

    applyUpgradeEffects() {
        if (!this.selectedUpgrade) return;
        
        const faction = this.type;
        const upgradeId = this.selectedUpgrade.id;
        
        // Amazonians upgrades
        if (faction === 'amazonians') {
          if (upgradeId === 'sky_talker') {
            this.multiShotCount = this.selectedUpgrade.effects.baseMultiShot;
            // Monitor rounds for additional shots
            // ...existing code...
          }
        }
        
        // Ironclad upgrades
        else if (faction === 'ironclad') {
          if (upgradeId === 'fortification') {
            // Apply range bonus
            this.range = Math.floor(this.range * 1.25);
          }
          // Other ironclad upgrade implementations
        }
        
        // Arcanist upgrades
        else if (faction === 'arcanists') {
          // Arcanist upgrade implementations
        }
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