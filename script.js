// 3D Tower Defense Game

window.handleTowerOptionClick = function(event, towerType) {
    event.stopPropagation();
    console.log("Tower option clicked directly:", towerType);
    buildTower(towerType);
};

// Create a corrected version of the buildTower function
window.buildTower = function(towerType) {
    console.log("Global buildTower called with type:", towerType);
    
    // Make sure we have gameState.towerTypes defined
    if (!gameState.towerTypes) {
        console.log("Tower types not defined, creating them now");
        gameState.towerTypes = {
            basic: {
                name: "Basic Tower",
                ranks: [
                    { cost: 3, damage: 25, attackSpeed: 2, color: 0xaaaaaa },
                    { cost: 5, damage: 40, attackSpeed: 1.5, color: 0xdddddd }
                ]
            },
            frost: {
                name: "Frost Tower",
                ranks: [
                    { cost: 5, damage: 15, attackSpeed: 1.5, slowEffect: 0.3, color: 0x6495ED },
                    { cost: 8, damage: 25, attackSpeed: 1.2, slowEffect: 0.5, color: 0x1E90FF }
                ]
            }
        };
    }
    
    // Check if slot is selected
    if (!gameState.selectedTowerSlot) {
        console.log("No tower slot selected");
        return;
    }
    
    // Get tower data
    console.log("Tower types:", gameState.towerTypes);
    console.log("Looking for tower type:", towerType);
    
    const towerData = gameState.towerTypes[towerType];
    if (!towerData) {
        console.error("Invalid tower type:", towerType);
        return;
    }
    
    const towerRank = towerData.ranks[0];
    
    // Check if we have enough gold
    if (gameState.gold < towerRank.cost) {
        console.log("Not enough gold");
        return;
    }
    
    // Get slot
    const slot = gameState.selectedTowerSlot;
    console.log("Building tower at slot:", slot);
    
    try {
        // Create tower mesh
        const towerMesh = createTowerMesh(towerType, 1);
        towerMesh.position.set(slot.x, slot.y + 1, slot.z);
        scene.add(towerMesh);
        
        // Create tower object
        const tower = {
            mesh: towerMesh,
            type: towerType,
            rank: 1,
            damage: towerRank.damage,
            attackSpeed: towerRank.attackSpeed,
            attackCooldown: 0,
            range: 8,
            position: { x: slot.x, y: slot.y + 1, z: slot.z },
            slotIndex: slot.index,
            totalCost: towerRank.cost,
            targetCreep: null
        };
        
        // Add special properties for specific tower types
        if (towerType === 'frost') {
            tower.slowEffect = towerRank.slowEffect;
        }
        
        // Add tower to game
        gameState.towers.push(tower);
        
        // Mark slot as occupied
        slot.occupied = true;
        slot.tower = tower;
        
        // Deduct gold
        gameState.gold -= towerRank.cost;
        
        // Update stats
        gameState.towerCount++;
        gameState.towersBuilt++;
        
        // Update UI
        updateGold();
        updateTowerCount();
        
        // Hide tower selection
        document.getElementById('tower-selection').classList.add('hidden');
        gameState.selectedTowerSlot = null;
        
        console.log("Tower built successfully:", tower);
    } catch (error) {
        console.error("Error building tower:", error);
    }
};

// Game state
let gameState = {
    kingHealth: 100,
    gold: 10,
    towerCount: 0,
    totalDamage: 0,
    currentRound: 0,
    maxRounds: 20,
    gameActive: false,
    roundActive: false,
    interRoundTimer: 10,
    timerInterval: null,
    isPaused: false,
    creeps: [],
    towers: [],
    projectiles: [],
    towerSlots: [],
    
    // New properties for round tracker
    creepTypes: {
        fast: { 
            name: "Fast", 
            description: "Quick enemy units with less health" 
        },
        armored: { 
            name: "Armored", 
            description: "Heavily armored, resistant to damage" 
        },
        swarm: { 
            name: "Swarm", 
            description: "Large numbers of weak enemies" 
        }
    },
    
    // Round definitions
    roundDefinitions: [
        { type: "fast", difficultly: 1 },
        { type: "armored", difficultly: 1 },
        { type: "swarm", difficultly: 1 },
        { type: "fast", difficultly: 2 },
        { type: "armored", difficultly: 2 },
        { type: "swarm", difficultly: 2 },
        { type: "fast", difficultly: 3 },
        { type: "armored", difficultly: 3 },
        { type: "swarm", difficultly: 3 },
        { type: "fast", difficultly: 4 },
        { type: "armored", difficultly: 4 },
        { type: "swarm", difficultly: 4 },
        { type: "fast", difficultly: 5 },
        { type: "armored", difficultly: 5 },
        { type: "swarm", difficultly: 5 },
        { type: "fast", difficultly: 6 },
        { type: "armored", difficultly: 6 },
        { type: "swarm", difficultly: 6 },
        { type: "fast", difficultly: 7 },
        { type: "armored", difficultly: 7 }
    ],
    
    // Define tower types
    towerTypes: {
        basic: {
            name: "Basic Tower",
            ranks: [
                { cost: 3, damage: 25, attackSpeed: 2, color: 0xaaaaaa },
                { cost: 5, damage: 40, attackSpeed: 1.5, color: 0xdddddd }
            ]
        },
        frost: {
            name: "Frost Tower",
            ranks: [
                { cost: 5, damage: 15, attackSpeed: 1.5, slowEffect: 0.3, color: 0x6495ED },
                { cost: 8, damage: 25, attackSpeed: 1.2, slowEffect: 0.5, color: 0x1E90FF }
            ]
        }
    }
};

// Three.js variables
let scene, camera, renderer;
let ground, pathMesh, kingMesh;
let clock = new THREE.Clock();

function initGame() {
    // Reset clock explicitly 
    clock = new THREE.Clock();
    
    // Save tower types before reset
    const savedTowerTypes = {...gameState.towerTypes};
    
    // Reset game state
    gameState.kingHealth = 100;
    gameState.gold = 10;
    gameState.towerCount = 0;
    gameState.totalDamage = 0;
    gameState.currentRound = 0;
    gameState.gameActive = true;
    gameState.roundActive = false;
    gameState.interRoundTimer = 10;
    gameState.isPaused = false;
    gameState.creeps = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.selectedTowerSlot = null;
    gameState.selectedTower = null;
    gameState.creepsKilled = 0;
    gameState.towersBuilt = 0;
    
    // Initialize the paths array
    gameState.paths = [
        // Left path
        { 
            spawnPoint: { x: -15, y: 0, z: -25 },
            waypoints: [
                { x: -15, y: 0, z: -25 },
                { x: -15, y: 0, z: -10 },
                { x: -15, y: 0, z: 0 },
                { x: -10, y: 0, z: 5 },
                { x: -5, y: 0, z: 7 },
                { x: 0, y: 0, z: 10 }
            ]
        },
        // Center path
        {
            spawnPoint: { x: 0, y: 0, z: -25 },
            waypoints: [
                { x: 0, y: 0, z: -25 },
                { x: 0, y: 0, z: 10 }
            ]
        },
        // Right path
        {
            spawnPoint: { x: 15, y: 0, z: -25 },
            waypoints: [
                { x: 15, y: 0, z: -25 },
                { x: 15, y: 0, z: -10 },
                { x: 15, y: 0, z: 0 },
                { x: 10, y: 0, z: 5 },
                { x: 5, y: 0, z: 7 },
                { x: 0, y: 0, z: 10 }
            ]
        }
    ];
    
    
    // Restore tower types
    gameState.towerTypes = savedTowerTypes;
    
    // Setup 3D scene
    setupScene();
    
    // Generate game environment
    generateTowerSlots();
    
    // Update UI
    updateUI();
    updateRoundTracker();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
    
    // Start timer for first round
    startInterRoundTimer();
}

