// 3D Tower Defense Game

window.handleTowerOptionClick = function(event, towerType) {
    event.stopPropagation();
    console.log("Tower option clicked:", towerType);
    
    if (!gameState.selectedTowerSlot) {
        console.log("No tower slot selected");
        return;
    }
    
    // Check if we have enough gold
    const towerData = gameState.towerTypes[towerType];
    if (!towerData) {
        console.error("Tower type not found:", towerType);
        return;
    }
    
    const towerCost = towerData.ranks[0].cost;
    if (gameState.gold < towerCost) {
        console.log("Not enough gold to build tower");
        return;
    }
    
    // Build the tower
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
            },
            fire: {
                name: "Fire Tower",
                ranks: [
                    { cost: 7, damage: 20, attackSpeed: 1.8, critChance: 0.5, critMultiplier: 1.75, color: 0xff4500 },
                    { cost: 10, damage: 35, attackSpeed: 1.4, critChance: 0.5, critMultiplier: 1.75, color: 0xff0000 }
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
        } else if (towerType === 'fire') {
            tower.critChance = towerRank.critChance;
            tower.critMultiplier = towerRank.critMultiplier;
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
        },
        fire: {
            name: "Fire Tower",
            ranks: [
                { cost: 7, damage: 20, attackSpeed: 1.8, critChance: 0.4, critMultiplier: 1.5, color: 0xff4500 },
                { cost: 10, damage: 35, attackSpeed: 1.4, critChance: 0.4, critMultiplier: 1.5, color: 0xff0000 }
            ]
        }
    },
    activeAugments: [],
    availableAugments: [
        {
            id: 'towers-of-rage',
            name: 'Towers of Rage',
            description: 'Towers gain 1% attack speed each time they attack (resets each round)',
            effect: (tower) => {
                tower.attackSpeed *= 1.01;
            },
            reset: (tower) => {
                tower.attackSpeed = gameState.towerTypes[tower.type].ranks[tower.rank - 1].attackSpeed;
            }
        },
        {
            id: 'catapult',
            name: 'Catapult',
            description: 'All towers have +2 range',
            effect: (tower) => {
                tower.range += 2;
                if (tower.rangeIndicator) {
                    scene.remove(tower.rangeIndicator);
                    tower.rangeIndicator = createRangeIndicator(tower.position, tower.range);
                    scene.add(tower.rangeIndicator);
                }
            }
        },
        {
            id: 'bloodbath',
            name: 'Bloodbath',
            description: 'All towers have 15% crit chance (+15% for Fire Towers)',
            effect: (tower) => {
                tower.critChance = tower.type === 'fire' ? 0.3 : 0.15;
            }
        },
        {
            id: 'hellfire',
            name: 'Hellfire',
            description: 'Tower attacks apply burn effect (5% health/2s)',
            effect: (tower) => {
                tower.burnEffect = true;
            }
        },
        {
            id: 'golden-towers',
            name: 'Golden Towers',
            description: '+1 gold per creep kill',
            effect: () => {
                gameState.goldPerKill += 1;
            }
        }
    ]
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
    gameState.gold = 10;
    gameState.kingHealth = 100;
    gameState.currentRound = 0;
    gameState.towers = [];
    gameState.creeps = [];
    gameState.projectiles = [];
    gameState.towerCount = 0;
    gameState.totalDamage = 0;
    gameState.towersBuilt = 0;
    gameState.selectedTower = null;
    gameState.selectedTowerSlot = null;
    gameState.activeAnimations = [];
    gameState.isPaused = false;
    gameState.goldPerKill = 1;
    gameState.activeAugments = [];
    gameState.gameActive = true;
    gameState.roundActive = false;
    gameState.interRoundTimer = 10;
    
    // Initialize the paths array
    gameState.paths = [
        // Left path
        { 
            spawnPoint: new THREE.Vector3(-15, 0, -24),
            waypoints: [
                new THREE.Vector3(-15, 0, -17.5),
                new THREE.Vector3(-15, 0, -7.5),
                new THREE.Vector3(-15, 0, 0),
                new THREE.Vector3(-10, 0, 2.5),
                new THREE.Vector3(0, 0, 5),
                new THREE.Vector3(0, 0, 10)
            ]
        },
        // Center path
        {
            spawnPoint: new THREE.Vector3(0, 0, -24),
            waypoints: [
                new THREE.Vector3(0, 0, -17.5),
                new THREE.Vector3(0, 0, -7.5),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 10)
            ]
        },
        // Right path
        {
            spawnPoint: new THREE.Vector3(15, 0, -24),
            waypoints: [
                new THREE.Vector3(15, 0, -17.5),
                new THREE.Vector3(15, 0, -7.5),
                new THREE.Vector3(15, 0, 0),
                new THREE.Vector3(10, 0, 2.5),
                new THREE.Vector3(0, 0, 5),
                new THREE.Vector3(0, 0, 10)
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
    updateAugmentTracker(); // Add this line
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
    
    // Show augment selection at game start
    showAugmentSelection();
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
    if (previousRound >= 0 && gameState.roundDefinitions && gameState.roundDefinitions[previousRound - 1]) {
        document.getElementById('previous-round').textContent = previousRound;
        const prevRoundDef = gameState.roundDefinitions[previousRound - 1];
        document.getElementById('previous-round-details').textContent = prevRoundDef.type.charAt(0).toUpperCase() + prevRoundDef.type.slice(1);
    } else {
        document.getElementById('previous-round').textContent = '-';
        document.getElementById('previous-round-details').textContent = 'N/A';
    }
    
    // Update current round
    document.getElementById('current-round').textContent = currentRound;
    if (currentRound >= 1 && currentRound <= gameState.maxRounds && gameState.roundDefinitions && gameState.roundDefinitions[currentRound - 1]) {
        const currRoundDef = gameState.roundDefinitions[currentRound - 1];
        document.getElementById('current-round-details').textContent = currRoundDef.type.charAt(0).toUpperCase() + currRoundDef.type.slice(1);
    } else {
        document.getElementById('current-round-details').textContent = 'Preparing';
    }
    
    // Update next round
    if (nextRound <= gameState.maxRounds && gameState.roundDefinitions && gameState.roundDefinitions[nextRound - 1]) {
        document.getElementById('next-round').textContent = nextRound;
        const nextRoundDef = gameState.roundDefinitions[nextRound - 1];
        document.getElementById('next-round-details').textContent = nextRoundDef.type.charAt(0).toUpperCase() + nextRoundDef.type.slice(1);
    } else {
        document.getElementById('next-round').textContent = '-';
        document.getElementById('next-round-details').textContent = 'N/A';
    }
    
    // Update future round
    if (futureRound <= gameState.maxRounds && gameState.roundDefinitions && gameState.roundDefinitions[futureRound - 1]) {
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
    if (currentRound >= 1) {
        document.querySelector('.round-item.current').classList.add('active');
    }
}


// Update in the setupScene function - change the camera position to zoom out more
function setupScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Black background
    
    // Create camera - positioned further back to show more of the scene
    console.log('Setting up camera...');
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 15);
    camera.lookAt(0, 0, -5); // Moderate tilt to see both board and environment
    
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
    // Remove any existing path group
    if (gameState.pathGroup) {
        scene.remove(gameState.pathGroup);
        gameState.pathGroup = null;
    }

    // Create a new path group
    gameState.pathGroup = new THREE.Group();
    scene.add(gameState.pathGroup);

    // Create visual markers for each path
    if (gameState.paths && gameState.paths.length > 0) {
        gameState.paths.forEach((path, pathIndex) => {
            // Create markers for spawn point
            const spawnMarker = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            spawnMarker.position.copy(path.spawnPoint);
            gameState.pathGroup.add(spawnMarker);

            // Create markers for waypoints
            path.waypoints.forEach((waypoint, index) => {
                const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                const markerMaterial = new THREE.MeshBasicMaterial({ 
                    color: index === path.waypoints.length - 1 ? 0xff0000 : // Last waypoint (end) is red
                           0xffff00 // Other waypoints are yellow
                });
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.copy(waypoint);
                gameState.pathGroup.add(marker);

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
                    gameState.pathGroup.add(line);
                }
            });

            // Create label for spawn point
            const loader = new THREE.FontLoader();
            loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
                const textGeometry = new THREE.TextGeometry(
                    `Spawn ${pathIndex + 1}: (${path.spawnPoint.x.toFixed(1)}, ${path.spawnPoint.y.toFixed(1)}, ${path.spawnPoint.z.toFixed(1)})`,
                    {
                        font: font,
                        size: 0.5,
                        height: 0.1,
                        curveSegments: 12,
                        bevelEnabled: false
                    }
                );
                const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
                textMesh.position.copy(path.spawnPoint);
                textMesh.position.y += 1;
                textMesh.rotation.x = -Math.PI / 2;
                gameState.pathGroup.add(textMesh);

                // Create labels for waypoints
                path.waypoints.forEach((waypoint, index) => {
                    const textGeometry = new THREE.TextGeometry(
                        `WP${index + 1}: (${waypoint.x.toFixed(1)}, ${waypoint.y.toFixed(1)}, ${waypoint.z.toFixed(1)})`,
                        {
                            font: font,
                            size: 0.5,
                            height: 0.1,
                            curveSegments: 12,
                            bevelEnabled: false
                        }
                    );
                    const textMesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
                    textMesh.position.copy(waypoint);
                    textMesh.position.y += 1;
                    textMesh.rotation.x = -Math.PI / 2;
                    gameState.pathGroup.add(textMesh);
                });
            });
        });
    } else {
        console.error('GameState paths not initialized!');
    }
}

