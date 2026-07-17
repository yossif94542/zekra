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
    // Uses ONLY native CSS classList operations to preserve the
    // project's CSS layout system. NO raw inline style.display.
    //
    // CSS Class System (from vault.css):
    //   .locked-full-overlay        → display: none (hidden by default)
    //   .locked-full-overlay.open   → display: flex !important
    //   .locked-full-overlay.active → display: flex !important
    //   .overlay                    → display: none
    //   .overlay.active             → display: flex !important
    //   .drawer                     → display: none
    //   .drawer.open-l / .open-r    → display: flex !important
    //   .hidden                     → display: none (Tailwind utility)
    App.forceUIRouting = function() {
        try {
            const isMaster = typeof SanctuaryEngine !== 'undefined' && SanctuaryEngine.isMaster();

            // ─── Step 1: Force-hide ALL overlay/drawer elements ───
            // Shop & Checkout (use CSS class system - remove .active to hide)
            const shopOverlay = document.getElementById('shop-overlay');
            const rechargeModal = document.getElementById('recharge-modal');
            if (shopOverlay) shopOverlay.classList.remove('active');
            if (rechargeModal) rechargeModal.classList.remove('active');

            // Master HQ (use CSS class system - remove .open to hide)
            const masterHQ = document.getElementById('master-hq-admin');
            if (masterHQ) masterHQ.classList.remove('open');

            // Admin Panel (also .locked-full-overlay)
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.classList.remove('open');

            // Drawers (journey, sketchbook, emergency)
            const jnDrawer = document.getElementById('jn-d');
            const skDrawer = document.getElementById('sk-d');
            const emgDrawer = document.getElementById('o-emg');
            if (jnDrawer) { jnDrawer.classList.remove('open-l', 'active'); }
            if (skDrawer) { skDrawer.classList.remove('open-r', 'active'); }
            if (emgDrawer) { emgDrawer.classList.remove('active', 'show'); }

            // Profile/Chat overlay
            const profileOverlay = document.getElementById('profile-overlay');
            if (profileOverlay) { profileOverlay.classList.remove('show', 'active'); }

            // User vault main container (use Tailwind .hidden class)
            const userVault = document.getElementById('app-v');
            if (userVault) userVault.classList.add('hidden');

            // ─── Step 2: Activate ONLY the correct view ───
            if (isMaster) {
                // === ADMIN VIEW ===
                // Show MasterHQ only (its CSS background is #0D0B10 dark)
                if (masterHQ) masterHQ.classList.add('open');
                // User vault stays hidden (classList.add('hidden') already applied above)
            } else {
                // === USER VIEW ===
                // Show user vault
                if (userVault) userVault.classList.remove('hidden');
                // MasterHQ stays hidden (classList.remove('open') already applied above)
            }

            console.log('✅ ZEKRA: UI routing enforced via classList (isMaster=' + isMaster + ')');
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
                    // Use the authoritative classList-based forceUIRouting
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