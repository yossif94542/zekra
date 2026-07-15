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

        // 4.5. Hash-based routing for MasterHQ
        if (window.location.hash === '#hq') {
            // Retry logic to wait for session to be ready
            const checkAndOpenHQ = function(retries) {
                retries = retries || 0;
                
                // Check session directly instead of isMaster() to avoid async config loading issues
                let session = typeof SanctuaryEngine !== 'undefined' ? SanctuaryEngine.getCurrentUser() : null;
                
                // Fallback: check localStorage directly with the session key
                if (!session && typeof ZEKRA !== 'undefined' && ZEKRA.SESSION_KEY) {
                    try {
                        const raw = localStorage.getItem(ZEKRA.SESSION_KEY);
                        if (raw) session = JSON.parse(raw);
                    } catch (e) { /* ignore */ }
                }
                
                const isMaster = session && (session.role === 'master' || session.id === 'zekra_master');
                
                if (isMaster) {
                    // Open MasterHQ - explicitly hide shop/checkout overlays first
                    setTimeout(() => {
                        // HIDE all shop/checkout overlays
                        const shopOverlay = document.getElementById('shop-overlay');
                        const rechargeModal = document.getElementById('recharge-modal');
                        if (shopOverlay) shopOverlay.classList.remove('active');
                        if (rechargeModal) rechargeModal.classList.remove('active');
                        
                        // SHOW MasterHQ
                        const hq = document.getElementById('master-hq-admin');
                        if (hq) {
                            hq.style.display = 'flex';
                            hq.classList.add('open');
                        }
                        // Clean hash without reload
                        if (history.replaceState) {
                            history.replaceState(null, null, 'vault.html');
                        }
                    }, 300);
                } else if (retries < 10) {
                    // Retry after 200ms if session not ready yet
                    setTimeout(function() { checkAndOpenHQ(retries + 1); }, 200);
                } else {
                    // Non-master tried to access HQ — redirect to normal vault
                    if (history.replaceState) {
                        history.replaceState(null, null, 'vault.html');
                    }
                    alert('❌ Access Denied: Administrator level required.');
                }
            };
            
            checkAndOpenHQ(0);
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