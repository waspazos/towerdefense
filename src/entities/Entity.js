export class Entity {
    constructor(position, mesh) {
        this.position = position;
        this.mesh = mesh;
        if (mesh) {
            mesh.position.copy(position);
            window.game.eventSystem.emit('addToScene', { object: mesh });
        }
    }

    update(delta) {
        // Base update method, override in child classes
        if (this.mesh) {
            this.mesh.position.copy(this.position);
        }
    }

    destroy() {
        if (this.mesh) {
            window.game.eventSystem.emit('removeFromScene', { object: this.mesh });
            this.mesh = null;
        }
    }
}