/**
 * ZEKRA UI ENGINE v4.4.1
 * Main rendering engine: builds the vault UI from state, handles live preview, gallery, and layout.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const UI = {};
    let _buildTimer = null;
    let _journeyRendered = false;

    // ─── Build Core UI ───────────────────────────────────────
    UI.build = function(immediate) {
        if (immediate) {
            if (_buildTimer) { clearTimeout(_buildTimer); _buildTimer = null; }
            _buildCore();
            return;
        }
        if (_buildTimer) clearTimeout(_buildTimer);
        _buildTimer = setTimeout(() => {
            _buildTimer = null;
            _buildCore();
        }, ZEKRA.isMobile() ? 400 : 120);
    };

    function _buildCore() {
        try {
            const state = ZEKRA.state ? ZEKRA.state.get() : {};
            const bgAttach = ZEKRA.isMobile() ? 'scroll' : 'fixed';

            // Background
            if (state.bg) {
                document.body.style.backgroundImage = `url('${state.bg}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundAttachment = bgAttach;
                document.body.style.backgroundPosition = 'center';
            }

            // Header Branding
            const nl = document.getElementById('nav-logo-img');
            const ni = document.getElementById('nav-logo-icon');
            if (nl && ni) {
                const logoUrl = (state.c && state.c.trim() !== "") ? state.c.trim() : null;
                if (logoUrl) { nl.src = logoUrl; nl.classList.remove('hidden'); ni.classList.add('hidden'); }
                else { nl.classList.add('hidden'); ni.classList.remove('hidden'); }
            }

            // Economy injection
            if (!state.products) state.products = [];
            ZEKRA.FONT_PRODUCTS.forEach(fp => {
                if (!state.products.find(p => p.id === fp.id)) state.products.push(fp);
            });
            if (state.galleryLimit === undefined) state.galleryLimit = 5;
            if (state.storyUnlocked === undefined) state.storyUnlocked = false;
            if (state.musicSwitches === undefined) state.musicSwitches = 0;

            // Names
            const uiN = document.getElementById('ui-n');
            if (uiN) {
                uiN.innerText = state.n || "Zekra Vault";
                uiN.style.fontFamily = state.userNameFont || "'Nunito'";
            }

            // Story text
            const uiStory = document.querySelector('header p');
            if (uiStory) {
                uiStory.innerHTML = state.w || "story!";
                uiStory.style.fontFamily = state.bigFont || "'Dancing Script'";
            }

            // Floating buddy
            const uiCat = document.getElementById('ui-cat');
            if (uiCat) {
                uiCat.src = state.float || ZEKRA.DEFAULT_FLOAT;
                uiCat.onerror = () => { uiCat.src = ZEKRA.DEFAULT_FLOAT; uiCat.onerror = null; };
            }

            // Daily message
            const uiDm = document.getElementById('ui-dm');
            if (uiDm) {
                if (!state.dm || state.dm.trim() === "") {
                    uiDm.innerHTML = '<span class="animated-placeholder">Write your daily message... ✍️</span>';
                } else {
                    uiDm.innerText = state.dm;
                }
            }

            // Big message
            const uiBigMsg = document.getElementById('ui-msg');
            if (uiBigMsg) {
                const content = state.longMessage || state.dm_large || "";
                if (content.trim() === "") {
                    uiBigMsg.innerHTML = '<div class="animated-placeholder opacity-60 text-2xl py-10 cursor-pointer" onclick="openAdminSheet()">Write your first big message here... ❤️</div>';
                } else {
                    uiBigMsg.innerHTML = ZEKRA.parseStoryText(content);
                    uiBigMsg.onclick = () => openAdminSheet();
                    uiBigMsg.classList.add('cursor-pointer');
                }
            }

            // Music style
            const mSec = document.getElementById('smart-player-container');
            if (mSec) {
                mSec.className = `w-full relative z-10 p-6 shadow-xl overflow-hidden min-h-[160px] ${state.spotifyStyle || 'spot-style-1'}`;
            }

            // Render journey
            UI.renderJourney(!ZEKRA.isMobile());

            // Render music player
            if (ZEKRA.Music) ZEKRA.Music.render(state.a, state.lyrics);

            // Shop theme
            const shopOverlay = document.getElementById('shop-overlay');
            if (shopOverlay) {
                shopOverlay.classList.remove('theme-glass', 'theme-dark', 'theme-pink');
                shopOverlay.classList.add(`theme-${state.storeTheme || 'glass'}`);
            }

            // Mood
            const moodModal = document.getElementById('o-emg');
            if (moodModal) {
                const ig = moodModal.querySelector('img');
                if (ig) {
                    ig.src = state.moodImg || ZEKRA.DEFAULT_MOOD;
                    ig.onerror = () => { ig.src = ZEKRA.DEFAULT_MOOD; ig.onerror = null; };
                }
                const rz = moodModal.querySelector('.space-y-3');
                const tMsg = moodModal.querySelector('h2');
                if (tMsg) tMsg.style.fontFamily = state.moodFont || "'Indie Flower'";
                if (rz && state.moodReasons) {
                    rz.innerHTML = state.moodReasons.split('|').map(r =>
                        `<div class="bg-blue-50 rounded-[45px] p-4 text-center text-lg font-bold text-blue-600 f-cur" style="font-family:${state.moodFont || "'Indie Flower'"}">${r.trim()}</div>`
                    ).join('');
                }
            }

            // Branding color
            const colorBox = document.getElementById('vaultState-color-p');
            if (colorBox) colorBox.style.background = state.color;
            if (!ZEKRA.isMobile() || state.color !== window._lastBrandingColor) {
                document.querySelectorAll('.text-pink-600, .text-pink-500, .text-pink-400').forEach(e => e.style.color = state.color);
                document.querySelectorAll('.bg-pink-400, .bg-pink-500').forEach(e => e.style.background = state.color);
                window._lastBrandingColor = state.color;
            }

            // Design overlay
            const bWrap = document.getElementById('b-wrap') || document.body;
            if (state.bg) {
                if (state.bg.includes('http') || state.bg.includes('base64')) {
                    bWrap.style.backgroundImage = `url(${state.bg})`;
                    bWrap.style.backgroundColor = 'transparent';
                } else {
                    bWrap.style.backgroundImage = 'none';
                    bWrap.style.backgroundColor = state.bg;
                    bWrap.style.background = state.bg;
                }
                bWrap.style.backgroundSize = 'cover';
                bWrap.style.backgroundAttachment = bgAttach;
                bWrap.style.backgroundPosition = 'center';
            }
            if (state.dim) bWrap.classList.add('brightness-75', 'backdrop-blur-sm');
            else bWrap.classList.remove('brightness-75', 'backdrop-blur-sm');
            document.querySelectorAll('.bg-heart').forEach(h => h.style.display = state.pixel ? 'block' : 'none');

            // Wallet
            UI._renderWallet(state);

            // Live counter
            const sDt = new Date(state.sd + 'T00:00:00');
            const nDt = new Date();
            const dfc = Math.floor((nDt - sDt) / 86400000);
            const uiDay = document.getElementById('ui-day');
            if (uiDay) uiDay.innerText = isNaN(dfc) ? 0 : dfc;

            // Midnight refresh
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            setTimeout(() => UI.build(), midnight - new Date() + 1000);

            // Reordering
            if (state.o) {
                Object.keys(state.o).forEach(k => {
                    const s = document.getElementById('sec-' + k);
                    if (s) s.style.order = state.o[k];
                });
            }

            // Gallery
            UI._renderGallery(state);

            // Apply fonts
            if (ZEKRA.Fonts) ZEKRA.Fonts.applyLocks();
        } catch (e) {
            console.error("UI build error:", e);
        }
    }

    // ─── Render Wallet ───────────────────────────────────────
    UI._renderWallet = function(state) {
        const walletSec = document.getElementById('sec-wal');
        const wFont = state.c1f || "'Montserrat'";
        if (!walletSec) return;
        walletSec.innerHTML = `
            <span class="text-[10px] font-black text-pink-400 uppercase tracking-widest block mb-1">Our Pocket</span>
            <span class="text-2xl text-gray-800 f-ser block mb-4 font-bold">Digital Wallet 💳</span>
            <div class="space-y-4">
                <div id="wal-c1" class="g-pink min-h-[170px] flex flex-col justify-end p-6 relative overflow-hidden text-left border-[2px] border-white shadow-lg w-full"
                     style="font-family:${wFont}; background-image: url('${state.c1b || ''}'); background-size: cover; background-position: center;">
                     <div class="relative z-10 pointer-events-none">
                        <h4 class="font-black text-gray-800 text-[20px] mb-1">${state.c1t}</h4>
                        <p class="text-gray-500 text-[18px]">${state.c1s}</p>
                     </div>
                </div>
                <div id="wal-c2" class="g-pink min-h-[170px] flex flex-col justify-end p-6 relative overflow-hidden text-left border-[2px] border-white shadow-lg w-full"
                     style="font-family:${wFont}; background-image: url('${state.c2b || ''}'); background-size: cover; background-position: center;">
                     <div class="relative z-10 pointer-events-none">
                        <h4 class="font-black text-gray-800 text-[20px] mb-1">${state.c2t}</h4>
                        <p class="text-gray-500 text-[18px]">${state.c2s}</p>
                     </div>
                </div>
            </div>`;
    };

    // ─── Render Gallery ──────────────────────────────────────
    UI._renderGallery = function(state) {
        const sc = document.getElementById('swipe-c');
        if (!sc) return;
        sc.innerHTML = '';
        const items = state.g || [];
        if (items.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'media-placeholder w-full h-[300px] cursor-pointer';
            placeholder.innerHTML = `<i class="ri-image-add-line text-5xl mb-2"></i><p class="text-lg">Add your first memory</p><p class="text-[10px] opacity-70 mt-1">(First one is free! 📸)</p>`;
            placeholder.onclick = () => { if (ZEKRA.Admin) ZEKRA.Admin.switchTab('gal'); };
            sc.appendChild(placeholder);
        } else {
            items.forEach(s => {
                const rawUrl = typeof s === 'string' ? s : s.url;
                const url = (rawUrl && rawUrl !== 'undefined' && rawUrl !== 'null') ? rawUrl : ZEKRA.DEFAULT_MEMORY;
                const isVideo = url && (url.toLowerCase().endsWith('.mp4') || url.includes('/video/upload/'));
                const media = isVideo
                    ? `<video src="${url}" class="w-full h-full object-cover rounded-[32px]" autoplay loop muted playsinline crossorigin="anonymous"></video>`
                    : `<img src="${url}" border="0" loading="lazy" class="w-full h-full object-cover rounded-[32px]" crossorigin="anonymous" onerror="this.onerror=null; this.src='${ZEKRA.DEFAULT_MEMORY}'">`;
                const card = document.createElement('div');
                card.className = 'scard';
                card.innerHTML = media;
                sc.appendChild(card);
            });
        }
        UI._initSwipe();
    };

    // ─── Swipe Engine ────────────────────────────────────────
    UI._initSwipe = function() {
        let cx = 0, tk = null, sx = 0, raf = null;
        const cs = document.querySelectorAll('.scard');
        cs.forEach((el, i) => {
            const r = (i % 2 === 0 ? 1 : -1) * ((i * 2) % 5 + 2);
            el.dataset.r = r;
            el.style.zIndex = i;
            if (i === cs.length - 1) {
                el.style.transform = `scale(1) rotate(${r}deg)`;
                el.style.opacity = '1';
            } else if (i === cs.length - 2) {
                el.style.transform = `scale(0.95) translateY(-20px) rotate(${r}deg)`;
                el.style.opacity = '0.9';
            } else {
                el.style.transform = `scale(0.9) translateY(-40px) rotate(${r}deg)`;
                el.style.opacity = '0.7';
            }
            el.onpointerdown = e => {
                if (i !== cs.length - 1) return;
                tk = el;
                sx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                tk.classList.add('moving');
                document.onpointermove = dm;
                document.onpointerup = du;
            };
        });

        function dm(e) {
            if (!tk) return;
            cx = (e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0)) - sx;
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (!tk) return;
                tk.style.transform = `translateX(${cx}px) rotate(${cx * 0.05 + parseFloat(tk.dataset.r)}deg)`;
            });
        }

        function du() {
            if (!tk) return;
            document.onpointermove = document.onpointerup = null;
            if (raf) cancelAnimationFrame(raf);
            tk.classList.remove('moving');
            if (Math.abs(cx) > 80) {
                const d = cx > 0 ? 1 : -1;
                tk.style.transform = `translateX(${d * 250}px) rotate(${d * 50}deg)`;
                tk.style.opacity = 0;
                if (navigator.vibrate) navigator.vibrate(10);
                const tt = tk; tk = null;
                setTimeout(() => {
                    const pc = document.getElementById('swipe-c');
                    if (pc) pc.insertBefore(tt, pc.firstChild);
                    UI._initSwipe();
                }, 300);
            } else {
                tk.style.transform = `scale(1) rotate(${tk.dataset.r}deg)`;
                tk = null;
            }
        }
    };

    // ─── Render Journey ──────────────────────────────────────
    UI.renderJourney = function(force) {
        if (!force && ZEKRA.isMobile() && !_journeyRendered) return;
        const list = document.getElementById('jn-list');
        if (!list) return;
        _journeyRendered = true;

        const missions = ZEKRA.isMobile() ? ZEKRA.MISSIONS.slice(0, 30) : ZEKRA.MISSIONS;
        list.innerHTML = `
            <div class="absolute top-8 bottom-0 left-1/2 transform -translate-x-1/2 w-2 bg-gray-200 rounded-full z-0 opacity-50"></div>
            <div id="jn-progress-bar" class="absolute top-8 left-1/2 transform -translate-x-1/2 w-2 bg-gradient-to-b from-pink-400 via-orange-400 to-purple-400 rounded-full z-0"></div>`;

        missions.forEach((m, i) => {
            const isLeft = i % 2 !== 0;
            const isCompleted = i < 3;
            const level = document.createElement('div');
            level.className = `mission-item relative z-10 w-full flex flex-col items-center mb-[70px] ${!isCompleted ? 'grayscale opacity-60' : ''}`;
            level.style.animationDelay = `${i * 0.15}s`;

            if (i === 0) {
                level.innerHTML = `
                    <div class="flex flex-col items-center gap-2">
                        <div class="w-[75px] h-[75px] rounded-full flex items-center justify-center text-[34px] text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] bg-pink-400 border-[2px] border-white/80">
                            <i class="ri-${m.i} drop-shadow-md"></i>
                        </div>
                        <h3 class="f-nun font-black tracking-tighter text-gray-800 text-[20px] mb-0 bg-white/70 backdrop-blur-sm px-5 py-1.5 rounded-full shadow-sm border-[1px] border-white/50 mt-1">${m.t}</h3>
                    </div>`;
            } else {
                level.className = `mission-item relative z-10 w-full flex flex-row items-center ${isLeft ? 'pl-6' : 'pr-6'} mb-[70px] ${!isCompleted ? 'grayscale opacity-60' : ''}`;
                level.style.animationDelay = `${i * 0.15}s`;
                level.innerHTML = `
                    <div class="flex items-center gap-4 w-full ${isLeft ? '' : 'flex-row-reverse'}">
                        <div class="w-[75px] h-[75px] rounded-full flex items-center justify-center text-[34px] text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] bg-pink-400 border-[2px] border-white/80 flex-shrink-0">
                            <i class="ri-${m.i} drop-shadow-md"></i>
                        </div>
                        <div class="bg-white/70 p-4 rounded-[25px] backdrop-blur-sm shadow-sm border-[1px] border-white/50 flex-1 ${isLeft ? 'relative' : 'text-right relative'}">
                            <div class="absolute ${isLeft ? '-left-2' : '-right-2'} top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white/70 backdrop-blur-sm transform rotate-45 border-${isLeft ? 'l-[1px] border-b' : 't-[1px] border-r'}-[1px] border-white/50"></div>
                            <h3 class="f-nun font-black tracking-tighter text-gray-800 text-[18px] mb-1">${m.t}</h3>
                            <p class="text-[10px] font-bold text-pink-500 uppercase flex ${isLeft ? '' : 'justify-end'} items-center gap-1"><i class="ri-star-fill"></i> +${m.xp || 50} XP</p>
                        </div>
                    </div>`;
            }
            list.appendChild(level);
        });

        const progress = document.getElementById('jn-progress-bar');
        if (progress) progress.style.height = '240px';
        const cc = document.getElementById('jn-curr-count');
        const tc = document.getElementById('jn-total-count');
        if (cc) cc.innerText = "3";
        if (tc) tc.innerText = missions.length;
    };

    window.ZEKRA.UI = UI;
    console.log('✅ ZEKRA: UIEngine loaded.');
})();