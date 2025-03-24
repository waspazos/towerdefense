// Round configuration definitions
export const roundConfig = {
  // Maximum number of rounds
  maxRounds: 20,
  
  // Time between rounds (seconds)
  interRoundTimer: 10,
  
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

  // Round progression
  rounds: [
    { type: "fast", count: 10 },
    { type: "armored", count: 8 },
    { type: "swarm", count: 15 },
    { type: "fast", count: 12 },
    { type: "boss", count: 1 },
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
  
  // Initialize method to set up rounds array
  initialize() {
    console.log(`Initialized ${this.rounds.length} rounds`);
  }
};