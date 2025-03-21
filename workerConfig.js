// Worker configuration definitions
window.workerConfig = {
    // Base worker properties
    base: {
        cost: 4,
        goldPerMining: 1,
        miningInterval: 8,  // seconds
        maxWorkers: 5,
        health: 100,
        speed: 2
    },

    // Visual properties
    visual: {
        bodyColor: 0x8B4513,  // Brown
        eyeColor: 0xFFFF00,   // Yellow
        scale: { x: 0.8, y: 1.2, z: 0.8 },
        pickaxeColor: 0x808080,  // Gray
        miningEffect: {
            particleColor: 0xFFD700,  // Gold
            particleCount: 5,
            particleSize: 0.1,
            particleOpacity: 0.8
        }
    },

    // Worker camp properties
    camp: {
        position: { x: -20, y: 0, z: 0 },
        size: { width: 3, height: 3 },
        color: 0x8B4513,  // Brown
        borderColor: 0x654321  // Darker brown
    },

    // Worker UI properties
    ui: {
        buttonColor: '#8B4513',
        buttonHoverColor: '#A0522D',
        listBackgroundColor: '#F5DEB3',
        workerIconSize: 32
    },

    // Worker animations
    animations: {
        idle: {
            duration: 2,
            scale: { min: 0.95, max: 1.05 }
        },
        mining: {
            duration: 0.5,
            rotation: { min: -0.2, max: 0.2 }
        },
        walking: {
            duration: 0.3,
            bobHeight: 0.1
        }
    }
}; 