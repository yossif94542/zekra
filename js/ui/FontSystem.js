/**
 * ZEKRA FONT SYSTEM v4.4.1
 * Font lock/unlock system, theme application, and font management.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const Fonts = {};

    // ─── Apply Font Locks ────────────────────────────────────
    Fonts.applyLocks = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const isMaster = SanctuaryEngine.isMaster ? SanctuaryEngine.isMaster() : false;

        const lockTarget = (selector, key, unlockedFont) => {
            const els = document.querySelectorAll(selector);
            els.forEach(el => {
                if ((state.ownedItems && state.ownedItems[key]) || isMaster) {
                    el.classList.remove('locked-font');
                    el.style.fontFamily = unlockedFont;
                } else {
                    el.classList.add('locked-font');
                    el.style.fontFamily = "'Nunito', sans-serif";
                }
            });
        };

        lockTarget('#ui-msg', 'font_welcomeMessage', "'Dancing Script'");
        lockTarget('#ui-story-text', 'font_storeWord', "'Cairo'");
        lockTarget('#ui-n', 'font_ourNames', "'Pacifico'");
        lockTarget('#ui-note-title', 'font_noteSection', "'Playfair Display'");
        lockTarget('#o-emg h2', 'font_whyYouMad', "'Montserrat'");
        lockTarget('.jn-txt, .greeting-msg', 'font_bodyText', "'Indie Flower'");

        // Re-apply vaultState font values
        const nameEl = document.getElementById('ui-n');
        const msgEl = document.getElementById('ui-msg');
        const storyEl = document.getElementById('ui-story-text');

        if (nameEl && state.userNameFont) nameEl.style.fontFamily = state.userNameFont;
        if (msgEl && state.bigFont) msgEl.style.fontFamily = state.bigFont;
        if (storyEl && state.bigFont) storyEl.style.fontFamily = state.bigFont;
    };

    // ─── Apply Soul Theme ────────────────────────────────────
    Fonts.applyTheme = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const themeName = state.p_theme || 'soft-rose';
        const themes = ZEKRA.THEMES || {};
        const t = themes[themeName] || themes['soft-rose'];
        if (!t) return;

        const r = document.documentElement.style;
        r.setProperty('--soul-accent', t.accent);
        r.setProperty('--soul-grad', t.grad);
        r.setProperty('--soul-me-bg', t.bubbleMe);
        r.setProperty('--soul-them-bg', t.bubbleThem);
        r.setProperty('--soul-text', t.text);
        r.setProperty('--soul-audio-inv', (t.text === '#fff' ? '1' : '0'));
    };

    // ─── Update Soul UI (Chat, Profile, Avatars) ─────────────
    Fonts.updateSoulUI = function() {
        Fonts.applyLocks();
        Fonts.applyTheme();

        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const user = SanctuaryEngine.getCurrentUser();
        if (!user) return;

        const isY = user.side === 'A';
        const defImg = state.p_theme === 'midnight-gold' || state.p_theme === 'crimson-velvet' || state.p_theme === 'noir-lux'
            ? ZEKRA.SVG_GOLD : ZEKRA.SVG_ROSE;

        const me_n = isY ? (state.y_n || "Soulmate") : (state.m_n || "Soulmate");
        const me_img = isY ? (state.y_img || defImg) : (state.m_img || defImg);
        const so_nick = isY ? (state.m_nick || "Beloved") : (state.y_nick || "Beloved");
        const so_img = isY ? (state.m_img || defImg) : (state.y_img || defImg);

        const msgAvatar = document.getElementById('msg-avatar');
        if (msgAvatar) msgAvatar.src = so_img;

        const msgName = document.getElementById('msg-name');
        if (msgName) msgName.innerText = so_nick;

        const inMyName = document.getElementById('in-my-name');
        if (inMyName) inMyName.value = me_n;

        const myPre = document.getElementById('my-pre');
        if (myPre) myPre.src = me_img;

        const inSoulNick = document.getElementById('in-soul-nick');
        if (inSoulNick) inSoulNick.value = so_nick;

        const soPre = document.getElementById('so-pre');
        if (soPre) soPre.src = so_img;

        // Update main message
        const uiBigMsg = document.getElementById('ui-msg');
        if (uiBigMsg) {
            const msg = state.longMessage || state.dm_large;
            if (!msg || msg.trim() === "") {
                uiBigMsg.innerHTML = '<span class="opacity-40 italic cursor-pointer" onclick="openAdminSheet()">Write your first big message here... ✨</span>';
            } else {
                uiBigMsg.innerHTML = ZEKRA.parseStoryText(msg);
                uiBigMsg.style.cursor = 'pointer';
                uiBigMsg.onclick = () => openAdminSheet();
            }
        }

        // Update coins
        const coinsKey = isY ? 'coins_yossif' : 'coins_marium';
        const coinsEl = document.getElementById('hdr-coins');
        if (coinsEl) coinsEl.innerText = `🪙 ${state[coinsKey] || 0}`;
    };

    // ─── Auto-Initialize on DOMContentLoaded ──────────────────
    Fonts.init = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        if (!state || Object.keys(state).length === 0) {
            // State not ready yet, retry after a short delay
            setTimeout(Fonts.init, 500);
            return;
        }
        Fonts.applyLocks();
        Fonts.applyTheme();
        Fonts.updateSoulUI();
        console.log('✅ ZEKRA: FontSystem auto-initialized.');
    };

    // Listen for state changes to re-apply fonts
    if (ZEKRA.state && ZEKRA.state.onChange) {
        ZEKRA.state.onChange(function(prop, value, state) {
            if (prop === 'p_theme' || prop === 'userNameFont' || prop === 'bigFont' || prop === 'ownedItems') {
                Fonts.applyLocks();
                Fonts.applyTheme();
            }
        });
    }

    window.ZEKRA.Fonts = Fonts;

    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Fonts.init);
    } else {
        Fonts.init();
    }

    console.log('✅ ZEKRA: FontSystem loaded.');
})();
