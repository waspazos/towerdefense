export class Renderer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new window['THREE'].Clock();
    this.ground = null;
    this.kingMesh = null;
    this.pathGroup = null;
  }

  initialize(containerId) {
    // Create scene
    this.scene = new window['THREE'].Scene();
    this.scene.background = new window['THREE'].Color(0x000000); // Black background

    // Create camera
    this.camera = new window['THREE'].PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 50, 30); // Moved back and up to see more
    this.camera.lookAt(0, 0, 0); // Looking at center of the scene

    // Create renderer
    this.renderer = new window['THREE'].WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById(containerId).appendChild(this.renderer.domElement);

    // Add lights
    this.setupLights();

    // Create ground
    this.createTerrainGround();

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    console.log("Renderer: Initialized");
    return this.renderer.domElement;
  }

  setupLights() {
    const ambientLight = new window['THREE'].AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new window['THREE'].DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.camera.far = 100;
    this.scene.add(directionalLight);

    // Add a subtle blue-tinted fill light for atmosphere
    const fillLight = new window['THREE'].HemisphereLight(0x8888ff, 0x004400, 0.5);
    this.scene.add(fillLight);
  }

  createTerrainGround() {
    // Create a simple flat ground plane
    const groundGeometry = new window['THREE'].PlaneGeometry(100, 80);
    const groundMaterial = new window['THREE'].MeshStandardMaterial({
      color: 0x4e6940,
      wireframe: false,
      flatShading: true
    });

    this.ground = new window['THREE'].Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0; // Ground at 0
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  createPath(paths) {
    // Remove existing path group if it exists
    if (this.pathGroup) {
      this.scene.remove(this.pathGroup);
    }

    // Create new path group
    this.pathGroup = new window['THREE'].Group();

    paths.forEach((path, pathIndex) => {
      // Create path materials - one for the main path and one for edges
      const mainPathColor = 0xC2B280; // Sandy/dirt color
      const edgeColor = 0x8B4513;  // Darker brown for edges
      
      const mainPathMaterial = new window['THREE'].MeshStandardMaterial({
        color: mainPathColor,
        roughness: 0.8,
        metalness: 0.1
      });

      const edgeMaterial = new window['THREE'].MeshStandardMaterial({
        color: edgeColor,
        roughness: 0.7,
        metalness: 0.1
      });

      // Create path segments
      for (let i = 0; i < path.waypoints.length - 1; i++) {
        const start = path.waypoints[i];
        const end = path.waypoints[i + 1];

        // Create main path segment (wider)
        const direction = new window['THREE'].Vector3().subVectors(end, start);
        const length = direction.length();
        const mainPathGeometry = new window['THREE'].BoxGeometry(1, 0.3, length); // Reduced width to 1
        const mainPathMesh = new window['THREE'].Mesh(mainPathGeometry, mainPathMaterial);

        // Position main path
        mainPathMesh.position.copy(start).add(end).multiplyScalar(0.5);
        mainPathMesh.lookAt(end);
        mainPathMesh.position.y = 0.15; // Half of its height
        mainPathMesh.receiveShadow = true;

        // Create edge segments (thinner, slightly raised)
        const edgeGeometry = new window['THREE'].BoxGeometry(0.2, 0.4, length); // Thinner edges
        
        // Left edge
        const leftEdge = new window['THREE'].Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.copy(mainPathMesh.position);
        leftEdge.rotation.copy(mainPathMesh.rotation);
        leftEdge.position.y = 0.2; // Slightly higher than path
        leftEdge.translateX(-0.6); // Adjusted for new width
        leftEdge.receiveShadow = true;
        leftEdge.castShadow = true;

        // Right edge
        const rightEdge = new window['THREE'].Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.copy(mainPathMesh.position);
        rightEdge.rotation.copy(mainPathMesh.rotation);
        rightEdge.position.y = 0.2; // Slightly higher than path
        rightEdge.translateX(0.6); // Adjusted for new width
        rightEdge.receiveShadow = true;
        rightEdge.castShadow = true;

        this.pathGroup.add(mainPathMesh);
        this.pathGroup.add(leftEdge);
        this.pathGroup.add(rightEdge);
      }
    });

    this.scene.add(this.pathGroup);
  }

  createKing(position) {
    const kingGeometry = new window['THREE'].SphereGeometry(1, 32, 32);
    const kingMaterial = new window['THREE'].MeshStandardMaterial({ color: 0xffd700 });
    this.kingMesh = new window['THREE'].Mesh(kingGeometry, kingMaterial);
    this.kingMesh.position.copy(position);
    this.kingMesh.castShadow = true;
    this.kingMesh.receiveShadow = true;

    // Add eyes
    const eyeGeometry = new window['THREE'].SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new window['THREE'].MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.3, 0.8);
    this.kingMesh.add(leftEye);

    const rightEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.3, 0.8);
    this.kingMesh.add(rightEye);

    // Add crown
    const crownGeometry = new window['THREE'].ConeGeometry(0.5, 0.5, 5);
    const crownMaterial = new window['THREE'].MeshStandardMaterial({ color: 0xffd700 });
    const crown = new window['THREE'].Mesh(crownGeometry, crownMaterial);
    crown.position.set(0, 0.8, 0);
    crown.castShadow = true;
    this.kingMesh.add(crown);

    this.scene.add(this.kingMesh);
    return this.kingMesh;
  }

  createCreepMesh(creepType) {
    // Create group to hold all monster parts
    const monsterGroup = new window['THREE'].Group();

    // Set color based on creep type
    let bodyColor, eyeColor, hornColor;

    switch(creepType) {
      case 'fast':
        bodyColor = 0x00AA00; // Green for fast creeps
        eyeColor = 0xFFFF00;
        hornColor = 0x006600;
        break;
      case 'armored':
        bodyColor = 0x888888; // Gray for armored creeps
        eyeColor = 0xFF0000;
        hornColor = 0x444444;
        break;
      case 'swarm':
        bodyColor = 0xAA00AA; // Purple for swarm creeps
        eyeColor = 0x00FFFF;
        hornColor = 0x660066;
        break;
      case 'boss':
        bodyColor = 0x8B0000; // Dark red for boss
        eyeColor = 0xFF0000;
        hornColor = 0x4A0404;
        break;
      default:
        bodyColor = 0xFF0000; // Red default
        eyeColor = 0xFFFF00;
        hornColor = 0x880000;
    }

    // Body
    const bodyGeometry = new window['THREE'].SphereGeometry(0.3, 16, 16);
    const bodyMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });
    const body = new window['THREE'].Mesh(bodyGeometry, bodyMaterial);
    body.scale.y = 1.5; // Stretch the sphere to make it oval-shaped
    body.castShadow = true;
    monsterGroup.add(body);

    // Head
    const headGeometry = new window['THREE'].SphereGeometry(0.25, 16, 16);
    const headMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });
    const head = new window['THREE'].Mesh(headGeometry, headMaterial);
    head.position.y = 0.4;
    head.castShadow = true;
    monsterGroup.add(head);

    // Eyes
    const eyeGeometry = new window['THREE'].SphereGeometry(0.06, 8, 8);
    const eyeMaterial = new window['THREE'].MeshStandardMaterial({
      color: eyeColor,
      emissive: eyeColor,
      emissiveIntensity: 0.5
    });

    const leftEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 0.45, 0.2);
    monsterGroup.add(leftEye);

    const rightEye = new window['THREE'].Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 0.45, 0.2);
    monsterGroup.add(rightEye);

    // Special visual elements for each type
    if (creepType === 'armored') {
      // Add armor plates
      const armorGeometry = new window['THREE'].BoxGeometry(0.4, 0.1, 0.4);
      const armorMaterial = new window['THREE'].MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

      for (let i = 0; i < 4; i++) {
        const armor = new window['THREE'].Mesh(armorGeometry, armorMaterial);
        armor.position.set(0, 0.2 - (i * 0.15), 0);
        monsterGroup.add(armor);
      }
    }

    if (creepType === 'fast') {
      // More elongated body
      body.scale.y = 1.8;
      body.scale.x = 0.8;
      body.scale.z = 0.8;
    }

    if (creepType === 'swarm') {
      // Smaller body
      monsterGroup.scale.set(0.7, 0.7, 0.7);
    }

    if (creepType === 'boss') {
      // Scale up the entire monster for boss
      monsterGroup.scale.set(2, 2, 2);

      // Add spikes
      const spikeGeometry = new window['THREE'].ConeGeometry(0.1, 0.3, 8);
      const spikeMaterial = new window['THREE'].MeshStandardMaterial({ color: 0x4A0404 });

      for (let i = 0; i < 8; i++) {
        const spike = new window['THREE'].Mesh(spikeGeometry, spikeMaterial);
        const angle = (i / 8) * Math.PI * 2;
        spike.position.set(
          Math.cos(angle) * 0.6,
          0.4,
          Math.sin(angle) * 0.6
        );
        spike.lookAt(0, 0.4, 0);
        monsterGroup.add(spike);
      }
    }

    // Arms
    const armGeometry = new window['THREE'].CylinderGeometry(0.05, 0.05, 0.3, 8);
    const armMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });

    const leftArm = new window['THREE'].Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.35, 0, 0);
    leftArm.rotation.z = 0.3;
    monsterGroup.add(leftArm);

    const rightArm = new window['THREE'].Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.35, 0, 0);
    rightArm.rotation.z = -0.3;
    monsterGroup.add(rightArm);

    // Legs
    const legGeometry = new window['THREE'].CylinderGeometry(0.07, 0.07, 0.4, 8);
    const legMaterial = new window['THREE'].MeshStandardMaterial({ color: bodyColor });

    const leftLeg = new window['THREE'].Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.4, 0);
    monsterGroup.add(leftLeg);

    const rightLeg = new window['THREE'].Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.4, 0);
    monsterGroup.add(rightLeg);

    // Set shadows
    monsterGroup.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    return monsterGroup;
  }

  createTowerMesh(rank = 1) {
    const towerGroup = new window['THREE'].Group();
    
    // Tower base
    const baseGeometry = new window['THREE'].BoxGeometry(1, 0.5, 1);
    const baseMaterial = new window['THREE'].MeshStandardMaterial({ color: 0x8b4513 });
    const base = new window['THREE'].Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    base.receiveShadow = true;
    base.userData.isPartOfTower = true;
    towerGroup.add(base);
    
    // Tower body
    const bodyGeometry = new window['THREE'].BoxGeometry(0.8, 1.5, 0.8);
    const bodyMaterial = new window['THREE'].MeshStandardMaterial({ color: 0x666666 });
    const body = new window['THREE'].Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.isPartOfTower = true;
    towerGroup.add(body);
    
    // Tower turret
    const turretGeometry = new window['THREE'].CylinderGeometry(0.2, 0.3, 0.8, 8);
    const turretMaterial = new window['THREE'].MeshStandardMaterial({ color: 0x333333 });
    const turret = new window['THREE'].Mesh(turretGeometry, turretMaterial);
    turret.position.y = 2.25;
    turret.rotation.x = Math.PI / 2;
    turret.castShadow = true;
    turret.receiveShadow = true;
    turret.userData.isPartOfTower = true;
    towerGroup.add(turret);
    
    // Add rank indicator
    for (let i = 0; i < rank; i++) {
      const stripeGeometry = new window['THREE'].BoxGeometry(0.9, 0.1, 0.1);
      const stripeMaterial = new window['THREE'].MeshStandardMaterial({ color: 0xffd700 });
      const stripe = new window['THREE'].Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(0, 0.7 + (i * 0.2), 0.45);
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
    
    return towerGroup;
  }

  createTowerSlotMesh() {
    // Create visual representation of the slot
    const slotGeometry = new window['THREE'].BoxGeometry(1.5, 0.2, 1.5);
    const slotMaterial = new window['THREE'].MeshStandardMaterial({
      color: 0x8b4513,
      transparent: true,
      opacity: 0.8
    });

    const slotMesh = new window['THREE'].Mesh(slotGeometry, slotMaterial);
    slotMesh.receiveShadow = true;
    return slotMesh;
  }

  createRangeIndicator(position, range) {
    // Create a ring geometry for the range indicator
    const ringGeometry = new window['THREE'].RingGeometry(range - 0.1, range, 32);
    const ringMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: window['THREE'].DoubleSide
    });

    const rangeIndicator = new window['THREE'].Mesh(ringGeometry, ringMaterial);
    rangeIndicator.rotation.x = -Math.PI / 2; // Lay flat on the ground
    rangeIndicator.position.copy(position);
    rangeIndicator.position.y = 0.1; // Slightly above ground
    
    return rangeIndicator;
  }

  createProjectileMesh() {
    const projectileGeometry = new window['THREE'].SphereGeometry(0.2, 8, 8);
    const projectileMaterial = new window['THREE'].MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    
    const projectile = new window['THREE'].Mesh(projectileGeometry, projectileMaterial);
    projectile.castShadow = true;
    
    return projectile;
  }

  createHitEffect(position) {
    const effectGroup = new window['THREE'].Group();
    
    // Flash
    const flashGeometry = new window['THREE'].SphereGeometry(0.3, 8, 8);
    const flashMaterial = new window['THREE'].MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const flash = new window['THREE'].Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    
    effectGroup.add(flash);
    this.scene.add(effectGroup);
    
    // Animate and remove after duration
    setTimeout(() => {
      this.scene.remove(effectGroup);
    }, 300);
    
    return effectGroup;
  }

  createFloatingDamageNumber(position, damage, isCritical = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 32;

    // Set up text style
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the damage number
    ctx.fillText(Math.round(damage).toString(), canvas.width / 2, canvas.height / 2);

    // Create sprite from canvas
    const texture = new window['THREE'].CanvasTexture(canvas);
    const spriteMaterial = new window['THREE'].SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    const sprite = new window['THREE'].Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.position.y += 1; // Place above the target
    sprite.scale.set(2, 1, 1);
    
    this.scene.add(sprite);
    
    // Animate and remove after duration
    const startTime = Date.now();
    const duration = 1000; // ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < duration) {
        sprite.position.y += 0.01;
        sprite.material.opacity = 1 - (elapsed / duration);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(sprite);
      }
    };
    
    animate();
    
    return sprite;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    if (this.scene && this.camera && this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}