// Create visual markers for waypoints
function createWaypointLabels(waypoints) {
    const loader = new THREE.FontLoader();
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const labels = [];

    loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
        waypoints.forEach((waypoint, index) => {
            const textGeometry = new THREE.TextGeometry(
                `WP${index + 1}: (${waypoint.x.toFixed(1)}, ${waypoint.y.toFixed(1)}, ${waypoint.z.toFixed(1)})`,
                {
                    font: font,
                    size: 0.5,
                    height: 0.1,
                    curveSegments: 12,
                    bevelEnabled: false
                }
            );
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.copy(waypoint);
            textMesh.position.y += 1; // Float above the waypoint
            textMesh.rotation.x = -Math.PI / 2; // Make text face up
            scene.add(textMesh);
            labels.push(textMesh);
        });
    });

    return labels;
}

function createWaypointMarkers(waypoints, pathGroup) {
    // Create visual markers for each waypoint
    waypoints.forEach((waypoint, index) => {
        const markerGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: index === 0 ? 0x00ff00 : // First waypoint (spawn) is green
                   index === waypoints.length - 1 ? 0xff0000 : // Last waypoint (end) is red
                   0xffff00 // Other waypoints are yellow
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(waypoint);
        pathGroup.add(marker);
    });

    // Create the path lines
    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        pathGroup.add(line);
    }

    // Create labels for the waypoints
    createWaypointLabels(waypoints);
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

    // Create tower slots at exact coordinates
    const slotPositions = [
        // Left path slots
        { x: -20, z: -17.5 },
        { x: -20, z: -7.5 },
        { x: -20, z: 0 },
        { x: -7.5, z: 7 },

        // Center path slots
        { x: -5, z: 0 },
        { x: 5, z: 0 },
        { x: -5, z: -7.5 },
        { x: 5, z: -7.5 },
        { x: -5, z: -17.5 },
        { x: 5, z: -17.5 },

        // Right path slots
        { x: 7.5, z: 7 },
        { x: 20, z: 0 },
        { x: 20, z: -17.5 },
        { x: 20, z: -7.5 }
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
        updateCriticalHitParticles(safeDelta);
        
        // Update animations
        if (gameState.activeAnimations) {
            for (let i = gameState.activeAnimations.length - 1; i >= 0; i--) {
                const animation = gameState.activeAnimations[i];
                const continueAnimation = animation(safeDelta);
                if (!continueAnimation) {
                    gameState.activeAnimations.splice(i, 1);
                }
            }
        }
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
        const spawnPoint = path.spawnPoint; // Use dedicated spawn point
        
        // Create 3D mesh with the appropriate type
        const creepMesh = createCreepMesh(creepType);
        creepMesh.position.set(spawnPoint.x, 0.5, spawnPoint.z); // Set initial position at spawn point
        scene.add(creepMesh);
        
        // Set type-specific properties
        let health, damage, speed;
        
        // Base values without any multipliers for round 1
        switch(creepType) {
            case 'fast':
                health = 15;
                damage = 2;
                speed = 3.45;
                break;
            case 'armored':
                health = 35;
                damage = 2;
                speed = 1.725;
                break;
            case 'swarm':
                health = 10;
                damage = 1;
                speed = 2.53;
                break;
            default:
                health = 25;
                damage = 2;
                speed = 2.3;
                break;
        }
        
        // Only apply difficulty scaling if we're past round 1
        if (gameState.currentRound > 1) {
            const difficultyMultiplier = Math.pow(1.1, gameState.currentRound - 1);
            health = Math.round(health * difficultyMultiplier);
        }
        
        // Add to game state with all required properties
        const creep = {
            mesh: creepMesh,
            position: { x: spawnPoint.x, y: 0.5, z: spawnPoint.z },
            progress: 0,
            health: health,
            maxHealth: health,
            baseSpeed: speed,
            speed: speed,
            slowEffects: [],
            effects: {
                slow: [],
                burn: null
            },
            reachedKing: false,
            damageToKing: damage,
            creepType: creepType,
            pathIndex: pathIndex,
            path: path,
            currentWaypoint: 0
        };
        
        // Create health bar and attach it to the monster
        const healthBarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        creep.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        creep.healthBar.position.set(0, 1.2, 0);
        creep.healthBar.renderOrder = 1; // Ensure health bar renders on top
        creepMesh.add(creep.healthBar);
        
        // Add billboard behavior to make health bar always face camera
        creep.healthBar.update = function() {
            // Get the creep's position
            const creepPosition = creep.mesh.position;
            
            // Get the camera's position
            const cameraPosition = camera.position;
            
            // Calculate direction from creep to camera
            const direction = new THREE.Vector3();
            direction.subVectors(cameraPosition, creepPosition).normalize();
            
            // Make the health bar face the camera
            this.lookAt(cameraPosition);
            
            // Keep the health bar horizontal by resetting X and Z rotation
            this.rotation.x = 0;
            this.rotation.z = 0;
        };
        
        gameState.creeps.push(creep);
        console.log("Creep spawned successfully:", creep);
    } catch (error) {
        console.error("Error spawning creep:", error);
    }
}

