// Path configuration definitions
export const pathConfig = {
  // Path types and their properties
  types: {
    main: {
      name: "Main Path",
      description: "The primary path to the king",
      width: 2,
      visual: {
        color: 0xff0000,
        opacity: 0.8,
      },
    }
  },

  // Path definitions
  paths: [
    {
      type: "main",
      spawnPoint: { x: -20, y: 0, z: -20 },
      waypoints: [
        { x: -20, y: 0, z: -20 }, // Start
        { x: 20, y: 0, z: -20 },  // Right
        { x: 20, y: 0, z: -15 },  // Down
        { x: -20, y: 0, z: -15 }, // Left
        { x: -20, y: 0, z: -10 }, // Down
        { x: 20, y: 0, z: -10 },  // Right
        { x: 20, y: 0, z: -5 },   // Down
        { x: -20, y: 0, z: -5 },  // Left
        { x: -20, y: 0, z: 0 },   // Down
        { x: 20, y: 0, z: 0 },    // Right
        { x: 20, y: 0, z: 5 },    // Down
        { x: -20, y: 0, z: 5 },   // Left
        { x: -20, y: 0, z: 10 },  // Down
        { x: 20, y: 0, z: 10 },   // Right
        { x: 20, y: 0, z: 15 },   // Down
        { x: -20, y: 0, z: 15 },  // Left
        { x: -20, y: 0, z: 20 },  // Down
        { x: 20, y: 0, z: 20 },   // Final stretch to king
      ],
      endPoint: { x: 20, y: 0, z: 20 },
    }
  ],

  // Path visual effects
  effects: {
    spawn: {
      particleCount: 10,
      particleColor: 0xff0000,
      particleOpacity: 0.8,
      particleSize: 0.2,
    },
    waypoint: {
      radius: 0.5,
      color: 0x00ff00,
      opacity: 0.5,
    },
    endPoint: {
      radius: 1,
      color: 0xff0000,
      opacity: 0.8,
    },
  },

  // Initialize method to set up paths
  initialize() {
    console.log("PathConfig: Initialized");
  }
};