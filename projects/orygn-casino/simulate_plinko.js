
const PAYOUTS = {
    8: {
        low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    10: {
        low: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
        medium: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
        high: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76]
    },
    12: {
        low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
        medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
        high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
    },
    14: {
        low: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
        medium: [58, 15, 7, 4, 1.9, 1, 0.5, 0.2, 0.5, 1, 1.9, 4, 7, 15, 58],
        high: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420]
    },
    16: {
        low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
};

function getTargetSlot(rows, sdMultiplier) {
    const naturalSD = Math.sqrt(rows) / 2;
    // const fatSD = naturalSD * 1.03; 
    const fatSD = naturalSD * sdMultiplier;

    let targetSlot;
    do {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const mean = rows / 2;
        const val = mean + z * fatSD;
        targetSlot = Math.round(val);
    } while (targetSlot < 0 || targetSlot > rows);

    return targetSlot;
}

function simulate(rows, risk, sdMultiplier, iterations = 100000) {
    const table = PAYOUTS[rows][risk];
    let totalWin = 0;

    for (let i = 0; i < iterations; i++) {
        const slot = getTargetSlot(rows, sdMultiplier);
        totalWin += table[slot];
    }

    const ev = totalWin / iterations;
    return ev;
}

console.log("--- Proposed Simulation (sdMultiplier = 1.0 - Normal Binomial) ---");
const configs = [
    { rows: 8, risk: 'low' },
    { rows: 16, risk: 'low' },
    { rows: 16, risk: 'high' }
];

console.log("Multiplier 1.0 (True Random):");
configs.forEach(c => {
    console.log(`Rows: ${c.rows}, Risk: ${c.risk}, EV: ${simulate(c.rows, c.risk, 1.0).toFixed(4)}`);
});

console.log("\nMultiplier 0.95 (Slight House Bias - Balls cluster to center):");
configs.forEach(c => {
    console.log(`Rows: ${c.rows}, Risk: ${c.risk}, EV: ${simulate(c.rows, c.risk, 0.95).toFixed(4)}`);
});
