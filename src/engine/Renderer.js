// src/engine/Renderer.js (partial update - only showing the relevant method)

export class Renderer {
  constructor() {
    // Initialize renderer properties
    this.renderer = new window['THREE'].WebGLRenderer({ antialias: true });
    this.scene = new window['THREE'].Scene();
    
    // Set up camera with a top-down angled view
    this.camera = new window['THREE'].PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 30, 30); // Position camera up and back
    this.camera.lookAt(0, 0, 0); // Look at the center of the game board
    
    // Set up renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    // Add lighting
    const ambientLight = new window['THREE'].AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const directionalLight = new window['THREE'].DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Add ground plane
    const groundGeometry = new window['THREE'].PlaneGeometry(50, 50);
    const groundMaterial = new window['THREE'].MeshStandardMaterial({ 
      color: 0x3a7e3a, // Forest green
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new window['THREE'].Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = window['THREE'].PCFSoftShadowMap;
  }

  initialize(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.appendChild(this.renderer.domElement);
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  createPath(paths) {
    // Create a path for each path configuration
    paths.forEach(pathConfig => {
      // Create vertices array from waypoints
      const vertices = [];
      pathConfig.waypoints.forEach(waypoint => {
        vertices.push(waypoint.x, waypoint.y, waypoint.z);
      });

      // Create geometry
      const pathGeometry = new window['THREE'].BufferGeometry();
      pathGeometry.setAttribute('position', new window['THREE'].Float32BufferAttribute(vertices, 3));
      pathGeometry.computeBoundingBox();
      
      // Create material and line
      const pathMaterial = new window['THREE'].LineBasicMaterial({ color: 0x808080 });
      const path = new window['THREE'].Line(pathGeometry, pathMaterial);
      path.userData.isPath = true;
      
      this.scene.add(path);
    });
    
    console.log("Renderer: Created paths");
  }

  createTowerSlot(position) {
    const slotGeometry = new window['THREE'].BoxGeometry(1, 0.1, 1);
    const slotMaterial = new window['THREE'].MeshStandardMaterial({ 
      color: 0x666666,
      transparent: true,
      opacity: 0.5
    });
    const slot = new window['THREE'].Mesh(slotGeometry, slotMaterial);
    slot.position.set(position.x, position.y, position.z);
    slot.userData.isTowerSlot = true;
    
    this.scene.add(slot);
    return slot;
  }

  createKing(position) {
    const kingGeometry = new window['THREE'].BoxGeometry(1, 2, 1);
    const kingMaterial = new window['THREE'].MeshStandardMaterial({ color: 0xffd700 });
    const king = new window['THREE'].Mesh(kingGeometry, kingMaterial);
    king.position.set(position.x, position.y, position.z);
    king.userData.isKing = true;
    
    this.scene.add(king);
    return king;
  }

  createCreep(position, type) {
    const creepGeometry = new window['THREE'].BoxGeometry(0.5, 1, 0.5);
    const creepMaterial = new window['THREE'].MeshStandardMaterial({ color: 0xff0000 });
    const creep = new window['THREE'].Mesh(creepGeometry, creepMaterial);
    creep.position.set(position.x, position.y, position.z);
    creep.userData.isCreep = true;
    creep.userData.type = type;
    
    this.scene.add(creep);
    return creep;
  }

  createProjectile(startPosition, targetPosition, type) {
    const projectile = this.createProjectileMesh(type);
    projectile.position.copy(startPosition);
    projectile.userData.isProjectile = true;
    projectile.userData.type = type;
    projectile.userData.target = targetPosition;
    
    this.scene.add(projectile);
    return projectile;
  }

  updateProjectile(projectile, delta) {
    if (projectile.userData.isProjectile) {
      const direction = projectile.userData.target.clone().sub(projectile.position);
      direction.normalize();
      projectile.position.add(direction.multiplyScalar(delta * 5));
    }
  }

  removeFromScene(object) {
    if (object && object.parent) {
      object.parent.remove(object);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // Add this method to the Renderer class
  createTowerMesh(rank = 1, faction = 'amazonians') {
    const towerGroup = new window['THREE'].Group();
    
    // Set up colors based on faction
    let baseColor, bodyColor, accentColor;
    
    switch(faction) {
      case 'amazonians':
        baseColor = 0x8b4513; // Brown wooden base
        bodyColor = 0x2E8B57; // Forest green body
        accentColor = 0xffd700; // Gold accents
        break;
      case 'ironclad':
        baseColor = 0x505050; // Dark metal base
        bodyColor = 0x708090; // Slate gray body
        accentColor = 0xb87333; // Copper accents
        break;
      case 'arcanists':
        baseColor = 0x4B0082; // Indigo base
        bodyColor = 0x9370DB; // Medium purple body
        accentColor = 0x00FFFF; // Cyan accents
        break;
      default:
        baseColor = 0x8b4513; // Brown wooden base
        bodyColor = 0x666666; // Gray body
        accentColor = 0xffd700; // Gold accents
    }
    
    // Tower base
    const baseGeometry = new window['THREE'].BoxGeometry(1, 0.5, 1);
    const baseMaterial = new window['THREE'].MeshStandardMaterial({ color: baseColor });
    const base = new window['THREE'].Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.isPartOfTower = true;
    towerGroup.add(base);
    
    // Tower body shape varies by faction
    let bodyGeometry;
    
    if (faction === 'amazonians') {
      // Slender, tall tower with a platform at the top
      bodyGeometry = new window['THREE'].BoxGeometry(0.8, 1.5, 0.8);
    } else if (faction === 'ironclad') {
      // Thick, sturdy tower with a wider base
      bodyGeometry = new window['THREE'].BoxGeometry(0.9, 1.3, 0.9);
    } else if (faction === 'arcanists') {
      // Cylinder tower with mystical appearance
      bodyGeometry = new window['THREE'].CylinderGeometry(0.4, 0.5, 1.5, 8);
    } else {
      // Default
      bodyGeometry = new window['THREE'].BoxGeometry(0.8, 1.5, 0.8);
    }
    
    const bodyMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });
    const body = new window['THREE'].Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.isPartOfTower = true;
    towerGroup.add(body);
    
    // Tower turret varies by faction
    let turretGeometry;
    
    if (faction === 'amazonians') {
      // Bow and arrow platform
      turretGeometry = new window['THREE'].CylinderGeometry(0.2, 0.3, 0.8, 8);
    } else if (faction === 'ironclad') {
      // Cannon barrel
      turretGeometry = new window['THREE'].CylinderGeometry(0.25, 0.25, 1.0, 8);
    } else if (faction === 'arcanists') {
      // Crystal focus
      turretGeometry = new window['THREE'].OctahedronGeometry(0.3);
    } else {
      // Default
      turretGeometry = new window['THREE'].CylinderGeometry(0.2, 0.3, 0.8, 8);
    }
    
    const turretMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });
    const turret = new window['THREE'].Mesh(turretGeometry, turretMaterial);
    turret.position.y = 2.25;
    
    // Position turret based on faction
    if (faction === 'amazonians' || faction === 'ironclad') {
      turret.rotation.x = Math.PI / 2; // Horizontal
    } else if (faction === 'arcanists') {
      turret.rotation.y = Math.PI / 4; // Tilted crystal
    }
    
    turret.castShadow = true;
    turret.receiveShadow = true;
    turret.userData.isPartOfTower = true;
    towerGroup.add(turret);
    
    // Add faction-specific details
    if (faction === 'amazonians') {
      // Add leaves/vines
      const leavesGeometry = new window['THREE'].SphereGeometry(0.4, 8, 4);
      const leavesMaterial = new window['THREE'].MeshStandardMaterial({ 
        color: 0x228B22,
        flatShading: true
      });
      const leaves = new window['THREE'].Mesh(leavesGeometry, leavesMaterial);
      leaves.scale.set(1, 0.3, 1);
      leaves.position.y = 1.9;
      leaves.userData.isPartOfTower = true;
      towerGroup.add(leaves);
    } else if (faction === 'ironclad') {
      // Add reinforcement bands
      for (let i = 0; i < 3; i++) {
        const bandGeometry = new window['THREE'].TorusGeometry(0.5, 0.05, 8, 16);
        const bandMaterial = new window['THREE'].MeshStandardMaterial({ 
          color: 0xb87333,
          metalness: 0.8
        });
        const band = new window['THREE'].Mesh(bandGeometry, bandMaterial);
        band.position.y = 0.8 + (i * 0.4);
        band.rotation.x = Math.PI / 2;
        band.userData.isPartOfTower = true;
        towerGroup.add(band);
      }
    } else if (faction === 'arcanists') {
      // Add floating magical orbs
      for (let i = 0; i < 3; i++) {
        const orbGeometry = new window['THREE'].SphereGeometry(0.1, 8, 8);
        const orbMaterial = new window['THREE'].MeshStandardMaterial({ 
          color: 0x00FFFF,
          emissive: 0x00FFFF,
          emissiveIntensity: 0.5
        });
        const orb = new window['THREE'].Mesh(orbGeometry, orbMaterial);
        
        // Position orbs in a circle around the tower
        const angle = (i / 3) * Math.PI * 2;
        const radius = 0.6;
        orb.position.set(
          Math.cos(angle) * radius,
          1.5,
          Math.sin(angle) * radius
        );
        orb.userData.isPartOfTower = true;
        towerGroup.add(orb);
      }
    }
    
    // Add rank indicator stripes
    for (let i = 0; i < rank; i++) {
      const stripeGeometry = new window['THREE'].BoxGeometry(0.9, 0.1, 0.1);
      const stripeMaterial = new window['THREE'].MeshStandardMaterial({ color: accentColor });
      const stripe = new window['THREE'].Mesh(stripeGeometry, stripeMaterial);
      
      if (faction === 'arcanists') {
        // For cylinder body, place stripes in a circle
        const angle = (i / rank) * Math.PI * 2;
        stripe.position.set(
          Math.cos(angle) * 0.4,
          0.7 + (i * 0.15),
          Math.sin(angle) * 0.4
        );
        stripe.lookAt(body.position.clone().add(new window['THREE'].Vector3(Math.cos(angle), 0, Math.sin(angle))));
      } else {
        // For box bodies, place stripes on front
        stripe.position.set(0, 0.7 + (i * 0.2), 0.45);
      }
      
      stripe.userData.isPartOfTower = true;
      body.add(stripe);
    }
    
    // Add click detection helper
    const hitboxGeometry = new window['THREE'].BoxGeometry(1, 3, 1);
    const hitboxMaterial = new window['THREE'].MeshBasicMaterial({ 
      transparent: true, 
      opacity: 0,
      visible: false 
    });
    const hitbox = new window['THREE'].Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.y = 1.5;
    hitbox.userData.isPartOfTower = true;
    towerGroup.add(hitbox);
    
    // Mark the group itself
    towerGroup.userData.isTower = true;
    towerGroup.userData.faction = faction;
    
    return towerGroup;
  }

