// Tower configuration definitions
export const towerConfig = {
    basic: {
        name: "Basic Tower",
        description: "A balanced tower with multi-target capability",
        ranks: [
            {
                cost: 3,
                damage: 25,
                attackSpeed: 2.0,
                description: "Basic multi-target tower"
            },
            {
                cost: 5,
                damage: 35,
                attackSpeed: 1.8,
                description: "Improved multi-target tower"
            },
            {
                cost: 8,
                damage: 45,
                attackSpeed: 1.6,
                description: "Advanced multi-target tower"
            },
            {
                cost: 12,
                damage: 60,
                attackSpeed: 1.4,
                description: "Elite multi-target tower"
            },
            {
                cost: 15,
                damage: 80,
                attackSpeed: 1.2,
                description: "Master multi-target tower"
            }
        ]
    },
    frost: {
        name: "Frost Tower",
        description: "Slows enemies with ice magic",
        ranks: [
            {
                cost: 5,
                damage: 15,
                attackSpeed: 1.5,
                slowAmount: 0.3,
                description: "Basic frost tower"
            },
            {
                cost: 8,
                damage: 25,
                attackSpeed: 1.4,
                slowAmount: 0.4,
                description: "Improved frost tower"
            },
            {
                cost: 12,
                damage: 35,
                attackSpeed: 1.3,
                slowAmount: 0.5,
                description: "Advanced frost tower"
            },
            {
                cost: 16,
                damage: 50,
                attackSpeed: 1.2,
                slowAmount: 0.6,
                description: "Elite frost tower"
            },
            {
                cost: 20,
                damage: 70,
                attackSpeed: 1.0,
                slowAmount: 0.7,
                description: "Master frost tower"
            }
        ]
    },
    fire: {
        name: "Fire Tower",
        description: "Deals high damage with critical hits",
        ranks: [
            {
                cost: 7,
                damage: 20,
                attackSpeed: 1.8,
                critChance: 0.4,
                critMultiplier: 1.5,
                description: "Basic fire tower"
            },
            {
                cost: 10,
                damage: 30,
                attackSpeed: 1.7,
                critChance: 0.45,
                critMultiplier: 1.6,
                description: "Improved fire tower"
            },
            {
                cost: 14,
                damage: 45,
                attackSpeed: 1.6,
                critChance: 0.5,
                critMultiplier: 1.7,
                description: "Advanced fire tower"
            },
            {
                cost: 18,
                damage: 65,
                attackSpeed: 1.5,
                critChance: 0.55,
                critMultiplier: 1.8,
                description: "Elite fire tower"
            },
            {
                cost: 22,
                damage: 90,
                attackSpeed: 1.4,
                critChance: 0.6,
                critMultiplier: 2.0,
                description: "Master fire tower"
            }
        ]
    }
};