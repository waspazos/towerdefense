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
        maxActive: 3,
        choicesPerSelection: 3,
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
    },
    
    // Available augments that can be selected during gameplay
    available: [
        {
            id: 'towers-of-rage',
            name: 'Towers of Rage',
            description: 'Towers gain 5% damage each time they attack, up to 50% bonus',
            effect: function(tower) {
                // Implementation details
                if (!tower.rageBonus) {
                    tower.rageBonus = 0;
                }
                
                if (tower.rageBonus < 0.5) { // 50% cap
                    tower.rageBonus += 0.05;
                    tower.damage = tower.damage * (1 + tower.rageBonus);
                }
            },
            reset: function(tower) {
                if (tower.rageBonus) {
                    tower.damage = tower.damage / (1 + tower.rageBonus);
                    tower.rageBonus = 0;
                }
            }
        },
        {
            id: 'golden-towers',
            name: 'Golden Towers',
            description: 'All creeps drop 30% more gold',
            effect: function() {
                // This would be implemented to increase gold gain
                window.game.eventSystem.emit('setGoldPerKill', { amount: 1.3 });
            }
        },
        {
            id: 'frost-master',
            name: 'Frost Master',
            description: 'Frost towers slow enemies by an additional 20%',
            effect: function(tower) {
                if (tower && tower.type === 'frost' && tower.slowAmount) {
                    tower.slowAmount *= 1.2;
                }
            }
        },
        {
            id: 'fire-fury',
            name: 'Fire Fury',
            description: 'Fire towers have 25% higher critical hit chance',
            effect: function(tower) {
                if (tower && tower.type === 'fire' && tower.critChance) {
                    tower.critChance *= 1.25;
                }
            }
        },
        {
            id: 'multishot',
            name: 'Multishot',
            description: 'Basic towers can hit one additional target',
            effect: function(tower) {
                // Would need to be implemented in the tower targeting logic
            }
        }
    ]
};