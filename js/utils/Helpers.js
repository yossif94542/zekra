/**
 * ZEKRA HELPERS v4.4.1
 * Shared utility functions used across all modules.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    // ─── Safe Element Style Getter/Setter ─────────────────────
    ZEKRA.gs = function(id, prop, val) {
        const el = document.getElementById(id);
        if (!el) return null;
        if (val !== undefined) {
            el.style[prop] = val;
            return el.style[prop];
        }
        return el.style[prop];
    };

    // ─── Parse Story Text with Rich Formatting ────────────────
    ZEKRA.parseStoryText = function(text) {
        if (!text) return "";
        let html = text;
        const tokens = [];
        const pt = (res) => {
            tokens.push(res);
            return `__TKN${tokens.length - 1}__`;
        };

        html = html.replace(/\*(.*?)\*/g, (m, p1) => pt(`<span class="uppercase text-pink-500 font-black">${p1}</span>`));
        html = html.replace(/\((.*?)\)/g, (m, p1) => pt(`<span class="bg-pink-100 text-pink-600 px-3 py-1 rounded-full inline-flex items-center gap-1 mx-1 shadow-sm"><i class="ri-heart-fill"></i> ${p1}</span>`));
        html = html.replace(/-(.*?)-/g, (m, p1) => pt(`<span class="border-2 border-indigo-400 text-indigo-500 px-2 py-0.5 rounded-md mx-1 font-bold bg-indigo-50/50">${p1}</span>`));
        html = html.replace(/~(.*?)~/g, (m, p1) => pt(`<span class="bg-yellow-200/50 text-yellow-700 px-1 rounded shadow-[0_0_10px_rgba(253,224,71,0.5)] mx-1">${p1}</span>`));
        html = html.replace(/#([\w\u0600-\u06FF]+)/g, (m, p1) => pt(`<span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 font-bold">#${p1}</span>`));
        html = html.replace(/\^(.*?)\^/g, (m, p1) => pt(`<span class="inline-block animate-bounce text-purple-600 font-black mx-1">${p1}</span>`));

        tokens.forEach((t, i) => { html = html.replace(`__TKN${i}__`, t); });
        html = html.replace(/\n/g, '<br>');
        return html;
    };

    // ─── Scrollbar Width Calculation ──────────────────────────
    ZEKRA.getScrollbarWidth = function() {
        return window.innerWidth - document.documentElement.clientWidth;
    };

    // ─── Mobile Detection ─────────────────────────────────────
    ZEKRA.isMobile = function() {
        return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
            || window.innerWidth <= 768
            || ('ontouchstart' in window && window.matchMedia('(max-width: 1024px)').matches);
    };

    ZEKRA.isLowPower = function() {
        return ZEKRA.isMobile()
            || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
            || !!(navigator.connection && navigator.connection.saveData);
    };

    // ─── Global Loading Overlay ───────────────────────────────
    ZEKRA.loading = function(state) {
        const el = document.getElementById('global-loading');
        if (!el) return;
        if (state) {
            el.style.display = 'flex';
            el.classList.add('show');
        } else {
            el.classList.remove('show');
            setTimeout(() => { el.style.display = 'none'; }, 300);
        }
    };

    // ─── Vibrate Shortcut ─────────────────────────────────────
    ZEKRA.vibrate = function(pattern) {
        if (navigator.vibrate) navigator.vibrate(pattern || 10);
    };

    // ─── Copy to Clipboard ────────────────────────────────────
    ZEKRA.copy = function(text, btnEl) {
        navigator.clipboard.writeText(text).then(() => {
            if (btnEl) {
                const orig = btnEl.innerText;
                btnEl.innerText = "COPIED!";
                btnEl.classList.add('text-green-400');
                setTimeout(() => {
                    btnEl.innerText = orig;
                    btnEl.classList.remove('text-green-400');
                }, 1000);
            }
        }).catch(() => {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    };

    // ─── Debounce ─────────────────────────────────────────────
    ZEKRA.debounce = function(fn, ms) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    };

    // ─── Throttle ─────────────────────────────────────────────
    ZEKRA.throttle = function(fn, ms) {
        let last = 0;
        return function(...args) {
            const now = Date.now();
            if (now - last >= ms) {
                last = now;
                fn.apply(this, args);
            }
        };
    };

    // ─── Format Timestamp ─────────────────────────────────────
    ZEKRA.formatTime = function(ts) {
        const d = new Date(ts);
        return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    };

    ZEKRA.formatDate = function(ts) {
        return new Date(ts).toLocaleString();
    };

    // ─── Image Error Fallback ─────────────────────────────────
    ZEKRA.imgFallback = function(img, fallback) {
        img.onerror = function() {
            this.src = fallback || ZEKRA.DEFAULT_MEMORY;
            this.onerror = null;
        };
    };

    console.log('✅ ZEKRA: Helpers loaded.');
})();