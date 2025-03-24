// Tower configuration definitions
export const towerConfig = {
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