  // Updated method for projectiles with faction-specific visuals
  createProjectileMesh(type = 'amazonians') {
    let projectileGeometry, projectileMaterial, projectileColor, emissiveColor;
    
    switch(type) {
      case 'amazonians':
        // Arrow projectile
        projectileGeometry = new window['THREE'].CylinderGeometry(0.05, 0.05, 0.4, 8);
        projectileColor = 0x8B4513; // Brown
        emissiveColor = 0x8B4513;
        break;
        
      case 'ironclad':
        // Cannonball projectile
        projectileGeometry = new window['THREE'].SphereGeometry(0.15, 8, 8);
        projectileColor = 0x333333; // Dark gray
        emissiveColor = 0x333333;
        break;
        
      case 'ironclad_critical':
        // Critical cannonball projectile
        projectileGeometry = new window['THREE'].SphereGeometry(0.2, 8, 8);
        projectileColor = 0xFF4500; // Red-orange
        emissiveColor = 0xFF4500;
        break;
        
      case 'arcanists':
        // Magic projectile
        projectileGeometry = new window['THREE'].OctahedronGeometry(0.15);
        projectileColor = 0x9370DB; // Purple
        emissiveColor = 0x9370DB;
        break;
        
      case 'arcanists_powered':
        // Powered magic projectile
        projectileGeometry = new window['THREE'].OctahedronGeometry(0.2);
        projectileColor = 0x00FFFF; // Cyan
        emissiveColor = 0x00FFFF;
        break;
        
      default:
        // Default projectile
        projectileGeometry = new window['THREE'].SphereGeometry(0.2, 8, 8);
        projectileColor = 0xffff00; // Yellow
        emissiveColor = 0xffff00;
    }
    
    projectileMaterial = new window['THREE'].MeshStandardMaterial({
      color: projectileColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.5
    });
    
    const projectile = new window['THREE'].Mesh(projectileGeometry, projectileMaterial);
    
    // Rotate arrows to point forward
    if (type === 'amazonians') {
      projectile.rotation.z = Math.PI / 2;
    }
    
    projectile.castShadow = true;
    
    return projectile;
  }