// Function to spawn a creep on a specific path
function spawnCreepOnPath(pathIndex) {
    try {
        const path = gameState.paths[pathIndex];
        if (!path) {
            console.error("Invalid path index:", pathIndex);
            return;
        }

        // Get the current round definition (using current round index - 1 since we increment at end of startRound)
        const roundIndex = gameState.currentRound - 1;
        const roundDef = gameState.roundDefinitions[roundIndex];
        if (!roundDef) {
            console.error("Invalid round definition for round:", gameState.currentRound);
            return;
        }
        const creepType = roundDef.type;

        // Create creep mesh with the correct type
        const creepMesh = createCreepMesh(creepType);
        // Set initial position at spawn point
        creepMesh.position.set(
            path.spawnPoint.x,
            0.5, // Keep constant height
            path.spawnPoint.z
        );
        scene.add(creepMesh);
        
        // Set type-specific properties
        let health, damage, speed;
        
        // Base values without any multipliers for round 1
        switch(creepType) {
            case 'fast':
                health = 15;
                damage = 2;
                speed = 3.45;
                break;
            case 'armored':
                health = 35;
                damage = 2;
                speed = 1.725;
                break;
            case 'swarm':
                health = 10;
                damage = 1;
                speed = 2.53;
                break;
            default:
                health = 25;
                damage = 2;
                speed = 2.3;
                break;
        }
        
        // Only apply difficulty scaling if we're past round 1
        if (gameState.currentRound > 1) {
            const difficultyMultiplier = Math.pow(1.1, gameState.currentRound - 1);
            health = Math.round(health * difficultyMultiplier);
        }
        
        // Create creep object
        const creep = {
            mesh: creepMesh,
            path: path,
            currentWaypoint: 0,
            health: health,
            maxHealth: health,
            damageToKing: damage,
            baseSpeed: speed,
            speed: speed,
            type: creepType,
            effects: {
                slow: [],
                burn: null
            },
            slowEffects: [],
            reachedKing: false,
            position: new THREE.Vector3(path.spawnPoint.x, 0.5, path.spawnPoint.z)
        };
        
        // Add health bar
        const healthBarGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.1);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        healthBar.position.set(0, 1.2, 0);
        healthBar.renderOrder = 1; // Ensure health bar renders on top
        creepMesh.add(healthBar);
        creep.healthBar = healthBar;

        // Add billboard behavior to make health bar always face camera
        creep.healthBar.update = function() {
            // Get the creep's position
            const creepPosition = creep.mesh.position;
            
            // Get the camera's position
            const cameraPosition = camera.position;
            
            // Calculate direction from creep to camera
            const direction = new THREE.Vector3();
            direction.subVectors(cameraPosition, creepPosition).normalize();
            
            // Make the health bar face the camera
            this.lookAt(cameraPosition);
            
            // Keep the health bar horizontal by resetting X and Z rotation
            this.rotation.x = 0;
            this.rotation.z = 0;
        };
        
        // Add to game state
        gameState.creeps.push(creep);
        
        console.log(`Spawned ${creepType} creep with ${health} health for round ${gameState.currentRound + 1}`);
    } catch (error) {
        console.error("Error spawning creep:", error);
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
    const particleMaterial = new THREE.MeshStandardMaterial({
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
    const crystalMaterial = new THREE.MeshStandardMaterial({
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
    // Skip update if no creeps
    if (gameState.creeps.length === 0) {
        // Add debug logging for round end conditions
        if (gameState.roundActive) {
            console.log("Round end check - Active creeps:", gameState.creeps.length, 
                       "Creeps to spawn:", gameState.creepsToSpawn, 
                       "Round active:", gameState.roundActive);
            // Check for round end when no creeps are present
            if (gameState.creepsToSpawn === 0) {
                console.log("No creeps and no more to spawn, ending round");
                endRound();
            }
        }
        return;
    }

    // Update burn effects
    for (let i = gameState.creeps.length - 1; i >= 0; i--) {
        const creep = gameState.creeps[i];
        if (creep.effects.burn) {
            creep.health -= creep.effects.burn.damage * delta;
            if (creep.health <= 0) {
                // Add gold for kill
                gameState.gold += gameState.goldPerKill;
                updateGold();
                
                // Remove creep from scene and game state
                scene.remove(creep.mesh);
                gameState.creeps.splice(i, 1);
                
                // Check for round end after creep death
                if (gameState.roundActive && gameState.creeps.length === 0 && gameState.creepsToSpawn === 0) {
                    console.log("Round end triggered by creep death");
                    endRound();
                    return;
                }
            }
        }
    }

    // Update slow effects
    for (let i = 0; i < gameState.creeps.length; i++) {
        updateCreepSlowEffects(gameState.creeps[i], delta);
    }

    // Move creeps along their paths
    for (let i = gameState.creeps.length - 1; i >= 0; i--) {
        const creep = gameState.creeps[i];
        
        if (!creep.path || !creep.path.waypoints) {
            console.error("Creep has invalid path:", creep);
            continue;
        }

        const currentWaypoint = creep.path.waypoints[creep.currentWaypoint];
        const nextWaypoint = creep.path.waypoints[creep.currentWaypoint + 1];

        if (!nextWaypoint) {
            // Creep reached the king
            if (!creep.reachedKing) {
                creep.reachedKing = true;
                gameState.kingHealth -= creep.damageToKing;
                updateKingHealth();
                console.log("Creep reached king. King health:", gameState.kingHealth);
                
                // Check for game over
                if (gameState.kingHealth <= 0) {
                    showGameOverScreen(false);
                    return;
                }
            }
            
            // Remove creep after dealing damage
            scene.remove(creep.mesh);
            gameState.creeps.splice(i, 1);
            
            // Check if round should end
            if (gameState.roundActive && gameState.creeps.length === 0 && gameState.creepsToSpawn === 0) {
                console.log("Round end triggered by creep reaching king");
                endRound();
                return;
            }
            continue;
        }

        // Calculate direct differences in coordinates
        const dx = nextWaypoint.x - creep.mesh.position.x;
        const dz = nextWaypoint.z - creep.mesh.position.z;
        
        // Calculate actual distance using Pythagorean theorem
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Calculate how far the creep should move this frame
        const moveDistance = creep.speed * delta;
        
        // Calculate the ratio of movement
        const ratio = moveDistance / distance;
        
        // Move the creep
        creep.mesh.position.x += dx * ratio;
        creep.mesh.position.z += dz * ratio;
        
        // Update creep's position vector
        creep.position.copy(creep.mesh.position);
        
        // Update health bar position
        if (creep.healthBar) {
            creep.healthBar.update();
        }
        
        // Check if we've reached the next waypoint
        if (distance < 0.1) {
            creep.currentWaypoint++;
        }
    }

    // Final round end check
    if (gameState.roundActive && gameState.creeps.length === 0 && gameState.creepsToSpawn === 0) {
        console.log("Round end triggered by final check");
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
        console.error("No tower slot selected");
        return;
    }
    
    // Remove range indicator if present
    if (gameState.towerSlotRangeIndicator) {
        scene.remove(gameState.towerSlotRangeIndicator);
        gameState.towerSlotRangeIndicator = null;
    }
    
    // Get tower data
    const towerData = gameState.towerTypes[towerType];
    if (!towerData) {
        console.error("Invalid tower type:", towerType);
        return;
    }
    
    const towerRank = towerData.ranks[0];
    
    // Check if we have enough gold
    if (gameState.gold < towerRank.cost) {
        console.error("Not enough gold to build tower");
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
    } else if (towerType === 'fire') {
        tower.critChance = towerRank.critChance;
        tower.critMultiplier = towerRank.critMultiplier;
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
        document.getElementById('tower-selection-backdrop').classList.add('hidden');
    gameState.selectedTowerSlot = null;
    
    console.log("Tower built successfully:", tower);
    } catch (error) {
        console.error("Error building tower:", error);
    }
}

// Update towers
function updateTowers(delta) {
    gameState.towers.forEach(tower => {
        // Update attack cooldown
        tower.attackCooldown += delta;
        
        // Check if tower can attack
        if (tower.attackCooldown >= tower.attackSpeed) {
            // Find target(s)
            const targets = findTarget(tower);
            
            if (targets) {
                // Handle both single target and multi-target cases
                if (Array.isArray(targets)) {
                    // Multi-target (basic tower)
                    // First target takes full damage
                    fireProjectile(tower, targets[0], 1.0);
                    // Second target takes 50% damage
                    if (targets[1]) {
                        fireProjectile(tower, targets[1], 0.5);
                    }
                } else {
                    // Single target (other towers)
                    fireProjectile(tower, targets);
                }
                
                // Reset attack cooldown
                tower.attackCooldown = 0;
            }
        }
    });
}

// 5. Fire projectile with proper color and effects
function fireProjectile(tower, target, damageMultiplier = 1) {
    // Safety check for target and its mesh
    if (!target || !target.mesh || !target.mesh.position) {
        console.log("No valid target for projectile - missing mesh or position");
        return;
    }

    // Calculate damage with augment effects
    let damage = gameState.towerTypes[tower.type].ranks[tower.rank - 1].damage * damageMultiplier;
    let isCritical = false;
    
    // Check for critical hit (base tower crit or Bloodbath augment)
    if (tower.type === 'fire' || gameState.activeAugments.includes('bloodbath')) {
        let critChance = tower.type === 'fire' ? 
            gameState.towerTypes[tower.type].ranks[tower.rank - 1].critChance : 0.15;
        let critMultiplier = tower.type === 'fire' ? 
            gameState.towerTypes[tower.type].ranks[tower.rank - 1].critMultiplier : 1.5;
            
        // Apply Bloodbath augment if active
        if (gameState.activeAugments.includes('bloodbath')) {
            critChance = tower.type === 'fire' ? 0.9 : 0.3;
            critMultiplier = tower.type === 'fire' ? 1.65 : 1.5;
        }
        
        if (Math.random() < critChance) {
            damage *= critMultiplier;
            isCritical = true;
        }
    }
    
    // Create projectile
    const projectile = {
        mesh: createProjectileMesh(gameState.towerTypes[tower.type].ranks[tower.rank - 1].color),
        target: target,
        damage: damage,
        speed: 15,
        position: { 
            x: tower.position.x, 
            y: tower.position.y + 1, 
            z: tower.position.z 
        },
        direction: { x: 0, y: 0, z: 0 },
        reached: false,
        isCritical: isCritical,
        type: tower.type
    };
    
    // Calculate direction to target using mesh position
    const dx = target.mesh.position.x - tower.position.x;
    const dy = target.mesh.position.y - tower.position.y;
    const dz = target.mesh.position.z - tower.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance === 0) {
        console.log("Target is at same position as tower, skipping projectile");
        return;
    }
    
    projectile.direction.x = dx / distance;
    projectile.direction.y = dy / distance;
    projectile.direction.z = dz / distance;
    
    // Position projectile at tower
    projectile.mesh.position.set(
        projectile.position.x,
        projectile.position.y,
        projectile.position.z
    );
    
    // Add to scene and game state
    scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
    
    // Apply Towers of Rage augment if active
    if (gameState.activeAugments.includes('towers-of-rage')) {
        tower.attackSpeed *= 1.05;
    }
}

// 6. Update projectiles to apply slow effect on hit
function updateProjectiles(delta) {
    const projectilesToRemove = [];
    
    gameState.projectiles.forEach(projectile => {
        if (projectile.reached) {
            projectilesToRemove.push(projectile);
            return;
        }
        
        // Safety check for target and its mesh
        if (!projectile.target || !projectile.target.mesh || !projectile.target.mesh.position) {
            console.warn("Invalid target for projectile:", projectile.target);
            projectilesToRemove.push(projectile);
            return;
        }
        
        // Calculate distance to target using mesh position
        const dx = projectile.target.mesh.position.x - projectile.position.x;
        const dy = projectile.target.mesh.position.y - projectile.position.y;
        const dz = projectile.target.mesh.position.z - projectile.position.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Check if projectile hit target
        if (distance < 0.5) {
            // Apply damage
            const damage = Math.round(projectile.damage);
            projectile.target.health -= damage;
            
            // Update health bar
            if (projectile.target.healthBar) {
                const healthPercent = Math.max(0, projectile.target.health / projectile.target.maxHealth);
                projectile.target.healthBar.scale.x = Math.max(0.01, healthPercent);
                projectile.target.healthBar.material.color.setHex(
                    healthPercent > 0.6 ? 0x00ff00 :
                    healthPercent > 0.3 ? 0xffff00 : 0xff0000
                );
            }
            
            // Create floating damage number
            createFloatingDamageNumber(projectile.position, damage, projectile.isCritical);
            
            // Remove creep if dead
            if (projectile.target.health <= 0) {
                // Add gold for kill
                gameState.gold += gameState.goldPerKill;
                updateGold();
                
                // Remove creep from scene and game state
                scene.remove(projectile.target.mesh);
                const creepIndex = gameState.creeps.indexOf(projectile.target);
                if (creepIndex > -1) {
                    gameState.creeps.splice(creepIndex, 1);
                }
            }
            
            // Mark projectile for removal
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
    });
    
    // Remove projectiles that have reached their target
    projectilesToRemove.forEach(projectile => {
        scene.remove(projectile.mesh);
        const index = gameState.projectiles.indexOf(projectile);
        if (index > -1) {
            gameState.projectiles.splice(index, 1);
        }
    });
}


// Find target for tower
function findTarget(tower) {
    // Safety check for tower position
    if (!tower || !tower.position) {
        console.warn("Invalid tower in findTarget:", tower);
        return null;
    }
    
    // Sort creeps by progress (prioritize creeps further along the path)
    const sortedCreeps = [...gameState.creeps]
        .filter(creep => {
            // Safety check for creep mesh and position
            if (!creep || !creep.mesh || !creep.mesh.position) {
                console.warn("Invalid creep in filter:", creep);
                return false;
            }
            return !creep.reachedKing && creep.health > 0;
        })
        .sort((a, b) => b.progress - a.progress);
    
    // For basic towers, find up to 2 targets
    if (tower.type === 'basic') {
        const targets = [];
        for (let i = 0; i < sortedCreeps.length && targets.length < 2; i++) {
            const creep = sortedCreeps[i];
            const distance = getDistance3D(tower.position, creep.mesh.position);
            
            if (distance <= tower.range) {
                targets.push(creep);
            }
        }
        console.log("Basic tower found targets:", targets.length);
        return targets; // Return array of targets for basic towers
    }
    
    // For other towers, find single target
    for (let i = 0; i < sortedCreeps.length; i++) {
        const creep = sortedCreeps[i];
        const distance = getDistance3D(tower.position, creep.mesh.position);
        
        if (distance <= tower.range) {
            return creep;
        }
    }
    
    return null;
}

// Calculate 3D distance between two points
function getDistance3D(point1, point2) {
    // Safety check for undefined or null points
    if (!point1 || !point2) {
        console.warn("Invalid points in getDistance3D:", point1, point2);
        return Infinity; // Return a large distance to prevent targeting
    }
    
    // Safety check for missing coordinates
    if (typeof point1.x !== 'number' || typeof point1.y !== 'number' || typeof point1.z !== 'number' ||
        typeof point2.x !== 'number' || typeof point2.y !== 'number' || typeof point2.z !== 'number') {
        console.warn("Invalid coordinates in getDistance3D:", point1, point2);
        return Infinity; // Return a large distance to prevent targeting
    }
    
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function startRound() {
    // Increment round counter at the start
    gameState.currentRound++;
    
    // Get current round definition (using 0-based index)
    const roundIndex = gameState.currentRound - 1;
    const currentRoundDef = gameState.roundDefinitions[roundIndex];
    if (!currentRoundDef) {
        console.error("Invalid round definition for round:", gameState.currentRound);
        return;
    }
    
    // Set round as active
    gameState.roundActive = true;
    gameState.isPaused = false;
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Calculate number of creeps to spawn
    const baseCreeps = 5;
    const roundBonus = Math.min(gameState.currentRound, 10);
    gameState.creepsToSpawn = baseCreeps + roundBonus;
    console.log("Creeps to spawn:", gameState.creepsToSpawn);
    
    // Spawn creeps with delay
    let spawnCount = 0;
    const spawnInterval = setInterval(() => {
        if (spawnCount < gameState.creepsToSpawn) {
            // Randomly select a path for this creep
            const pathIndex = Math.floor(Math.random() * gameState.paths.length);
            spawnCreepOnPath(pathIndex);
            spawnCount++;
            console.log("Spawned creep", spawnCount, "of", gameState.creepsToSpawn);
        } else {
            clearInterval(spawnInterval);
            gameState.creepsToSpawn = 0; // Only set to 0 when all creeps are spawned
            console.log("Finished spawning all creeps");
        }
    }, 500); // Reduced from 1000ms to 500ms for faster spawning
    
    // Start round timer
    gameState.roundTimer = 0;
    updateRoundTimer();
    
    // Check for game over
    if (gameState.currentRound > gameState.maxRounds) {
        showGameOverScreen(true);
        return;
    }
    
    // Update round tracker and counter
    updateRoundTracker();
    updateRoundCounter();
}

function endRound() {
    console.log("Ending round", gameState.currentRound);
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Reset round-specific augments
    resetRoundAugments();
    
    // Set round as inactive
    gameState.roundActive = false;
    
    // Check if we should show augment selection (Round 6 or game start)
    if (gameState.currentRound === 6 || gameState.currentRound === 0) {
        // Pause the game
        gameState.isPaused = true;
        // Show augment selection
        showAugmentSelection();
    } else {
        // Start inter-round timer for other rounds
        startInterRoundTimer();
    }
}

function startInterRoundTimer() {
    console.log("Starting inter-round timer");
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Reset timer to 10 seconds
    gameState.interRoundTimer = 10;
    updateRoundTimer();
    
    // Start countdown timer
    gameState.timerInterval = setInterval(() => {
        if (!gameState.isPaused) {
            gameState.interRoundTimer--;
            updateRoundTimer();
            
            // When timer reaches 0, start next round
            if (gameState.interRoundTimer <= 0) {
                console.log("Inter-round timer finished, starting next round");
                clearInterval(gameState.timerInterval);
                gameState.timerInterval = null;
                startRound();
            }
        }
    }, 1000); // Update every second
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
    
    // Show damage per target for basic towers
    if (tower.type === 'basic') {
        document.getElementById('tower-details-damage').textContent = `Damage: ${tower.damage} (${Math.floor(tower.damage * 0.5)} per target)`;
    } else {
        document.getElementById('tower-details-damage').textContent = `Damage: ${tower.damage}`;
    }
    
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
    // Show the actual round number (no need to add 1 since we increment at start of startRound)
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
    // Remove any existing event listeners
    const towerOptions = document.querySelectorAll('.tower-option');
    towerOptions.forEach(option => {
        // Remove any existing onclick handlers
        option.onclick = null;
        
        // Add new onclick handler
        option.onclick = function(e) {
            e.stopPropagation();
            const towerType = this.getAttribute('data-type');
            console.log("Tower option clicked:", towerType);
            handleTowerOptionClick(e, towerType);
        };
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
    
    if (!gameState.selectedTowerSlot) {
        console.log("No tower slot selected");
        return;
    }
    
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
    console.log("Selecting tower slot:", slot);
    
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
    
    // Show backdrop and tower selection menu
    document.getElementById('tower-selection-backdrop').classList.remove('hidden');
    document.getElementById('tower-selection').classList.remove('hidden');
    
    // Update tower options based on available gold
    updateTowerOptionsAvailability();
    
    // Setup tower selection listeners
    setupTowerSelectionListeners();

    // Remove any existing click handler
    if (gameState.modalCloseHandler) {
        document.getElementById('tower-selection-backdrop').removeEventListener('click', gameState.modalCloseHandler);
    }

    // Create new click handler for the backdrop
    gameState.modalCloseHandler = function(event) {
        // Only handle clicks directly on the backdrop
        if (event.target === document.getElementById('tower-selection-backdrop')) {
            // Clear range indicator
            if (gameState.towerSlotRangeIndicator) {
                scene.remove(gameState.towerSlotRangeIndicator);
                gameState.towerSlotRangeIndicator = null;
            }
            
            // Hide menus
            document.getElementById('tower-selection-backdrop').classList.add('hidden');
            document.getElementById('tower-selection').classList.add('hidden');
            document.getElementById('tower-actions').classList.add('hidden');
            
            // Reset selection
            gameState.selectedTowerSlot = null;
            gameState.selectedTower = null;
            
            // Remove the click handler
            document.getElementById('tower-selection-backdrop').removeEventListener('click', gameState.modalCloseHandler);
            gameState.modalCloseHandler = null;
        }
    };
    
    // Add click handler to the backdrop
    document.getElementById('tower-selection-backdrop').addEventListener('click', gameState.modalCloseHandler);
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
    console.error("GameState paths not initialized!");
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

// Add critical hit effect function
function createCriticalHitEffect(position) {
    const particleCount = 12;
    const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
    const particleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
        emissive: 0xff0000,
        emissiveIntensity: 0.6
    });
    
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.copy(position);
        scene.add(particle);
        
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 2 + Math.random();
        const direction = {
            x: Math.cos(angle) * speed,
            y: Math.random() * speed,
            z: Math.sin(angle) * speed
        };
        
        particles.push({
            mesh: particle,
            direction: direction,
            life: 1.0
        });
    }
    
    // Store particles for animation
    if (!gameState.criticalHitParticles) {
        gameState.criticalHitParticles = [];
    }
    gameState.criticalHitParticles.push(...particles);
}

// Update critical hit particles
function updateCriticalHitParticles(delta) {
    if (!gameState.criticalHitParticles) return;
    
    for (let i = gameState.criticalHitParticles.length - 1; i >= 0; i--) {
        const particle = gameState.criticalHitParticles[i];
        
        // Update position
        particle.mesh.position.x += particle.direction.x;
        particle.mesh.position.y += particle.direction.y;
        particle.mesh.position.z += particle.direction.z;
        
        // Update life and fade out
        particle.life -= delta;
        particle.mesh.material.opacity = particle.life;
        
        // Remove dead particles
        if (particle.life <= 0) {
            scene.remove(particle.mesh);
            gameState.criticalHitParticles.splice(i, 1);
        }
    }
}

// Create a fire critical hit explosion effect
function createFireCriticalEffect(position) {
    // Create a group to hold all particles
    const particleGroup = new THREE.Group();
    
    // Create the main explosion ring
    const ringGeometry = new THREE.RingGeometry(0.2, 0.4, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide
    });
    
    const explosionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    explosionRing.rotation.x = -Math.PI / 2;
    explosionRing.position.set(position.x, 0.1, position.z);
    particleGroup.add(explosionRing);
    
    // Add some particles
    const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 1
    });
    
    for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.2 + Math.random() * 0.3;
        particle.position.set(
            position.x + Math.cos(angle) * radius,
            0.1 + Math.random() * 0.2,
            position.z + Math.sin(angle) * radius
        );
        particleGroup.add(particle);
    }
    
    // Add to scene
    scene.add(particleGroup);
    
    // Add animation data
    particleGroup.userData = {
        time: 0,
        duration: 0.5
    };
    
    // Add to active animations
    if (!gameState.activeAnimations) {
        gameState.activeAnimations = [];
    }
    
    const animation = function(delta) {
        particleGroup.userData.time += delta;
        const progress = particleGroup.userData.time / particleGroup.userData.duration;
        
        if (progress >= 1) {
            scene.remove(particleGroup);
            return false;
        }
            
            // Fade out
        const opacity = 1 - progress;
        particleGroup.children.forEach(child => {
            if (child.material) {
                child.material.opacity = opacity;
            }
        });
        
        // Expand ring
        if (explosionRing) {
            const scale = 1 + progress * 2;
            explosionRing.scale.set(scale, scale, 1);
        }
        
        return true;
    };
    
    gameState.activeAnimations.push(animation);
}

// Create floating damage number
function createFloatingDamageNumber(position, damage, isCritical = false) {
    // Create a canvas element for the damage number
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;  // Increased size
    canvas.height = 64;  // Increased size
    
    // Draw the damage number with larger font and better styling
    ctx.fillStyle = isCritical ? '#ff0000' : '#ffffff';
    ctx.font = 'bold 48px Arial';  // Increased font size
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(damage.toString(), 64, 32);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false  // Ensure it's always visible
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Set initial position and scale
    sprite.position.set(position.x, position.y + 1, position.z);
    sprite.scale.set(2, 1, 1);  // Increased scale
    
    // Add to scene
    scene.add(sprite);
    
    // Create animation
    let time = 0;
    const animation = function(delta) {
        time += delta;
        
        // Initial pop-up effect
        const popUpProgress = Math.min(1, time * 5);  // Faster initial pop
        const popUpScale = 1 + (1 - popUpProgress) * 0.5;  // Start larger and shrink to normal size
        
        // Float upward with easing
        const floatProgress = Math.min(1, time * 2);  // Slower float
        const floatHeight = floatProgress * 2;  // Float up 2 units
        
        // Fade out
        const fadeProgress = Math.max(0, 1 - (time - 0.5));  // Start fading after 0.5s
        
        // Apply transformations
        sprite.scale.set(2 * popUpScale, popUpScale, 1);
        sprite.position.y = position.y + 1 + floatHeight;
        sprite.material.opacity = fadeProgress;
        
        // Remove when done
        if (time >= 1) {
            scene.remove(sprite);
            return false;
        }
        
        return true;
    };
    
    // Add to active animations
    if (!gameState.activeAnimations) {
        gameState.activeAnimations = [];
    }
    gameState.activeAnimations.push(animation);
}

// Function to show augment selection modal
function showAugmentSelection() {
    const modal = document.getElementById('augment-modal');
    const options = modal.querySelectorAll('.augment-option');
    
    // Hide all options first
    options.forEach(option => option.style.display = 'none');
    
    // Get 3 random augments that aren't already active
    const availableAugments = gameState.availableAugments.filter(
        augment => !gameState.activeAugments.includes(augment.id)
    );
    
    // Randomly select 3 augments
    const selectedAugments = [];
    for (let i = 0; i < 3 && availableAugments.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableAugments.length);
        selectedAugments.push(availableAugments.splice(randomIndex, 1)[0]);
    }
    
    // Show only the selected augments
    selectedAugments.forEach(augment => {
        const option = modal.querySelector(`[data-augment="${augment.id}"]`);
        if (option) {
            option.style.display = 'flex';
            option.onclick = () => selectAugment(augment);
        }
    });
    
    // Show the modal
    modal.classList.remove('hidden');
}

