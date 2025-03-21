import { Projectile } from "../entities/Projectile.js";

export class CombatSystem {
  constructor(eventSystem, renderer) {
    this.eventSystem = eventSystem;
    this.renderer = renderer;
    this.projectiles = [];
    this.effects = [];

    // Register event listeners
    this.eventSystem.on("createProjectile", this.createProjectile.bind(this));
    this.eventSystem.on(
      "createFrostImpact",
      this.createFrostImpactEffect.bind(this),
    );
    this.eventSystem.on(
      "createFireCritical",
      this.createFireCriticalEffect.bind(this),
    );
    this.eventSystem.on(
      "createBasicImpact",
      this.createBasicImpactEffect.bind(this),
    );
    this.eventSystem.on(
      "createFloatingDamage",
      this.createFloatingDamageNumber.bind(this),
    );
  }

  update(delta) {
    // Update all projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(delta);

      // Remove destroyed projectiles
      if (projectile.hasReachedTarget) {
        this.projectiles.splice(i, 1);
      }
    }

    // Update visual effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      const finished = effect.update(delta);

      if (finished) {
        // Remove effect from scene
        if (effect.mesh && effect.mesh.parent) {
          effect.mesh.parent.remove(effect.mesh);
        }
        this.effects.splice(i, 1);
      }
    }
  }

  createProjectile(data) {
    const projectile = new Projectile(data);
    this.projectiles.push(projectile);

    // Add to scene
    this.eventSystem.emit("addToScene", { object: projectile.mesh });
  }

  createFrostImpactEffect(data) {
    const { position } = data;

    // Create frost impact effect group
    const impactGroup = new window['THREE'].Group();

    // Central flash
    const flashGeometry = new window['THREE'].SphereGeometry(0.5, 16, 16);
    const flashMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xadd8e6,
      transparent: true,
      opacity: 0.7,
    });

    const flash = new window['THREE'].Mesh(flashGeometry, flashMaterial);
    impactGroup.add(flash);

    // Ice shards exploding outward
    const shardGeometry = new window['THREE'].ConeGeometry(0.1, 0.3, 4);
    const shardMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xcceeff,
      transparent: true,
      opacity: 0.8,
    });

    const numShards = 12;
    const shards = [];

    for (let i = 0; i < numShards; i++) {
      const shard = new window['THREE'].Mesh(shardGeometry, shardMaterial);

      // Calculate position on a sphere
      const phi = Math.acos(-1 + (2 * i) / numShards);
      const theta = Math.sqrt(numShards * Math.PI) * phi;

      shard.position.set(
        0.2 * Math.cos(theta) * Math.sin(phi),
        0.2 * Math.sin(theta) * Math.sin(phi),
        0.2 * Math.cos(phi),
      );

      // Store original position for animation
      shard.userData = {
        originalPos: shard.position.clone(),
        direction: shard.position.clone().normalize(),
        speed: Math.random() * 2 + 3,
      };

      // Rotate to point outward
      shard.lookAt(shard.position.clone().add(shard.userData.direction));

      impactGroup.add(shard);
      shards.push(shard);
    }

    // Create ice ring effect
    const ringGeometry = new window['THREE'].RingGeometry(0.2, 0.6, 32);
    const ringMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0x87cefa,
      transparent: true,
      opacity: 0.5,
      side: window['THREE'].DoubleSide,
    });

    const ring = new window['THREE'].Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    impactGroup.add(ring);

    // Set position
    impactGroup.position.copy(position);

    // Add to scene
    this.eventSystem.emit("addToScene", { object: impactGroup });

    // Create effect object
    const effect = {
      mesh: impactGroup,
      startTime: Date.now(),
      duration: 600, // milliseconds
      update: (delta) => {
        const elapsed = (Date.now() - effect.startTime) / effect.duration;

        if (elapsed >= 1) {
          return true; // Effect complete
        }

        // Animate central flash - expand and fade
        flash.scale.set(1 + elapsed * 2, 1 + elapsed * 2, 1 + elapsed * 2);
        flashMaterial.opacity = 0.7 * (1 - elapsed);

        // Animate shards - move outward and fade
        shards.forEach((shard) => {
          const dir = shard.userData.direction;
          const speed = shard.userData.speed;
          const originalPos = shard.userData.originalPos;

          shard.position
            .copy(originalPos)
            .add(dir.clone().multiplyScalar(elapsed * speed));
          shardMaterial.opacity = 0.8 * (1 - elapsed);
        });

        // Animate ring - expand and fade
        ring.scale.set(1 + elapsed * 3, 1 + elapsed * 3, 1 + elapsed * 3);
        ringMaterial.opacity = 0.5 * (1 - elapsed);

        return false; // Continue effect
      },
    };

    this.effects.push(effect);
  }

  createFireCriticalEffect(data) {
    const { position } = data;

    // Create fire explosion effect group
    const explosionGroup = new window['THREE'].Group();

    // Explosion ring
    const ringGeometry = new window['THREE'].RingGeometry(0.2, 0.4, 32);
    const ringMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 1,
      side: window['THREE'].DoubleSide,
    });

    const explosionRing = new window['THREE'].Mesh(ringGeometry, ringMaterial);
    explosionRing.rotation.x = Math.PI / 2;
    explosionRing.position.y = 0.1;
    explosionGroup.add(explosionRing);

    // Fire particles
    const particles = [];
    const particleGeometry = new window['THREE'].SphereGeometry(0.05, 8, 8);
    const particleMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 1,
    });

    for (let i = 0; i < 12; i++) {
      const particle = new window['THREE'].Mesh(particleGeometry, particleMaterial);
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.2;

      particle.position.set(
        Math.cos(angle) * radius,
        0.1 + Math.random() * 0.2,
        Math.sin(angle) * radius,
      );

      particle.userData = {
        angle: angle,
        radius: radius,
        verticalSpeed: Math.random() * 1.5 + 0.5,
        expansionSpeed: Math.random() * 1 + 0.5,
      };

      explosionGroup.add(particle);
      particles.push(particle);
    }

    // Set group position
    explosionGroup.position.copy(position);

    // Add to scene
    this.eventSystem.emit("addToScene", { object: explosionGroup });

    // Create effect object
    const effect = {
      mesh: explosionGroup,
      startTime: Date.now(),
      duration: 500, // milliseconds
      update: (delta) => {
        const elapsed = (Date.now() - effect.startTime) / effect.duration;

        if (elapsed >= 1) {
          return true; // Effect complete
        }

        // Expand and fade ring
        explosionRing.scale.set(1 + elapsed * 3, 1 + elapsed * 3, 1);
        ringMaterial.opacity = 1 - elapsed;

        // Move and fade particles
        particles.forEach((particle) => {
          const data = particle.userData;

          // Expand outward
          const currentRadius = data.radius + data.expansionSpeed * elapsed;
          particle.position.x = Math.cos(data.angle) * currentRadius;
          particle.position.z = Math.sin(data.angle) * currentRadius;

          // Rise upward
          particle.position.y = 0.1 + data.verticalSpeed * elapsed;

          // Fade out
          particleMaterial.opacity = 1 - elapsed;
        });

        return false; // Continue effect
      },
    };

    this.effects.push(effect);
  }

  createBasicImpactEffect(data) {
    const { position } = data;

    // Create basic impact effect group
    const impactGroup = new window['THREE'].Group();

    // Impact flash
    const flashGeometry = new window['THREE'].SphereGeometry(0.3, 16, 16);
    const flashMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
    });

    const flash = new window['THREE'].Mesh(flashGeometry, flashMaterial);
    impactGroup.add(flash);

    // Impact ring
    const ringGeometry = new window['THREE'].RingGeometry(0.2, 0.4, 32);
    const ringMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    impactGroup.add(ring);

    // Set position
    impactGroup.position.copy(position);

    // Add to scene
    this.eventSystem.emit("addToScene", { object: impactGroup });

    // Create effect object
    const effect = {
      mesh: impactGroup,
      startTime: Date.now(),
      duration: 400, // milliseconds
      update: (delta) => {
        const elapsed = (Date.now() - effect.startTime) / effect.duration;

        if (elapsed >= 1) {
          return true; // Effect complete
        }

        // Expand and fade flash
        flash.scale.set(1 + elapsed * 2, 1 + elapsed * 2, 1 + elapsed * 2);
        flashMaterial.opacity = 0.8 * (1 - elapsed);

        // Expand and fade ring
        ring.scale.set(1 + elapsed * 3, 1 + elapsed * 3, 1 + elapsed * 3);
        ringMaterial.opacity = 0.6 * (1 - elapsed);

        return false; // Continue effect
      },
    };

    this.effects.push(effect);
  }

  createFloatingDamageNumber(data) {
    const { position, damage, isCritical } = data;

    // Create text sprite
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 64;

    // Set text style
    context.font = isCritical ? "bold 48px Arial" : "36px Arial";
    context.fillStyle = isCritical ? "#ff0000" : "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";

    // Draw text
    context.fillText(damage.toString(), canvas.width / 2, canvas.height / 2);

    // Create sprite texture
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });

    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 0.5, 1);
    sprite.position.copy(position);

    // Add to scene
    this.eventSystem.emit("addToScene", { object: sprite });

    // Create effect object
    const effect = {
      mesh: sprite,
      startTime: Date.now(),
      duration: 1000, // milliseconds
      update: (delta) => {
        const elapsed = (Date.now() - effect.startTime) / effect.duration;

        if (elapsed >= 1) {
          return true; // Effect complete
        }

        // Move upward and fade
        sprite.position.y = position.y + elapsed * 2;
        spriteMaterial.opacity = 1 - elapsed;

        return false; // Continue effect
      },
    };

    this.effects.push(effect);
  }
}
