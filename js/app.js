/**
 * ZEKRA APP BOOTSTRAP v4.4.1
 * Entry point that orchestrates all modules.
 * Include this script LAST in the HTML, after all other modules.
 */
(function() {
    'use strict';

    const App = {
        version: '4.4.1',
        initialized: false
    };

    // ─── Detect Environment ──────────────────────────────────
    App.env = {
        isMobile: ZEKRA.isMobile(),
        isLowPower: ZEKRA.isLowPower()
    };

    // ─── Initialize ──────────────────────────────────────────
    App.init = async function() {
        if (App.initialized) return;
        App.initialized = true;

        // 1. Init Firebase
        const fb = window.ZEKRA.firebase;
        if (fb) fb.init();

        // 2. Disable heavy features on mobile
        if (App.env.isMobile) {
            window.fxGo = function(){};
            window.trx = function(){};
            // Lazy setInterval
            const _origSetInt = window.setInterval;
            window.setInterval = function(fn, delay, ...args) {
                return _origSetInt(fn, Math.max(delay, 30000), ...args);
            };
        }

        // 3. Set global flags
        window.ZEKRA_IS_MOBILE = App.env.isMobile;
        window.ZEKRA_LOW_POWER = App.env.isLowPower;

        // 4. Route Guardian
        if (typeof SanctuaryEngine !== 'undefined') {
            SanctuaryEngine.checkSession();
        }

        // 5. Connection test
        window.addEventListener('load', async () => {
            if (typeof SanctuaryEngine !== 'undefined') {
                const connected = await SanctuaryEngine.testConnection();
                if (!connected) {
                    console.warn("ZEKRA: Firebase heartbeat failed.");
                }
            }
        });

        console.log(`✅ ZEKRA App v${App.version} initialized.`);
        return App;
    };

    window.ZEKRA.app = App;

    // ─── Auto-Initialize on DOMContentLoaded ─────────────────
    document.addEventListener('DOMContentLoaded', () => App.init());

    console.log('✅ ZEKRA: App bootstrap loaded.');
})();