// Worker configuration definitions
export const workerConfig = {
  // Base worker properties
  base: {
    cost: 3,
    speed: 2,
    miningInterval: 2.0,
    goldPerMining: 1,
    maxWorkers: 5,
  },

  // Worker camp location
  camp: {
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    radius: 2,
    visual: {
      color: 0x8b4513,
      opacity: 0.8,
    },
  },

  // Mining rock properties
  rocks: {
    count: 5,
    respawnTime: 30,
    visual: {
      color: 0x8b4513,
      scale: { x: 1, y: 1, z: 1 },
    },
  },

  // Worker visual properties
  visual: {
    bodyColor: 0x8b4513,
    eyeColor: 0xffff00,
    scale: { x: 0.8, y: 1.2, z: 0.8 },
    particles: {
      count: 3,
      color: 0xffd700,
      emissiveIntensity: 0.3,
    },
  },

  // Worker status indicators
  status: {
    idle: {
      color: 0x808080,
      text: "Idle",
    },
    moving: {
      color: 0x00ff00,
      text: "Moving",
    },
    mining: {
      color: 0xffd700,
      text: "Mining",
    },
  },
};
