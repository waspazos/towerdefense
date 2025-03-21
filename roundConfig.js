// Round configuration definitions
window.roundConfig = {
    // Game settings
    maxRounds: 20,
    interRoundTimer: 10,
    
    // Round definitions with difficulty scaling
    rounds: [
        { type: "fast", difficulty: 1 },
        { type: "armored", difficulty: 1 },
        { type: "swarm", difficulty: 1 },
        { type: "fast", difficulty: 2 },
        { type: "boss", difficulty: 1 },
        { type: "armored", difficulty: 2 },
        { type: "swarm", difficulty: 2 },
        { type: "fast", difficulty: 3 },
        { type: "armored", difficulty: 3 },
        { type: "boss", difficulty: 2 },
        { type: "swarm", difficulty: 3 },
        { type: "fast", difficulty: 4 },
        { type: "armored", difficulty: 4 },
        { type: "swarm", difficulty: 4 },
        { type: "boss", difficulty: 3 },
        { type: "fast", difficulty: 5 },
        { type: "armored", difficulty: 5 },
        { type: "swarm", difficulty: 5 },
        { type: "fast", difficulty: 6 },
        { type: "boss", difficulty: 4 }
    ],

    // Spawn patterns for different round types
    spawnPatterns: {
        fast: {
            spawnInterval: 1.5,  // seconds between spawns
            groupSize: 1,
            totalCreeps: 8
        },
        armored: {
            spawnInterval: 3,
            groupSize: 1,
            totalCreeps: 5
        },
        swarm: {
            spawnInterval: 0.8,
            groupSize: 2,
            totalCreeps: 12
        },
        boss: {
            spawnInterval: 0,
            groupSize: 1,
            totalCreeps: 1
        }
    },

    // Special round events
    specialEvents: {
        augmentSelection: {
            rounds: [0, 6],  // Rounds where augment selection appears
            duration: 30     // Seconds to choose an augment
        }
    },

    // Round rewards
    rewards: {
        gold: {
            base: 10,
            difficultyMultiplier: 1.2
        },
        experience: {
            base: 100,
            difficultyMultiplier: 1.5
        }
    }
}; 