// Create creep mesh without using CapsuleGeometry
function createCreepMesh(creepType = 'standard') {
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
            case 'standard':
            default:
                bodyColor = 0x8B0000; // Original dark red for standard creeps
                eyeColor = 0xFFFF00;
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

// Update the updateRoundTracker function to correctly highlight the current round
function updateRoundTracker() {
    const currentRound = gameState.currentRound;
    const previousRound = currentRound - 1;
    const nextRound = currentRound + 1;
    const futureRound = currentRound + 2;
    
    // Update previous round
    if (previousRound >= 1) {
        document.getElementById('previous-round').textContent = previousRound;
        const prevRoundDef = gameState.roundDefinitions[previousRound - 1];
        document.getElementById('previous-round-details').textContent = prevRoundDef.type.charAt(0).toUpperCase() + prevRoundDef.type.slice(1);
    } else {
        document.getElementById('previous-round').textContent = '-';
        document.getElementById('previous-round-details').textContent = 'N/A';
    }
    
    // Update current round
    document.getElementById('current-round').textContent = currentRound;
    if (currentRound > 0 && currentRound <= gameState.maxRounds) {
        const currRoundDef = gameState.roundDefinitions[currentRound - 1];
        document.getElementById('current-round-details').textContent = currRoundDef.type.charAt(0).toUpperCase() + currRoundDef.type.slice(1);
    } else {
        document.getElementById('current-round-details').textContent = 'Preparing';
    }
    
    // Update next round
    if (nextRound <= gameState.maxRounds) {
        document.getElementById('next-round').textContent = nextRound;
        const nextRoundDef = gameState.roundDefinitions[nextRound - 1];
        document.getElementById('next-round-details').textContent = nextRoundDef.type.charAt(0).toUpperCase() + nextRoundDef.type.slice(1);
    } else {
        document.getElementById('next-round').textContent = '-';
        document.getElementById('next-round-details').textContent = 'N/A';
    }
    
    // Update future round
    if (futureRound <= gameState.maxRounds) {
        document.getElementById('future-round').textContent = futureRound;
        const futureRoundDef = gameState.roundDefinitions[futureRound - 1];
        document.getElementById('future-round-details').textContent = futureRoundDef.type.charAt(0).toUpperCase() + futureRoundDef.type.slice(1);
    } else {
        document.getElementById('future-round').textContent = '-';
        document.getElementById('future-round-details').textContent = 'N/A';
    }
    
    // Reset all active classes
    document.querySelectorAll('.round-item').forEach(item => item.classList.remove('active'));
    
    // Only highlight current round when game has started
    if (currentRound > 0) {
        document.querySelector('.round-item.current').classList.add('active');
    }
}


// Update in the setupScene function - change the camera position to zoom out more
function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background
    
    // Create camera - positioned further back to show more of the scene
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 25, 35); // Increased Y and Z values for a higher, more distant viewpoint
    camera.lookAt(0, 0, -15);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

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
    scene.add(directionalLight);

    // Add a subtle blue-tinted fill light for the forest
    const forestLight = new THREE.HemisphereLight(0x8888ff, 0x004400, 0.5);
    scene.add(forestLight);
    
    // Create ground with raised terrain around the path
    createTerrainGround();
    
    // Create forest environment
    createForestEnvironment();
    
    // Create path
    createPath();
    
    // Create king
    createKing();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Create terrain ground function (simplified to flat ground)
function createTerrainGround() {
    // Create a simple flat ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 80, 1, 1);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4e6940,
        wireframe: false,
        flatShading: true
    });
    
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

// Create path (simplified - no visual elements)
function createPath() {
    // No visual elements needed, paths are just defined in gameState.paths
}

// Create forest environment (simplified - only mountains)
function createForestEnvironment() {
    // No background elements needed
}

// Create mountains backdrop
function createMountains() {
    // No mountains needed
}

// Create king (modified for flat terrain)
function createKing() {
    const kingGeometry = new THREE.SphereGeometry(1, 32, 32);
    const kingMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    kingMesh = new THREE.Mesh(kingGeometry, kingMaterial);
    kingMesh.position.set(0, 1, 10); // Raised Y position to 1 to lift above ground
    kingMesh.castShadow = true;
    kingMesh.receiveShadow = true;
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.3, 0.8);
    kingMesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.3, 0.8);
    kingMesh.add(rightEye);
    
    // Add crown
    const crownGeometry = new THREE.ConeGeometry(0.5, 0.5, 5);
    const crownMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.set(0, 0.8, 0);
    crown.castShadow = true;
    kingMesh.add(crown);
    
    scene.add(kingMesh);
}

// Create forest floor details (rocks, bushes)
function createForestDetails() {
    // Add some rocks
    for (let i = 0; i < 20; i++) {
        // Generate random position away from the path
        let x, z;
        do {
            x = Math.random() * 80 - 40;
            z = Math.random() * 60 - 30;
        } while (Math.abs(x) < 5 && z > -30 && z < 15); // Keep away from path and king
        
        createRock(x, z);
    }
    
    // Add some bushes
    for (let i = 0; i < 15; i++) {
        // Generate random position away from the path
        let x, z;
        do {
            x = Math.random() * 70 - 35;
            z = Math.random() * 50 - 25;
        } while (Math.abs(x) < 5 && z > -30 && z < 15); // Keep away from path and king
        
        createBush(x, z);
    }
}

// Create a rock
function createRock(x, z) {
    const scale = Math.random() * 0.5 + 0.3;
    const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
    const rockMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        flatShading: true,
        roughness: 0.8
    });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    
    // Position
    rock.position.set(x, scale * 0.5, z);
    rock.scale.set(scale, scale * 0.7, scale);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    rock.castShadow = true;
    rock.receiveShadow = true;
    
    scene.add(rock);
}

// Create a bush
function createBush(x, z) {
    const bushGroup = new THREE.Group();
    const scale = Math.random() * 0.4 + 0.3;
    
    // Create 3-5 spheres clustered together to form a bush
    const numSpheres = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < numSpheres; i++) {
        const bushGeometry = new THREE.SphereGeometry(0.7, 8, 8);
        
        // Random green color for the bush
        const color = Math.random() > 0.7 ? 0x698469 : 0x4e6940;
        
        const bushMaterial = new THREE.MeshStandardMaterial({ 
            color: color,
            flatShading: true 
        });
        
        const bushPart = new THREE.Mesh(bushGeometry, bushMaterial);
        
        // Position the sphere with slight random offsets
        bushPart.position.set(
            Math.random() * 0.5 - 0.25,
            Math.random() * 0.3,
            Math.random() * 0.5 - 0.25
        );
        
        bushPart.castShadow = true;
        bushPart.receiveShadow = true;
        bushGroup.add(bushPart);
    }
    
    // Position the entire bush
    bushGroup.position.set(x, scale * 0.5, z);
    bushGroup.scale.set(scale, scale, scale);
    
    scene.add(bushGroup);
}


// Generate tower slots along the path (modified for flat terrain)
function generateTowerSlots() {
    gameState.towerSlots = [];
    
    // Create tower slots along all paths
    const slotPositions = [
        // Left path slots
        { x: -18.5, z: -15 },  // Moved left by 3.5 units
        { x: -18.5, z: -5 },   // Moved left by 3.5 units
        { x: -10, z: 0 },
        { x: -5, z: 5 },
        
        // Center path slots (original positions)
        { x: -3.5, z: -15 },
        { x: 3.5, z: -15 },
        { x: -3.5, z: -5 },
        { x: 3.5, z: -5 },
        
        // Right path slots
        { x: 18.5, z: -15 },   // Moved right by 3.5 units
        { x: 18.5, z: -5 },    // Moved right by 3.5 units
        { x: 10, z: 0 },
        { x: 5, z: 5 }
    ];
    
    slotPositions.forEach((position, index) => {
        // Create visual representation of the slot
        const slotGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.5);
        const slotMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8b4513,
            transparent: true,
            opacity: 0.8
        });
        const slotMesh = new THREE.Mesh(slotGeometry, slotMaterial);
        slotMesh.position.set(position.x, 0.1, position.z); // Positioned on the flat ground
        slotMesh.receiveShadow = true;
        
        // Make the slot interactive
        slotMesh.userData = {
            type: 'towerSlot',
            index: index
        };
        
        scene.add(slotMesh);
        
        // Add to game state
        gameState.towerSlots.push({
            x: position.x,
            y: 0.1,  // Flat ground level plus a small offset
            z: position.z,
            mesh: slotMesh,
            size: 1.5,
            occupied: false,
            tower: null,
            index: index
        });
    });
}

// 3. Create frost tower mesh with special visual effects
function createTowerMesh(towerType, rank) {
    const towerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const towerColor = gameState.towerTypes[towerType].ranks[rank-1].color;
    
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
    }
    
    return towerMesh;
}

// 2. Create a frost impact effect when projectile hits creeps
function createFrostImpactEffect(position) {
    const impactGroup = new THREE.Group();
    
    // Central flash
    const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.7
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    impactGroup.add(flash);
    
    // Ice shards exploding outward
    const shardGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
    const shardMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCEEFF,
        transparent: true,
        opacity: 0.8
    });
    
    const numShards = 12;
    const shards = [];
    
    for (let i = 0; i < numShards; i++) {
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);
        
        // Calculate position on a sphere
        const phi = Math.acos(-1 + (2 * i) / numShards);
        const theta = Math.sqrt(numShards * Math.PI) * phi;
        
        shard.position.set(
            0.2 * Math.cos(theta) * Math.sin(phi),
            0.2 * Math.sin(theta) * Math.sin(phi),
            0.2 * Math.cos(phi)
        );
        
        // Store original position for animation
        shard.userData = {
            originalPos: shard.position.clone(),
            direction: shard.position.clone().normalize(),
            speed: Math.random() * 2 + 3
        };
        
        // Rotate to point outward
        shard.lookAt(shard.position.clone().add(shard.userData.direction));
        
        impactGroup.add(shard);
        shards.push(shard);
    }
    
    // Create ice ring effect
    const ringGeometry = new THREE.RingGeometry(0.2, 0.6, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEFA,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    impactGroup.add(ring);
    
    // Set position
    impactGroup.position.copy(position);
    
    // Add to scene
    scene.add(impactGroup);
    
    // Animate the effect
    const lifeTime = 0.6; // Effect lasts for 0.6 seconds
    let elapsed = 0;
    
    function animateImpact(delta) {
        elapsed += delta;
        
        if (elapsed >= lifeTime) {
            // Remove from scene when animation is complete
            scene.remove(impactGroup);
            return false; // Stop animation
        }
        
        // Progress from 0 to 1
        const progress = elapsed / lifeTime;
        
        // Animate central flash - expand and fade
        flash.scale.set(1 + progress * 2, 1 + progress * 2, 1 + progress * 2);
        flashMaterial.opacity = 0.7 * (1 - progress);
        
        // Animate shards - move outward and fade
        shards.forEach(shard => {
            const dir = shard.userData.direction;
            const speed = shard.userData.speed;
            const originalPos = shard.userData.originalPos;
            
            shard.position.copy(originalPos).add(
                dir.clone().multiplyScalar(progress * speed)
            );
            shard.material.opacity = 0.8 * (1 - progress);
        });
        
        // Animate ring - expand and fade
        ring.scale.set(1 + progress * 3, 1 + progress * 3, 1 + progress * 3);
        ringMaterial.opacity = 0.5 * (1 - progress);
        
        return true; // Continue animation
    }
    
    // Return the animation function so it can be added to game loop
    return animateImpact;
}

