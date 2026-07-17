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

    // ─── FORCE UI ROUTING — Single Source of Truth ───────────
    // This function is the authoritative UI state router.
    // It runs after ALL modules are loaded and Firebase is initialized.
    // It forcibly locks the UI to the correct state based on user role,
    // eliminating all race conditions with shop/checkout overlays.
    App.forceUIRouting = function() {
        try {
            const isMaster = typeof SanctuaryEngine !== 'undefined' && SanctuaryEngine.isMaster();
            
            // Get all critical UI elements
            const shopOverlay = document.getElementById('shop-overlay');
            const rechargeModal = document.getElementById('recharge-modal');
            const masterHQ = document.getElementById('master-hq-admin');
            const userVault = document.getElementById('app-v');
            const adminPanel = document.getElementById('admin-panel');
            
            // ─── ALWAYS hide shop/checkout first (defense in depth) ───
            if (shopOverlay) {
                shopOverlay.style.display = 'none';
                shopOverlay.classList.remove('active', 'open');
            }
            if (rechargeModal) {
                rechargeModal.style.display = 'none';
                rechargeModal.classList.remove('active', 'open');
            }
            
            // ─── FORCE correct UI based on role ───
            if (isMaster) {
                // ADMIN VIEW: Show MasterHQ, hide user vault
                if (masterHQ) {
                    masterHQ.style.display = 'flex';
                    masterHQ.classList.add('open');
                }
                if (userVault) {
                    userVault.style.display = 'none';
                }
                if (adminPanel) {
                    adminPanel.style.display = 'none';
                    adminPanel.classList.remove('open');
                }
            } else {
                // USER VIEW: Show user vault, hide MasterHQ
                if (masterHQ) {
                    masterHQ.style.display = 'none';
                    masterHQ.classList.remove('open');
                }
                if (userVault) {
                    userVault.style.display = 'flex';
                }
                if (adminPanel) {
                    adminPanel.style.display = 'none';
                    adminPanel.classList.remove('open');
                }
            }
            
            console.log('✅ ZEKRA: UI routing enforced (isMaster=' + isMaster + ')');
        } catch (e) {
            console.warn('ZEKRA: forceUIRouting error (non-fatal):', e);
        }
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
                    // Use the authoritative forceUIRouting instead of manual DOM manipulation
                    App.forceUIRouting();
                    // Clean hash without reload
                    if (history.replaceState) {
                        history.replaceState(null, null, 'vault.html');
                    }
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

        // 5. Connection test + force UI routing on full load
        window.addEventListener('load', async () => {
            // Force UI routing after everything is fully loaded
            App.forceUIRouting();
            
            if (typeof SanctuaryEngine !== 'undefined') {
                const connected = await SanctuaryEngine.testConnection();
                if (!connected) {
                    console.warn("ZEKRA: Firebase heartbeat failed.");
                }
            }
        });

        // 6. Force UI routing after init completes (with small delay for modules to settle)
        setTimeout(function() {
            App.forceUIRouting();
        }, 500);

        console.log(`✅ ZEKRA App v${App.version} initialized.`);
        return App;
    };

    window.ZEKRA.app = App;

    // ─── Auto-Initialize on DOMContentLoaded ─────────────────
    document.addEventListener('DOMContentLoaded', () => App.init());

    console.log('✅ ZEKRA: App bootstrap loaded.');
})();