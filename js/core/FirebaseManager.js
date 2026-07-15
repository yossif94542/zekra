/**
 * ZEKRA FIREBASE MANAGER v4.4.1
 * Centralized Firebase initialization and database operations.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const FM = {};

    // ─── Initialize Firebase ──────────────────────────────────
    FM.init = function() {
        if (FM.ready) return FM;
        try {
            const fbApp = !firebase.apps.length
                ? firebase.initializeApp(firebaseConfig)
                : firebase.app();
            FM.db = fbApp.database();
            FM.app = fbApp;
            FM.ready = true;

            // Go online
            FM.db.goOnline();

            // Connection status listener
            FM.db.ref('.info/connected').on('value', (snap) => {
                FM.online = snap.val() === true;
                const badge = document.getElementById('fb-status-badge');
                if (badge) {
                    if (FM.online) {
                        badge.innerText = "ONLINE";
                        badge.className = "text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm";
                    } else {
                        badge.innerText = "CONNECTING...";
                        badge.className = "text-[9px] font-black bg-yellow-500 text-white px-2 py-0.5 rounded-full animate-pulse shadow-sm";
                    }
                }
            });

            console.log('✅ ZEKRA: Firebase initialized.');
        } catch (e) {
            console.warn('⚠️ ZEKRA: Firebase init failed:', e.message);
        }
        return FM;
    };

    // ─── Alias for backwards compatibility ────────────────────
    FM.ref = function(path) {
        if (!FM.db) FM.init();
        return FM.db.ref(path);
    };

    FM.onValue = function(ref, cb) {
        ref.on('value', cb);
    };

    FM.push = function(ref, data) {
        return ref.push(data);
    };

    FM.set = function(ref, data) {
        return ref.set(data);
    };

    FM.update = function(ref, data) {
        return ref.update(data);
    };

    FM.remove = function(ref) {
        return ref.remove();
    };

    FM.once = function(ref) {
        return ref.once('value');
    };

    // ─── Server Timestamp ─────────────────────────────────────
    FM.timestamp = function() {
        return firebase.database.ServerValue.TIMESTAMP;
    };

    // ─── Reconnect ─────────────────────────────────────────────
    FM.reconnect = function() {
        if (!FM.db) return;
        FM.db.goOffline();
        setTimeout(() => FM.db.goOnline(), 500);
    };

    window.ZEKRA.firebase = FM;

    console.log('✅ ZEKRA: FirebaseManager loaded.');
})();