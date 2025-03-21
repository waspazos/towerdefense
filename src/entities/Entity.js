import { eventSystem } from '../engine/EventSystem';

export class Entity {
    constructor(position, mesh) {
        this.position = position;
        this.mesh = mesh;
        if (mesh) {
            mesh.position.copy(position);
            eventSystem.emit('addToScene', { object: mesh });
        }
    }

    update(delta) {
        // Base update method, override in child classes
    }

    destroy() {
        if (this.mesh) {
            eventSystem.emit('removeFromScene', { object: this.mesh });
            this.mesh = null;
        }
    }
}