import * as THREE from 'three';
import { Entity } from './Entity';
import { eventSystem } from '../engine/EventSystem';
import { renderer } from '../engine/Renderer';
import { towerConfig } from '../config/towerConfig';

export class Tower extends Entity {
    constructor(type, position, slotIndex, rank = 1) {
        const mesh = renderer.createTowerMesh(type, rank);
        super(position, mesh);
        
        this.type = type;
        this.rank = rank;
        this.slotIndex = slotIndex;
        
        // Load configuration
        const config = towerConfig[type].ranks[rank-1];
        this.damage = config.damage;
        this.attackSpeed = config.attackSpeed;
        this.range = 8; // Default range
        this.attackTimer = 0;
        this.totalCost = config.cost;
        
        // Special properties based on tower type
        if (type === 'frost') {
            this.slowAmount = config.slowAmount;
        } else if (type === 'fire') {
            this.critChance = config.critChance || 0.4;
            this.critMultiplier = config.critMultiplier || 1.5;
        }
        
        // Create range indicator (hidden by default)
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
            } else if (targets) {
                // Single target for other tower types
                this.fireProjectile(targets);
                this.attackTimer = 0;
            }
        }
    }
    
    findTargets() {
        // Get all creeps from event system
        const creeps = [];
        eventSystem.emit('getTowerTargets', { tower: this, callback: (targets) => {
            creeps.push(...targets);
        }});
        
        // For basic towers, find up to 2 targets
        if (this.type === 'basic') {
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
        
        // For other towers, find single target
        const sortedCreeps = [...creeps].sort((a, b) => b.progress - a.progress);
        
        for (let i = 0; i < sortedCreeps.length; i++) {
            const creep = sortedCreeps[i];
            const distance = this.getDistanceTo(creep.position);
            
            if (distance <= this.range) {
                return creep;
            }
        }
        
        return null;
    }
    
    fireProjectile(target) {
        // Check if this is a critical hit (for fire towers)
        let isCritical = false;
        let damageMultiplier = 1;
        
        if (this.type === 'fire' && this.critChance > 0) {
            isCritical = Math.random() < this.critChance;
            if (isCritical) {
                damageMultiplier = this.critMultiplier || 1.5;
            }
        }
        
        // Create projectile via event system
        eventSystem.emit('createProjectile', {
            position: this.position.clone(),
            target: target,
            damage: this.damage * damageMultiplier,
            towerType: this.type,
            towerRank: this.rank,
            isCritical: isCritical
        });
        
        // Apply "Towers of Rage" augment if active
        eventSystem.emit('towerAttacked', { tower: this });
    }
    
    upgrade() {
        // Check if max rank reached
        if (this.rank >= 5) return false;
        
        // Get upgrade cost
        const upgradeCost = towerConfig[this.type].ranks[this.rank].cost;
        let canAfford = false;
        
        // Check if player can afford upgrade
        eventSystem.emit('canAffordUpgrade', { cost: upgradeCost, callback: (result) => {
            canAfford = result;
        }});
        
        if (!canAfford) return false;
        
        // Deduct cost
        eventSystem.emit('spendGold', { amount: upgradeCost });
        
        // Upgrade tower
        this.rank++;
        const newConfig = towerConfig[this.type].ranks[this.rank-1];
        
        // Update properties
        this.damage = newConfig.damage;
        this.attackSpeed = newConfig.attackSpeed;
        this.totalCost += upgradeCost;
        
        // Update special properties
        if (this.type === 'frost') {
            this.slowAmount = newConfig.slowAmount;
        } else if (this.type === 'fire') {
            this.critChance = newConfig.critChance;
            this.critMultiplier = newConfig.critMultiplier;
        }
        
        // Update mesh
        this.mesh = renderer.createTowerMesh(this.type, this.rank);
        this.mesh.position.copy(this.position);
        
        // Emit upgrade event
        eventSystem.emit('towerUpgraded', { tower: this });
        
        return true;
    }
    
    sell() {
        // Calculate sell value (50% of total cost)
        const sellValue = Math.floor(this.totalCost * 0.5);
        
        // Give gold to player
        eventSystem.emit('addGold', { amount: sellValue });
        
        // Emit sell event
        eventSystem.emit('towerSold', { tower: this, value: sellValue });
        
        // Destroy tower
        this.destroy();
    }
    
    showRangeIndicator() {
        if (!this.rangeIndicator) {
            const geometry = new THREE.RingGeometry(this.range - 0.1, this.range + 0.1, 32);
            const material = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                opacity: 0.3,
                transparent: true,
                side: THREE.DoubleSide
            });
            this.rangeIndicator = new THREE.Mesh(geometry, material);
            this.rangeIndicator.rotation.x = -Math.PI / 2;
            this.rangeIndicator.position.y = 0.1;
            this.mesh.add(this.rangeIndicator);
        }
    }
    
    hideRangeIndicator() {
        if (this.rangeIndicator) {
            this.mesh.remove(this.rangeIndicator);
            this.rangeIndicator = null;
        }
    }
    
    getDistanceTo(position) {
        return this.position.distanceTo(position);
    }
    
    destroy() {
        this.hideRangeIndicator();
        super.destroy();
    }
}

// Make Tower class globally available
window.Tower = Tower; 