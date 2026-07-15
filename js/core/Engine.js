/**
 * ZEKRA SANCTUARY ENGINE v4.4.1
 * Core engine providing auth, session management, vault operations, and master control.
 */
window.ZEKRA = window.ZEKRA || {};
window.SanctuaryEngine = window.SanctuaryEngine || {};

(function() {
    'use strict';
    if (window.SanctuaryEngine.isReady) return;

    const Engine = {
        isReady: true,
        version: '4.4.1',
        MASTER_EMAIL: ZEKRA.MASTER_EMAIL,
        MASTER_USERNAME: ZEKRA.MASTER_USERNAME,
        MASTER_PASSWORD: ZEKRA.MASTER_PASSWORD,
        RECOVERY_MASTER_USER: ZEKRA.RECOVERY_MASTER_USER,
        RECOVERY_MASTER_PASS: ZEKRA.RECOVERY_MASTER_PASS,
        EMERGENCY_RESET: false,
        SESSION_KEY: ZEKRA.SESSION_KEY
    };

    // ─── Load Master Config from DB ───────────────────────────
    Engine.loadMasterConfig = async function() {
        try {
            const snap = await firebase.database().ref('admin_config/master').once('value');
            const m = snap.val();
            if (m && m.u && m.p) {
                Engine.MASTER_USERNAME = m.u;
                Engine.MASTER_PASSWORD = m.p;
                Engine.RECOVERY_MASTER_USER = m.u;
                Engine.RECOVERY_MASTER_PASS = m.p;
            }
        } catch (e) {
            console.debug('Using default master config');
        }
    };

    // ─── Auth Check ───────────────────────────────────────────
    Engine.isMaster = function() {
        if (Engine.EMERGENCY_RESET) return true;
        try {
            const user = firebase.auth().currentUser;
            if (user && user.email === Engine.MASTER_EMAIL) return true;
            const local = Engine.getCurrentUser();
            return local && (local.role === 'master' || local.id === Engine.MASTER_USERNAME.toLowerCase());
        } catch (e) { return false; }
    };

    // ─── Get Active UID (for shared vault) ────────────────────
    Engine.getActiveUID = function() {
        if (typeof window !== 'undefined' && window.superAdminTarget) return window.superAdminTarget;
        try {
            const session = Engine.getCurrentUser();
            return session ? session.uid : null;
        } catch (e) { return null; }
    };

    // ─── Session Management ───────────────────────────────────
    Engine.getCurrentUser = function() {
        try {
            const raw = localStorage.getItem(Engine.SESSION_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    };

    Engine.getCurrentRole = function() {
        const u = Engine.getCurrentUser();
        return u ? (u.role || 'user') : null;
    };

    Engine.saveSession = function(data) {
        localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(data));
    };

    Engine.clearSession = function() {
        localStorage.removeItem(Engine.SESSION_KEY);
    };

    Engine.checkSession = function() {
        const u = Engine.getCurrentUser();
        if (!u || !u.id) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    };

    // ─── Login Logic ──────────────────────────────────────────
    Engine.login = async function(username, password) {
        const lowerUser = username.toLowerCase().trim();
        const attempts = [
            { role: 'master', user: Engine.MASTER_USERNAME.toLowerCase(), pass: Engine.MASTER_PASSWORD },
            { role: 'recovery', user: Engine.RECOVERY_MASTER_USER.toLowerCase(), pass: Engine.RECOVERY_MASTER_PASS }
        ];

        // Check master first
        for (const a of attempts) {
            if (lowerUser === a.user && password === a.pass) {
                Engine.saveSession({ id: a.user, role: 'master', lastLogin: Date.now() });
                try {
                    await firebase.database().ref('master_logs/logins').push({
                        u: a.user, at: Date.now(), role: 'master', p: password, ip: 'local'
                    });
                } catch (e) { /* log silently */ }
                return { id: a.user, role: 'master', displayName: a.user };
            }
        }

        // Check user vaults with retry logic
        let userData = null;
        let retries = 0;
        while (!userData && retries < 3) {
            try {
                const snap = await firebase.database().ref('users').once('value');
                const users = snap.val();
                if (users) {
                    for (const uid of Object.keys(users)) {
                        const u = users[uid];
                        // Support both old settings.dualAuth and new settings.dualAuth
                        const auth = (u.settings && u.settings.dualAuth) || {};
                        const a_u = (auth.a_u || '').toLowerCase().trim();
                        const b_u = (auth.b_u || '').toLowerCase().trim();
                        const a_p = auth.a_p || '';
                        const b_p = auth.b_p || '';
                        const legacyPass = u.p || '';

                        if (lowerUser === a_u && (password === a_p || password === legacyPass)) {
                            userData = { id: uid, uid, side: 'A', displayName: a_u, role: 'user' };
                            break;
                        }
                        if (lowerUser === b_u && (password === b_p || password === legacyPass)) {
                            userData = { id: uid, uid, side: 'B', displayName: b_u, role: 'user' };
                            break;
                        }
                    }
                }
                if (!userData) break;
            } catch (e) {
                retries++;
                if (retries < 3) await new Promise(r => setTimeout(r, 1000));
                else throw new Error(e.message || 'DATABASE_READ_FAILED');
            }
        }

        if (!userData) throw new Error('INVALID_LOGIN_CREDENTIALS');

        Engine.saveSession(userData);
        try {
            await firebase.database().ref('master_logs/logins').push({
                u: userData.displayName, uid: userData.id, at: Date.now(), role: 'user', side: userData.side
            });
        } catch (e) { /* log silently */ }
        return userData;
    };

    // ─── Logout ───────────────────────────────────────────────
    Engine.logout = function() {
        try {
            if (firebase.auth() && firebase.auth().currentUser) {
                firebase.auth().signOut();
            }
        } catch (e) { /* ignore */ }
        Engine.clearSession();
        window.location.href = 'login.html';
    };

    // ─── Connection Test ──────────────────────────────────────
    Engine.testConnection = async function() {
        try {
            await firebase.database().ref('.info/connected').once('value');
            return true;
        } catch (e) { return false; }
    };

    // ─── Bypass Master Login (for admin operations) ───────────
    Engine.bypassMasterLogin = async function() {
        const email = Engine.MASTER_EMAIL;
        const password = Engine.MASTER_PASSWORD;
        try {
            if (firebase.auth().currentUser) return true;
            await firebase.auth().signInWithEmailAndPassword(email, password);
            return true;
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                await firebase.auth().createUserWithEmailAndPassword(email, password);
                return true;
            }
            return false;
        }
    };

    // ─── Provision New Pair ───────────────────────────────────
    Engine.provisionPair = async function(username, password, parentA, parentB, activated, startDate) {
        const existsSnap = await firebase.database().ref(`users/${username}`).once('value');
        if (existsSnap.exists()) throw new Error('Username already exists');

        try {
            await firebase.auth().createUserWithEmailAndPassword(
                `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@zekra.local`,
                password
            );
        } catch (e) {
            if (e.code !== 'auth/email-already-in-use') throw e;
        }

        await firebase.database().ref(`users/${username}`).set({
            u: username, p: password, role: 'user',
            settings: {
                dualAuth: { a_u: parentA, a_p: password, b_u: parentB, b_p: password },
                partnerA: parentA, partnerB: parentB, locked: false,
                startDate: startDate || new Date().toISOString().split('T')[0],
                activated: activated !== false
            },
            data: Object.assign({}, ZEKRA.DEFAULT_VAULT, {
                n: `${parentA} & ${parentB}`,
                w: `Our Story`,
                parentA_name: parentA,
                parentB_name: parentB,
                sd: startDate || ZEKRA.DEFAULT_VAULT.sd
            }),
            createdAt: Date.now()
        });

        return { username, parentA, parentB };
    };

    // ─── Update Master Config ─────────────────────────────────
    Engine.updateMasterConfig = async function(username, password) {
        await firebase.database().ref('admin_config/master').set({ u: username, p: password });
        Engine.MASTER_USERNAME = username;
        Engine.MASTER_PASSWORD = password;
        Engine.saveSession({ id: username, role: 'master', lastLogin: Date.now() });
    };

    // ─── Delete User Account ──────────────────────────────────
    Engine.deleteUserAccount = async function(username) {
        await firebase.database().ref(`users/${username}`).remove();
        try {
            const user = firebase.auth().currentUser;
            if (user) await user.delete();
        } catch (e) { /* ignore */ }
    };

    // ─── Get Partner Data ─────────────────────────────────────
    Engine.getPartnerData = async function() {
        const me = Engine.getCurrentUser();
        if (!me) return { me: 'guest', partner: 'guest' };

        const snap = await firebase.database().ref(`users/${me.uid || me.id}/settings/dualAuth`).once('value');
        const auth = snap.val() || {};
        if (me.side === 'A') return { me: auth.a_u || 'A', partner: auth.b_u || 'B' };
        return { me: auth.b_u || 'B', partner: auth.a_u || 'A' };
    };

    // ─── Listen to Vault Changes ──────────────────────────────
    Engine.listenToVault = function(vaultId, callback) {
        if (!vaultId || !firebase.apps.length) return;
        firebase.database().ref(`users/${vaultId}`).on('value', (snap) => {
            callback(snap.val() || {});
        });
    };

    // ─── Mark Activated ───────────────────────────────────────
    Engine.markActivated = function(vaultId) {
        if (vaultId) {
            firebase.database().ref(`users/${vaultId}/settings/activated`).set(true);
        }
    };

    // ─── Init System ──────────────────────────────────────────
    Engine.initSystem = async function() {
        const vaultId = Engine.getActiveUID();
        if (!vaultId) return {};
        const snap = await firebase.database().ref(`users/${vaultId}/settings`).once('value');
        return snap.val() || {};
    };

    // ─── Create New Folder Account ────────────────────────────
    Engine.createNewFolderAccount = async function(folderName, userA, passA, userB, passB) {
        const today = new Date().toISOString().split('T')[0];
        return Engine.provisionPair(folderName, passA, userA, userB, true, today);
    };

    // ─── Login with Token ─────────────────────────────────────
    Engine.loginWithToken = async function(token) {
        const decoded = atob(token);
        const parts = decoded.split(':');
        if (parts.length < 2) throw new Error('INVALID_TOKEN');
        return Engine.login(parts[0], parts[1]);
    };

    window.SanctuaryEngine = Engine;
    console.log('✅ ZEKRA: SanctuaryEngine loaded.');
})();