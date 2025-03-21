// Import THREE from CDN
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

export class Renderer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.ground = null;
    this.kingMesh = null;
    this.pathGroup = null;
  }
  
  initialize(containerId) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black background
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 40, 15);
    this.camera.lookAt(0, 0, -5);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.getElementById(containerId).appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
    
    // Create ground
    this.createTerrainGround();
    
    // Create forest environment
    this.createForestEnvironment();
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    
    return this.renderer.domElement;
  }
  
  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
    
    // Add a subtle blue-tinted fill light for the forest
    const forestLight = new THREE.HemisphereLight(0x8888ff, 0x004400, 0.5);
    this.scene.add(forestLight);
  }
  
  createTerrainGround() {
    // Create a simple flat ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 80, 1, 1);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x4e6940,
      wireframe: false,
      flatShading: true
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }
  
  createForestEnvironment() {
    // Empty function - we don't want trees or rocks anymore
  }
  
  createPath(paths) {
    // Remove any existing path group
    if (this.pathGroup) {
      this.scene.remove(this.pathGroup);
    }

    // Create a new path group
    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);

    // Create visual markers for each path
    if (paths && paths.length > 0) {
      paths.forEach((path, pathIndex) => {
        // Create markers for spawn point
        const spawnMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        spawnMarker.position.copy(path.spawnPoint);
        this.pathGroup.add(spawnMarker);

        // Create markers for waypoints
        path.waypoints.forEach((waypoint, index) => {
          const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: index === path.waypoints.length - 1 ? 0xff0000 : 0xffff00
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(waypoint);
          this.pathGroup.add(marker);

          // Create connecting lines
          if (index > 0) {
            const start = path.waypoints[index - 1];
            const end = waypoint;
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
              color: 0xffffff, 
              opacity: 0.5, 
              transparent: true 
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.pathGroup.add(line);
          }
        });
      });
    }
  }
  
  createKing(position) {
    const kingGeometry = new THREE.SphereGeometry(1, 32, 32);
    const kingMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    this.kingMesh = new THREE.Mesh(kingGeometry, kingMaterial);
    this.kingMesh.position.copy(position);
    this.kingMesh.castShadow = true;
    this.kingMesh.receiveShadow = true;
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.3, 0.8);
    this.kingMesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.3, 0.8);
    this.kingMesh.add(rightEye);
    
    // Add crown
    const crownGeometry = new THREE.ConeGeometry(0.5, 0.5, 5);
    const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(0, 0.8, 0);
    crown.castShadow = true;
    this.kingMesh.add(crown);
    
    this.scene.add(this.kingMesh);
    
    return this.kingMesh;
  }
  
  createCreepMesh(creepType) {
    try {
      // Create group to hold all monster parts
      const monsterGroup = new THREE.Group();
      
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
      }
      
      // Body - using combination of sphere and cylinder instead of capsule
      const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.y = 1.5; // Stretch the sphere to make it oval-shaped
      body.castShadow = true;
      monsterGroup.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.4;
      head.castShadow = true;
      monsterGroup.add(head);
      
      // Eyes - glowing yellow (or type-specific color)
      const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: eyeColor,
        emissive: eyeColor,
        emissiveIntensity: 0.5
      });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 0.45, 0.2);
      monsterGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 0.45, 0.2);
      monsterGroup.add(rightEye);
      
      // Special visual elements for each type
      if (creepType === 'armored') {
        // Add armor plates for armored creeps
        const armorGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.4);
        const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
        
        // Add armor plates at different positions
        for (let i = 0; i < 4; i++) {
          const armor = new THREE.Mesh(armorGeometry, armorMaterial);
          armor.position.set(0, 0.2 - (i * 0.15), 0);
          monsterGroup.add(armor);
        }
        
        // Add helmet
        const helmetGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
        const helmet = new THREE.Mesh(helmetGeometry, armorMaterial);
        helmet.position.set(0, 0.5, 0);
        monsterGroup.add(helmet);
      }
      
      if (creepType === 'fast') {
        // Streamlined body for fast creeps
        body.scale.y = 1.8; // More elongated body
        body.scale.x = 0.8; // Narrower
        body.scale.z = 0.8;
        
        // Add some speed lines
        const lineGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
        const lineMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x00FF00,
          emissive: 0x00FF00,
          emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 3; i++) {
          const line = new THREE.Mesh(lineGeometry, lineMaterial);
          line.position.set(-0.2 + (i * 0.2), 0, -0.2);
          monsterGroup.add(line);
        }
      }
      
      if (creepType === 'swarm') {
        // Smaller body for swarm creeps
        monsterGroup.scale.set(0.7, 0.7, 0.7);
        
        // Add some particle effects
        const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
        const particleMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xAA00AA,
          emissive: 0xAA00AA,
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.7
        });
        
        for (let i = 0; i < 8; i++) {
          const particle = new THREE.Mesh(particleGeometry, particleMaterial);
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.3 + Math.random() * 0.2;
          particle.position.set(
            Math.cos(angle) * radius,
            Math.random() * 0.6,
            Math.sin(angle) * radius
          );
          monsterGroup.add(particle);
        }
      }

      if (creepType === 'boss') {
        // Scale up the entire monster for boss
        monsterGroup.scale.set(2, 2, 2);
        
        // Add glowing aura
        const auraGeometry = new THREE.RingGeometry(0.8, 1.2, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
          color: 0xFF0000,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        aura.rotation.x = Math.PI / 2;
        aura.position.y = 0.1;
        monsterGroup.add(aura);
        
        // Add spikes
        const spikeGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0x4A0404 });
        
        for (let i = 0; i < 8; i++) {
          const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
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
      
      // Horns (unless we're a swarm creep, which has no horns)
      if (creepType !== 'swarm') {
        const hornGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
        const hornMaterial = new THREE.MeshStandardMaterial({ color: hornColor });
        
        const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        leftHorn.position.set(-0.15, 0.6, 0);
        leftHorn.rotation.x = -0.2;
        monsterGroup.add(leftHorn);
        
        const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
        rightHorn.position.set(0.15, 0.6, 0);
        rightHorn.rotation.x = -0.2;
        monsterGroup.add(rightHorn);
      }
      
      // Arms - using cylinders
      const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
      const armMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.35, 0, 0);
      leftArm.rotation.z = 0.3;
      monsterGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.35, 0, 0);
      rightArm.rotation.z = -0.3;
      monsterGroup.add(rightArm);
      
      // Legs - using cylinders
      const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8);
      const legMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.15, -0.4, 0);
      monsterGroup.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.15, -0.4, 0);
      monsterGroup.add(rightLeg);
      
      // Set the entire group to cast shadows
      monsterGroup.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      
      // Add animation data
      monsterGroup.userData = {
        walkTime: 0,
        walkSpeed: Math.random() * 0.5 + 0.5,
        armSwing: { left: leftArm, right: rightArm },
        legSwing: { left: leftLeg, right: rightLeg },
        creepType: creepType // Store creep type for future reference
      };
      
      return monsterGroup;
    } catch (error) {
      console.log("Error creating monster mesh:", error);
      
      // Fall back to the original simple sphere if there's an error
      const creepGeometry = new THREE.SphereGeometry(0.5, 16, 16);
      const creepMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
      return new THREE.Mesh(creepGeometry, creepMaterial);
    }
  }
  
  createTowerMesh(towerType, rank) {
    const towerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const towerConfig = window.towerConfig[towerType];
    const towerColor = towerConfig.ranks[rank-1].color;
    
    const towerMaterial = new THREE.MeshStandardMaterial({ 
      color: towerColor
    });
    const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    
    // Add turret/cannon
    const turretGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.8, 8);
    
    // Different turret color for frost towers
    let turretColor;
    if (towerType === 'frost') {
      turretColor = rank === 1 ? 0x4682B4 : 0x0000CD; // Darker blue for turret
    } else if (towerType === 'fire') {
      turretColor = rank === 1 ? 0x8B0000 : 0x800000; // Dark red for turret
    } else {
      turretColor = 0x333333; // Default dark gray for basic tower
    }
    
    const turretMaterial = new THREE.MeshStandardMaterial({ color: turretColor });
    const turretMesh = new THREE.Mesh(turretGeometry, turretMaterial);
    turretMesh.position.set(0, 1, 0);
    turretMesh.rotation.x = Math.PI / 2;
    towerMesh.add(turretMesh);
    
    // Add special effects for frost tower
    if (towerType === 'frost') {
      // Add a glowing orb at the end of the turret
      const orbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0xADD8E6,
        emissive: 0xADD8E6,
        emissiveIntensity: 0.7
      });
      const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
      orbMesh.position.set(0, 0, 0.5); // Position at end of turret
      turretMesh.add(orbMesh);
    } else if (towerType === 'fire') {
      // Add a glowing fire orb at the end of the turret
      const orbGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const orbMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        emissive: 0xff4500,
        emissiveIntensity: 0.8
      });
      const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
      orbMesh.position.set(0, 0, 0.5); // Position at end of turret
      turretMesh.add(orbMesh);
      
      // Add fire particles
      const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        emissive: 0xff8c00,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8
      });
      
      // Create multiple particles
      for (let i = 0; i < 6; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const angle = (i / 6) * Math.PI * 2;
        particle.position.set(
          Math.cos(angle) * 0.2,
          Math.sin(angle) * 0.2,
          0.5
        );
        particle.userData = {
          originalPos: particle.position.clone(),
          speed: Math.random() * 0.5 + 0.5,
          angle: angle
        };
        turretMesh.add(particle);
      }
    }
    
    return towerMesh;
  }
  
  createWorkerMesh() {
    try {
      // Create group to hold all worker parts
      const workerGroup = new THREE.Group();
      
      // Worker-specific colors
      const bodyColor = 0x4169E1; // Royal blue for workers
      const eyeColor = 0xFFFFFF;
      const toolColor = 0x8B4513; // Brown for tools
      
      // Body - using combination of sphere and cylinder instead of capsule
      const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.scale.y = 1.5; // Stretch the sphere to make it oval-shaped
      body.castShadow = true;
      workerGroup.add(body);
      
      // Head
      const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
      const headMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.4;
      head.castShadow = true;
      workerGroup.add(head);
      
      // Eyes - white and friendly
      const eyeGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const eyeMaterial = new THREE.MeshStandardMaterial({ 
        color: eyeColor,
        emissive: eyeColor,
        emissiveIntensity: 0.3
      });
      
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.1, 0.45, 0.2);
      workerGroup.add(leftEye);
      
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.1, 0.45, 0.2);
      workerGroup.add(rightEye);
      
      // Add a mining pickaxe
      const pickaxeGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
      const pickaxeMaterial = new THREE.MeshStandardMaterial({ color: toolColor });
      const pickaxe = new THREE.Mesh(pickaxeGeometry, pickaxeMaterial);
      pickaxe.position.set(0.4, 0, 0);
      pickaxe.rotation.z = -0.3;
      workerGroup.add(pickaxe);
      
      // Add pickaxe head
      const pickaxeHeadGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.1);
      const pickaxeHead = new THREE.Mesh(pickaxeHeadGeometry, pickaxeMaterial);
      pickaxeHead.position.set(0.5, 0.2, 0);
      pickaxeHead.rotation.z = -0.3;
      workerGroup.add(pickaxeHead);
      
      // Arms - using cylinders
      const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
      const armMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      
      const leftArm = new THREE.Mesh(armGeometry, armMaterial);
      leftArm.position.set(-0.35, 0, 0);
      leftArm.rotation.z = 0.3;
      workerGroup.add(leftArm);
      
      const rightArm = new THREE.Mesh(armGeometry, armMaterial);
      rightArm.position.set(0.35, 0, 0);
      rightArm.rotation.z = -0.3;
      workerGroup.add(rightArm);
      
      // Legs - using cylinders
      const legGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.4, 8);
      const legMaterial = new THREE.MeshStandardMaterial({ color: bodyColor });
      
      const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
      leftLeg.position.set(-0.15, -0.4, 0);
      workerGroup.add(leftLeg);
      
      const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
      rightLeg.position.set(0.15, -0.4, 0);
      workerGroup.add(rightLeg);
      
      // Set the entire group to cast shadows
      workerGroup.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      
      // Add animation data
      workerGroup.userData = {
        walkTime: 0,
        walkSpeed: Math.random() * 0.5 + 0.5,
        armSwing: { left: leftArm, right: rightArm },
        legSwing: { left: leftLeg, right: rightLeg }
      };
      
      return workerGroup;
    } catch (error) {
      console.log("Error creating worker mesh:", error);
      
      // Fall back to a simple worker mesh if there's an error
      const workerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const workerMaterial = new THREE.MeshStandardMaterial({ color: 0x4169E1 });
      return new THREE.Mesh(workerGeometry, workerMaterial);
    }
  }
  
  createTowerSlotMesh() {
    // Create visual representation of the slot
    const slotGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
    const slotMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513,
      transparent: true,
      opacity: 0.8
    });
    
    const slotMesh = new THREE.Mesh(slotGeometry, slotMaterial);
    slotMesh.receiveShadow = true;
    
    // Make the slot interactive
    slotMesh.userData = {
      type: 'towerSlot'
    };
    
    return slotMesh;
  }
  
  createRangeIndicator(position, range) {
    // Create a ring geometry for the range indicator
    const ringGeometry = new THREE.RingGeometry(range - 0.1, range, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true, 
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    const rangeIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
    rangeIndicator.rotation.x = -Math.PI / 2; // Lay flat on the ground
    rangeIndicator.position.copy(position);
    rangeIndicator.userData.type = 'rangeIndicator';
    
    return rangeIndicator;
  }
  
  createRock(x, z) {
    const rockGroup = new THREE.Group();
    
    // Create main rock body
    const rockGeometry = new THREE.DodecahedronGeometry(0.8, 0);
    const rockMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rockGroup.add(rock);
    
    // Add some smaller rocks for variety
    for (let i = 0; i < 3; i++) {
      const smallRockGeometry = new THREE.DodecahedronGeometry(0.3, 0);
      const smallRockMaterial = new THREE.MeshPhongMaterial({ color: 0x909090 });
      const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
      
      // Position small rocks around the main rock
      const angle = (i / 3) * Math.PI * 2;
      smallRock.position.x = Math.cos(angle) * 0.5;
      smallRock.position.z = Math.sin(angle) * 0.5;
      smallRock.position.y = 0.2;
      
      rockGroup.add(smallRock);
    }
    
    // Position the rock group
    rockGroup.position.set(x, 0, z);
    
    // Add userData to the rock group
    rockGroup.userData = {
      type: 'mining-rock',
      isOccupied: false
    };
    
    // Add to scene
    this.scene.add(rockGroup);
    return rockGroup;
  }
  
  createProjectileMesh(color) {
    const projectileGroup = new THREE.Group();
    
    // Main projectile sphere
    const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const projectileMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.5
    });
    
    const projectileMesh = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectileGroup.add(projectileMesh);
    
    // For frost projectiles (blue colors), add enhanced ice effect
    if (color === 0x6495ED || color === 0x1E90FF) {
      // Larger glowing core for frost projectiles
      const coreGeometry = new THREE.SphereGeometry(0.15, 12, 12);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.7,
        emissive: 0xADD8E6,
        emissiveIntensity: 0.8
      });
      
      const coreEffect = new THREE.Mesh(coreGeometry, coreMaterial);
      coreEffect.scale.set(0.8, 0.8, 0.8);
      projectileGroup.add(coreEffect);
      
      // Add ice crystal shards around the projectile
      const shardGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCEEFF,
        transparent: true,
        opacity: 0.9,
        emissive: 0xCCEEFF,
        emissiveIntensity: 0.3
      });
      
      // Create multiple shards pointing outward
      for (let i = 0; i < 8; i++) {
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);
        
        // Position around the sphere
        const angle = (i / 8) * Math.PI * 2;
        shard.position.set(
          Math.cos(angle) * 0.15,
          Math.sin(angle) * 0.15,
          0
        );
        
        // Rotate to point outward
        shard.rotation.z = angle + Math.PI;
        shard.rotation.y = Math.random() * 0.5;
        
        projectileGroup.add(shard);
      }
    } else if (color === 0xff4500 || color === 0xff0000) {
      // Fire projectile effects
      const coreGeometry = new THREE.SphereGeometry(0.15, 12, 12);
      const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.7,
        emissive: 0xff8c00,
        emissiveIntensity: 0.8
      });
      
      const coreEffect = new THREE.Mesh(coreGeometry, coreMaterial);
      coreEffect.scale.set(0.8, 0.8, 0.8);
      projectileGroup.add(coreEffect);
      
      // Add fire particles
      const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.8,
        emissive: 0xff4500,
        emissiveIntensity: 0.6
      });
      
      // Add more particles for a better trail effect
      for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        // Position behind the main projectile in a random pattern
        particle.position.set(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          -(i + 1) * 0.1
        );
        particle.scale.set(
          0.8 - (i * 0.1),
          0.8 - (i * 0.1),
          0.8 - (i * 0.1)
        );
        projectileGroup.add(particle);
      }
      
      // Store animation data in user data
      projectileGroup.userData = {
        rotationSpeed: Math.random() * 0.1 + 0.05,
        pulseTime: 0
      };
    }
    
    return projectileGroup;
  }
  
  createFloatingDamageNumber(position, damage, isCritical = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 64;
    
    // Set up text style
    ctx.fillStyle = isCritical ? '#ff0000' : '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Draw the damage number
    ctx.fillText(Math.round(damage).toString(), canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthTest: false // Ensure it's always visible
      })
    );
    
    // Set initial position and scale
    sprite.position.copy(position);
    sprite.position.y += 1; // Start above the target
    sprite.scale.set(2, 1, 1); // Make the sprite wider for better readability
    
    this.scene.add(sprite);
    
    return sprite;
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}