// 4. Create colorful projectiles with particle effects for frost tower
function createProjectileMesh(color) {
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
        
        // Add trailing ice particles
        const particleGeometry = new THREE.SphereGeometry(0.03, 4, 4);
        const particleMaterial = new THREE.MeshStandardMaterial({
            color: 0xCCEEFF,
            transparent: true,
            opacity: 0.7,
            emissive: 0xCCEEFF,
            emissiveIntensity: 0.2
        });
        
        // Add more particles for a better trail effect
        for (let i = 0; i < 6; i++) {
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

// Animation loop
function animate() {
    if (!gameState.gameActive) return;
    
    requestAnimationFrame(animate);
    
    // Only update if not paused
    if (!gameState.isPaused) {
        const delta = clock.getDelta();
        
        // Add a check to ensure delta is valid (not too large if game was paused)
        const safeDelta = Math.min(delta, 0.1); // Cap at 0.1 seconds to prevent huge jumps
        
        // Update game logic with safe delta
        updateTowers(safeDelta);
        updateCreeps(safeDelta);
        updateProjectiles(safeDelta);
    }
    
    // Always render the scene (even when paused)
    renderer.render(scene, camera);
}

// Create a range indicator for towers
function createRangeIndicator(position, range) {
    // Create the actual circle geometry aligned with gameplay logic
    const geometry = new THREE.RingGeometry(range - 0.2, range, 32);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const rangeIndicator = new THREE.Mesh(geometry, material);
    
    // Important: Position correctly in 3D space
    rangeIndicator.rotation.x = -Math.PI / 2; // Rotate to horizontal
    rangeIndicator.position.set(position.x, 0.1, position.z); // Position just above ground
    
    return rangeIndicator;
}

// Spawn a new creep (modified for sunken path)
function spawnCreep() {
    try {
        // Get the current round definition
        const roundIndex = gameState.currentRound - 1;
        const roundDef = gameState.roundDefinitions[roundIndex];
        
        // Use the type directly from the round definition
        let creepType = roundDef.type;
        
        // Randomly select a path for this creep
        const pathIndex = Math.floor(Math.random() * gameState.paths.length);
        const path = gameState.paths[pathIndex];
        const spawnPoint = path.spawnPoint;
        
        // Create 3D mesh with the appropriate type
        const creepMesh = createCreepMesh(creepType);
        creepMesh.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        scene.add(creepMesh);
        
        // Set type-specific properties
        let health, damage, speed;
        
        // Base values scaled by round difficulty
        const difficultyMultiplier = Math.pow(1.15, gameState.currentRound - 1);
        const roundDifficulty = roundDef.difficultly;
        
        switch(creepType) {
            case 'fast':
                health = 20 * difficultyMultiplier;
                damage = 2;
                speed = 3; // Faster movement
                break;
            case 'armored':
                health = 45 * difficultyMultiplier;
                damage = 2;
                speed = 1.5; // Slower but more health
                break;
            case 'swarm':
                health = 15 * difficultyMultiplier;
                damage = 1; // Less damage individually
                speed = 2.2;
                break;
            default:
                // Fallback (shouldn't occur with the new system)
                health = 30 * difficultyMultiplier;
                damage = 2;
                speed = 2;
                break;
        }
        
        // Add to game state
        const creep = {
            mesh: creepMesh,
            position: { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z },
            progress: 0,
            health: health,
            maxHealth: health,
            baseSpeed: speed,
            speed: speed,
            slowEffects: [],
            reachedKing: false,
            damageToKing: damage,
            creepType: creepType,
            pathIndex: pathIndex, // Store which path this creep is following
            waypointIndex: 0      // Track current waypoint target
        };
        
        // Create health bar and attach it to the monster
        const healthBarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        creep.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        creep.healthBar.position.set(0, 1.2, 0);
        creepMesh.add(creep.healthBar);
        
        gameState.creeps.push(creep);
    } catch (error) {
        console.log("Error spawning creep:", error);
    }
}

// Function to spawn a creep on a specific path
function spawnCreepOnPath(pathIndex) {
    try {
        // Get the current round definition
        const roundIndex = gameState.currentRound - 1;
        const roundDef = gameState.roundDefinitions[roundIndex];
        
        // Use the type directly from the round definition
        let creepType = roundDef.type;
        
        // Get the specified path
        const path = gameState.paths[pathIndex];
        const spawnPoint = path.spawnPoint;
        
        // Create 3D mesh with the appropriate type
        const creepMesh = createCreepMesh(creepType);
        creepMesh.position.set(spawnPoint.x, 1, spawnPoint.z); // Raised Y position to 1
        scene.add(creepMesh);
        
        // Set type-specific properties
        let health, damage, speed;
        
        // Base values scaled by round difficulty
        const difficultyMultiplier = Math.pow(1.15, gameState.currentRound - 1);
        const roundDifficulty = roundDef.difficultly;
        
        switch(creepType) {
            case 'fast':
                health = 20 * difficultyMultiplier;
                damage = 2;
                speed = 3; // Faster movement
                break;
            case 'armored':
                health = 45 * difficultyMultiplier;
                damage = 2;
                speed = 1.5; // Slower but more health
                break;
            case 'swarm':
                health = 15 * difficultyMultiplier;
                damage = 1; // Less damage individually
                speed = 2.2;
                break;
            default:
                health = 30 * difficultyMultiplier;
                damage = 2;
                speed = 2;
                break;
        }
        
        // Add to game state
        const creep = {
            mesh: creepMesh,
            position: { x: spawnPoint.x, y: 1, z: spawnPoint.z }, // Raised Y position to 1
            progress: 0,
            health: health,
            maxHealth: health,
            baseSpeed: speed,
            speed: speed,
            slowEffects: [],
            reachedKing: false,
            damageToKing: damage,
            creepType: creepType,
            pathIndex: pathIndex, // Store which path this creep is following
            waypointIndex: 0      // Track current waypoint target
        };
        
        // Create health bar and attach it to the monster
        const healthBarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        creep.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        creep.healthBar.position.set(0, 1.2, 0);
        creepMesh.add(creep.healthBar);
        
        gameState.creeps.push(creep);
    } catch (error) {
        console.log("Error spawning creep on path:", pathIndex, error);
    }
}

// Update creep's slow effects (reduce durations, remove expired effects)
function updateCreepSlowEffects(creep, delta) {
    let needsUpdate = false;
    
    // Update remaining time on all slow effects
    for (let i = creep.slowEffects.length - 1; i >= 0; i--) {
        const effect = creep.slowEffects[i];
        effect.remainingTime -= delta;
        
        // Remove expired effects
        if (effect.remainingTime <= 0) {
            creep.slowEffects.splice(i, 1);
            needsUpdate = true;
        }
    }
    
    // Update creep speed if any effects were removed
    if (needsUpdate) {
        updateCreepSpeed(creep);
    }
}


// Add visual effect to show slowed creeps
function addSlowVisualEffect(creep) {
    // Check if creep already has a slow effect visual
    if (creep.slowEffectVisual) {
        return; // Already has a visual effect
    }
    
    // Create a blue particle system around the creep
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEFA,
        transparent: true,
        opacity: 0.7,
        emissive: 0x87CEFA,
        emissiveIntensity: 0.5
    });
    
    // Create a group for particles
    const particleGroup = new THREE.Group();
    
    // Add some particles around the creep
    for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position around the creep
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 0.2;
        particle.position.set(
            Math.cos(angle) * radius,
            0.5 + Math.random() * 0.5,
            Math.sin(angle) * radius
        );
        
        // Add animation data
        particle.userData = {
            originalY: particle.position.y,
            speed: Math.random() * 0.5 + 0.5,
            angle: angle,
            radius: radius
        };
        
        particleGroup.add(particle);
    }
    
    // Add ice crystals forming on the creep
    const crystalGeometry = new THREE.ConeGeometry(0.03, 0.15, 4);
    const crystalMaterial = new THREE.MeshBasicMaterial({
        color: 0xCCEEFF,
        transparent: true,
        opacity: 0.8,
        emissive: 0xCCEEFF,
        emissiveIntensity: 0.3
    });
    
    // Add several small ice crystals on the creep's body
    for (let i = 0; i < 5; i++) {
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        
        // Position crystals on the body surface
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * 0.8 - 0.2;
        const radius = 0.25;
        
        crystal.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        // Rotate to point outward
        crystal.lookAt(
            crystal.position.x * 2,
            crystal.position.y,
            crystal.position.z * 2
        );
        
        // Add animation data
        crystal.userData = {
            growthStage: 0,
            growthRate: Math.random() * 0.5 + 0.5,
            maxSize: Math.random() * 0.5 + 0.8
        };
        
        particleGroup.add(crystal);
    }
    
    // Add a frost aura effect
    const auraGeometry = new THREE.RingGeometry(0.4, 0.5, 16);
    const auraMaterial = new THREE.MeshBasicMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    
    const frostAura = new THREE.Mesh(auraGeometry, auraMaterial);
    frostAura.rotation.x = Math.PI / 2; // Make it horizontal
    frostAura.position.y = 0.05; // Just above the ground
    
    // Add animation data
    frostAura.userData = {
        pulseTime: 0
    };
    
    particleGroup.add(frostAura);
    
    creep.mesh.add(particleGroup);
    creep.slowEffectVisual = particleGroup;
    
    // Add animating function to the creep's update cycle
    const originalUpdateFunction = creep.update || function() {};
    creep.update = function(delta) {
        // Call original update if it exists
        originalUpdateFunction.call(this, delta);
        
        // Animate particles
        if (this.slowEffectVisual) {
            // Particle movement
            this.slowEffectVisual.children.forEach(particle => {
                if (particle.geometry.type === 'SphereGeometry') {
                    // Orbit and bob up and down for sphere particles
                    if (particle.userData) {
                        particle.userData.angle += particle.userData.speed * delta;
                        particle.position.x = Math.cos(particle.userData.angle) * particle.userData.radius;
                        particle.position.z = Math.sin(particle.userData.angle) * particle.userData.radius;
                        particle.position.y = particle.userData.originalY + Math.sin(particle.userData.angle * 2) * 0.1;
                    }
                } else if (particle.geometry.type === 'ConeGeometry') {
                    // Animate ice crystal growth
                    if (particle.userData) {
                        if (particle.userData.growthStage < 1) {
                            particle.userData.growthStage += delta * particle.userData.growthRate;
                            const currentSize = Math.min(1, particle.userData.growthStage) * particle.userData.maxSize;
                            particle.scale.set(currentSize, currentSize, currentSize);
                        }
                    }
                } else if (particle.geometry.type === 'RingGeometry') {
                    // Pulse the aura
                    if (particle.userData) {
                        particle.userData.pulseTime += delta * 2;
                        const pulseSize = 1 + Math.sin(particle.userData.pulseTime) * 0.2;
                        particle.scale.set(pulseSize, pulseSize, 1);
                        
                        // Also make it rotate slowly
                        particle.rotation.z += delta * 0.5;
                    }
                }
            });
            
            // Check if we still have slow effects
            if (this.slowEffects.length === 0 && this.slowEffectVisual) {
                // Remove the visual effect if no longer slowed
                this.mesh.remove(this.slowEffectVisual);
                this.slowEffectVisual = null;
            }
        }
    };
}

