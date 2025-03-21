// Creep configuration definitions
window.creepConfig = {
    // Base creep types and their properties
    types: {
        fast: {
            name: "Fast",
            description: "Quick enemy units with less health",
            baseStats: {
                health: 50,
                speed: 3,
                damageToKing: 10,
                goldValue: 1
            },
            visual: {
                bodyColor: 0x00FF00,
                eyeColor: 0xFFFF00,
                hornColor: 0x006600,
                scale: { x: 0.8, y: 1.8, z: 0.8 },
                speedLines: {
                    count: 3,
                    color: 0x00FF00,
                    emissiveIntensity: 0.3
                }
            }
        },
        armored: {
            name: "Armored",
            description: "Heavily armored, resistant to damage",
            baseStats: {
                health: 150,
                speed: 1.5,
                damageToKing: 20,
                goldValue: 2
            },
            visual: {
                bodyColor: 0x808080,
                eyeColor: 0xFF0000,
                hornColor: 0x404040,
                scale: { x: 1.2, y: 1.2, z: 1.2 },
                hasArmor: true,
                armorColor: 0xCCCCCC
            }
        },
        swarm: {
            name: "Swarm",
            description: "Large numbers of weak enemies",
            baseStats: {
                health: 30,
                speed: 2,
                damageToKing: 5,
                goldValue: 1
            },
            visual: {
                bodyColor: 0x800080,
                eyeColor: 0xFF00FF,
                hornColor: 0x400040,
                scale: { x: 0.7, y: 0.7, z: 0.7 },
                particles: {
                    count: 8,
                    color: 0xAA00AA,
                    emissiveIntensity: 0.3,
                    opacity: 0.7
                }
            }
        },
        boss: {
            name: "Boss",
            description: "A powerful enemy that appears every 5 rounds",
            baseStats: {
                health: 500,
                speed: 1,
                damageToKing: 50,
                goldValue: 10
            },
            visual: {
                bodyColor: 0x8B0000,
                eyeColor: 0xFF0000,
                hornColor: 0x4A0404,
                scale: { x: 2, y: 2, z: 2 },
                aura: {
                    color: 0xFF0000,
                    opacity: 0.3,
                    radius: { inner: 0.8, outer: 1.2 }
                },
                spikes: {
                    count: 8,
                    color: 0x4A0404,
                    size: { radius: 0.1, height: 0.3 }
                }
            }
        }
    },

    // Difficulty scaling for different rounds
    difficultyScaling: {
        health: 1.2,    // 20% increase per difficulty level
        speed: 1.1,     // 10% increase per difficulty level
        goldValue: 1.1  // 10% increase per difficulty level
    },

    // Visual effects configuration
    effects: {
        slow: {
            particleCount: 12,
            particleColor: 0x87CEFA,
            particleOpacity: 0.7,
            particleEmissiveIntensity: 0.5,
            crystalCount: 8,
            crystalColor: 0xCCEEFF,
            crystalOpacity: 0.8,
            crystalEmissiveIntensity: 0.3,
            auraColor: 0xADD8E6,
            auraOpacity: 0.4
        },
        burn: {
            particleCount: 10,
            particleColor: 0xFF4500,
            particleOpacity: 0.8,
            particleEmissiveIntensity: 0.6
        }
    }
}; 