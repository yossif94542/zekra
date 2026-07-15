/**
 * ZEKRA SHOP & ECONOMY v4.4.1
 * Store management, coin economy, product purchasing, and recharge.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const Shop = {};

    // ─── Render Shop Products ────────────────────────────────
    Shop.renderProducts = function() {
        const list = document.getElementById('shop-product-list');
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        if (!list || !state.products) return;

        const filtered = state.products.filter(p => {
            return !window.currentShopCat || window.currentShopCat === 'All' || p.cat === window.currentShopCat;
        });

        const user = ZEKRA.getCurrentUser ? ZEKRA.getCurrentUser() : null;
        const uid = user ? (user.side === 'A' ? 'yossif' : 'marium') : 'guest';
        const coinsKey = uid === 'yossif' ? 'coins_yossif' : 'coins_marium';

        list.innerHTML = filtered.map(p => {
            const discount = p.discount || 0;
            const finalPrice = Math.floor(p.cost * (1 - discount / 100));
            const isOwned = p.type === 'font'
                ? (state.purchasedFonts && state.purchasedFonts[uid] && state.purchasedFonts[uid][p.id])
                : (state.ownedItems && state.ownedItems[p.id]);

            return `
                <div class="p-card ${isOwned ? 'opacity-40' : ''}">
                    <div class="p-icon">${p.icon || '📦'}</div>
                    <div class="p-info">
                        <span class="p-tag">${p.category || p.cat || 'Special'}</span>
                        <h4 class="p-title">${p.name}</h4>
                        <div class="p-price-wrap">
                            <span class="p-price">${finalPrice || 'Free'} ${finalPrice ? '🪙' : ''}</span>
                            ${discount > 0 ? `<span class="p-old-price">${p.cost}</span>` : ''}
                        </div>
                    </div>
                    <div class="p-btn-row">
                        ${isOwned ? '<span class="text-[10px] font-black uppercase text-[#FF7096]">Owned</span>' : `
                            <button onclick="ZEKRA.Shop.buy('${p.id}', false)" class="p-buy">Buy</button>
                            <button onclick="ZEKRA.Shop.buy('${p.id}', true)" class="p-gift">🎁</button>
                        `}
                    </div>
                </div>`;
        }).join('');

        // Update coins display
        const coinsEl = document.getElementById('u-shop-coins');
        if (coinsEl) coinsEl.innerText = state[coinsKey] || 0;
    };

    // ─── Buy Product ─────────────────────────────────────────
    Shop.buy = function(id, isGift) {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const user = SanctuaryEngine.getCurrentUser();
        if (!user || user === 'guest') {
            alert("Session Expired. Please log in.");
            return;
        }

        const p = state.products.find(x => x.id === id);
        if (!p) return;

        const finalCost = Math.floor(p.cost * (1 - (p.discount || 0) / 100));
        const coinsKey = (user.side === 'A') ? 'coins_yossif' : 'coins_marium';

        if ((state[coinsKey] || 0) < finalCost) {
            if (confirm(`Not enough coins! 🪙 You need ${finalCost}.\n\nRequest a Coin Top-up?`)) {
                Shop.confirmRecharge(Math.max(100, finalCost), Math.ceil(Math.max(100, finalCost) / 5));
            }
            return;
        }

        if (!state.ownedItems) state.ownedItems = {};

        if (p.type === 'font') {
            if (!state.purchasedFonts) state.purchasedFonts = { marium: {}, yossif: {} };
            const uid = user.id || user.displayName || 'guest';
            if (!state.purchasedFonts[uid]) state.purchasedFonts[uid] = {};
            if (state.purchasedFonts[uid][id]) return alert("Font already purchased! 💖");
            state[coinsKey] -= finalCost;
            state.purchasedFonts[uid][id] = true;
            ZEKRA.state.scheduleLocalSave();
            ZEKRA.state.scheduleCloudSync();
            Shop.renderProducts();
            if (typeof applyFontLocks === 'function') applyFontLocks();
            return;
        }

        if (p.type === 'unlock' && state.ownedItems[id]) return alert("Item already owned!");
        state[coinsKey] -= finalCost;

        if (id === 'extra_photo_1') state.galleryLimit = (state.galleryLimit || 5) + 1;
        if (id === 'extra_photo_10') state.galleryLimit = (state.galleryLimit || 5) + 10;
        if (id === 'music_switcher') state.musicSwitches = (state.musicSwitches || 0) + 1;
        if (id === 'story_editor') state.storyUnlocked = true;
        if (id === 'msg_editor') {
            const newMsg = prompt("Enter new Main Message:", state.dm_large || "");
            if (newMsg) {
                state.dm_large = newMsg;
                state.longMessage = newMsg;
                const fb = window.ZEKRA.firebase;
                if (fb && fb.db) {
                    fb.db.ref(`users/${user.uid}/data/longMessage`).set(newMsg);
                }
            }
        }

        state.ownedItems[id] = { at: Date.now(), title: p.name, type: p.type, active: true };

        if (p.type === 'theme') {
            Object.keys(state.ownedItems).forEach(key => {
                if (state.ownedItems[key].type === 'theme' && key !== id) {
                    state.ownedItems[key].active = false;
                }
            });
        }

        ZEKRA.state.scheduleLocalSave();
        ZEKRA.state.scheduleCloudSync();
        Shop.renderProducts();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        alert(isGift ? `Gift sent! 🎁` : `Purchase success! ${p.icon || '✨'}`);
    };

    // ─── Category Filter ─────────────────────────────────────
    Shop.filter = function(cat, btn) {
        document.querySelectorAll('.cat-btn').forEach(el => el.classList.remove('active'));
        if (btn) btn.classList.add('active');
        window.currentShopCat = cat;
        Shop.renderProducts();
    };

    // ─── Confirm Recharge ────────────────────────────────────
    Shop.confirmRecharge = function(coins, egp) {
        window.pendingRecharge = { coins, egp };
        document.getElementById('rech-egp-val').innerText = egp;
        const coinsVal = document.getElementById('rech-coins-val');
        if (coinsVal) coinsVal.innerText = coins;
        ZEKRA.lockScroll();
        ZEKRA.closeAll();
        const modal = document.getElementById('recharge-modal');
        if (modal) modal.classList.add('active');
        const successScreen = document.getElementById('order-success-screen');
        if (successScreen) {
            successScreen.classList.add('hidden', 'opacity-0', 'translate-y-4');
            successScreen.classList.remove('flex');
        }
    };

    // ─── Handle Purchase (Recharge) ──────────────────────────
    Shop.handlePurchase = async function() {
        if (!window.pendingRecharge) return;
        const receiptInput = document.getElementById('rech-receipt-img');
        const errText = document.getElementById('rech-receipt-err');
        if (!receiptInput.files || receiptInput.files.length === 0) {
            if (errText) errText.classList.remove('hidden');
            return;
        }
        if (errText) errText.classList.add('hidden');

        const file = receiptInput.files[0];
        ZEKRA.loading(true);

        try {
            const blob = await ZEKRA.Uploader.compressToBlob(file, 1000, 0.7);
            const url = await ZEKRA.Uploader.uploadToCloudinary(blob, 'receipt');

            const fb = window.ZEKRA.firebase;
            const user = SanctuaryEngine.getCurrentUser();
            if (!fb || !user) throw new Error("Not connected");

            const orderRef = fb.db.ref('zekra_orders').push();
            const genId = Math.floor(Math.random() * 90000000) + 10000000;
            await orderRef.set({
                orderId: orderRef.key,
                displayId: genId,
                uid: user.id,
                coinsAmount: window.pendingRecharge.coins,
                amountEGP: window.pendingRecharge.egp,
                itemType: "COIN_TOPUP",
                status: "PENDING",
                screenshot: url || 'no-screenshot',
                timestamp: fb.timestamp(),
                type: 'topup_request'
            });

            ZEKRA.loading(false);
            const successScreen = document.getElementById('order-success-screen');
            if (successScreen) {
                document.getElementById('gen-order-id').innerText = genId;
                document.getElementById('order-acc-name').innerText = user.displayName || user.id;
                document.getElementById('order-egp-val').innerText = window.pendingRecharge.egp;
                const oc = document.getElementById('order-coins-val');
                if (oc) oc.innerText = window.pendingRecharge.coins;
                successScreen.classList.remove('hidden', 'opacity-0', 'translate-y-4');
                successScreen.classList.add('flex', 'opacity-100', 'translate-y-0');
            }
            receiptInput.value = '';
        } catch (err) {
            ZEKRA.loading(false);
            alert('Order Failed: ' + err.message);
        }
    };

    window.ZEKRA.Shop = Shop;
    console.log('✅ ZEKRA: ShopModule loaded.');
})();