// Update creep's speed based on current slow effects
function updateCreepSpeed(creep) {
    // Reset to base speed
    creep.speed = creep.baseSpeed;
    
    // Find the strongest slow effect
    let strongestSlowAmount = 0;
    
    for (const effect of creep.slowEffects) {
        if (effect.amount > strongestSlowAmount) {
            strongestSlowAmount = effect.amount;
        }
    }
    
    // Apply the slow effect
    if (strongestSlowAmount > 0) {
        creep.speed = creep.baseSpeed * (1 - strongestSlowAmount);
    }
    
    // Remove visual effect if no longer slowed
    if (strongestSlowAmount === 0 && creep.slowEffectVisual) {
        creep.mesh.remove(creep.slowEffectVisual);
        creep.slowEffectVisual = null;
    }
}

// Update creeps
function updateCreeps(delta) {
    const creepsToRemove = [];
    
    gameState.creeps.forEach((creep, index) => {
        if (creep.reachedKing) {
            // Apply damage based on creep type
            gameState.kingHealth -= creep.damageToKing;
            updateKingHealth();
            
            if (gameState.kingHealth <= 0) {
                gameState.gameActive = false;
                showGameOverScreen(false);
            }
            
            creepsToRemove.push(creep);
            return;
        }
        
        // Get current path and waypoints
        const path = gameState.paths[creep.pathIndex];
        const waypoints = path.waypoints;
        
        // Current and next waypoint
        const currentWaypoint = waypoints[creep.waypointIndex];
        const nextWaypoint = waypoints[creep.waypointIndex + 1];
        
        // If reached final waypoint, mark as reached king
        if (!nextWaypoint) {
            creep.reachedKing = true;
            
            // Apply damage based on creep type
            gameState.kingHealth -= creep.damageToKing;
            updateKingHealth();
            
            if (gameState.kingHealth <= 0) {
                gameState.gameActive = false;
                showGameOverScreen(false);
            }
            
            creepsToRemove.push(creep);
            return;
        }
        
        // Calculate direction to next waypoint
        const dx = nextWaypoint.x - currentWaypoint.x;
        const dz = nextWaypoint.z - currentWaypoint.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Update position based on speed and delta time
        creep.progress += (creep.speed * delta) / distance;
        
        // If reached next waypoint, advance to next segment
        if (creep.progress >= 1) {
            creep.waypointIndex++;
            creep.progress = 0;
            
            // If no more waypoints, mark as reached king
            if (creep.waypointIndex >= waypoints.length - 1) {
                creep.reachedKing = true;
                
                // Apply damage based on creep type
                gameState.kingHealth -= creep.damageToKing;
                updateKingHealth();
                
                if (gameState.kingHealth <= 0) {
                    gameState.gameActive = false;
                    showGameOverScreen(false);
                }
                
                creepsToRemove.push(creep);
                return;
            }
        } else {
            // Calculate interpolated position between waypoints
            const newX = currentWaypoint.x + dx * creep.progress;
            const newZ = currentWaypoint.z + dz * creep.progress;
            
            // Update position while maintaining height
            creep.position.x = newX;
            creep.position.y = 1; // Maintain raised height
            creep.position.z = newZ;
            creep.mesh.position.set(newX, 1, newZ); // Maintain raised height
            
            // Update mesh rotation to face movement direction
            const angle = Math.atan2(dz, dx);
            creep.mesh.rotation.y = angle;
        }
        
        // Apply bobbing animation while maintaining base height
        creep.mesh.position.y = 1 + Math.sin(clock.elapsedTime * 5) * 0.1;
        
        // Special animation for swarm type - rotate particles
        if (creep.creepType === 'swarm') {
            creep.mesh.children.forEach(child => {
                // Only animate the particle spheres (not arms, legs, etc.)
                if (child.geometry && child.geometry.type === 'SphereGeometry' && 
                    child.geometry.parameters.radius === 0.05) {
                    child.position.x = Math.cos(clock.elapsedTime * 2 + child.position.y * 10) * 0.3;
                    child.position.z = Math.sin(clock.elapsedTime * 2 + child.position.y * 10) * 0.3;
                }
            });
        }
        
        // Simple animation if userData exists
        try {
            if (creep.mesh.userData) {
                // Existing animation code...
                creep.mesh.userData.walkTime += delta;
                const walkTime = creep.mesh.userData.walkTime;
                
                // Animate arms
                if (creep.mesh.userData.armSwing) {
                    if (creep.mesh.userData.armSwing.left) {
                        creep.mesh.userData.armSwing.left.rotation.x = Math.sin(walkTime * 5) * 0.4;
                    }
                    if (creep.mesh.userData.armSwing.right) {
                        creep.mesh.userData.armSwing.right.rotation.x = -Math.sin(walkTime * 5) * 0.4;
                    }
                }
                
                // Animate legs
                if (creep.mesh.userData.legSwing) {
                    if (creep.mesh.userData.legSwing.left) {
                        creep.mesh.userData.legSwing.left.rotation.x = Math.sin(walkTime * 5) * 0.4;
                    }
                    if (creep.mesh.userData.legSwing.right) {
                        creep.mesh.userData.legSwing.right.rotation.x = -Math.sin(walkTime * 5) * 0.4;
                    }
                }
            }
        } catch (animError) {
            // Silent error handling for animations
        }
        
        // Update health bar
        if (creep.healthBar) {
            const healthPercent = creep.health / creep.maxHealth;
            creep.healthBar.scale.x = Math.max(0.1, healthPercent);
            
            if (healthPercent > 0.5) {
                creep.healthBar.material.color.setHex(0x00ff00);
            } else if (healthPercent > 0.25) {
                creep.healthBar.material.color.setHex(0xffff00);
            } else {
                creep.healthBar.material.color.setHex(0xff0000);
            }
        }
        
        if (creep.health <= 0) {
            creepsToRemove.push(creep);
            
            // Gold reward based on creep type
            let goldReward = 1;
            if (creep.creepType === 'armored') goldReward = 2;
            if (creep.creepType === 'fast') goldReward = 1;
            if (creep.creepType === 'swarm') goldReward = 1;
            
            gameState.gold += goldReward;
            gameState.creepsKilled++;
            updateGold();
        }
        
        // Update slow effects
        updateCreepSlowEffects(creep, delta);
        
        // Call custom update function if it exists
        if (typeof creep.update === 'function') {
            creep.update(delta);
        }
    });
    
    creepsToRemove.forEach(creep => {
        const index = gameState.creeps.indexOf(creep);
        if (index !== -1) {
            scene.remove(creep.mesh);
            gameState.creeps.splice(index, 1);
        }
    });
    
    if (gameState.roundActive && gameState.creeps.length === 0) {
        endRound();
    }
}
// Clean up all game objects and restart the game
function cleanupAndRestartGame() {
    console.log("Performing complete game cleanup and restart");
    
    // Stop all ongoing animations/updates
    gameState.gameActive = false;
    gameState.isPaused = true;
    
    // Clear any existing timer interval
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Clear all range indicators
    clearAllRangeIndicators();
    
    // Explicitly remove all meshes
    console.log("Removing all game objects from scene");
    
    // Remove all creeps
    gameState.creeps.forEach(creep => {
        if (creep.mesh && scene.children.includes(creep.mesh)) {
            scene.remove(creep.mesh);
        }
    });
    
    // Remove all towers
    gameState.towers.forEach(tower => {
        if (tower.mesh && scene.children.includes(tower.mesh)) {
            scene.remove(tower.mesh);
        }
        
        if (tower.rangeIndicator && scene.children.includes(tower.rangeIndicator)) {
            scene.remove(tower.rangeIndicator);
        }
    });
    
    // Remove all projectiles
    gameState.projectiles.forEach(projectile => {
        if (projectile.mesh && scene.children.includes(projectile.mesh)) {
            scene.remove(projectile.mesh);
        }
    });
    
    // Remove all tower slots
    gameState.towerSlots.forEach(slot => {
        if (slot.mesh && scene.children.includes(slot.mesh)) {
            scene.remove(slot.mesh);
        }
    });
    
    // Clear all arrays
    gameState.creeps = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.towerSlots = [];
    
    // Reset range indicator references
    gameState.selectedTower = null;
    gameState.towerSlotRangeIndicator = null;
    
    // Remove all other scene objects
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    // Dispose of the renderer to free memory
    if (renderer) {
        renderer.dispose();
    }
    
    // Clear the canvas container
    const canvasContainer = document.getElementById('canvas-container');
    while (canvasContainer.firstChild) {
        canvasContainer.removeChild(canvasContainer.firstChild);
    }
    
    // Hide any open menus
    document.getElementById('tower-selection').classList.add('hidden');
    document.getElementById('tower-actions').classList.add('hidden');
    document.getElementById('esc-menu').classList.add('hidden');
    
    console.log("Cleanup complete, restarting game");
    
    // Create a new clock to fix the animation timing issues
    clock = new THREE.Clock();
    
    // Start a completely new game
    initGame();
}

    
    // Resume button
    document.getElementById('resume-game').addEventListener('click', resumeGame);
    
