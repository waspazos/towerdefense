// Augment configuration definitions
window.augmentConfig = {
    // Available augments
    available: [
        {
            id: 'towers-of-rage',
            name: 'Towers of Rage',
            description: 'Towers gain 1% attack speed each time they attack (resets each round)',
            icon: 'rage-icon',
            effect: (tower) => {
                tower.attackSpeed *= 1.01;
            },
            reset: (tower) => {
                tower.attackSpeed = gameState.towerTypes[tower.type].ranks[tower.rank - 1].attackSpeed;
            }
        },
        {
            id: 'catapult',
            name: 'Catapult',
            description: 'All towers have +2 range',
            icon: 'catapult-icon',
            effect: (tower) => {
                tower.range += 2;
                if (tower.rangeIndicator) {
                    scene.remove(tower.rangeIndicator);
                    tower.rangeIndicator = createRangeIndicator(tower.position, tower.range);
                    scene.add(tower.rangeIndicator);
                }
            }
        },
        {
            id: 'bloodbath',
            name: 'Bloodbath',
            description: 'All towers have 15% crit chance (+15% for Fire Towers)',
            icon: 'bloodbath-icon',
            effect: (tower) => {
                tower.critChance = tower.type === 'fire' ? 0.3 : 0.15;
            }
        },
        {
            id: 'hellfire',
            name: 'Hellfire',
            description: 'Tower attacks apply burn effect (5% health/2s)',
            icon: 'hellfire-icon',
            effect: (tower) => {
                tower.burnEffect = true;
            }
        },
        {
            id: 'golden-towers',
            name: 'Golden Towers',
            description: '+1 gold per creep kill',
            icon: 'golden-icon',
            effect: () => {
                gameState.goldPerKill += 1;
            }
        }
    ],

    // Augment selection settings
    selection: {
        maxActive: 3,
        choicesPerSelection: 3,
        duration: 30,  // seconds to choose
        rounds: [0, 6] // rounds where selection appears
    },

    // Visual effects for augments
    effects: {
        rage: {
            particleColor: 0xFF0000,
            particleCount: 5,
            particleSize: 0.1
        },
        catapult: {
            rangeIndicatorColor: 0x00FF00,
            rangeIndicatorOpacity: 0.2
        },
        bloodbath: {
            critEffectColor: 0xFF0000,
            critEffectSize: 1.5
        },
        hellfire: {
            burnEffectColor: 0xFF4500,
            burnEffectOpacity: 0.8
        },
        golden: {
            goldEffectColor: 0xFFD700,
            goldEffectSize: 1.2
        }
    }
}; 