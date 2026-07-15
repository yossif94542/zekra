/**
 * ZEKRA NAVIGATION v4.4.1
 * Bottom nav bar, drawer management, overlay management.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    let lastScrollY = 0;
    let _navMapping = {
        'home': 0, 'missions': 1, 'studio': 2, 'notes': 3, 'shop': 4
    };

    // ─── Update Active Nav State ─────────────────────────────
    ZEKRA.updateNav = function(navType) {
        const links = document.querySelectorAll('.nav-link');
        if (!links.length) return;
        links.forEach(l => l.classList.remove('active'));
        const idx = _navMapping[navType];
        if (idx !== undefined && links[idx]) {
            links[idx].classList.add('active');
        }
    };

    // ─── Close All Overlays ──────────────────────────────────
    ZEKRA.closeAll = function() {
        const overlays = [
            'profile-overlay', 'shop-overlay', 'sk-d', 'jn-d',
            'admin-panel', 'o-emg', 'recharge-modal'
        ];
        overlays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('show', 'active', 'open', 'open-l', 'open-r');
        });

        const wasLocked = document.body.classList.contains('scroll-locked');
        document.body.classList.remove('scroll-locked', 'drawer-open', 'locked-full-overlay', 'chat-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        document.body.style.top = '';

        if (wasLocked && lastScrollY !== undefined) {
            window.scrollTo(0, lastScrollY);
        }

        ZEKRA.updateNav('home');
    };

    // ─── Save/Lock Scroll ────────────────────────────────────
    ZEKRA.lockScroll = function() {
        if (!document.body.classList.contains('scroll-locked')) {
            lastScrollY = window.scrollY;
        }
        document.body.classList.add('scroll-locked');
        document.body.style.top = `-${lastScrollY}px`;
    };

    ZEKRA.unlockScroll = function() {
        document.body.classList.remove('scroll-locked', 'drawer-open', 'locked-full-overlay');
        document.body.style.top = '';
        if (lastScrollY !== undefined) {
            window.scrollTo(0, lastScrollY);
        }
    };

    // ─── Open Missions ───────────────────────────────────────
    ZEKRA.openMissions = function() {
        ZEKRA.lockScroll();
        ZEKRA.closeAll();
        const jn = document.getElementById('jn-d');
        if (jn) jn.classList.add('open-l');
        ZEKRA.updateNav('missions');
    };

    // ─── Open Notes/Sketchbook ───────────────────────────────
    ZEKRA.openNotes = function() {
        ZEKRA.lockScroll();
        ZEKRA.closeAll();
        const sk = document.getElementById('sk-d');
        if (sk) sk.classList.add('open-r');
        ZEKRA.updateNav('notes');
    };

    // ─── Open Shop ───────────────────────────────────────────
    ZEKRA.openShop = function(show) {
        if (show) {
            ZEKRA.lockScroll();
            ZEKRA.closeAll();
            const shop = document.getElementById('shop-overlay');
            if (shop) shop.classList.add('active');
            const trigger = document.getElementById('shop-trigger');
            if (trigger) trigger.style.transform = 'scale(0) rotate(90deg)';
            ZEKRA.updateNav('shop');
        } else {
            ZEKRA.closeAll();
        }
    };

    // ─── Open Chat ───────────────────────────────────────────
    ZEKRA.openChat = function() {
        document.body.classList.remove('drawer-open', 'locked-full-overlay', 'scroll-locked');
        document.body.style.overflow = 'hidden';
        document.body.style.top = '';
        const profile = document.getElementById('profile-overlay');
        if (profile) {
            profile.classList.add('show');
            document.body.classList.add('chat-open');
        }
    };

    console.log('✅ ZEKRA: Navigation loaded.');
})();