// Restart from pause menu
    document.getElementById('restart-from-pause').addEventListener('click', () => {
        document.getElementById('esc-menu').classList.add('hidden');
        cleanupAndRestartGame();
    });

// Toggle ESC menu
function toggleEscMenu() {
    console.log("Toggling ESC menu");
    const escMenu = document.getElementById('esc-menu');
    
    if (escMenu.classList.contains('hidden')) {
        // Show menu and pause game
        pauseGame();
        escMenu.classList.remove('hidden');
    } else {
        // Hide menu and resume game
        resumeGame();
    }
}

function pauseGame() {
    console.log("Game paused");
    gameState.isPaused = true;
    
    // Stop the timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
}

// And resumeGame function:
function resumeGame() {
    console.log("Game resumed");
    const escMenu = document.getElementById('esc-menu');
    escMenu.classList.add('hidden');
    
    gameState.isPaused = false;
    gameState.gameActive = true;
    
    // Restart timer if needed
    if (!gameState.roundActive && gameState.interRoundTimer > 0) {
        startInterRoundTimer();
    }
}

// Complete buildTower function implementation
function buildTower(towerType) {
    console.log("buildTower called with type:", towerType);
    
    // Check if slot is selected
    if (!gameState.selectedTowerSlot) {
        console.log("No tower slot selected");
        return;
    }
    
    // Remove range indicator if present - make sure it's completely removed
    if (gameState.towerSlotRangeIndicator) {
        scene.remove(gameState.towerSlotRangeIndicator);
        gameState.towerSlotRangeIndicator = null;
    }
    
    // Get tower data - debugging output
    console.log("Tower types:", gameState.towerTypes);
    
    // Define tower types if missing
    if (!gameState.towerTypes) {
        console.log("Tower types not defined, creating defaults");
        gameState.towerTypes = {
            basic: {
                name: "Basic Tower",
                ranks: [
                    { cost: 3, damage: 25, attackSpeed: 2, color: 0xaaaaaa },
                    { cost: 5, damage: 40, attackSpeed: 1.5, color: 0xdddddd }
                ]
            },
            frost: {
                name: "Frost Tower",
                ranks: [
                    { cost: 5, damage: 15, attackSpeed: 1.5, slowEffect: 0.3, color: 0x6495ED },
                    { cost: 8, damage: 25, attackSpeed: 1.2, slowEffect: 0.5, color: 0x1E90FF }
                ]
            }
        };
    }
    
    const towerData = gameState.towerTypes[towerType];
    
    if (!towerData) {
        console.error("Tower type not found:", towerType);
        return;
    }
    
    const towerRank = towerData.ranks[0];
    
    // Check if we have enough gold
    if (gameState.gold < towerRank.cost) {
        console.log("Not enough gold");
        return;
    }
    
    // Get slot
    const slot = gameState.selectedTowerSlot;
    console.log("Building tower at slot:", slot);
    
    // Create tower mesh
    const towerMesh = createTowerMesh(towerType, 1);
    towerMesh.position.set(slot.x, slot.y + 1, slot.z); // Position at slot
    scene.add(towerMesh);
    
    // Create tower object with properties based on tower type
    const tower = {
        mesh: towerMesh,
        type: towerType,
        rank: 1,
        damage: towerRank.damage,
        attackSpeed: towerRank.attackSpeed,
        attackCooldown: 0,
        range: 8,
        position: { x: slot.x, y: slot.y + 1, z: slot.z },
        slotIndex: slot.index,
        totalCost: towerRank.cost,
        targetCreep: null
    };
    
    // Add special properties for specific tower types
    if (towerType === 'frost') {
        tower.slowEffect = towerRank.slowEffect;
    }
    
    // Add tower to game
    gameState.towers.push(tower);
    
    // Mark slot as occupied
    slot.occupied = true;
    slot.tower = tower;
    
    // Deduct gold
    gameState.gold -= towerRank.cost;
    
    // Update stats
    gameState.towerCount++;
    gameState.towersBuilt++;
    
    // Update UI
    updateGold();
    updateTowerCount();
    
    // Hide tower selection
    document.getElementById('tower-selection').classList.add('hidden');
    gameState.selectedTowerSlot = null;
    
    console.log("Tower built successfully:", tower);
}

// Update towers
function updateTowers(delta) {
    gameState.towers.forEach(tower => {
        // Decrease attack cooldown
        if (tower.attackCooldown > 0) {
            tower.attackCooldown -= delta;
        }
        
        // Find targets if needed
        if (!tower.targetCreep || tower.targetCreep.length === 0 || 
            tower.targetCreep.some(target => target.health <= 0 || target.reachedKing) || 
            tower.targetCreep.some(target => getDistance3D(tower.position, target.position) > tower.range)) {
            tower.targetCreep = findTarget(tower);
        }
        
        // Face the turret towards the first target
        if (tower.targetCreep && tower.targetCreep.length > 0) {
            const turret = tower.mesh.children[0];
            const targetPos = tower.targetCreep[0].position;
            
            // Calculate direction to target
            const dx = targetPos.x - tower.position.x;
            const dz = targetPos.z - tower.position.z;
            const angle = Math.atan2(dz, dx);
            
            // Rotate the tower base
            tower.mesh.rotation.y = angle + Math.PI / 2;
        }
        
        // Attack if ready and has targets
        if (tower.attackCooldown <= 0 && tower.targetCreep && tower.targetCreep.length > 0) {
            console.log("Tower firing:", tower.type, "Targets:", tower.targetCreep.length); // Debug log
            
            // For basic towers, always fire at least one projectile
            if (tower.type === 'basic') {
                // Fire at first target
                fireProjectile(tower, tower.targetCreep[0]);
                
                // If there's a second target, fire at it too
                if (tower.targetCreep.length > 1) {
                    console.log("Firing second projectile"); // Debug log
                    fireProjectile(tower, tower.targetCreep[1]);
                }
            } else {
                // For other towers, fire at single target
                fireProjectile(tower, tower.targetCreep[0]);
            }
            
            // Reset cooldown
            tower.attackCooldown = tower.attackSpeed;
        }
    });
}

