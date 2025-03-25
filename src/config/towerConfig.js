// src/config/towerConfig.js
export const towerConfig = {
    // Faction definitions
    factions: {
        amazonians: {
            name: "The Amazonians",
            description: "Jungle warriors who excel at rapid fire and multi-target attacks",
            towerType: "amazonians",
            startingGold: 20,
            icon: "🌿",
            color: 0x2E8B57 // Forest green
        },
        ironclad: {
            name: "The Ironclad",
            description: "Masters of heavy artillery and defensive tactics",
            towerType: "ironclad",
            startingGold: 25,
            icon: "⚒️",
            color: 0x708090 // Slate gray
        },
        arcanists: {
            name: "The Arcanist Order",
            description: "Mystics who harness magical energies for devastating effects",
            towerType: "arcanists",
            startingGold: 15,
            icon: "✨",
            color: 0x9370DB // Medium purple
        }
    },
    
    // Tower types by faction
    amazonians: {
        name: "Arrow Tower",
        description: "Rapid-fire tower specializing in multiple targets",
        ranks: [
            {
                cost: 5,
                damage: 25,
                attackSpeed: 2.0,
                description: "Basic arrow tower",
                upgrades: []
            },
            {
                cost: 10,
                damage: 40,
                attackSpeed: 1.8,
                description: "Improved arrow tower",
                upgrades: [
                    {
                        id: "sharpened_tools",
                        name: "Sharpened Tools",
                        description: "Every 30 shots give a nearby tower +2 damage at random",
                        effects: {
                            shotCounter: 0,
                            damageBonus: 2,
                            shotsRequired: 30
                        }
                    },
                    {
                        id: "forest_echoes",
                        name: "Forest Echoes",
                        description: "40% chance to fire an extra shot (0.2s delay)",
                        effects: {
                            extraShotChance: 0.4,
                            extraShotDelay: 0.2
                        }
                    }
                ]
            },
            {
                cost: 15,
                damage: 60,
                attackSpeed: 1.6,
                description: "Advanced arrow tower",
                upgrades: [
                    {
                        id: "night_witch",
                        name: "Night Witch",
                        description: "Slows by 15% and does 0.5% of target's total HP per attack",
                        effects: {
                            slowAmount: 0.15,
                            healthDamagePercent: 0.005
                        }
                    },
                    {
                        id: "sky_talker",
                        name: "Sky Talker",
                        description: "Gain +1 additional multi-shot and another after every 5 rounds",
                        effects: {
                            baseMultiShot: 1,
                            roundsPerShot: 5
                        }
                    }
                ]
            },
            {
                cost: 20,
                damage: 85,
                attackSpeed: 1.4,
                description: "Elite arrow tower",
                upgrades: []
            },
            {
                cost: 25,
                damage: 120,
                attackSpeed: 1.2,
                description: "Master arrow tower",
                upgrades: []
            }
        ]
    },
    
    ironclad: {
        name: "Cannon Tower",
        description: "Heavy damage tower with area effect attacks",
        ranks: [
            {
                cost: 8,
                damage: 40,
                attackSpeed: 3.0,
                description: "Basic cannon tower",
                upgrades: []
            },
            {
                cost: 12,
                damage: 60,
                attackSpeed: 2.8,
                description: "Improved cannon tower",
                upgrades: [
                    {
                        id: "reinforced_frame",
                        name: "Reinforced Frame",
                        description: "Increases damage by 20% and grants a small splash damage effect",
                        effects: {
                            damageMultiplier: 1.2,
                            splashRadius: 2
                        }
                    },
                    {
                        id: "metalworking",
                        name: "Metalworking",
                        description: "Every 5th shot does triple damage",
                        effects: {
                            criticalHitCounter: 5,
                            criticalHitMultiplier: 3
                        }
                    }
                ]
            },
            {
                cost: 18,
                damage: 90,
                attackSpeed: 2.5,
                description: "Advanced cannon tower",
                upgrades: [
                    {
                        id: "siege_master",
                        name: "Siege Master",
                        description: "Does double damage to armored enemies and reduces their armor",
                        effects: {
                            armoredDamageMultiplier: 2,
                            armorReduction: 0.2
                        }
                    },
                    {
                        id: "fortification",
                        name: "Fortification",
                        description: "Increases range by 25% and adds a defensive aura that slows nearby enemies",
                        effects: {
                            rangeMultiplier: 1.25,
                            slowAuraRadius: 5,
                            slowAmount: 0.1
                        }
                    }
                ]
            },
            {
                cost: 25,
                damage: 130,
                attackSpeed: 2.2,
                description: "Elite cannon tower",
                upgrades: []
            },
            {
                cost: 35,
                damage: 180,
                attackSpeed: 2.0,
                description: "Master cannon tower",
                upgrades: []
            }
        ]
    },
    
    arcanists: {
        name: "Arcane Tower",
        description: "Magic tower with powerful elemental attacks",
        ranks: [
            {
                cost: 6,
                damage: 30,
                attackSpeed: 2.5,
                description: "Basic arcane tower",
                upgrades: []
            },
            {
                cost: 12,
                damage: 45,
                attackSpeed: 2.3,
                description: "Improved arcane tower",
                upgrades: [
                    {
                        id: "frost_magic",
                        name: "Frost Magic",
                        description: "Attacks slow enemies by 25% for 2 seconds",
                        effects: {
                            slowAmount: 0.25,
                            slowDuration: 2
                        }
                    },
                    {
                        id: "mana_infusion",
                        name: "Mana Infusion",
                        description: "Every 10 seconds, the next attack does 3x damage",
                        effects: {
                            infusionInterval: 10,
                            damageMultiplier: 3
                        }
                    }
                ]
            },
            {
                cost: 18,
                damage: 65,
                attackSpeed: 2.0,
                description: "Advanced arcane tower",
                upgrades: [
                    {
                        id: "chain_lightning",
                        name: "Chain Lightning",
                        description: "Attacks jump to up to 2 additional targets for 50% damage",
                        effects: {
                            chainCount: 2,
                            chainDamageMultiplier: 0.5
                        }
                    },
                    {
                        id: "arcane_resonance",
                        name: "Arcane Resonance",
                        description: "Enemies take 10% increased damage from all sources for 3 seconds",
                        effects: {
                            damageAmplification: 0.1,
                            amplificationDuration: 3
                        }
                    }
                ]
            },
            {
                cost: 24,
                damage: 90,
                attackSpeed: 1.8,
                description: "Elite arcane tower",
                upgrades: []
            },
            {
                cost: 30,
                damage: 120,
                attackSpeed: 1.5,
                description: "Master arcane tower",
                upgrades: []
            }
        ]
    },
    
    // Keeping this for backward compatibility
    basic: {
        name: "Tower",
        description: "Basic defense tower",
        ranks: [
            {
                cost: 5,
                damage: 25,
                attackSpeed: 2.0,
                description: "Basic defense tower",
                upgrades: []
            },
            {
                cost: 10,
                damage: 40,
                attackSpeed: 1.8,
                description: "Improved defense tower",
                upgrades: [
                    {
                        id: "sharpened_tools",
                        name: "Sharpened Tools",
                        description: "Every 30 shots give a nearby tower +2 damage at random",
                        effects: {
                            shotCounter: 0,
                            damageBonus: 2,
                            shotsRequired: 30
                        }
                    },
                    {
                        id: "forest_echoes",
                        name: "Forest Echoes",
                        description: "40% chance to fire an extra shot (0.2s delay)",
                        effects: {
                            extraShotChance: 0.4,
                            extraShotDelay: 0.2
                        }
                    }
                ]
            },
            {
                cost: 15,
                damage: 60,
                attackSpeed: 1.6,
                description: "Advanced defense tower",
                upgrades: [
                    {
                        id: "night_witch",
                        name: "Night Witch",
                        description: "Slows by 15% and does 0.5% of target's total HP per attack",
                        effects: {
                            slowAmount: 0.15,
                            healthDamagePercent: 0.005
                        }
                    },
                    {
                        id: "sky_talker",
                        name: "Sky Talker",
                        description: "Gain +1 additional multi-shot and another after every 5 rounds",
                        effects: {
                            baseMultiShot: 1,
                            roundsPerShot: 5
                        }
                    }
                ]
            },
            {
                cost: 20,
                damage: 85,
                attackSpeed: 1.4,
                description: "Elite defense tower",
                upgrades: []
            },
            {
                cost: 25,
                damage: 120,
                attackSpeed: 1.2,
                description: "Master defense tower",
                upgrades: []
            }
        ]
    }
};