  createRangeIndicator(radius) {
    const segments = 32;
    const circleGeometry = new window['THREE'].RingGeometry(radius - 0.1, radius + 0.1, segments);
    const circleMaterial = new window['THREE'].MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: window['THREE'].DoubleSide
    });
    const rangeIndicator = new window['THREE'].Mesh(circleGeometry, circleMaterial);
    rangeIndicator.rotation.x = -Math.PI / 2;
    rangeIndicator.userData.isRangeIndicator = true;
    return rangeIndicator;
  }

  createCreepMesh(type = 'normal') {
    const creepGroup = new window['THREE'].Group();
    
    // Base body
    const bodyGeometry = new window['THREE'].BoxGeometry(0.5, 1, 0.5);
    const bodyMaterial = new window['THREE'].MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.7,
      metalness: 0.3
    });
    const body = new window['THREE'].Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    creepGroup.add(body);

    // Head
    const headGeometry = new window['THREE'].SphereGeometry(0.2, 8, 8);
    const headMaterial = new window['THREE'].MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.7,
      metalness: 0.3
    });
    const head = new window['THREE'].Mesh(headGeometry, headMaterial);
    head.position.y = 0.6;
    head.castShadow = true;
    head.receiveShadow = true;
    creepGroup.add(head);

    // Eyes
    const eyeGeometry = new window['THREE'].SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new window['THREE'].MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5
    });

    const leftEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.6, 0.2);
    creepGroup.add(leftEye);

    const rightEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.6, 0.2);
    creepGroup.add(rightEye);

    // Mark the group
    creepGroup.userData.isCreep = true;
    creepGroup.userData.type = type;

    return creepGroup;
  }

  createHitEffect(position, type = 'amazonians') {
    const effectGroup = new window['THREE'].Group();
    
    switch(type) {
      case 'amazonians':
        // Create a burst of leaves
        for (let i = 0; i < 8; i++) {
          const leafGeometry = new window['THREE'].SphereGeometry(0.1, 4, 4);
          const leafMaterial = new window['THREE'].MeshStandardMaterial({ 
            color: 0x228B22,
            transparent: true,
            opacity: 0.8
          });
          const leaf = new window['THREE'].Mesh(leafGeometry, leafMaterial);
          leaf.position.copy(position);
          
          // Random direction for each leaf
          const angle = (i / 8) * Math.PI * 2;
          const radius = 0.5;
          leaf.userData.velocity = new window['THREE'].Vector3(
            Math.cos(angle) * radius,
            0.2,
            Math.sin(angle) * radius
          );
          leaf.userData.lifetime = 1.0;
          leaf.userData.fadeSpeed = 0.8;
          
          effectGroup.add(leaf);
        }
        break;
        
      case 'ironclad':
        // Create a burst of sparks
        for (let i = 0; i < 12; i++) {
          const sparkGeometry = new window['THREE'].SphereGeometry(0.05, 4, 4);
          const sparkMaterial = new window['THREE'].MeshStandardMaterial({ 
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 1.0
          });
          const spark = new window['THREE'].Mesh(sparkGeometry, sparkMaterial);
          spark.position.copy(position);
          
          // Random direction for each spark
          const angle = (i / 12) * Math.PI * 2;
          const radius = 0.3;
          spark.userData.velocity = new window['THREE'].Vector3(
            Math.cos(angle) * radius,
            0.1,
            Math.sin(angle) * radius
          );
          spark.userData.lifetime = 0.5;
          spark.userData.fadeSpeed = 1.0;
          
          effectGroup.add(spark);
        }
        break;
        
      case 'arcanists':
        // Create a magical burst
        const burstGeometry = new window['THREE'].SphereGeometry(0.3, 8, 8);
        const burstMaterial = new window['THREE'].MeshStandardMaterial({ 
          color: 0x9370DB,
          transparent: true,
          opacity: 0.8,
          emissive: 0x9370DB,
          emissiveIntensity: 0.5
        });
        const burst = new window['THREE'].Mesh(burstGeometry, burstMaterial);
        burst.position.copy(position);
        burst.userData.lifetime = 0.8;
        burst.userData.fadeSpeed = 0.8;
        burst.userData.scaleSpeed = 1.5;
        
        effectGroup.add(burst);
        break;
        
      default:
        // Default hit effect
        const defaultGeometry = new window['THREE'].SphereGeometry(0.2, 8, 8);
        const defaultMaterial = new window['THREE'].MeshStandardMaterial({ 
          color: 0xffff00,
          transparent: true,
          opacity: 0.8
        });
        const defaultEffect = new window['THREE'].Mesh(defaultGeometry, defaultMaterial);
        defaultEffect.position.copy(position);
        defaultEffect.userData.lifetime = 0.5;
        defaultEffect.userData.fadeSpeed = 1.0;
        
        effectGroup.add(defaultEffect);
    }
    
    effectGroup.userData.isHitEffect = true;
    effectGroup.userData.type = type;
    this.scene.add(effectGroup);
    
    // Update the effect in the render loop
    const updateEffect = (delta) => {
      effectGroup.children.forEach(child => {
        if (child.userData.velocity) {
          child.position.add(child.userData.velocity);
        }
        if (child.userData.lifetime) {
          child.userData.lifetime -= delta;
          if (child.userData.fadeSpeed) {
            child.material.opacity = child.userData.lifetime * child.userData.fadeSpeed;
          }
          if (child.userData.scaleSpeed) {
            child.scale.setScalar(1 + (1 - child.userData.lifetime) * child.userData.scaleSpeed);
          }
          if (child.userData.lifetime <= 0) {
            this.scene.remove(child);
          }
        }
      });
      
      if (effectGroup.children.length === 0) {
        this.scene.remove(effectGroup);
      }
    };
    
    // Store the update function in the effect group
    effectGroup.userData.update = updateEffect;
    
    return effectGroup;
  }
}