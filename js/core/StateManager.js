/**
 * ZEKRA STATE MANAGER v4.4.1
 * Manages vault state with Proxy-based auto-sync, localStorage cache, and cloud push.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const SM = {};

    // ─── Internal State ───────────────────────────────────────
    let _vaultState = null;
    let _dbId = null;
    let _syncTimer = null;
    let _cloudTimer = null;
    let _listeners = [];

    // ─── Get DB Key ───────────────────────────────────────────
    SM.getDBId = function(userId) {
        return ZEKRA.DB_ID_PREFIX + (userId || 'guest');
    };

    // ─── Initialize State from localStorage ───────────────────
    SM.init = function(userId, defaults) {
        _dbId = SM.getDBId(userId);
        defaults = defaults || ZEKRA.DEFAULT_VAULT;

        try {
            const localData = JSON.parse(localStorage.getItem(_dbId));
            _vaultState = Object.assign({}, defaults, localData || {});
        } catch (e) {
            _vaultState = Object.assign({}, defaults);
        }

        // Ensure ownedItems and purchasedFonts exist
        if (!_vaultState.ownedItems) _vaultState.ownedItems = {};
        if (!_vaultState.purchasedFonts) _vaultState.purchasedFonts = { marium: {}, yossif: {} };

        // Inject font products
        if (_vaultState.products) {
            ZEKRA.FONT_PRODUCTS.forEach(fp => {
                if (!_vaultState.products.find(p => p.id === fp.id)) {
                    _vaultState.products.push(fp);
                }
            });
        }

        // Create proxy for auto-sync
        _vaultState = new Proxy(_vaultState, {
            get(target, prop) {
                if (prop === '__isZekraProxy') return true;
                if (prop === '__raw') return target;
                return target[prop];
            },
            set(target, prop, value) {
                target[prop] = value;
                SM.scheduleLocalSave();
                SM.scheduleCloudSync();
                SM.notifyListeners(prop, value);
                return true;
            }
        });

        console.log('✅ ZEKRA: StateManager initialized.');
        return _vaultState;
    };

    // ─── Get Current State ────────────────────────────────────
    SM.get = function() {
        return _vaultState;
    };

    // ─── Set State Directly (for cloud merge) ─────────────────
    SM.set = function(data, defaults) {
        defaults = defaults || ZEKRA.DEFAULT_VAULT;
        const merged = Object.assign({}, defaults, data);

        // Copy into existing proxy to maintain reactivity
        if (_vaultState && _vaultState.__isZekraProxy) {
            Object.keys(merged).forEach(key => {
                _vaultState[key] = merged[key];
            });
        } else {
            _vaultState = Object.assign({}, merged);
        }
        return _vaultState;
    };

    // ─── Local Save (debounced) ───────────────────────────────
    SM.scheduleLocalSave = function() {
        clearTimeout(_syncTimer);
        _syncTimer = setTimeout(() => {
            try {
                localStorage.setItem(_dbId, JSON.stringify(_vaultState));
                // Show sync icon
                const syncEl = document.getElementById('sync-i');
                if (syncEl) {
                    syncEl.style.opacity = '1';
                    setTimeout(() => { if (syncEl) syncEl.style.opacity = '0'; }, 1500);
                }
            } catch (e) {
                console.warn('Local save failed:', e);
            }
        }, 300);
    };

    // ─── Cloud Sync (debounced) ───────────────────────────────
    SM.scheduleCloudSync = function() {
        clearTimeout(_cloudTimer);
        _cloudTimer = setTimeout(async () => {
            const fb = window.ZEKRA.firebase;
            const engine = window.SanctuaryEngine;
            if (!fb || !fb.db || !engine) return;

            const vaultId = engine.getActiveUID();
            if (!vaultId || vaultId === 'undefined' || vaultId === 'null') return;

            try {
                await fb.db.ref(`users/${vaultId}/data`).set(_vaultState.__raw || _vaultState);
                await fb.db.ref(`users/${vaultId}/lastSeen`).set(fb.timestamp());
            } catch (e) {
                console.warn('Cloud sync failed:', e.message);
            }
        }, 900);
    };

    // ─── Immediate Cloud Push ─────────────────────────────────
    SM.pushToCloud = async function() {
        const fb = window.ZEKRA.firebase;
        const engine = window.SanctuaryEngine;
        if (!fb || !fb.db || !engine) return;

        const vaultId = engine.getActiveUID();
        if (!vaultId || vaultId === 'undefined' || vaultId === 'null') return;

        try {
            await fb.db.ref(`users/${vaultId}/data`).set(_vaultState.__raw || _vaultState);
            await fb.db.ref(`users/${vaultId}/lastSeen`).set(fb.timestamp());
            console.log('✅ ZEKRA: Cloud sync complete.');
        } catch (e) {
            console.warn('Cloud push failed:', e.message);
        }
    };

    // ─── Event System ─────────────────────────────────────────
    SM.onChange = function(callback) {
        _listeners.push(callback);
        return () => {
            _listeners = _listeners.filter(l => l !== callback);
        };
    };

    SM.notifyListeners = function(prop, value) {
        _listeners.forEach(cb => {
            try { cb(prop, value, _vaultState); } catch (e) { /* ignore */ }
        });
    };

    window.ZEKRA.state = SM;

    console.log('✅ ZEKRA: StateManager loaded.');
})();