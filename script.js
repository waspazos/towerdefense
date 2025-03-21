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
function buildTower(towerType) {
    console.log("Global buildTower called with type:", towerType);
    
    // Make sure we have gameState.towerTypes defined
    if (!gameState.towerTypes) {
        console.log("Tower types not defined, initializing from config");
        gameState.towerTypes = window.towerConfig;
    }
    
    // Get tower data from config
    const towerData = window.towerConfig[towerType];
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
}

// Game state
let gameState = {
    kingHealth: 100,
    gold: 10,
    towerCount: 0,
    totalDamage: 0,
    damageInCurrentSecond: 0,
    currentDPS: 0,
    lastDPSUpdateTime: 0,
    currentRound: 0,
    maxRounds: window.roundConfig.maxRounds,
    gameActive: false,
    roundActive: false,
    interRoundTimer: window.roundConfig.interRoundTimer,
    timerInterval: null,
    isPaused: false,
    creeps: [],
    towers: [],
    projectiles: [],
    towerSlots: [],
    
    // New properties for round tracker
    creepTypes: window.creepConfig.types,
    
    // Round definitions
    roundDefinitions: window.roundConfig.rounds,
    
    // Define tower types
    towerTypes: window.towerConfig,
    
    activeAugments: [],
    availableAugments: window.augmentConfig.available,
    
    workers: [],
    workerCost: window.workerConfig.base.cost,
    goldPerWorker: window.workerConfig.base.goldPerMining,
    workerMiningInterval: window.workerConfig.base.miningInterval,
    workerMiningTimers: {},

    // Initialize paths array
    paths: window.pathConfig.paths.map(path => ({
        spawnPoint: new THREE.Vector3(path.spawnPoint.x, path.spawnPoint.y, path.spawnPoint.z),
        waypoints: path.waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z))
    }))
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
    gameState.gold = 100;
    gameState.kingHealth = 100;
    gameState.currentRound = 1;
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
    gameState.interRoundTimer = window.roundConfig.interRoundTimer;
    gameState.workers = []; // Reset workers array
    
    // Initialize the paths array from config
    gameState.paths = window.pathConfig.paths;
    
    // Restore tower types
    gameState.towerTypes = savedTowerTypes;
    
    // Setup 3D scene
    setupScene();
    
    // Generate game environment
    generateTowerSlots();
    
    // Update UI
    updateUI();
    updateRoundTracker();
    updateAugmentTracker();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start game loop
    animate();
    
    // Show augment selection first
    showAugmentSelection();
    
    // Create worker camp and start first round only after augment selection
    function startGameAfterAugment() {
        // Remove the event listener
        document.removeEventListener('augmentSelected', startGameAfterAugment);
        
        // Create worker camp
        createWorkerCamp();
        updateBuyWorkerButton();
        updateWorkerList();
        
        // Start the first round with a delay to allow for scene setup
        setTimeout(() => {
            startRound();
        }, 1000);
    }
    
    // Listen for augment selection completion
    document.addEventListener('augmentSelected', startGameAfterAugment);
}

// Create creep mesh without using CapsuleGeometry
function createCreepMesh(creepType) {
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
    
    // Create paths
    if (!gameState.paths || gameState.paths.length === 0) {
        console.error('No paths defined in game state!');
        if (window.pathConfig && window.pathConfig.paths) {
            console.log('Initializing paths from config...');
            gameState.paths = window.pathConfig.paths;
        } else {
            console.error('Path configuration not found!');
            return;
        }
    }
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
    scene.add(rockGroup);
    return rockGroup;
}

// Generate tower slots along the path (modified for flat terrain)
function generateTowerSlots() {
    // Clear existing slots
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
        const slot = {
            position: new THREE.Vector3(position.x, 0.1, position.z),
            occupied: false,
            mesh: createTowerSlotMesh()
        };
        
        // Position the mesh
        slot.mesh.position.copy(slot.position);
        
        // Add to scene and game state
        scene.add(slot.mesh);
        gameState.towerSlots.push(slot);
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
    
    const delta = clock.getDelta();
    
    // Don't update game state if paused
    if (!gameState.isPaused) {
        updateCreeps(delta);
        updateTowers(delta);
        updateProjectiles(delta);
        updateWorkers(delta);
        updateCriticalHitParticles(delta);
        
        // Update any active animations
        if (gameState.activeAnimations) {
            for (let i = gameState.activeAnimations.length - 1; i >= 0; i--) {
                const animation = gameState.activeAnimations[i];
                const finished = animation(delta);
                if (finished) {
                    gameState.activeAnimations.splice(i, 1);
                }
            }
        }
    }
    
    // Always render
    renderer.render(scene, camera);
}

