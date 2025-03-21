import * as THREE from 'three';
import { Entity } from './Entity';
import { eventSystem } from '../engine/EventSystem';
import { renderer } from '../engine/Renderer';

export class King extends Entity {
    constructor(position) {
        const mesh = renderer.createKing(position);
        super(position, mesh);
        
        this.health = 100;
        this.maxHealth = 100;
        this.isDead = false;
        
        // Create health bar
        this.createHealthBar();
    }
    
    createHealthBar() {
        const healthBarWidth = 2;
        const healthBarHeight = 0.1;
        
        // Background for health bar
        const healthBarBgGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarBgMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(healthBarBgGeometry, healthBarBgMaterial);
        this.healthBarBg.position.y = 2;
        this.healthBarBg.rotation.x = Math.PI / 2;
        this.mesh.add(this.healthBarBg);
        
        // Health bar
        const healthBarGeometry = new THREE.PlaneGeometry(healthBarWidth, healthBarHeight);
        const healthBarMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.y = 2;
        this.healthBar.rotation.x = Math.PI / 2;
        this.mesh.add(this.healthBar);
    }
    
    update(delta) {
        super.update(delta);
        
        // Update health bar
        this.updateHealthBar();
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
        eventSystem.emit('createFloatingDamage', {
            position: this.position.clone(),
            damage: amount
        });
        
        // Check if dead
        if (this.health <= 0 && !this.isDead) {
            this.die();
            return true;
        }
        
        return false;
    }
    
    die() {
        this.isDead = true;
        
        // Emit death event
        eventSystem.emit('kingDied', { king: this });
        
        // Destroy king
        this.destroy();
    }
    
    destroy() {
        if (this.healthBar) {
            this.mesh.remove(this.healthBar);
        }
        if (this.healthBarBg) {
            this.mesh.remove(this.healthBarBg);
        }
        super.destroy();
    }
} 