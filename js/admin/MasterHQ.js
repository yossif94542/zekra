/**
 * ZEKRA MASTER HQ v4.4.1
 * Master control panel: user management, orders, economy, broadcast, logs.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const HQ = {};
    let superAdminTarget = null;

    // ─── Initialize Master HQ ────────────────────────────────
    HQ.init = function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        // FX
        const fxData = state.globalControls?.fx || { filter: 'normal', trail: false, gyro: false, ambient: 'off', blur: 0, bright: 100 };
        HQ.setFX(fxData.filter);
        HQ.toggle('trail', fxData.trail);
        HQ.toggle('gyro', fxData.gyro);
        HQ.setAmb(fxData.ambient);
        const sBlur = document.getElementById('sld-blur');
        const sBright = document.getElementById('sld-bright');
        if (sBlur) { sBlur.value = fxData.blur; HQ.slider('blur'); }
        if (sBright) { sBright.value = fxData.bright; HQ.slider('bright'); }

        // Content
        const mTitle = document.getElementById('m-main-title');
        const mTop = document.getElementById('m-top-msg');
        const mStory = document.getElementById('m-big-story');
        const mDate = document.getElementById('m-date');
        if (mTitle) mTitle.value = state.n || "";
        if (mTop) mTop.value = state.w || "";
        if (mStory) mStory.value = state.longMessage || state.dm_large || "";
        if (mDate) mDate.value = state.sd || "";

        // Assets
        const mBg = document.getElementById('m-bg-url');
        const mBud = document.getElementById('m-buddy-url');
        const mSpot = document.getElementById('m-spotify-url');
        const mSongT = document.getElementById('m-song-title');
        const mSongA = document.getElementById('m-song-artist');
        if (mBg) mBg.value = state.bg || "";
        if (mBud) mBud.value = state.bud || "";
        if (mSpot) mSpot.value = state.a || "";
        if (mSongT) mSongT.value = state.at || "";
        if (mSongA) mSongA.value = state.aa || "";

        // Identity
        const mGName = document.getElementById('m-global-name');
        const mIg = document.getElementById('m-ig');
        const mTk = document.getElementById('m-tk');
        const mSp = document.getElementById('m-sp');
        if (mGName) mGName.value = state.n || "";
        if (mIg) mIg.value = state.ig || "";
        if (mTk) mTk.value = state.tk || "";
        if (mSp) mSp.value = state.sp || "";

        // Economy
        const mCon = document.getElementById('marium-coins');
        if (mCon) mCon.innerText = (state.coins_marium || 0) + " 💎";
        const galLimitEl = document.getElementById('m-gal-limit-display');
        if (galLimitEl) galLimitEl.innerText = `Gallery Limit: ${state.galleryLimit || 5}`;

        HQ.loadUsers();
        HQ.loadOrders();
        HQ.loadTopups();
    };

    // ─── Tab Switching ───────────────────────────────────────
    HQ.tab = function(tabId) {
        document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.m-content').forEach(c => c.classList.remove('active'));
        const activeTab = document.querySelector(`.m-tab[data-t="${tabId}"]`);
        const activeContent = document.getElementById(`m-tp-${tabId}`);
        if (activeTab) activeTab.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        if (tabId === 'users') HQ.loadUsers();
        if (tabId === 'ord') { HQ.loadOrders(); HQ.loadTopups(); }
    };

    // ─── Sub-Tab Switching ───────────────────────────────────
    HQ.subTab = function(subTabId) {
        document.querySelectorAll('.m-sub-tab').forEach(t => {
            t.classList.remove('active', 'bg-[#FF7096]', 'text-white', 'shadow-lg');
            t.classList.add('bg-[#212121]', 'text-gray-400');
        });
        document.querySelectorAll('.m-sub-content').forEach(c => {
            c.classList.remove('active');
            c.classList.add('hidden');
        });
        const activeSubTab = document.querySelector(`.m-sub-tab[data-t="${subTabId}"]`);
        const activeSubContent = document.getElementById(`m-sub-${subTabId}`);
        if (activeSubTab) {
            activeSubTab.classList.add('active', 'bg-[#FF7096]', 'text-white', 'shadow-lg');
            activeSubTab.classList.remove('bg-[#212121]', 'text-gray-400');
        }
        if (activeSubContent) {
            activeSubContent.classList.add('active');
            activeSubContent.classList.remove('hidden');
        }
    };

    // ─── Load Users Tree ─────────────────────────────────────
    HQ.loadUsers = function() {
        const fb = window.ZEKRA.firebase;
        const treeEl = document.getElementById('users-tree-container');
        if (!fb || !treeEl) return;

        treeEl.innerHTML = '<div class="text-center py-20"><div class="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div><p class="text-gray-500 font-black uppercase text-[10px] tracking-widest">Syncing...</p></div>';

        (async function() {
            if (!firebase.auth().currentUser) {
                try { await SanctuaryEngine.bypassMasterLogin(); } catch(e) {}
                try {
                    fb.db.goOffline();
                    fb.db.goOnline();
                    await new Promise(r => setTimeout(r, 500));
                } catch(e) {}
            }

            try {
                const snap = await fb.db.ref('users').once('value');
                const users = snap.val();
                if (!users) {
                    treeEl.innerHTML = '<p class="text-center text-gray-500 py-20 font-black uppercase text-[10px]">No Nodes Found.</p>';
                    return;
                }

                const sorted = Object.keys(users).sort((a, b) => {
                    const aIsS = a.toLowerCase().includes('soulmate');
                    const bIsS = b.toLowerCase().includes('soulmate');
                    if (aIsS && !bIsS) return -1;
                    if (!aIsS && bIsS) return 1;
                    return a.localeCompare(b, undefined, { numeric: true });
                });

                const baseURL = window.location.origin + window.location.pathname;
                treeEl.innerHTML = sorted.map(username => {
                    const user = users[username];
                    const auth = user.settings?.dualAuth || {};
                    const nameA = auth.a_u || "Yossif";
                    const nameB = auth.b_u || "Marium";
                    const nfcA = `${baseURL}?v=${username}&side=A&n=${encodeURIComponent(nameA)}`;
                    const nfcB = `${baseURL}?v=${username}&side=B&n=${encodeURIComponent(nameB)}`;
                    const isSoulmate = username.toLowerCase().includes('soulmate');

                    return `
                        <div class="bg-[#1C1821] rounded-[32px] border ${isSoulmate ? 'border-purple-500/20' : 'border-white/5'} overflow-hidden shadow-2xl mb-4">
                            <div onclick="ZEKRA.HQ.toggleUser('${username}')" class="p-6 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 ${isSoulmate ? 'bg-purple-500/10 text-purple-400' : 'bg-white/5 text-gray-500'} rounded-2xl flex items-center justify-center">
                                        <i class="${isSoulmate ? 'ri-folder-heart-line' : 'ri-shield-keyhole-line'} text-2xl"></i>
                                    </div>
                                    <div>
                                        <h4 class="text-white font-black text-xs uppercase tracking-widest">${username}</h4>
                                        <p class="text-[9px] text-gray-500 font-bold uppercase tracking-widest">${nameA} & ${nameB}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <button onclick="event.stopPropagation(); ZEKRA.HQ.deleteUser('${username}')" class="bg-red-500/10 text-red-400 p-2 rounded-xl hover:bg-red-500/20 border border-red-500/20"><i class="ri-delete-bin-line"></i></button>
                                    <button onclick="event.stopPropagation(); ZEKRA.HQ.manageUser('${username}')" class="bg-white/5 text-white/40 text-[9px] font-black uppercase px-4 py-2 rounded-xl hover:bg-white/10 border border-white/5">Manage</button>
                                    <i class="ri-arrow-down-s-line text-gray-500 transition-transform duration-300" id="tree-icon-${username}"></i>
                                </div>
                            </div>
                            <div id="tree-content-${username}" class="hidden border-t border-white/5 bg-black/20 p-6">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="bg-white/5 p-4 rounded-2xl border border-blue-500/10">
                                        <span class="text-[8px] font-black text-blue-500 uppercase block mb-1">Parent A</span>
                                        <div class="text-[9px] text-gray-300 font-bold mt-2">👤 ${nameA}</div>
                                        <div class="text-[9px] text-gray-300 font-bold mt-1">🔑 ${auth.a_p || 'N/A'}</div>
                                        <div class="flex items-center gap-2 mt-2">
                                            <code class="text-blue-400 font-mono text-[10px] truncate max-w-[150px]">${nfcA}</code>
                                            <button onclick="ZEKRA.copy('${nfcA}', this)" class="bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 p-1 rounded text-[10px]">📋</button>
                                        </div>
                                    </div>
                                    <div class="bg-white/5 p-4 rounded-2xl border border-pink-500/10">
                                        <span class="text-[8px] font-black text-pink-500 uppercase block mb-1">Parent B</span>
                                        <div class="text-[9px] text-gray-300 font-bold mt-2">👤 ${nameB}</div>
                                        <div class="text-[9px] text-gray-300 font-bold mt-1">🔑 ${auth.b_p || 'N/A'}</div>
                                        <div class="flex items-center gap-2 mt-2">
                                            <code class="text-pink-400 font-mono text-[10px] truncate max-w-[150px]">${nfcB}</code>
                                            <button onclick="ZEKRA.copy('${nfcB}', this)" class="bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 p-1 rounded text-[10px]">📋</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                }).join('');
            } catch (err) {
                treeEl.innerHTML = `<div class="text-center py-20"><p class="text-red-400 font-black uppercase text-[10px]">Sync Blocked</p><p class="text-gray-500 text-[11px] mt-2">${err.message}</p>
                    <button onclick="ZEKRA.HQ.loadUsers()" class="mt-4 bg-[#FF7096] text-white font-black py-3 px-6 rounded-2xl text-[10px] uppercase">Retry</button></div>`;
            }
        })();
    };

    // ─── Toggle User Tree ────────────────────────────────────
    HQ.toggleUser = function(username) {
        const content = document.getElementById(`tree-content-${username}`);
        const icon = document.getElementById(`tree-icon-${username}`);
        if (content) {
            const isOpen = !content.classList.contains('hidden');
            content.classList.toggle('hidden');
            if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    };

    // ─── Manage User ─────────────────────────────────────────
    HQ.manageUser = async function(uid) {
        superAdminTarget = uid;
        document.getElementById('sup-target-display').innerText = uid;
        document.getElementById('users-list-header')?.classList.add('hidden');
        document.getElementById('users-tree-container')?.classList.add('hidden');
        document.getElementById('super-panel-form').classList.remove('hidden');

        const fb = window.ZEKRA.firebase;
        if (!fb) return;
        const snap = await fb.db.ref(`users/${uid}`).once('value');
        const val = snap.val() || {};
        const settings = val.settings || {};
        const data = val.data || {};
        const auth = settings.dualAuth || {};

        document.getElementById('sup-uid').value = val.u || uid;
        document.getElementById('sup-pa').value = auth.a_u || '';
        document.getElementById('sup-pass-a').value = auth.a_p || val.p || '';
        document.getElementById('sup-pb').value = auth.b_u || '';
        document.getElementById('sup-pass-b').value = auth.b_p || val.p || '';
        document.getElementById('sup-msg').value = data.longMessage || data.dm_large || '';

        const lockToggle = document.getElementById('sup-lock-toggle');
        if (lockToggle) lockToggle.classList.toggle('active', settings.locked);

        HQ.subTab('root');
    };

    // ─── Close Super Panel ───────────────────────────────────
    HQ.closeSuper = function() {
        document.getElementById('users-list-header')?.classList.remove('hidden');
        document.getElementById('users-tree-container')?.classList.remove('hidden');
        document.getElementById('super-panel-form').classList.add('hidden');
        superAdminTarget = null;
    };

    // ─── Save Super Admin Changes ────────────────────────────
    HQ.saveSuper = async function() {
        if (!superAdminTarget) return alert("No target selected");
        const fb = window.ZEKRA.firebase;
        if (!fb) return;

        const lockToggle = document.getElementById('sup-lock-toggle');
        const locked = lockToggle ? lockToggle.classList.contains('active') : false;
        const pa = document.getElementById('sup-pa')?.value.trim() || '';
        const pb = document.getElementById('sup-pb')?.value.trim() || '';
        const passA = document.getElementById('sup-pass-a')?.value.trim() || '';
        const passB = document.getElementById('sup-pass-b')?.value.trim() || '';
        const msg = document.getElementById('sup-msg')?.value || '';

        try {
            const updates = {};
            updates[`users/${superAdminTarget}/settings/locked`] = locked;
            updates[`users/${superAdminTarget}/settings/dualAuth/a_u`] = pa;
            updates[`users/${superAdminTarget}/settings/dualAuth/a_p`] = passA;
            updates[`users/${superAdminTarget}/settings/dualAuth/b_u`] = pb;
            updates[`users/${superAdminTarget}/settings/dualAuth/b_p`] = passB;
            if (pa) updates[`users/${superAdminTarget}/settings/partnerA`] = pa;
            if (pb) updates[`users/${superAdminTarget}/settings/partnerB`] = pb;
            updates[`users/${superAdminTarget}/data/longMessage`] = msg;
            updates[`users/${superAdminTarget}/data/dm_large`] = msg;
            if (pa && pb) updates[`users/${superAdminTarget}/data/n`] = `${pa} & ${pb}`;

            await fb.db.ref().update(updates);
            alert(`✅ Updated ${superAdminTarget}!`);
            HQ.loadUsers();
        } catch (e) {
            alert("❌ " + e.message);
        }
    };

    // ─── Delete User ─────────────────────────────────────────
    HQ.deleteUser = async function(username) {
        if (!confirm(`⚠️ Delete "${username}" permanently?`)) return;
        const phrase = prompt(`Type "${username}" to confirm:`);
        if (phrase !== username) return alert("Aborted.");
        try {
            await SanctuaryEngine.deleteUserAccount(username);
            alert(`🗑️ Deleted ${username}`);
            HQ.loadUsers();
        } catch (e) {
            alert("❌ " + e.message);
        }
    };

    // ─── Load Orders ─────────────────────────────────────────
    HQ.loadOrders = function() {
        const fb = window.ZEKRA.firebase;
        if (!fb) return;
        fb.db.ref('orders_database').on('value', snap => {
            const listEl = document.getElementById('orders-container');
            if (!listEl) return;
            const reqs = snap.val();
            if (!reqs) {
                listEl.innerHTML = '<p class="text-center text-gray-500/50 py-10 font-black text-xs tracking-widest uppercase">Queue Clear 🕊️</p>';
                return;
            }
            const pending = Object.entries(reqs).map(([k, v]) => ({ id: k, ...v }))
                .filter(r => r.status === 'pending').sort((a, b) => b.createdAt - a.createdAt);

            listEl.innerHTML = pending.map(r => `
                <div class="bg-[#1C1821] p-4 rounded-2xl border border-blue-500/10 flex flex-col gap-2 mb-4">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="text-white font-black text-[10px] uppercase">${r.customerName}</h4>
                            <p class="text-blue-400 text-[11px] font-bold">${r.action}</p>
                        </div>
                        <button onclick="ZEKRA.HQ.rejectOrder('${r.id}')" class="text-gray-500 hover:text-red-500"><i class="ri-delete-bin-line"></i></button>
                    </div>
                    <p class="text-[8px] text-gray-600 uppercase">${ZEKRA.formatDate(r.createdAt)}</p>
                </div>`).join('');
        });
    };

    // ─── Load Topups ─────────────────────────────────────────
    HQ.loadTopups = function() {
        const fb = window.ZEKRA.firebase;
        if (!fb) return;
        fb.db.ref('zekra_orders').on('child_added', snap => {
            const item = snap.val();
            if (!item || item.status !== "PENDING") return;
            const listEl = document.getElementById('topups-container');
            if (!listEl) return;
            const cardHtml = item.type === 'topup_request' ? `
                <div id="item-${snap.key}" class="bg-[#1C1821] p-5 rounded-2xl border border-white/5 flex flex-col gap-3 mb-4">
                    <h4 class="text-white font-black text-lg">${item.uid}</h4>
                    <div class="flex gap-2">
                        <span class="text-yellow-400 text-[11px] font-black bg-yellow-400/10 px-3 py-1 rounded-lg">💎 ${item.coinsAmount} Coins</span>
                        <span class="text-emerald-400 text-[11px] font-black bg-emerald-400/10 px-3 py-1 rounded-lg">💰 ${item.amountEGP} EGP</span>
                    </div>
                    ${item.screenshot && item.screenshot !== 'no-screenshot' ? `<img src="${item.screenshot}" onclick="window.open('${item.screenshot}','_blank')" class="w-full h-40 object-cover rounded-xl border border-white/10 cursor-zoom-in">` : ''}
                    <div class="grid grid-cols-2 gap-3 mt-2">
                        <button onclick="ZEKRA.HQ.approveTopup('${snap.key}', '${item.uid}', ${item.coinsAmount})" class="bg-green-600 text-white py-3 rounded-xl font-black text-[10px]">Approve</button>
                        <button onclick="ZEKRA.HQ.rejectTopup('${snap.key}')" class="bg-red-900/20 text-red-500 py-3 rounded-xl font-black text-[10px]">Deny</button>
                    </div>
                </div>` : '';
            if (cardHtml) listEl.insertAdjacentHTML('afterbegin', cardHtml);
        });
    };

    // ─── Approve Topup ───────────────────────────────────────
    HQ.approveTopup = async function(reqId, userId, amount) {
        const fb = window.ZEKRA.firebase;
        if (!fb) return;
        if (!confirm(`Approve ${amount} coins for ${userId}?`)) return;
        try {
            const snap = await fb.db.ref(`users/${userId}`).once('value');
            const data = snap.val();
            const currentCoins = (data && data.coins_marium) || 0;
            await fb.db.ref(`users/${userId}`).update({ coins_marium: currentCoins + amount });
            await fb.db.ref(`zekra_orders/${reqId}`).update({ status: 'APPROVED' });
            alert("✅ Coins added!");
        } catch (e) { alert("❌ " + e.message); }
    };

    // ─── Reject Topup ────────────────────────────────────────
    HQ.rejectTopup = async function(reqId) {
        const fb = window.ZEKRA.firebase;
        if (!fb || !confirm("Reject?")) return;
        await fb.db.ref(`zekra_orders/${reqId}`).remove();
    };

    // ─── Reject Order ────────────────────────────────────────
    HQ.rejectOrder = function(id) {
        const fb = window.ZEKRA.firebase;
        if (!fb || !confirm("Reject?")) return;
        fb.db.ref(`orders_database/${id}`).remove();
    };

    // ─── FX Helpers ──────────────────────────────────────────
    HQ.setFX = function(v) {
        document.querySelectorAll('#fx-filters .m-card').forEach(el => el.classList.remove('active'));
        const card = document.querySelector(`#fx-filters .m-card[data-v="${v}"]`);
        if (card) card.classList.add('active');
        window.currentFX = v;
    };

    HQ.toggle = function(l, force) {
        const el = document.getElementById(`sw-${l}`);
        if (!el) return;
        if (force !== undefined) { force ? el.classList.add('on') : el.classList.remove('on'); }
        else el.classList.toggle('on');
    };

    HQ.setAmb = function(a) {
        document.querySelectorAll('#fx-audio .m-card').forEach(el => el.classList.remove('active'));
        const card = document.querySelector(`#fx-audio .m-card[data-a="${a}"]`);
        if (card) card.classList.add('active');
        window.currentAmb = a;
    };

    HQ.slider = function(type) {
        const val = document.getElementById(`sld-${type}`)?.value;
        const display = document.getElementById(`val-${type}`);
        if (display) display.innerText = type === 'blur' ? `${val}px` : `${val}%`;
    };

    // ─── Broadcast ───────────────────────────────────────────
    HQ.broadcast = async function() {
        const fb = window.ZEKRA.firebase;
        const msg = document.getElementById('broadcast-msg')?.value.trim();
        if (!fb || !msg) return alert("Enter a message.");
        await fb.db.ref('system/broadcast').set({ txt: msg, at: Date.now(), sender: "Admin" });
        alert("Broadcast sent! 🚀");
        document.getElementById('broadcast-msg').value = '';
    };

    // ─── Provision New User ──────────────────────────────────
    HQ.provision = async function() {
        const u1 = document.getElementById('prov-u1')?.value.trim();
        const p1 = document.getElementById('prov-p1')?.value.trim();
        const pa = document.getElementById('prov-pa')?.value.trim() || "Yossif";
        const pb = document.getElementById('prov-pb')?.value.trim() || "Marium";
        if (!u1 || !p1) return alert("Username and Key required.");

        const btn = document.getElementById('btn-provision-user');
        btn.innerText = "⏳ Creating...";
        btn.disabled = true;
        try {
            await SanctuaryEngine.provisionPair(u1, p1, pa, pb, true, new Date().toISOString().split('T')[0]);
            alert(`✅ Created ${u1}!`);
            document.getElementById('prov-u1').value = '';
            document.getElementById('prov-p1').value = '';
            HQ.loadUsers();
        } catch (err) { alert("❌ " + err.message); }
        finally { btn.innerText = "Generate Vault & Authenticate 🚀"; btn.disabled = false; }
    };

    window.ZEKRA.HQ = HQ;
    console.log('✅ ZEKRA: MasterHQ loaded.');
})();