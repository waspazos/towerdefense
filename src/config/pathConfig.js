import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

// Path configuration definitions
export const pathConfig = {
    // Path types and their properties
    types: {
        main: {
            name: "Main Path",
            description: "The primary path to the king",
            width: 2,
            visual: {
                color: 0x8B4513,
                opacity: 0.8
            }
        },
        side: {
            name: "Side Path",
            description: "Alternative path to the king",
            width: 1.5,
            visual: {
                color: 0x8B4513,
                opacity: 0.6
            }
        }
    },

    // Path definitions
    paths: [
        {
            type: "main",
            spawnPoint: { x: -20, y: 0, z: 0 },
            waypoints: [
                { x: -20, y: 0, z: 0 },
                { x: -10, y: 0, z: 0 },
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 0, z: 0 },
                { x: 20, y: 0, z: 0 }
            ],
            endPoint: { x: 20, y: 0, z: 0 }
        },
        {
            type: "side",
            spawnPoint: { x: -20, y: 0, z: 10 },
            waypoints: [
                { x: -20, y: 0, z: 10 },
                { x: -10, y: 0, z: 10 },
                { x: 0, y: 0, z: 10 },
                { x: 10, y: 0, z: 10 },
                { x: 20, y: 0, z: 10 }
            ],
            endPoint: { x: 20, y: 0, z: 10 }
        }
    ],

    // Path visual effects
    effects: {
        spawn: {
            particleCount: 10,
            particleColor: 0xFF0000,
            particleOpacity: 0.8,
            particleSize: 0.2
        },
        waypoint: {
            radius: 0.5,
            color: 0x00FF00,
            opacity: 0.5
        },
        endPoint: {
            radius: 1,
            color: 0xFF0000,
            opacity: 0.8
        }
    }
};