// Round configuration definitions
export const roundConfig = {
  rounds: [], // Will be populated by initialize()
  
  // Round types and their properties
  types: {
    fast: {
      name: "Fast Round",
      description: "Quick enemies with less health",
      creepTypes: ["fast"],
      spawnInterval: 1.0,
      difficulty: 1,
    },
    armored: {
      name: "Armored Round",
      description: "Heavily armored enemies",
      creepTypes: ["armored"],
      spawnInterval: 2.0,
      difficulty: 1,
    },
    swarm: {
      name: "Swarm Round",
      description: "Large numbers of weak enemies",
      creepTypes: ["swarm"],
      spawnInterval: 0.5,
      difficulty: 1,
    },
    boss: {
      name: "Boss Round",
      description: "A powerful boss enemy",
      creepTypes: ["boss"],
      spawnInterval: 5.0,
      difficulty: 2,
    },
  },

  // Round progression
  progression: [
    { type: "fast", count: 10 },
    { type: "armored", count: 8 },
    { type: "swarm", count: 15 },
    { type: "boss", count: 1 },
    { type: "fast", count: 12 },
    { type: "armored", count: 10 },
    { type: "swarm", count: 20 },
    { type: "boss", count: 1 },
    { type: "fast", count: 15 },
    { type: "armored", count: 12 },
    { type: "swarm", count: 25 },
    { type: "boss", count: 1 },
    { type: "fast", count: 18 },
    { type: "armored", count: 15 },
    { type: "swarm", count: 30 },
    { type: "boss", count: 1 },
    { type: "fast", count: 20 },
    { type: "armored", count: 18 },
    { type: "swarm", count: 35 },
    { type: "boss", count: 1 },
  ],

  // Spawn patterns for each round type
  spawnPatterns: {
    fast: {
      totalCreeps: 10,
      spawnInterval: 1.0,
    },
    armored: {
      totalCreeps: 8,
      spawnInterval: 2.0,
    },
    swarm: {
      totalCreeps: 15,
      spawnInterval: 0.5,
    },
    boss: {
      totalCreeps: 1,
      spawnInterval: 5.0,
    }
  },

  // Round settings
  settings: {
    maxRounds: 20,
    roundDelay: 10, // seconds between rounds
    difficultyIncrease: 0.2, // 20% increase per round
    bossRounds: [4, 8, 12, 16, 20], // rounds where boss appears
  },
  
  // Timer between rounds
  interRoundTimer: 10, // seconds between rounds
  
  // Initialize method to populate rounds array from progression data
  initialize() {
    // Clear the rounds array
    this.rounds = [];
    
    // Populate rounds from progression data
    this.progression.forEach((progItem, index) => {
      // Calculate difficulty based on round number
      const difficulty = Math.floor(index / 4) + 1;
      
      // Create a new round definition based on progression type
      const roundDef = {
        type: progItem.type,
        count: progItem.count,
        difficulty: difficulty
      };
      
      // Add to rounds array
      this.rounds.push(roundDef);
    });
    
    console.log(`Initialized ${this.rounds.length} rounds`);
  }
};