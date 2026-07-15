/**
 * ZEKRA ADMIN PANEL v4.4.1
 * User-facing admin settings: branding, security, music, gallery, wallet, design, mood, events.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const Admin = {};

    // ─── Open Admin Sheet ────────────────────────────────────
    Admin.open = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const map = {
            'vaultState-color': 'color', 'vaultState-c': 'c',
            'vaultState-a': 'a', 'vaultState-at': 'title', 'vaultState-aa': 'artist',
            'music-lyrics-input': 'lyrics', 'spotify-widget-style': 'spotifyStyle',
            'vaultState-c1t': 'c1t', 'vaultState-c1s': 'c1s', 'vaultState-c1b': 'c1b',
            'vaultState-c2t': 'c2t', 'vaultState-c2s': 'c2s', 'vaultState-c2b': 'c2b',
            'wallet-font-input': 'c1f',
            'vaultState-bg': 'bg', 'vaultState-dim': 'dim', 'vaultState-pixel': 'pixel',
            'welcome-msg-input': 'longMessage', 'user-name-font': 'userNameFont', 'big-msg-font': 'bigFont',
            'vaultState-emg': 'moodImg', 'vaultState-emgr': 'moodReasons', 'mood-font-input': 'moodFont',
            'vaultState-sd': 'sd', 'vaultState-d': 'd'
        };

        Object.keys(map).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const key = map[id];
            if (el.type === 'checkbox') el.checked = state[key];
            else if (el.contentEditable === 'true') el.innerHTML = state[key] || '';
            else el.value = state[key] || '';
        });

        ZEKRA.lockScroll();
        ZEKRA.closeAll();
        const ap = document.getElementById('admin-panel');
        if (ap) ap.classList.add('open');
    };

    // ─── Close Admin Sheet ───────────────────────────────────
    Admin.close = function() {
        const ap = document.getElementById('admin-panel');
        if (ap) ap.classList.remove('open');
        ZEKRA.unlockScroll();
    };

    // ─── Save All Settings ───────────────────────────────────
    Admin.save = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const map = {
            'vaultState-color': 'color', 'vaultState-c': 'c',
            'vaultState-a': 'a', 'vaultState-at': 'title', 'vaultState-aa': 'artist',
            'music-lyrics-input': 'lyrics', 'spotify-widget-style': 'spotifyStyle',
            'vaultState-c1t': 'c1t', 'vaultState-c1s': 'c1s', 'vaultState-c1b': 'c1b',
            'vaultState-c2t': 'c2t', 'vaultState-c2s': 'c2s', 'vaultState-c2b': 'c2b',
            'wallet-font-input': 'c1f',
            'vaultState-bg': 'bg', 'vaultState-dim': 'dim', 'vaultState-pixel': 'pixel',
            'vaultState-p-theme': 'p_theme',
            'welcome-msg-input': 'longMessage', 'user-name-font': 'userNameFont', 'big-msg-font': 'bigFont',
            'vaultState-emg': 'moodImg', 'vaultState-emgr': 'moodReasons', 'mood-font-input': 'moodFont',
            'vaultState-sd': 'sd', 'vaultState-d': 'd'
        };

        Object.keys(map).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const val = (el.type === 'checkbox') ? el.checked : (el.contentEditable === 'true' ? el.innerHTML : el.value);
            if (val !== "" || state[map[id]] === undefined) {
                state[map[id]] = val;
            }
        });
        if (state.longMessage) state.dm_large = state.longMessage;

        if (ZEKRA.state) {
            ZEKRA.state.scheduleLocalSave();
            ZEKRA.state.scheduleCloudSync();
        }
        if (ZEKRA.Fonts) ZEKRA.Fonts.updateSoulUI();
        Admin.close();
    };

    // ─── Tab Switching ───────────────────────────────────────
    Admin.switchTab = function(tabId) {
        document.querySelectorAll('.t-btn').forEach(x => x.classList.remove('t-act'));
        document.querySelectorAll('.t-pan').forEach(x => x.classList.remove('p-act'));

        const tab = document.querySelector(`.t-btn[data-t="${tabId}"]`);
        const pan = document.getElementById(`tp-${tabId}`);
        if (tab) tab.classList.add('t-act');
        if (pan) pan.classList.add('p-act');
    };

    // ─── Bind File Uploads ───────────────────────────────────
    Admin.bindFileUpload = function(inputId, fileNameId, dbField, maxW, qual) {
        const inp = document.getElementById(inputId);
        const txt = document.getElementById(fileNameId);
        if (!inp) return;

        inp.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const isMaster = SanctuaryEngine.isMaster ? SanctuaryEngine.isMaster() : false;
            const isFreeField = isMaster || (dbField === 'bg' || dbField === 'moodImg' || dbField === 'c1b' || dbField === 'c2b' || dbField === 'chatBg');
            if (!isFreeField) {
                const state = ZEKRA.state ? ZEKRA.state.get() : {};
                const user = SanctuaryEngine.getCurrentUser();
                const coinsKey = (user && user.side === 'A') ? 'coins_yossif' : 'coins_marium';
                if (!state.firsts?.img && (state[coinsKey] || 0) < 50) {
                    alert("🔒 50 Coins required for Branding Update 💰");
                    inp.value = '';
                    return;
                }
            }

            if (txt) txt.innerText = file.name;
            ZEKRA.loading(true);
            try {
                const url = await ZEKRA.Uploader.upload(file, { maxW: maxW || 800, qual: qual || 0.7 });
                const state = ZEKRA.state ? ZEKRA.state.get() : {};
                state[dbField] = url;
                if (ZEKRA.state) ZEKRA.state.scheduleLocalSave();
            } catch (err) {
                alert("Upload failed: " + err.message);
            }
            ZEKRA.loading(false);
        };
    };

    window.ZEKRA.Admin = Admin;
    console.log('✅ ZEKRA: AdminPanel loaded.');
})();