// 5. Fire projectile with proper color and slowEffect for frost towers
function fireProjectile(tower, target) {
    // Determine projectile color based on tower type and rank
    let projectileColor;
    
    if (tower.type === 'frost') {
        // Frost tower has blue projectiles
        projectileColor = tower.rank === 1 ? 0x6495ED : 0x1E90FF;
    } else {
        // Basic tower has gray projectiles
        projectileColor = tower.rank === 1 ? 0xaaaaaa : 0xdddddd;
    }
    
    // Create projectile mesh
    const projectileMesh = createProjectileMesh(projectileColor);
    
    // Offset the projectile position slightly for multiple targets
    const offset = Math.random() * 0.2 - 0.1; // Random offset between -0.1 and 0.1
    projectileMesh.position.copy(tower.position);
    projectileMesh.position.y += 0.5; // Start at turret height
    projectileMesh.position.x += offset; // Add random offset
    projectileMesh.position.z += offset; // Add random offset
    
    scene.add(projectileMesh);
    
    // Create projectile object
    const projectile = {
        mesh: projectileMesh,
        position: { 
            x: projectileMesh.position.x,
            y: projectileMesh.position.y,
            z: projectileMesh.position.z
        },
        target: target,
        speed: 15, // Units per second
        damage: tower.damage,
        type: tower.type,
        towerRank: tower.rank,
        slowEffect: tower.type === 'frost' ? tower.slowEffect : 0, // Add slowing effect for frost towers
        reached: false
    };
    
    gameState.projectiles.push(projectile);
}

// 6. Update projectiles to apply slow effect on hit
function updateProjectiles(delta) {
    const projectilesToRemove = [];
    
    // Animate existing projectiles (especially frost ones)
    gameState.projectiles.forEach(projectile => {
        // Rotate and animate frost projectiles
        if (projectile.type === 'frost' && projectile.mesh.userData) {
            // Rotate the projectile group
            projectile.mesh.rotation.z += projectile.mesh.userData.rotationSpeed;
            
            // Pulse effect
            projectile.mesh.userData.pulseTime += delta * 5;
            const pulse = Math.sin(projectile.mesh.userData.pulseTime) * 0.2 + 1;
            
            // Apply pulse to core (second child in the group)
            if (projectile.mesh.children.length > 1) {
                projectile.mesh.children[1].scale.set(pulse, pulse, pulse);
            }
        }
        
        if (projectile.reached || !projectile.target) {
            projectilesToRemove.push(projectile);
            return;
        }
        
        // Calculate direction to target
        const targetPos = projectile.target.position;
        const dx = targetPos.x - projectile.position.x;
        const dy = targetPos.y - projectile.position.y;
        const dz = targetPos.z - projectile.position.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Mark as reached if close enough
        if (distance < 0.5) {
            // Deal damage
            projectile.target.health -= projectile.damage;
            gameState.totalDamage += projectile.damage;
            updateTotalDamage();
            
            // Create impact effect for frost towers
            if (projectile.type === 'frost' && projectile.slowEffect > 0) {
                // Apply slowing effect
                applySlowEffect(projectile.target, projectile.slowEffect, projectile.towerRank);
                
                // Create and add frost impact animation
                const impactAnimation = createFrostImpactEffect(projectile.target.position);
                
                // Add to animation system
                if (!gameState.activeAnimations) {
                    gameState.activeAnimations = [];
                }
                gameState.activeAnimations.push(impactAnimation);
            }
            
            // Mark for removal
            projectile.reached = true;
            projectilesToRemove.push(projectile);
            return;
        }
        
        // Move towards target
        const moveX = (dx / distance) * projectile.speed * delta;
        const moveY = (dy / distance) * projectile.speed * delta;
        const moveZ = (dz / distance) * projectile.speed * delta;
        
        projectile.position.x += moveX;
        projectile.position.y += moveY;
        projectile.position.z += moveZ;
        
        // Update mesh position
        projectile.mesh.position.set(
            projectile.position.x,
            projectile.position.y,
            projectile.position.z
        );
        
        // Make frost projectiles face the direction of travel
        if (projectile.type === 'frost') {
            projectile.mesh.lookAt(
                projectile.position.x + dx,
                projectile.position.y + dy,
                projectile.position.z + dz
            );
        }
    });
    
    // Remove projectiles
    projectilesToRemove.forEach(projectile => {
        const index = gameState.projectiles.indexOf(projectile);
        if (index !== -1) {
            scene.remove(projectile.mesh);
            gameState.projectiles.splice(index, 1);
        }
    });
    
    // Update any active animations
    if (gameState.activeAnimations) {
        for (let i = gameState.activeAnimations.length - 1; i >= 0; i--) {
            const animationFunc = gameState.activeAnimations[i];
            const continueAnimation = animationFunc(delta);
            
            if (!continueAnimation) {
                gameState.activeAnimations.splice(i, 1);
            }
        }
    }
}


// Find target for tower
function findTarget(tower) {
    // Sort creeps by progress (prioritize creeps further along the path)
    const sortedCreeps = [...gameState.creeps]
        .filter(creep => !creep.reachedKing && creep.health > 0)
        .sort((a, b) => b.progress - a.progress);
    
    // For basic towers, find up to 2 targets
    if (tower.type === 'basic') {
        const targets = [];
        for (let i = 0; i < sortedCreeps.length && targets.length < 2; i++) {
            const creep = sortedCreeps[i];
            const distance = getDistance3D(tower.position, creep.position);
            
            if (distance <= tower.range) {
                targets.push(creep);
            }
        }
        console.log("Basic tower found targets:", targets.length); // Debug log
        return targets;
    }
    
    // For other towers, find single target
    for (let i = 0; i < sortedCreeps.length; i++) {
        const creep = sortedCreeps[i];
        const distance = getDistance3D(tower.position, creep.position);
        
        if (distance <= tower.range) {
            return [creep]; // Return as array for consistency
        }
    }
    
    return [];
}

