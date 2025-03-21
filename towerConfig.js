// Tower configuration definitions
window.towerConfig = {
    basic: {
        name: "Basic Tower",
        ranks: [
            { cost: 3, damage: 25, attackSpeed: 2, color: 0xaaaaaa },
            { cost: 5, damage: 40, attackSpeed: 1.5, color: 0xdddddd },
            { cost: 8, damage: 60, attackSpeed: 1.2, color: 0xffffff },
            { cost: 12, damage: 85, attackSpeed: 1.0, color: 0xffffff },
            { cost: 15, damage: 120, attackSpeed: 0.8, color: 0xffffff }
        ]
    },
    frost: {
        name: "Frost Tower",
        ranks: [
            { cost: 5, damage: 15, attackSpeed: 1.5, slowAmount: 0.3, color: 0x00ffff },
            { cost: 8, damage: 25, attackSpeed: 1.2, slowAmount: 0.4, color: 0x00ffff },
            { cost: 12, damage: 35, attackSpeed: 1.0, slowAmount: 0.5, color: 0x00ffff },
            { cost: 15, damage: 50, attackSpeed: 0.8, slowAmount: 0.6, color: 0x00ffff },
            { cost: 20, damage: 70, attackSpeed: 0.6, slowAmount: 0.7, color: 0x00ffff }
        ]
    },
    fire: {
        name: "Fire Tower",
        ranks: [
            { cost: 6, damage: 35, attackSpeed: 1.8, color: 0xff4400 },
            { cost: 10, damage: 55, attackSpeed: 1.5, color: 0xff6600 },
            { cost: 15, damage: 80, attackSpeed: 1.2, color: 0xff8800 },
            { cost: 20, damage: 110, attackSpeed: 1.0, color: 0xffaa00 },
            { cost: 25, damage: 150, attackSpeed: 0.8, color: 0xffcc00 }
        ]
    }
}; 