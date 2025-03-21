// Augment configuration definitions
export const augmentConfig = {
    // Augment types and their properties
    types: {
        damageBoost: {
            name: "Damage Boost",
            description: "Increases all tower damage by 20%",
            effect: {
                type: "damage",
                multiplier: 1.2
            },
            visual: {
                color: 0xFF0000,
                particleCount: 10
            }
        },
        attackSpeed: {
            name: "Attack Speed",
            description: "Increases all tower attack speed by 15%",
            effect: {
                type: "attackSpeed",
                multiplier: 0.85 // 15% faster = 85% of original time
            },
            visual: {
                color: 0x00FF00,
                particleCount: 8
            }
        },
        rangeBoost: {
            name: "Range Boost",
            description: "Increases all tower range by 25%",
            effect: {
                type: "range",
                multiplier: 1.25
            },
            visual: {
                color: 0x0000FF,
                particleCount: 12
            }
        },
        goldBoost: {
            name: "Gold Boost",
            description: "Increases gold earned by 30%",
            effect: {
                type: "gold",
                multiplier: 1.3
            },
            visual: {
                color: 0xFFFF00,
                particleCount: 15
            }
        },
        slowBoost: {
            name: "Slow Boost",
            description: "Increases slow effect by 40%",
            effect: {
                type: "slow",
                multiplier: 1.4
            },
            visual: {
                color: 0x00FFFF,
                particleCount: 10
            }
        },
        critBoost: {
            name: "Critical Boost",
            description: "Increases critical hit chance by 20%",
            effect: {
                type: "crit",
                multiplier: 1.2
            },
            visual: {
                color: 0xFF00FF,
                particleCount: 8
            }
        }
    },

    // Augment selection settings
    selection: {
        maxAugments: 3,
        selectionTime: 30, // seconds to choose an augment
        rounds: [5, 10, 15] // rounds where augment selection appears
    },

    // Visual effects for active augments
    effects: {
        active: {
            particleCount: 5,
            particleSize: 0.1,
            particleSpeed: 0.5,
            particleLifetime: 2.0
        }
    }
};