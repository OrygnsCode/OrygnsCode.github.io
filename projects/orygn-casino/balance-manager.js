/**
 * Balance Manager v2.0
 * Handles persistent user balance across Orygn Casino games.
 * Includes migration from legacy storage keys.
 */
const BalanceManager = {
    KEY: 'orygn_wallet_balance',
    LEGACY_KEY: 'orygn_balance',
    DEFAULT_BALANCE: 10000.00,

    init: function () {
        // Migration Check
        const currentData = localStorage.getItem(this.KEY);
        const legacyData = localStorage.getItem(this.LEGACY_KEY);

        if (currentData === null) {
            // New system not initialized
            if (legacyData !== null) {
                console.log('[BalanceManager] Migrating legacy balance:', legacyData);
                this.set(parseFloat(legacyData)); // Migrate Old -> New
                // Optional: localStorage.removeItem(this.LEGACY_KEY); // Keep for safety for now
            } else {
                console.log('[BalanceManager] New Wallet. Setting default.');
                this.set(this.DEFAULT_BALANCE);
            }
        }

        // Sync across tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.KEY) {
                this.onBalanceChange(parseFloat(e.newValue));
            }
        });
    },

    get: function () {
        const val = parseFloat(localStorage.getItem(this.KEY));
        return isNaN(val) ? this.DEFAULT_BALANCE : val;
    },

    set: function (amount) {
        const safeAmount = parseFloat(amount);
        if (isNaN(safeAmount)) return;
        localStorage.setItem(this.KEY, safeAmount.toFixed(2));
        this.onBalanceChange(safeAmount);
    },

    update: function (delta) {
        let current = this.get();
        let newBalance = current + delta;
        if (newBalance < 0) newBalance = 0;
        this.set(newBalance);
        return newBalance;
    },

    // Callback system
    listeners: [],
    subscribe: function (callback) {
        this.listeners.push(callback);
        // Immediate callback with current value
        callback(this.get());
    },

    onBalanceChange: function (newBalance) {
        this.listeners.forEach(cb => cb(newBalance));
    }
};

// Auto-init
BalanceManager.init();