// Calculate 3D distance between two points
function getDistance3D(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function startRound() {
    // Don't start if game is over
    if (!gameState.gameActive) return;
    
    // Don't start if there are still creeps from previous round
    if (gameState.creeps.length > 0) {
        console.log("Cannot start new round - creeps still active");
        // Try again after a delay
        setTimeout(startRound, 1000);
        return;
    }
    
    gameState.currentRound++;
    if (gameState.currentRound > gameState.maxRounds) {
        gameState.gameActive = false;
        showGameOverScreen(true);
        return;
    }
    
    // Update UI
    updateRoundCounter();
    updateRoundTracker();
    
    // Reset and hide round timer during active round
    document.getElementById('round-timer').textContent = 'Round in progress';
    
    // Calculate creep stats for this round
    const baseCreepCount = 8;
    const creepCountIncrease = 1.1; // 10% increase per round
    
    const creepCount = Math.floor(baseCreepCount * Math.pow(creepCountIncrease, gameState.currentRound - 1));
    
    // Spawn creeps
    gameState.roundActive = true;
    
    // Determine distribution of creeps across paths
    // This will vary based on round type
    let pathDistribution;
    const roundDef = gameState.roundDefinitions[gameState.currentRound - 1];
    
    switch(roundDef.type) {
        case 'swarm':
            // Swarm creeps come mainly from one random path
            const mainPath = Math.floor(Math.random() * 3);
            pathDistribution = [0.1, 0.1, 0.1];
            pathDistribution[mainPath] = 0.8;
            break;
        case 'armored':
            // Armored creeps are evenly distributed but fewer in number
            pathDistribution = [0.33, 0.34, 0.33];
            break;
        case 'fast':
            // Fast creeps come from all paths but slightly more from sides
            pathDistribution = [0.4, 0.2, 0.4];
            break;
        default:
            // Default even distribution
            pathDistribution = [0.33, 0.34, 0.33];
    }
    
    // Calculate creeps per path
    const creepsPerPath = [
        Math.floor(creepCount * pathDistribution[0]),
        Math.floor(creepCount * pathDistribution[1]),
        Math.floor(creepCount * pathDistribution[2])
    ];
    
    // Add any remainder to the first path
    const totalAllocated = creepsPerPath.reduce((sum, current) => sum + current, 0);
    creepsPerPath[0] += creepCount - totalAllocated;
    
    // Spawn creeps with a delay for each path
    for (let pathIdx = 0; pathIdx < gameState.paths.length; pathIdx++) {
        for (let i = 0; i < creepsPerPath[pathIdx]; i++) {
            setTimeout(() => {
                // Set the spawn point for this creep
                const specificPathIndex = pathIdx;
                spawnCreepOnPath(specificPathIndex);
            }, (pathIdx * 300) + (i * 800)); // Stagger spawn timing between paths
        }
    }
}



// End round function
function endRound() {
    // Don't end round if there are still creeps
    if (gameState.creeps.length > 0) {
        console.log("Cannot end round - creeps still active");
        // Try again after a delay
        setTimeout(endRound, 1000);
        return;
    }
    
    gameState.roundActive = false;
    startInterRoundTimer();
    
    // Bonus gold at end of round
    gameState.gold += 3;
    updateGold();
    
    // Update round tracker
    updateRoundTracker();
}

// Start timer between rounds
function startInterRoundTimer() {
    // Check if there are still creeps from the previous round
    if (gameState.creeps.length > 0) {
        console.log("Cannot start timer - creeps still active");
        // Try again after a delay
        setTimeout(startInterRoundTimer, 1000);
        return;
    }
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    gameState.interRoundTimer = 10;
    updateRoundTimer();
    
    gameState.timerInterval = setInterval(() => {
        gameState.interRoundTimer--;
        updateRoundTimer();
        
        if (gameState.interRoundTimer <= 0) {
            clearInterval(gameState.timerInterval);
            startRound();
        }
    }, 1000);
}


// 9. Tower selection display function to show frost tower's slow effect
function selectTower(tower) {
    // If there was a previously selected tower, remove its range indicator
    if (gameState.selectedTower && gameState.selectedTower.rangeIndicator) {
        scene.remove(gameState.selectedTower.rangeIndicator);
        gameState.selectedTower.rangeIndicator = null;
    }
    
    // Also remove any slot range indicator if it exists
    if (gameState.towerSlotRangeIndicator) {
        scene.remove(gameState.towerSlotRangeIndicator);
        gameState.towerSlotRangeIndicator = null;
    }
    
    gameState.selectedTower = tower;
    
    // Create and add range indicator
    tower.rangeIndicator = createRangeIndicator(tower.position, tower.range);
    scene.add(tower.rangeIndicator);
    
    // Hide tower selection menu
    document.getElementById('tower-selection').classList.add('hidden');
    
    // Show tower actions menu
    const towerActions = document.getElementById('tower-actions');
    towerActions.classList.remove('hidden');
    
    // Update tower details
    const towerType = gameState.towerTypes[tower.type];
    
    document.getElementById('tower-details-icon').style.backgroundColor = '#' + tower.mesh.material.color.getHexString();
    document.getElementById('tower-details-name').textContent = `${towerType.name}`;
    document.getElementById('tower-details-damage').textContent = `Damage: ${tower.damage}`;
    document.getElementById('tower-details-speed').textContent = `Attack Speed: ${tower.attackSpeed}s`;
    document.getElementById('tower-details-rank').textContent = `Rank: ${tower.rank}`;
    
    // Display special stats for specific tower types
    const towerInfoDiv = document.getElementById('tower-details-info');
    
    // Remove any existing special stat if it exists
    const existingSpecialStat = document.getElementById('tower-details-special');
    if (existingSpecialStat) {
        towerInfoDiv.removeChild(existingSpecialStat);
    }
    
    // Add special stat for frost tower
    if (tower.type === 'frost') {
        const specialStat = document.createElement('div');
        specialStat.id = 'tower-details-special';
        specialStat.textContent = `Slow Effect: ${tower.slowEffect * 100}%`;
        specialStat.style.color = '#add8e6'; // Light blue for frost effect
        towerInfoDiv.appendChild(specialStat);
    }
    
    // Update upgrade button
    const upgradeButton = document.getElementById('upgrade-tower');
    if (tower.rank < 2) {
        const upgradeCost = towerType.ranks[tower.rank].cost;
        upgradeButton.textContent = `Upgrade (${upgradeCost} Gold)`;
        
        if (gameState.gold < upgradeCost) {
            upgradeButton.disabled = true;
            upgradeButton.style.opacity = '0.5';
        } else {
            upgradeButton.disabled = false;
            upgradeButton.style.opacity = '1';
        }
    } else {
        upgradeButton.textContent = 'Max Rank';
        upgradeButton.disabled = true;
        upgradeButton.style.opacity = '0.5';
    }
    
    // Update sell button
    const sellAmount = Math.floor(tower.totalCost * 0.75);
    document.getElementById('sell-tower').textContent = `Sell (${sellAmount} Gold)`;
}

// 8. Upgrade tower function to handle frost tower upgrades
function upgradeTower() {
    if (!gameState.selectedTower) return;
    
    const tower = gameState.selectedTower;
    const towerType = gameState.towerTypes[tower.type];
    
    // Check tower rank
    if (tower.rank >= 2) return;
    
    // Get upgrade cost
    const upgradeCost = towerType.ranks[tower.rank].cost;
    
    // Check if we have enough gold
    if (gameState.gold < upgradeCost) return;
    
    // Upgrade tower
    tower.rank++;
    const newRankData = towerType.ranks[tower.rank - 1];
    tower.damage = newRankData.damage;
    tower.attackSpeed = newRankData.attackSpeed;
    
    // Update special properties for specific tower types
    if (tower.type === 'frost') {
        tower.slowEffect = newRankData.slowEffect;
    }
    
    // Update visual appearance
    scene.remove(tower.mesh);
    tower.mesh = createTowerMesh(tower.type, tower.rank);
    tower.mesh.position.set(tower.position.x, tower.position.y, tower.position.z);
    scene.add(tower.mesh);
    
    tower.totalCost += upgradeCost;
    
    // Deduct gold
    gameState.gold -= upgradeCost;
    
    // Update UI
    updateGold();
    
    // Update tower details
    selectTower(tower);
}

// Sell tower
function sellTower() {
    if (!gameState.selectedTower) return;
    
    const tower = gameState.selectedTower;
    
    // Remove range indicator if it exists
    if (tower.rangeIndicator) {
        scene.remove(tower.rangeIndicator);
        tower.rangeIndicator = null;
    }
    
    // Calculate sell amount (75% of total cost)
    const sellAmount = Math.floor(tower.totalCost * 0.75);
    
    // Find tower's slot
    const slot = gameState.towerSlots.find(s => s.index === tower.slotIndex);
    
    if (slot) {
        // Mark slot as unoccupied
        slot.occupied = false;
        slot.tower = null;
    }
    
    // Remove tower from scene
    scene.remove(tower.mesh);
    
    // Remove tower from game
    const towerIndex = gameState.towers.indexOf(tower);
    if (towerIndex !== -1) {
        gameState.towers.splice(towerIndex, 1);
    }
    
    // Add gold
    gameState.gold += sellAmount;
    
    // Update stats
    gameState.towerCount--;
    
    // Update UI
    updateGold();
    updateTowerCount();
    
    // Hide tower actions
    document.getElementById('tower-actions').classList.add('hidden');
    gameState.selectedTower = null;
}

function cancelTowerAction() {
    // Remove range indicator if it exists
    if (gameState.selectedTower && gameState.selectedTower.rangeIndicator) {
        scene.remove(gameState.selectedTower.rangeIndicator);
        gameState.selectedTower.rangeIndicator = null;
    }
    
    // Also remove any slot range indicator if it exists
    if (gameState.towerSlotRangeIndicator) {
        scene.remove(gameState.towerSlotRangeIndicator);
        gameState.towerSlotRangeIndicator = null;
    }
    
    document.getElementById('tower-actions').classList.add('hidden');
    gameState.selectedTower = null;
}


// Update UI functions
function updateUI() {
    updateKingHealth();
    updateGold();
    updateTowerCount();
    updateTotalDamage();
    updateRoundCounter();
    updateRoundTimer();
}

function updateKingHealth() {
    document.getElementById('king-health').textContent = Math.max(0, Math.floor(gameState.kingHealth));
}

function updateGold() {
    document.getElementById('gold').textContent = gameState.gold;
}

function updateTowerCount() {
    document.getElementById('tower-count').textContent = gameState.towerCount;
}

function updateTotalDamage() {
    document.getElementById('total-damage').textContent = Math.floor(gameState.totalDamage);
}

function updateRoundCounter() {
    document.getElementById('round-counter').textContent = `Round: ${gameState.currentRound}/${gameState.maxRounds}`;
}

function updateRoundTimer() {
    document.getElementById('round-timer').textContent = `Next round in: ${gameState.interRoundTimer}s`;
}

// Show game over screen
function showGameOverScreen(victory) {
    const gameOverElement = document.getElementById('game-over');
    const titleElement = document.getElementById('game-result-title');
    const messageElement = document.getElementById('game-result-message');
    
    if (victory) {
        titleElement.textContent = 'Victory!';
        messageElement.textContent = 'The kingdom is safe. Congratulations!';
    } else {
        titleElement.textContent = 'Game Over';
        messageElement.textContent = 'The King has fallen!';
    }
    
    document.getElementById('rounds-survived').textContent = gameState.currentRound;
    document.getElementById('final-damage').textContent = Math.floor(gameState.totalDamage);
    document.getElementById('towers-built').textContent = gameState.towersBuilt;
    
    gameOverElement.classList.remove('hidden');
}

// Setup tower selection event listeners
function setupTowerSelectionListeners() {
    // Get all tower options
    const towerOptions = document.querySelectorAll('.tower-option');
    
    towerOptions.forEach(option => {
        const towerType = option.getAttribute('data-type');
        
        // Remove any existing click listeners
        option.removeEventListener('click', handleTowerOptionClick);
        
        // Add new click listener
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log(`Tower option clicked: ${towerType}`);
            handleTowerOptionClick(e, towerType);
        });
    });
}

