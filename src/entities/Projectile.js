import * as THREE from 'three';
import { Entity } from './Entity';
import { eventSystem } from '../engine/EventSystem';
import { renderer } from '../engine/Renderer';
import { towerConfig } from '../config/towerConfig';

export class Projectile extends Entity {
    constructor(options) {
        const { position, target, damage, towerType, towerRank, isCritical = false } = options;
        
        // Get color based on tower type and rank
        let color;
        if (towerType === 'frost') {
            color = 0x00ffff;
        } else if (towerType === 'fire') {
            color = 0xff4500;
        } else {
            color = 0xffffff;
        }
        
        const mesh = renderer.createProjectileMesh(color);
        super(position, mesh);
        
        this.target = target;
        this.damage = damage;
        this.towerType = towerType;
        this.towerRank = towerRank;
        this.isCritical = isCritical;
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
        const direction = new THREE.Vector3();
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
        let killed = false;
        if (this.target.takeDamage) {
            killed = this.target.takeDamage(this.damage, this.isCritical ? 'critical' : 'normal');
        }
        
        // Apply special effects based on tower type
        if (!killed) {
            if (this.towerType === 'frost' && this.target.applySlowEffect) {
                // Get slow amount based on tower rank
                const slowAmount = towerConfig.frost.ranks[this.towerRank - 1].slowAmount;
                this.target.applySlowEffect(slowAmount, 5.0, this.towerRank);
            } else if (this.towerType === 'fire' && this.isCritical && this.target.applyBurnEffect) {
                // Apply burn effect on critical hits
                const burnDamage = this.damage * 0.05; // 5% of damage per second
                this.target.applyBurnEffect(burnDamage, 3.0);
            }
        }
        
        // Create hit effect
        this.createHitEffect();
        
        // Destroy projectile
        this.destroy();
    }
    
    createHitEffect() {
        // Create different hit effects based on tower type
        if (this.towerType === 'frost') {
            this.createFrostImpactEffect();
        } else if (this.towerType === 'fire' && this.isCritical) {
            this.createFireCriticalEffect();
        } else {
            this.createBasicImpactEffect();
        }
    }
    
    createFrostImpactEffect() {
        eventSystem.emit('createFrostImpact', { 
            position: this.position.clone()
        });
    }
    
    createFireCriticalEffect() {
        eventSystem.emit('createFireCritical', { 
            position: this.position.clone()
        });
    }
    
    createBasicImpactEffect() {
        eventSystem.emit('createBasicImpact', { 
            position: this.position.clone()
        });
    }
} 