// Function to handle augment selection
function selectAugment(augment) {
    // Add augment to active augments
    gameState.activeAugments.push(augment.id);
    
    // Apply the augment effect
    if (augment.id === 'golden-towers') {
        augment.effect();
    } else {
        gameState.towers.forEach(tower => augment.effect(tower));
    }
    
    // Update the augment tracker
    updateAugmentTracker();
    
    // Hide the modal
    document.getElementById('augment-modal').classList.add('hidden');
    
    // Unpause the game
    gameState.isPaused = false;
    
    // Start the inter-round timer
    startInterRoundTimer();
}

// Function to reset round-specific augments
function resetRoundAugments() {
    gameState.towers.forEach(tower => {
        if (gameState.activeAugments.includes('towers-of-rage')) {
            const augment = gameState.availableAugments.find(a => a.id === 'towers-of-rage');
            augment.reset(tower);
        }
    });
    
    // Update the augment tracker after resetting
    updateAugmentTracker();
}

// Function to update the augment tracker UI
function updateAugmentTracker() {
    const augmentList = document.getElementById('augment-list');
    augmentList.innerHTML = ''; // Clear existing augments
    
    // Get all active augments
    gameState.activeAugments.forEach(augmentId => {
        const augment = gameState.availableAugments.find(a => a.id === augmentId);
        if (augment) {
            // Create augment item element
            const augmentItem = document.createElement('div');
            augmentItem.className = 'augment-item';
            
            // Create icon element
            const icon = document.createElement('div');
            icon.className = `augment-icon-small ${augmentId}-icon`;
            
            // Create info container
            const info = document.createElement('div');
            info.className = 'augment-info-small';
            
            // Create name element
            const name = document.createElement('div');
            name.className = 'augment-name-small';
            name.textContent = augment.name;
            
            // Create description element
            const description = document.createElement('div');
            description.className = 'augment-description-small';
            description.textContent = augment.description;
            
            // Assemble the elements
            info.appendChild(name);
            info.appendChild(description);
            augmentItem.appendChild(icon);
            augmentItem.appendChild(info);
            
            // Add to the list
            augmentList.appendChild(augmentItem);
        }
    });
}