// Modify the setupEventListeners function to use our new method
function setupEventListeners() {
    // Canvas click event for tower placement and selection
    renderer.domElement.addEventListener('click', handleCanvasClick);
    
    // Tower selection events
    setupTowerSelectionListeners();
    
    // Tower action buttons
    document.getElementById('upgrade-tower').addEventListener('click', upgradeTower);
    document.getElementById('sell-tower').addEventListener('click', sellTower);
    document.getElementById('cancel-tower-action').addEventListener('click', cancelTowerAction);
    
    // Restart game button
    document.getElementById('restart-game').addEventListener('click', () => {
        document.getElementById('game-over').classList.add('hidden');
        cleanupAndRestartGame();
    });
    
    // Escape menu buttons
    document.getElementById('resume-game').addEventListener('click', resumeGame);
    document.getElementById('restart-from-pause').addEventListener('click', () => {
        document.getElementById('esc-menu').classList.add('hidden');
        cleanupAndRestartGame();
    });
    
    // ESC key for menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            console.log("ESC key pressed");
            toggleEscMenu();
        }
    });

    // Ensure scope issues are resolved
    document.addEventListener('DOMContentLoaded', function() {
    console.log("Setting up tower building fix");
    
    // Fix for direct tower option clicks
    document.querySelectorAll('.tower-option').forEach(option => {
      const towerType = option.getAttribute('data-type');
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log(`Tower option clicked: ${towerType}`);
        handleTowerOptionClick(e, towerType);
      });
    });
    
    // Ensure the tower selection menu works properly when shown
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.target.id === 'tower-selection' && 
            !mutation.target.classList.contains('hidden')) {
          // Re-attach handlers when menu becomes visible
          document.querySelectorAll('.tower-option').forEach(option => {
            const towerType = option.getAttribute('data-type');
            option.onclick = function(e) {
              e.stopPropagation();
              handleTowerOptionClick(e, towerType);
            };
          });
        }
      });
    });
    
    const towerSelectionMenu = document.getElementById('tower-selection');
    if (towerSelectionMenu) {
      observer.observe(towerSelectionMenu, { attributes: true, attributeFilter: ['class'] });
    }
  });
}

// Direct event handlers for tower options (add to HTML)
function handleTowerOptionClick(event, towerType) {
    event.stopPropagation();
    console.log("Tower option clicked directly:", towerType);
    buildTower(towerType);
}

// Handle canvas click
function handleCanvasClick(event) {
    // Stop event from bubbling up to document
    event.stopPropagation();
    
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);
    
    // First check for tower clicks
    const towerIntersects = raycaster.intersectObjects(scene.children, true);
    
    // Find which tower was clicked by checking the entire hierarchy
    let clickedObject = towerIntersects[0]?.object;
    let selectedTower = null;
    
    while (clickedObject && !selectedTower) {
        // Check if this object is a tower mesh
        for (let i = 0; i < gameState.towers.length; i++) {
            if (gameState.towers[i].mesh === clickedObject) {
                selectedTower = gameState.towers[i];
                break;
            }
        }
        
        // Move up to parent if exists
        clickedObject = clickedObject.parent;
        // Break if we're at scene level
        if (clickedObject === scene) break;
    }
    
    if (selectedTower) {
        // Remove any previous range indicators
        clearAllRangeIndicators();
        selectTower(selectedTower);
        return;
    }
    
    // Then check for slot clicks
    const slotIntersects = raycaster.intersectObjects(scene.children, true);
    
    for (const intersect of slotIntersects) {
        const object = intersect.object;
        if (object.userData && object.userData.type === 'towerSlot') {
            const slot = gameState.towerSlots[object.userData.index];
            if (!slot.occupied) {
                // Clear previous indicators first
                clearAllRangeIndicators();
                selectTowerSlot(slot);
                return;
            }
        }
    }
    
    // If we didn't hit anything important, clear all selections and indicators
    clearAllRangeIndicators();
}


// Also modify the selectTowerSlot function to call setupTowerSelectionListeners
function selectTowerSlot(slot) {
    // If there was a previously selected tower, remove its range indicator
    if (gameState.selectedTower && gameState.selectedTower.rangeIndicator) {
        scene.remove(gameState.selectedTower.rangeIndicator);
        gameState.selectedTower.rangeIndicator = null;
    }
    
    gameState.selectedTowerSlot = slot;
    
    // Create and show range indicator for potential tower
    const rangeIndicator = createRangeIndicator(
        {x: slot.x, y: slot.y, z: slot.z}, 
        8 // Default tower range
    );
    gameState.towerSlotRangeIndicator = rangeIndicator;
    scene.add(rangeIndicator);
    
    // Hide tower actions
    document.getElementById('tower-actions').classList.add('hidden');
    
    // Show tower selection menu
    const towerSelection = document.getElementById('tower-selection');
    towerSelection.classList.remove('hidden');
    
    // Update tower options based on available gold
    updateTowerOptionsAvailability();
    
    // Setup tower selection listeners again to ensure they work
    setTimeout(() => {
        setupTowerSelectionListeners();
    }, 10);

    // Add document click handler to close modal when clicking outside
    const closeModalHandler = function(event) {
        // Don't close if clicking on the canvas
        if (event.target === renderer.domElement) {
            return;
        }
        
        const towerSelection = document.getElementById('tower-selection');
        const towerActions = document.getElementById('tower-actions');
        
        // Check if click is outside both menus
        if (!towerSelection.contains(event.target) && !towerActions.contains(event.target)) {
            // Clear range indicator
            if (gameState.towerSlotRangeIndicator) {
                scene.remove(gameState.towerSlotRangeIndicator);
                gameState.towerSlotRangeIndicator = null;
            }
            
            // Hide menus
            towerSelection.classList.add('hidden');
            towerActions.classList.add('hidden');
            
            // Reset selection
            gameState.selectedTowerSlot = null;
            
            // Remove this event listener
            document.removeEventListener('click', closeModalHandler);
        }
    };
    
    // Add the event listener
    document.addEventListener('click', closeModalHandler);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 12. Update tower options availability based on gold
function updateTowerOptionsAvailability() {
    const towerOptions = document.querySelectorAll('.tower-option');
    
    towerOptions.forEach(option => {
        const towerType = option.getAttribute('data-type');
        const towerCost = gameState.towerTypes[towerType].ranks[0].cost;
        
        if (towerCost > gameState.gold) {
            option.style.opacity = '0.5';
            option.style.cursor = 'not-allowed';
        } else {
            option.style.opacity = '1';
            option.style.cursor = 'pointer';
        }
    });
}

// Initialize game when page loads
window.addEventListener('load', initGame);

if (!gameState.paths) {
    gameState.paths = [
        // Left path
        { 
            spawnPoint: { x: -15, y: 0, z: -25 },
            waypoints: [
                { x: -15, y: 0, z: -25 },
                { x: -15, y: 0, z: -10 },
                { x: -15, y: 0, z: 0 },
                { x: -10, y: 0, z: 5 },
                { x: -5, y: 0, z: 7 },
                { x: 0, y: 0, z: 10 }
            ]
        },
        // Center path
        {
            spawnPoint: { x: 0, y: 0, z: -25 },
            waypoints: [
                { x: 0, y: 0, z: -25 },
                { x: 0, y: 0, z: 10 }
            ]
        },
        // Right path
        {
            spawnPoint: { x: 15, y: 0, z: -25 },
            waypoints: [
                { x: 15, y: 0, z: -25 },
                { x: 15, y: 0, z: -10 },
                { x: 15, y: 0, z: 0 },
                { x: 10, y: 0, z: 5 },
                { x: 5, y: 0, z: 7 },
                { x: 0, y: 0, z: 10 }
            ]
        }
    ];
}

// Clear all range indicators
function clearAllRangeIndicators() {
    // Clear tower range indicators
    if (gameState.selectedTower && gameState.selectedTower.rangeIndicator) {
        scene.remove(gameState.selectedTower.rangeIndicator);
        gameState.selectedTower.rangeIndicator = null;
    }
    
    // Clear slot range indicator
    if (gameState.towerSlotRangeIndicator) {
        scene.remove(gameState.towerSlotRangeIndicator);
        gameState.towerSlotRangeIndicator = null;
    }
}

// Apply slow effect to a creep
function applySlowEffect(creep, slowAmount, towerRank) {
    // Add slow effect to creep's effects array
    creep.slowEffects.push({
        amount: slowAmount,
        remainingTime: 2.0, // Slow effect lasts for 2 seconds
        source: towerRank // Track which tower rank applied the slow
    });
    
    // Update creep's speed
    updateCreepSpeed(creep);
    
    // Add visual effect if not already present
    if (!creep.slowEffectVisual) {
        addSlowVisualEffect(creep);
    }
}