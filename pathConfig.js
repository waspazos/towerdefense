// Path configuration definitions
window.pathConfig = {
    // Path definitions
    paths: [
        // Left path
        { 
            spawnPoint: new THREE.Vector3(-15, 0, -24),
            waypoints: [
                new THREE.Vector3(-15, 0, -17.5),
                new THREE.Vector3(-15, 0, -7.5),
                new THREE.Vector3(-15, 0, 0),
                new THREE.Vector3(-10, 0, 2.5),
                new THREE.Vector3(0, 0, 5),
                new THREE.Vector3(0, 0, 10)
            ]
        },
        // Center path
        {
            spawnPoint: new THREE.Vector3(0, 0, -24),
            waypoints: [
                new THREE.Vector3(0, 0, -17.5),
                new THREE.Vector3(0, 0, -7.5),
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, 10)
            ]
        },
        // Right path
        {
            spawnPoint: new THREE.Vector3(15, 0, -24),
            waypoints: [
                new THREE.Vector3(15, 0, -17.5),
                new THREE.Vector3(15, 0, -7.5),
                new THREE.Vector3(15, 0, 0),
                new THREE.Vector3(10, 0, 2.5),
                new THREE.Vector3(0, 0, 5),
                new THREE.Vector3(0, 0, 10)
            ]
        }
    ],

    // Path visual properties
    visual: {
        width: 2,
        height: 0.1,
        color: 0x8B4513,  // Brown
        borderColor: 0x654321,  // Darker brown
        borderWidth: 0.1,
        glowColor: 0x8B4513,
        glowIntensity: 0.2
    },

    // Path markers
    markers: {
        waypoint: {
            size: 0.3,
            color: 0xFFFF00,
            opacity: 0.5
        },
        spawnPoint: {
            size: 0.5,
            color: 0xFF0000,
            opacity: 0.7
        },
        endPoint: {
            size: 0.4,
            color: 0x00FF00,
            opacity: 0.7
        }
    },

    // Path labels
    labels: {
        font: 'Arial',
        fontSize: 12,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 5
    }
}; 