// Create a range indicator for towers
function createRangeIndicator(position, range) {
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

// Function to spawn a creep on a specific path
function spawnCreepOnPath(pathIndex) {
    if (!gameState.paths[pathIndex]) {
        console.error('Invalid path index:', pathIndex);
        return;
    }
    
    // Get current round definition
    const roundDef = window.roundConfig.rounds[gameState.currentRound - 1];
    if (!roundDef) {
        console.error('Invalid round definition');
        return;
    }
    
    // Get creep type definition
    const creepTypeDef = window.creepConfig.types[roundDef.type];
    if (!creepTypeDef) {
        console.error('Invalid creep type:', roundDef.type);
        return;
    }
    
    // Get spawn point
    const spawnPoint = gameState.paths[pathIndex].spawnPoint;
    if (!spawnPoint) {
        console.error('Invalid spawn point for path:', pathIndex);
        return;
    }
    
    // Initialize position as Vector3
    const position = new THREE.Vector3(spawnPoint.x, 0.5, spawnPoint.z);
    
    // Create creep
    const creep = {
        type: roundDef.type,
        health: creepTypeDef.baseStats.health,
        maxHealth: creepTypeDef.baseStats.health,
        speed: creepTypeDef.baseStats.speed,
        goldValue: creepTypeDef.baseStats.goldValue,
        damageToKing: creepTypeDef.baseStats.damageToKing,
        pathIndex: pathIndex,
        currentWaypointIndex: 0,
        position: position.clone(), // Initialize position as Vector3
        mesh: createCreepMesh(roundDef.type),
        effects: {
            slow: null,
            burn: null
        }
    };
    
    // Set mesh position to match creep position
    creep.mesh.position.copy(position);
    
    // Add to scene and game state
    scene.add(creep.mesh);
    gameState.creeps.push(creep);
    
    // Debug log
    console.log(`Spawned ${roundDef.type} creep on path ${pathIndex}`);
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
    
    // Add more particles for better visibility
    for (let i = 0; i < 12; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position around the creep
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.4 + Math.random() * 0.3;
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
    const crystalGeometry = new THREE.ConeGeometry(0.04, 0.2, 4);
    const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0xCCEEFF,
        transparent: true,
        opacity: 0.8,
        emissive: 0xCCEEFF,
        emissiveIntensity: 0.3
    });
    
    // Add more ice crystals for better coverage
    for (let i = 0; i < 8; i++) {
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        
        // Position crystals on the body surface
        const angle = Math.random() * Math.PI * 2;
        const height = Math.random() * 1.0 - 0.3;
        const radius = 0.3;
        
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
    
    // Add a larger frost aura effect
    const auraGeometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const auraMaterial = new THREE.MeshBasicMaterial({
        color: 0xADD8E6,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    
    const frostAura = new THREE.Mesh(auraGeometry, auraMaterial);
    frostAura.rotation.x = Math.PI / 2;
    frostAura.position.y = 0.05;
    
    // Add animation data
    frostAura.userData = {
        pulseTime: 0
    };
    
    particleGroup.add(frostAura);
    
    // Add a blue tint to the creep's material
    if (creep.mesh) {
        // Store original materials and create new ones for the slow effect
        creep.mesh.traverse((object) => {
            if (object.isMesh && object.material) {
                // Store original material
                object.userData.originalMaterial = object.material;
                
                // Create a new material for the slow effect
                const newMaterial = new THREE.MeshStandardMaterial({
                    color: 0x87CEEB,
                    transparent: true,
                    opacity: 0.8,
                    emissive: 0x87CEEB,
                    emissiveIntensity: 0.2,
                    metalness: object.material.metalness || 0,
                    roughness: object.material.roughness || 0.5,
                    side: object.material.side || THREE.FrontSide
                });
                
                // Apply the new material
                object.material = newMaterial;
            }
        });
    }
    
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
                }
                // Animate ice crystal growth
                if (particle.userData && particle.userData.growthStage !== undefined) {
                    if (particle.userData.growthStage < 1) {
                        particle.userData.growthStage += delta * particle.userData.growthRate;
                        const currentSize = Math.min(1, particle.userData.growthStage) * particle.userData.maxSize;
                        particle.scale.set(currentSize, currentSize, currentSize);
                    }
                }
                // Animate aura
                if (particle.geometry.type === 'RingGeometry') {
                    if (particle.userData) {
                        particle.userData.pulseTime += delta * 2;
                        const pulseSize = 1 + Math.sin(particle.userData.pulseTime) * 0.2;
                        particle.scale.set(pulseSize, pulseSize, 1);
                        particle.rotation.z += delta * 0.5;
                    }
                }
            });
            
            // Check if we still have slow effects
            if (this.slowEffects.length === 0 && this.slowEffectVisual) {
                // Remove the visual effect if no longer slowed
                this.mesh.remove(this.slowEffectVisual);
                this.slowEffectVisual = null;
                
                // Restore original materials
                this.mesh.traverse((object) => {
                    if (object.isMesh && object.userData.originalMaterial) {
                        object.material = object.userData.originalMaterial;
                    }
                });
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
    for (let i = gameState.creeps.length - 1; i >= 0; i--) {
        const creep = gameState.creeps[i];
        
        // Get the path for this creep
        const path = gameState.paths[creep.pathIndex];
        if (!path) {
            console.error('Creep has invalid path:', creep);
            continue;
        }

        // Get current and next waypoint
        const currentWaypoint = path.waypoints[creep.currentWaypointIndex];
        const nextWaypoint = path.waypoints[creep.currentWaypointIndex + 1];

        if (!nextWaypoint) {
            // Creep reached the end
            gameState.kingHealth -= creep.damageToKing || 10;
            updateKingHealth();
            scene.remove(creep.mesh);
            gameState.creeps.splice(i, 1);
            gameState.creepsReachedEnd++;
            continue;
        }

        // Ensure waypoints are Vector3s
        const nextWaypointVec = nextWaypoint instanceof THREE.Vector3 ? 
            nextWaypoint : new THREE.Vector3(nextWaypoint.x, nextWaypoint.y, nextWaypoint.z);

        // Calculate direction to next waypoint
        const direction = new THREE.Vector3();
        direction.subVectors(nextWaypointVec, creep.position).normalize();
        
        // Update creep position
        const distance = creep.speed * delta;
        creep.position.add(direction.multiplyScalar(distance));
        creep.mesh.position.copy(creep.position);
        
        // Check if we reached the next waypoint
        const distanceToWaypoint = creep.position.distanceTo(nextWaypointVec);
        if (distanceToWaypoint < 0.1) {
            creep.currentWaypointIndex++;
        }
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

    // Remove all workers
    gameState.workers.forEach(worker => {
        if (worker.mesh && scene.children.includes(worker.mesh)) {
            scene.remove(worker.mesh);
        }
    });
    
    // Clear all arrays
    gameState.creeps = [];
    gameState.towers = [];
    gameState.projectiles = [];
    gameState.towerSlots = [];
    gameState.workers = [];
    gameState.workerCount = 0;
    
    // Reset range indicator references
    gameState.selectedTower = null;
    gameState.towerSlotRangeIndicator = null;
    
    // Update worker UI
    updateWorkerList();
    updateBuyWorkerButton();
    
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
    if (!gameState.gameActive) return;
    
    if (gameState.isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

function pauseGame() {
    if (!gameState.gameActive || gameState.isPaused) return;
    
    gameState.isPaused = true;
    gameState.pauseStartTime = Date.now();
    
    // Pause all timers
    if (gameState.roundTimer) clearInterval(gameState.roundTimer);
    if (gameState.spawnTimer) clearInterval(gameState.spawnTimer);
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    
    // Show pause menu and backdrop
    const pauseMenu = document.getElementById('esc-menu');
    const pauseBackdrop = document.getElementById('esc-menu-backdrop');
    
    if (pauseMenu) {
        pauseMenu.classList.remove('hidden');
        pauseMenu.style.zIndex = '1000';
    }
    
    if (pauseBackdrop) {
        pauseBackdrop.classList.remove('hidden');
        pauseBackdrop.style.zIndex = '999';
    }
}

// And resumeGame function:
function resumeGame() {
    if (!gameState.gameActive || !gameState.isPaused) return;
    
    const pauseDuration = Date.now() - gameState.pauseStartTime;
    gameState.isPaused = false;
    
    // Hide pause menu and backdrop
    const pauseMenu = document.getElementById('esc-menu');
    const pauseBackdrop = document.getElementById('esc-menu-backdrop');
    
    if (pauseMenu) {
        pauseMenu.classList.add('hidden');
        pauseMenu.style.zIndex = 'auto';
    }
    
    if (pauseBackdrop) {
        pauseBackdrop.classList.add('hidden');
        pauseBackdrop.style.zIndex = 'auto';
    }
    
    // Adjust timers based on pause duration
    if (gameState.roundActive && gameState.roundStartTime) {
        gameState.roundStartTime += pauseDuration;
        
        // Restart round timer
        gameState.roundTimer = setInterval(() => {
            const elapsed = (Date.now() - gameState.roundStartTime) / 1000;
            updateRoundTimer();
            
            const roundDef = window.roundConfig.rounds[gameState.currentRound - 1];
            if (roundDef && elapsed >= roundDef.duration) {
                endRound();
            }
        }, 1000);
    } else if (!gameState.roundActive) {
        // Restart inter-round timer
        startInterRoundTimer();
    }
    
    // Reset clock to prevent large delta times
    clock.getDelta();
}

// Complete buildTower function implementation
function buildTower(towerType) {
    if (!gameState.selectedTowerSlot || !gameState.gold) return;
    
    const towerConfig = window.towerConfig[towerType];
    if (!towerConfig) {
        console.error('Invalid tower type:', towerType);
        return;
    }
    
    const baseRank = towerConfig.ranks[0];
    const towerCost = baseRank.cost;
    if (gameState.gold < towerCost) {
        console.log('Not enough gold to build tower');
        return;
    }
    
    // Deduct gold
    gameState.gold -= towerCost;
    updateGold();
    
    // Create tower
    const tower = {
        type: towerType,
        rank: 1,
        position: gameState.selectedTowerSlot.position.clone(),
        damage: baseRank.damage,
        attackSpeed: baseRank.attackSpeed,
        range: 8, // Default range
        attackTimer: 0,
        mesh: createTowerMesh(towerType, 1)
    };
    
    // Add special properties based on tower type
    if (towerType === 'frost') {
        tower.slowAmount = baseRank.slowAmount;
    }
    
    // Position tower
    tower.mesh.position.copy(gameState.selectedTowerSlot.position);
    
    // Add to scene and game state
    scene.add(tower.mesh);
    gameState.towers.push(tower);
    
    // Mark slot as occupied
    gameState.selectedTowerSlot.occupied = true;
    
    // Update UI
    updateTowerCount();
    updateTotalDamage();
    
    // Hide tower selection modal
    const towerSelection = document.getElementById('tower-selection');
    const towerSelectionBackdrop = document.getElementById('tower-selection-backdrop');
    
    if (towerSelection && towerSelectionBackdrop) {
        towerSelection.classList.add('hidden');
        towerSelectionBackdrop.classList.add('hidden');
    }
    
    // Clear selection and range indicator
    gameState.selectedTowerSlot = null;
    clearAllRangeIndicators();
}

// Update towers
function updateTowers(delta) {
    for (const tower of gameState.towers) {
        // Update attack timer
        tower.attackTimer = (tower.attackTimer || 0) + delta;
        
        // Check if tower can attack
        if (tower.attackTimer >= tower.attackSpeed) {
            // Find target(s)
            const targets = findTarget(tower);
            
            if (Array.isArray(targets)) {
                // Basic tower can hit multiple targets
                targets.forEach(target => {
                    if (target) fireProjectile(tower, target);
                });
            } else if (targets) {
                // Single target for other tower types
                fireProjectile(tower, targets);
            }
            
            // Reset attack timer if any target was found
            if ((Array.isArray(targets) && targets.length > 0) || targets) {
                tower.attackTimer = 0;
            }
        }
    }
}

function findTarget(tower) {
    let closestCreep = null;
    let closestDistance = tower.range;
    
    for (const creep of gameState.creeps) {
        const distance = getDistance3D(tower.mesh.position, creep.mesh.position);
        
        if (distance <= tower.range) {
            if (distance < closestDistance) {
                closestDistance = distance;
                closestCreep = creep;
            }
        }
    }
    
    return closestCreep;
}

// 5. Fire projectile with proper color and effects
function fireProjectile(tower, target, damageMultiplier = 1) {
    if (!target || !target.mesh || !target.mesh.position) {
        console.log('No valid target for projectile - missing mesh or position');
        return;
    }
    
    // Create projectile
    const projectile = {
        mesh: createProjectileMesh(window.towerConfig[tower.type].ranks[tower.rank - 1].color),
        position: tower.mesh.position.clone(),
        target: target,
        speed: 20,
        damage: tower.damage * damageMultiplier,
        towerType: tower.type,
        towerRank: tower.rank,
        reached: false
    };

    // Position projectile at tower's top
    projectile.mesh.position.copy(projectile.position);
    projectile.mesh.position.y += 2; // Start from tower's top
    
    // Add to scene and game state
    scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
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
            
            // Track damage for DPS calculation
            gameState.damageInCurrentSecond += damage;
            
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
            
            // Apply slow effect for frost tower projectiles
            if (projectile.type === 'frost') {
                const tower = gameState.towers.find(t => t.type === 'frost');
                if (tower) {
                    const slowAmount = gameState.towerTypes.frost.ranks[tower.rank - 1].slowEffect;
                    applySlowEffect(projectile.target, slowAmount, tower.rank);
                }
            }
            
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
    if (!gameState.gameActive || gameState.roundActive) {
        console.log('Cannot start round:', { gameActive: gameState.gameActive, roundActive: gameState.roundActive });
        return;
    }
    
    // Start with inter-round timer
    gameState.interRoundTimer = 10;
    updateRoundTimer();
    
    // Set up timer to start the round after delay
    const timerInterval = setInterval(() => {
        if (gameState.isPaused) return;
        
        gameState.interRoundTimer--;
        updateRoundTimer();
        
        if (gameState.interRoundTimer <= 0) {
            clearInterval(timerInterval);
            startRoundSpawning();
        }
    }, 1000);
    
    gameState.timerInterval = timerInterval;
}

function startRoundSpawning() {
    console.log('Starting round:', gameState.currentRound);
    
    // Get current round definition
    const roundDef = window.roundConfig.rounds[gameState.currentRound - 1];
    if (!roundDef) {
        console.error('Invalid round definition for round:', gameState.currentRound);
        return;
    }
    
    // Get spawn pattern for this round type
    const spawnPattern = window.roundConfig.spawnPatterns[roundDef.type];
    if (!spawnPattern) {
        console.error('No spawn pattern found for round type:', roundDef.type);
        return;
    }
    
    // Calculate round duration based on spawn pattern
    const spawnDuration = spawnPattern.totalCreeps * spawnPattern.spawnInterval;
    const bufferTime = 30; // 30 seconds buffer for creeps to reach the end
    roundDef.duration = spawnDuration + bufferTime;
    
    // Set round state
    gameState.roundActive = true;
    gameState.roundStartTime = Date.now();
    gameState.creepsSpawned = 0;
    gameState.creepsKilled = 0;
    gameState.creepsReachedEnd = 0;
    
    // Clear any existing timers
    if (gameState.roundTimer) clearInterval(gameState.roundTimer);
    if (gameState.spawnTimer) clearInterval(gameState.spawnTimer);
    
    console.log(`Round ${gameState.currentRound} configuration:`, {
        type: roundDef.type,
        creepsToSpawn: spawnPattern.totalCreeps,
        spawnInterval: spawnPattern.spawnInterval,
        duration: roundDef.duration
    });
    
    // Spawn first creep
    const pathIndex = Math.floor(Math.random() * gameState.paths.length);
    spawnCreepOnPath(pathIndex);
    gameState.creepsSpawned++;
    console.log(`Spawned first creep on path ${pathIndex}`);
    
    // Set up spawn timer for remaining creeps
    gameState.spawnTimer = setInterval(() => {
        if (!gameState.isPaused) {
            if (gameState.creepsSpawned < spawnPattern.totalCreeps) {
                const pathIndex = Math.floor(Math.random() * gameState.paths.length);
                spawnCreepOnPath(pathIndex);
                gameState.creepsSpawned++;
                console.log(`Spawned creep ${gameState.creepsSpawned}/${spawnPattern.totalCreeps} on path ${pathIndex}`);
            } else {
                clearInterval(gameState.spawnTimer);
                console.log('Finished spawning all creeps for this round');
            }
        }
    }, spawnPattern.spawnInterval * 1000);
}

function updateRoundTimer() {
    const timerElement = document.getElementById('round-timer');
    if (!timerElement) return;
    
    if (!gameState.gameActive) {
        timerElement.textContent = 'Game not active';
        return;
    }
    
    if (!gameState.roundActive) {
        // Show inter-round countdown
        const timer = Math.max(0, Math.floor(gameState.interRoundTimer));
        timerElement.textContent = `Next round in: ${timer}s`;
    } else {
        // Show current round number
        timerElement.textContent = `Round: ${gameState.currentRound}/${window.roundConfig.maxRounds}`;
    }
}

function endRound() {
    if (!gameState.roundActive) return;
    
    // Clear round timer
    if (gameState.roundTimer) {
        clearInterval(gameState.roundTimer);
        gameState.roundTimer = null;
    }
    
    // Clear spawn timer
    if (gameState.spawnTimer) {
        clearInterval(gameState.spawnTimer);
        gameState.spawnTimer = null;
    }
    
    // Check if round was successful
    const roundDef = window.roundConfig.rounds[gameState.currentRound - 1];
    const success = gameState.creepsReachedEnd < roundDef.maxCreepsReached;
    
    if (success) {
        // Round completed successfully
        gameState.currentRound++;
        gameState.roundsCompleted++;
        
        // Check for game victory
        if (gameState.currentRound > window.roundConfig.maxRounds) {
            showGameOverScreen(true);
            return;
        }
        
        // Start inter-round timer
        startInterRoundTimer();
    } else {
        // Round failed
        showGameOverScreen(false);
    }
    
    // Reset round state
    gameState.roundActive = false;
    gameState.roundStartTime = null;
    gameState.creepsSpawned = 0;
    gameState.creepsKilled = 0;
    gameState.creepsReachedEnd = 0;
    
    // Clear all creeps
    gameState.creeps.forEach(creep => {
        scene.remove(creep.mesh);
    });
    gameState.creeps = [];
    
    // Clear all projectiles
    gameState.projectiles.forEach(projectile => {
        scene.remove(projectile.mesh);
    });
    gameState.projectiles = [];
    
    console.log(`Round ${gameState.currentRound - 1} ended. Success: ${success}`);
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
    // Clear previous selections and indicators
    clearAllRangeIndicators();
    
    // Update selected tower
    gameState.selectedTower = tower;
    gameState.selectedTowerSlot = null;
    
    // Show tower actions modal
    const towerActions = document.getElementById('tower-actions');
    const towerSelectionBackdrop = document.getElementById('tower-selection-backdrop');
    
    if (towerActions && towerSelectionBackdrop) {
    towerActions.classList.remove('hidden');
        towerSelectionBackdrop.classList.remove('hidden');
    
    // Update tower details
        document.getElementById('tower-details-name').textContent = `${tower.type.charAt(0).toUpperCase() + tower.type.slice(1)} Tower`;
        document.getElementById('tower-details-damage').textContent = `Damage: ${tower.damage}`;
    document.getElementById('tower-details-speed').textContent = `Attack Speed: ${tower.attackSpeed}s`;
    document.getElementById('tower-details-rank').textContent = `Rank: ${tower.rank}`;
    
        // Update upgrade and sell costs
        const upgradeCost = window.towerConfig[tower.type].ranks[tower.rank].cost;
        const sellValue = Math.floor(upgradeCost * 0.75);
        
        document.getElementById('upgrade-tower').textContent = `Upgrade (${upgradeCost} Gold)`;
        document.getElementById('sell-tower').textContent = `Sell (${sellValue} Gold)`;
    }
    
    // Create range indicator for the tower
    const rangeIndicator = createRangeIndicator(tower.mesh.position, tower.range);
    rangeIndicator.userData.type = 'rangeIndicator';
    scene.add(rangeIndicator);
}

// 8. Upgrade tower function to handle frost tower upgrades
function upgradeTower() {
    if (!gameState.selectedTower) return;
    
    const tower = gameState.selectedTower;
    const towerType = gameState.towerTypes[tower.type];
    
    // Check tower rank
    if (tower.rank >= 5) return;
    
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
    } else if (tower.type === 'fire') {
        tower.critChance = newRankData.critChance;
        tower.critMultiplier = newRankData.critMultiplier;
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
    updateBuyWorkerButton();
}

function updateTowerCount() {
    document.getElementById('tower-count').textContent = gameState.towerCount;
}

function updateTotalDamage() {
    const currentTime = performance.now() / 1000; // Convert to seconds
    
    // Update DPS every second
    if (currentTime - gameState.lastDPSUpdateTime >= 1.0) {
        gameState.currentDPS = gameState.damageInCurrentSecond;
        gameState.damageInCurrentSecond = 0;
        gameState.lastDPSUpdateTime = currentTime;
    }
    
    document.getElementById('total-damage').textContent = Math.round(gameState.currentDPS);
}

function updateRoundCounter() {
    // Show the actual round number (no need to add 1 since we increment at start of startRound)
    document.getElementById('round-counter').textContent = `Round: ${gameState.currentRound}/${gameState.maxRounds}`;
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

    const buyWorkerBtn = document.getElementById('buy-worker');
    buyWorkerBtn.addEventListener('click', buyWorker);
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
    if (!gameState.gameActive) return;
    
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
    // Check for tower slot hits
    const towerSlotIntersects = raycaster.intersectObjects(
        gameState.towerSlots.filter(slot => !slot.occupied).map(slot => slot.mesh)
    );
    
    // Check for existing tower hits
    const towerIntersects = raycaster.intersectObjects(
        gameState.towers.map(tower => tower.mesh)
    );
    
    // Clear range indicators if clicking on empty space
    if (towerSlotIntersects.length === 0 && towerIntersects.length === 0) {
        clearAllRangeIndicators();
        gameState.selectedTowerSlot = null;
        gameState.selectedTower = null;
        updateUI();
        return;
    }
    
    // Handle tower slot selection
    if (towerSlotIntersects.length > 0) {
        const slotMesh = towerSlotIntersects[0].object;
        const slot = gameState.towerSlots.find(s => s.mesh === slotMesh);
        if (slot && !slot.occupied) {
                selectTowerSlot(slot);
        }
                return;
            }
    
    // Handle tower selection
    if (towerIntersects.length > 0) {
        const towerMesh = towerIntersects[0].object;
        const tower = gameState.towers.find(t => t.mesh === towerMesh);
        if (tower) {
            selectTower(tower);
        }
    }
}


// Also modify the selectTowerSlot function to call setupTowerSelectionListeners
function selectTowerSlot(slot) {
    // Clear previous selections and indicators
    clearAllRangeIndicators();
    
    // Update selected slot
    gameState.selectedTowerSlot = slot;
    gameState.selectedTower = null;
    
    // Show tower selection modal
    const towerSelection = document.getElementById('tower-selection');
    const towerSelectionBackdrop = document.getElementById('tower-selection-backdrop');
    
    if (towerSelection && towerSelectionBackdrop) {
        towerSelection.classList.remove('hidden');
        towerSelectionBackdrop.classList.remove('hidden');
        
        // Add click handler to backdrop for closing
        towerSelectionBackdrop.onclick = function(event) {
            if (event.target === towerSelectionBackdrop) {
                // Hide modals
                towerSelection.classList.add('hidden');
                towerSelectionBackdrop.classList.add('hidden');
                
                // Clear selection and range indicator
            gameState.selectedTowerSlot = null;
                clearAllRangeIndicators();
            }
        };
    }
    
    // Create range indicator for the slot
    const rangeIndicator = createRangeIndicator(slot.position, 8); // Default range of 8
    rangeIndicator.userData.type = 'rangeIndicator';
    scene.add(rangeIndicator);
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
    // Remove all range indicators from the scene
    scene.children.forEach(child => {
        if (child.userData && child.userData.type === 'rangeIndicator') {
            scene.remove(child);
        }
    });
}

// Apply slow effect to a creep
function applySlowEffect(creep, slowAmount, towerRank) {
    // Add slow effect to creep's effects array
    creep.slowEffects.push({
        amount: slowAmount,
        remainingTime: 5.0, // Slow effect lasts for 5 seconds
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

function createDamageTexture(damage, isCritical = false) {
    // Create a canvas element for the damage number
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
    
    return texture;
}

function createFloatingDamageNumber(position, damage, isCritical = false) {
    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: createDamageTexture(damage, isCritical),
            transparent: true,
            opacity: 1,
            depthTest: false // Ensure it's always visible
        })
    );
    
    // Set initial position and scale
    sprite.position.copy(position);
    sprite.position.y += 1; // Start above the target
    sprite.scale.set(2, 1, 1); // Make the sprite wider for better readability
    
    scene.add(sprite);
    
    const startTime = Date.now();
    const duration = 1000; // Animation duration in ms
    const startY = sprite.position.y;
    
    const animation = function(delta) {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress >= 1) {
            scene.remove(sprite);
            sprite.material.dispose();
            sprite.material.map.dispose();
            return true; // Animation complete
        }
        
        // Pop-up and fade effect
        const scaleProgress = Math.min(1, progress * 2); // Faster scale animation
        const fadeProgress = Math.max(0, 1 - (progress * 1.5)); // Start fading earlier
        
        // Move upward with easing
        sprite.position.y = startY + (progress * 1.5); // Float up 1.5 units
        
        // Scale effect
        const scale = 1 + (0.5 * (1 - scaleProgress)); // Start 50% larger and shrink to normal
        sprite.scale.set(2 * scale, scale, 1);
        
        // Fade out
        sprite.material.opacity = fadeProgress;
        
        return false; // Continue animation
    };
    
    // Add to active animations
    if (!gameState.activeAnimations) gameState.activeAnimations = [];
    gameState.activeAnimations.push(animation);
}

// Function to show augment selection modal
function showAugmentSelection() {
    const augmentModal = document.getElementById('augment-modal');
    if (!augmentModal) return;
    
    // Get available augments
    const availableAugments = window.augmentConfig.available || [];
    
    // Filter out already active augments
    const activeAugmentIds = gameState.activeAugments.map(a => a.id);
    const availableAugmentChoices = availableAugments.filter(augment => !activeAugmentIds.includes(augment.id));
    
    // Randomly select exactly 3 augments
    const selectedAugments = [];
    const tempChoices = [...availableAugmentChoices];
    while (selectedAugments.length < 3 && tempChoices.length > 0) {
        const randomIndex = Math.floor(Math.random() * tempChoices.length);
        const augment = tempChoices.splice(randomIndex, 1)[0];
        selectedAugments.push(augment);
    }
    
    // Get the augment options container
    const augmentOptions = augmentModal.querySelector('.augment-options');
    if (!augmentOptions) return;
    
    // Clear existing options
    augmentOptions.innerHTML = '';
    
    // Create only the randomly selected augment options
    selectedAugments.forEach(augment => {
        const option = document.createElement('div');
        option.className = 'augment-option';
        option.innerHTML = `
            <div class="augment-icon ${augment.icon}"></div>
            <div class="augment-info">
                <div class="augment-name">${augment.name}</div>
                <div class="augment-description">${augment.description}</div>
            </div>
        `;
        option.onclick = () => selectAugment(augment);
        augmentOptions.appendChild(option);
    });
    
    // Show augment selection
    augmentModal.classList.remove('hidden');
    gameState.isPaused = true;
}

// Function to handle augment selection
function selectAugment(augment) {
    // Add augment to active augments
    gameState.activeAugments.push(augment);
    
    // Apply the augment effect
    if (augment.id === 'golden-towers') {
        augment.effect();
    } else {
        gameState.towers.forEach(tower => augment.effect(tower));
    }
    
    // Hide the augment selection
    const augmentModal = document.getElementById('augment-modal');
    if (augmentModal) {
        augmentModal.classList.add('hidden');
    }
    
    // Update the augment tracker
    updateAugmentTracker();
    
    // Unpause the game
    gameState.isPaused = false;
    
    // Dispatch the augmentSelected event
    document.dispatchEvent(new Event('augmentSelected'));
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
    if (!augmentList) return;
    
    augmentList.innerHTML = ''; // Clear existing augments
    
    // Add each active augment to the tracker
    gameState.activeAugments.forEach(augment => {
        const augmentItem = document.createElement('div');
        augmentItem.className = 'augment-item';
        
        augmentItem.innerHTML = `
            <div class="augment-icon-small ${augment.icon}"></div>
            <div class="augment-info-small">
                <div class="augment-name-small">${augment.name}</div>
                <div class="augment-description-small">${augment.description}</div>
            </div>
        `;
        
        augmentList.appendChild(augmentItem);
    });
}

function createWorkerMesh() {
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

function createWorkerCamp() {
    // Add some decorative elements
    const tentGeometry = new THREE.ConeGeometry(1, 2, 4);
    const tentMaterial = new THREE.MeshPhongMaterial({ color: 0x8B0000 });
    const tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.set(-35, 1, 0);
    scene.add(tent);

    // Create exactly 10 mining spots (rocks) in a grid pattern
    const rockPositions = [
        // Row 1 (back)
        { x: -40, z: -4 },
        { x: -40, z: -2 },
        { x: -40, z: 0 },
        { x: -40, z: 2 },
        { x: -40, z: 4 },
        // Row 2 (front)
        { x: -30, z: -4 },
        { x: -30, z: -2 },
        { x: -30, z: 0 },
        { x: -30, z: 2 },
        { x: -30, z: 4 }
    ];

    rockPositions.forEach(pos => {
        const rock = createRock(pos.x, pos.z);
        rock.userData.type = 'mining-rock';
        rock.userData.isOccupied = false;
    });

    // Update buy button state
    updateBuyWorkerButton();
}

function updateBuyWorkerButton() {
    const buyWorkerBtn = document.getElementById('buy-worker');
    if (!buyWorkerBtn) return;
    
    const workerCost = window.workerConfig.base.cost;
    const canAfford = gameState.gold >= workerCost;
    const maxWorkers = window.workerConfig.base.maxWorkers;
    const canBuyMore = gameState.workers.length < maxWorkers;
    
    buyWorkerBtn.disabled = !canAfford || !canBuyMore;
    buyWorkerBtn.style.backgroundColor = (canAfford && canBuyMore) ? '#4CAF50' : '#cccccc';
    buyWorkerBtn.style.cursor = (canAfford && canBuyMore) ? 'pointer' : 'not-allowed';
}

function buyWorker() {
    const workerCost = window.workerConfig.base.cost;
    const maxWorkers = window.workerConfig.base.maxWorkers;
    
    // Check if we can afford and have room for another worker
    if (gameState.gold >= workerCost && gameState.workers.length < maxWorkers) {
        // Deduct gold
        gameState.gold -= workerCost;
            updateGold();

        // Create new worker
            const worker = {
            id: Date.now(),
                mesh: createWorkerMesh(),
            targetRock: null,
            miningTimer: 0,
            miningInterval: window.workerConfig.base.miningInterval,
            goldPerMining: window.workerConfig.base.goldPerMining
        };
        
        // Position worker at camp
        const campPosition = window.workerConfig.camp.position;
        worker.mesh.position.set(campPosition.x, 0, campPosition.z);
        
        // Add to scene and game state
        scene.add(worker.mesh);
        gameState.workers.push(worker);
        
        // Find an available rock
        const availableRocks = scene.children.filter(child => 
            child.userData.type === 'mining-rock' && !child.userData.isOccupied
        );
        
        if (availableRocks.length > 0) {
            const targetRock = availableRocks[0];
            targetRock.userData.isOccupied = true;
            worker.targetRock = targetRock;
            worker.mesh.position.copy(targetRock.position);
        }
        
        // Update UI
            updateWorkerList();
            updateBuyWorkerButton();
    }
}

function updateWorkers(delta) {
    gameState.workers.forEach(worker => {
        if (worker.targetRock) {
            worker.miningTimer += delta;
            if (worker.miningTimer >= gameState.workerMiningInterval) {
                worker.miningTimer = 0;
                gameState.gold += gameState.goldPerWorker;
                updateGold();
            }
        }
    });
}

function updateWorkerList() {
    const workerList = document.getElementById('worker-list');
    workerList.innerHTML = '';
    
    if (gameState.workers.length === 0) {
        const message = document.createElement('div');
        message.className = 'worker-message';
        message.textContent = 'No workers yet';
        workerList.appendChild(message);
        return;
    }
    
    gameState.workers.forEach(worker => {
        const workerItem = document.createElement('div');
        workerItem.className = 'worker-item';
        
        const icon = document.createElement('div');
        icon.className = 'worker-icon';
        
        const info = document.createElement('div');
        info.className = 'worker-info';
        
        const name = document.createElement('div');
        name.className = 'worker-name';
        name.textContent = worker.id;
        
        const status = document.createElement('div');
        status.className = 'worker-status';
        status.textContent = worker.targetRock ? 'Mining' : 'Idle';
        
        info.appendChild(name);
        info.appendChild(status);
        workerItem.appendChild(icon);
        workerItem.appendChild(info);
        workerList.appendChild(workerItem);
    });
}

function createForestEnvironment() {
    // Empty function - we don't want trees or rocks anymore
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.4, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x4a2f10 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    treeGroup.add(trunk);
    
    // Create leaves
    const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a27 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 2.5;
    treeGroup.add(leaves);
    
    // Position the tree
    treeGroup.position.set(x, 0, z);
    
    // Add to scene
    scene.add(treeGroup);
}

function createTowerSlotMesh() {
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