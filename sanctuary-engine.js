/**
 * ZEKRA SANCTUARY ENGINE v4.4.0 (MASTER BYPASS + AUTO-PROVISION) 🛡️
 */

(function() {
    if (window.SanctuaryEngine) return; // Prevent double execution memory leak

    class Engine {
        static MASTER_EMAIL = "admin_zekra_9454@zekra.com";
        static MASTER_USERNAME = "admin_zekra_9454";
        static MASTER_PASSWORD = "Master2026!";
        static RECOVERY_MASTER_USER = "zekra_master";
        static RECOVERY_MASTER_PASS = "Master2026!";
        
        /**
         * سحب بيانات الماستر من قاعدة البيانات بدلاً من القيم الثابتة
         * عشان لو غيرت الباسورد من إعدادات الماستر يضبط
         */
        static async loadMasterConfig() {
            try {
                const snap = await firebase.database().ref('admin_config/master').once('value');
                const m = snap.val();
                if (m && m.u && m.p) {
                    Engine.MASTER_USERNAME = m.u;
                    Engine.MASTER_PASSWORD = m.p;
                    Engine.RECOVERY_MASTER_USER = m.u;
                    Engine.RECOVERY_MASTER_PASS = m.p;
                    console.log("🛡️ Master config loaded from DB:", m.u);
                }
            } catch (e) {
                console.debug("🛡️ Using default master config (DB not available)");
            }
        }
        static EMERGENCY_RESET = false;
        static SESSION_KEY = "zekra_session_id";
        static version = "4.5.0-v2";

        static isMaster() {
            if (Engine.EMERGENCY_RESET) return true;
            try {
                const user = firebase.auth().currentUser;
                if (user && user.email === Engine.MASTER_EMAIL) return true;
                const local = Engine.getCurrentUser();
                if (local && (local.role === 'master' || local.id === Engine.MASTER_USERNAME.toLowerCase())) return true;
                return false;
            } catch (e) { return false; }
        }

        static getActiveUID() {
            if (typeof window !== 'undefined' && window.superAdminTarget) return window.superAdminTarget;
            const override = sessionStorage.getItem('zekra_master_view_uid');
            if (override && Engine.isOverride()) return override;

            const local = Engine.getCurrentUser();
            if (local) {
                // ★ Master keeps its reserved UID (master_root / configured)
                if (local.role === 'master') return local.uid || local.id;
                // ★ Regular users: the canonical data path is the FOLDER/GROUP name
                //   (shared by both partners of a couple), NOT the per-partner Firebase
                //   Auth UID. Returning the auth UID previously made every partner read &
                //   write a different (empty) node instead of their shared couple vault.
                return local.id;
            }

            const user = firebase.auth().currentUser;
            return user ? user.uid : null;
        }

        /**
         * Check whether a folder name or a partner username is already taken.
         * Returns "folder" | "username" | false. Used to prevent the
         * "create several users with the same name and everything gets mixed up" bug.
         */
        /**
         * Converts any username/folder string (Arabic, English, special characters)
         * to a safe Firebase Realtime Database path key.
         */
        static toLookupKey(str) {
            if (!str) return '';
            return encodeURIComponent(str.toString().trim().toLowerCase())
                .replace(/\./g, '%2E')
                .replace(/\$/g, '%24')
                .replace(/\[/g, '%5B')
                .replace(/\]/g, '%5D')
                .replace(/#/g, '%23')
                .replace(/\//g, '%2F');
        }

        /**
         * Generates an RFC-compliant ASCII email guaranteed to be accepted by Firebase Auth
         * even if folderName or username has spaces, &, @, Arabic characters, emojis, etc.
         */
        static toSafeAuthEmail(name) {
            if (!name) return 'vault_user@zekra.app';
            let clean = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (!clean.replace(/_/g, '')) {
                let hex = '';
                for (let i = 0; i < name.length; i++) {
                    hex += name.charCodeAt(i).toString(16);
                }
                clean = 'u_' + hex.slice(0, 16);
            }
            return `zekra_${clean.slice(0, 32)}@zekra.app`;
        }

        /**
         * Guarantees that firebase.auth().currentUser is not null before reading RTDB.
         * Satisfies Firebase Realtime Database rules where .read: auth != null.
         */
        static async ensureAuth(vaultId) {
            try {
                if (firebase.auth().currentUser) {
                    return firebase.auth().currentUser;
                }
                const session = Engine.getCurrentUser();
                // 1. Try credentials from session
                if (session && session.authEmail && session.authPass) {
                    try {
                        const cred = await firebase.auth().signInWithEmailAndPassword(session.authEmail, session.authPass);
                        if (cred && cred.user) return cred.user;
                    } catch (e) {}
                }
                // 2. Try anonymous sign-in
                try {
                    const anon = await firebase.auth().signInAnonymously();
                    if (anon && anon.user) return anon.user;
                } catch (e) {}
                // 3. Fallback to Master account to guarantee database read access
                try {
                    const masterCred = await firebase.auth().signInWithEmailAndPassword(Engine.MASTER_EMAIL, Engine.MASTER_PASSWORD);
                    if (masterCred && masterCred.user) return masterCred.user;
                } catch (e) {}
            } catch (err) {
                console.warn("ensureAuth note:", err);
            }
            return firebase.auth().currentUser;
        }

        static async isIdentityTaken(folderName, userA, userB) {
            if (!Engine.isMaster()) throw new Error("Unauthorized");
            const lowerFolder = (folderName || "").toLowerCase();
            const snap = await firebase.database().ref('users').once('value');
            const users = snap.val() || {};
            for (const [f, data] of Object.entries(users)) {
                if (f.toLowerCase() === lowerFolder) return "folder";
                const auth = data?.settings?.dualAuth || {};
                const existingA = (auth.a_u || "").toLowerCase();
                const existingB = (auth.b_u || "").toLowerCase();
                const ua = (userA || "").toLowerCase();
                const ub = (userB || "").toLowerCase();
                if (ua && (existingA === ua || existingB === ua)) return "username";
                if (ub && (existingA === ub || existingB === ub)) return "username";
            }
            return false;
        }

        /**
         * MASTER BYPASS: Directly signs in with the master account credentials
         * to retrieve the real Firebase Auth UID, then stores the session
         * in localStorage so vault.html recognizes the user as the true master.
         * 
         * This bypasses the normal login flow and hardcodes the master session.
         */
        static async bypassMasterLogin() {
            // Load latest config from DB first
            await Engine.loadMasterConfig();
            const masterEmail = Engine.MASTER_EMAIL;
            const masterPassword = Engine.MASTER_PASSWORD;
            
            try {
                // Step 1: Sign in with Firebase Auth to get the real UID
                const cred = await firebase.auth().signInWithEmailAndPassword(masterEmail, masterPassword);
                const user = cred.user;
                const realUID = user.uid;
                
                console.log("🛡️ MASTER BYPASS: Authenticated as", masterEmail, "UID:", realUID);
                
                // Step 2: Store the master session in localStorage with the REAL UID
                const sessionData = {
                    id: Engine.MASTER_USERNAME,
                    uid: realUID,
                    role: 'master',
                    email: masterEmail,
                    lastLogin: Date.now()
                };
                
                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                
                // Step 3: Also store in sessionStorage for override
                sessionStorage.setItem('zekra_admin_override', 'true');
                
                console.log("🛡️ MASTER BYPASS: Session stored with UID:", realUID);
                
                return { 
                    success: true, 
                    user: Engine.MASTER_USERNAME, 
                    role: 'master',
                    uid: realUID,
                    email: masterEmail
                };
            } catch (authError) {
                // Distinguish between "account doesn't exist" and other errors
                const code = authError.code || '';
                const isAccountMissing = code === 'auth/user-not-found' || 
                                         code === 'auth/invalid-credential' ||
                                         authError.message.includes('400');
                
                console.error("🛡️ MASTER BYPASS: Auth failed -", authError.message);
                
                if (isAccountMissing) {
                    console.warn("🛡️ MASTER BYPASS: Master account does not exist in Firebase Auth yet.");
                    console.warn("🛡️ MASTER BYPASS: Creating the master account now...");
                    
                    try {
                        // Try to create the master account on-the-fly
                        const secondary = firebase.initializeApp(firebaseConfig, "MasterProvision_" + Date.now());
                        try {
                            const cred = await secondary.auth().createUserWithEmailAndPassword(masterEmail, masterPassword);
                            const realUID = cred.user.uid;
                            console.log("🛡️ MASTER BYPASS: Master account CREATED with UID:", realUID);
                            
                            const sessionData = {
                                id: Engine.MASTER_USERNAME,
                                uid: realUID,
                                role: 'master',
                                email: masterEmail,
                                lastLogin: Date.now()
                            };
                            localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                            sessionStorage.setItem('zekra_admin_override', 'true');
                            
                            return { 
                                success: true, 
                                user: Engine.MASTER_USERNAME, 
                                role: 'master',
                                uid: realUID,
                                email: masterEmail,
                                note: "Master account was auto-created."
                            };
                        } finally {
                            await secondary.delete();
                        }
                    } catch (creationError) {
                        console.error("🛡️ MASTER BYPASS: Auto-creation also failed:", creationError.message);
                        console.warn("🛡️ MASTER BYPASS: This might mean the account already exists with a different password,");
                        console.warn("   or the Firebase project has email/password auth disabled.");
                    }
                }
                
                // Final fallback: Use master_root placeholder
                const FALLBACK_UID = "master_root";
                
                console.warn("🛡️ MASTER BYPASS: Using fallback UID -", FALLBACK_UID);
                console.warn("🛡️ Use force-master.html to create the master account and retrieve the real UID.");
                
                const sessionData = {
                    id: Engine.MASTER_USERNAME,
                    uid: FALLBACK_UID,
                    role: 'master',
                    email: masterEmail,
                    lastLogin: Date.now()
                };
                
                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                sessionStorage.setItem('zekra_admin_override', 'true');
                
                return { 
                    success: true, 
                    user: Engine.MASTER_USERNAME, 
                    role: 'master',
                    uid: FALLBACK_UID,
                    email: masterEmail,
                    note: "Fallback UID used. Real UID needs to be set up via Firebase Console."
                };
            }
        }

        static async login(username, password) {
            const lowerUser = username.toLowerCase();
            const safePass = password.padEnd(6, '0');

            // ★ INSTANT MASTER FALLBACK: If credentials match master, bypass Firebase Auth entirely
            if ((lowerUser === Engine.MASTER_USERNAME.toLowerCase() || lowerUser === Engine.MASTER_EMAIL.toLowerCase()) && 
                (password === Engine.MASTER_PASSWORD || safePass === Engine.MASTER_PASSWORD)) {
                console.log("🛡️ Master login detected — using instant local fallback (bypasses Firebase Auth)");
                const sessionData = {
                    id: Engine.MASTER_USERNAME,
                    uid: 'master_root',
                    role: 'master',
                    email: Engine.MASTER_EMAIL,
                    lastLogin: Date.now()
                };
                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                sessionStorage.setItem('zekra_admin_override', 'true');
                localStorage.setItem('userRole', 'master');
                
                Engine.bypassMasterLogin().catch(() => {});
                
                return { success: true, user: Engine.MASTER_USERNAME, role: 'master', uid: 'master_root' };
            }

            // 1. Check for Dynamic Master Override (admin_config)
            try {
                const masterSnap = await firebase.database().ref('admin_config/master').once('value');
                const m = masterSnap.val();
                const isConfiguredMaster = m && m.u && m.p && (m.u.toLowerCase() === lowerUser && m.p === password);
                const isRecoveryMaster = lowerUser === Engine.RECOVERY_MASTER_USER && password === Engine.RECOVERY_MASTER_PASS;

                if (isConfiguredMaster || isRecoveryMaster) {
                    localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                        id: username, uid: 'master_root', role: 'master', lastLogin: Date.now()
                    }));
                    try {
                        await firebase.database().ref('admin_config/master').set({
                            u: Engine.RECOVERY_MASTER_USER,
                            p: Engine.RECOVERY_MASTER_PASS,
                            updatedAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    } catch (e) { /* non-critical */ }
                    return { success: true, user: username, role: 'master' };
                }
            } catch (e) { /* non-critical */ }

            // ★ FOLDER LOOKUP: Find user by Global UID, Parent A, OR Parent B username
            // âک… PUBLIC PARTNER & FOLDER LOOKUP
            // Reads from admin_recovery/partner_lookup which has .read: true for all clients
            const lookupKey = Engine.toLookupKey(username);
            let targetFolder = null;
            let side = 'A';
            let matchedPassword = null;
            let folderAuthEmail = null;
            let folderAuthPass = null;
            let partnerDisplayName = username;

            try {
                const lookupSnap = await firebase.database().ref('admin_recovery/partner_lookup/' + lookupKey).once('value');
                let rec = lookupSnap.val();
                
                // If direct key not found, search the lookup table
                if (!rec) {
                    const allLookupSnap = await firebase.database().ref('admin_recovery/partner_lookup').once('value');
                    const allRecs = allLookupSnap.val() || {};
                    const cleanU = username.trim().toLowerCase();
                    for (const [k, v] of Object.entries(allRecs)) {
                        if (k.toLowerCase() === cleanU || (v.name && v.name.toLowerCase() === cleanU) || (v.folder && v.folder.toLowerCase() === cleanU)) {
                            rec = v;
                            break;
                        }
                    }
                }

                // If still not found in partner_lookup, search /users directly (using master auth if needed)
                if (!rec) {
                    try {
                        if (!firebase.auth().currentUser) {
                            try {
                                await firebase.auth().signInWithEmailAndPassword(Engine.MASTER_EMAIL, Engine.MASTER_PASSWORD);
                            } catch (e) {
                                await firebase.auth().signInAnonymously().catch(() => {});
                            }
                        }
                        const usersSnap = await firebase.database().ref('users').once('value');
                        const allUsers = usersSnap.val() || {};
                        const cleanU = username.trim().toLowerCase();
                        
                        for (const [fName, fData] of Object.entries(allUsers)) {
                            if (fName === 'master' || !fData) continue;
                            const auth = fData?.settings?.dualAuth || {};
                            const pA = (auth.a_u || fData?.settings?.partnerA || '').trim();
                            const pB = (auth.b_u || fData?.settings?.partnerB || '').trim();
                            const fKey = fName.toLowerCase();
                            
                            if (fKey === cleanU || (pA && pA.toLowerCase() === cleanU) || (pB && pB.toLowerCase() === cleanU)) {
                                const isSideA = (pA && pA.toLowerCase() === cleanU) || (fKey === cleanU);
                                const isSideB = (pB && pB.toLowerCase() === cleanU);
                                const passA = auth.a_p || '000000';
                                const passB = auth.b_p || passA;
                                const fAuthEmail = Engine.toSafeAuthEmail(fName);
                                
                                rec = {
                                    folder: fName,
                                    side: isSideB ? 'B' : 'A',
                                    pass: isSideB ? passB : passA,
                                    altPass: isSideB ? passA : passB,
                                    name: isSideB ? pB : (isSideA && pA ? pA : username),
                                    authEmail: fAuthEmail,
                                    authPass: passA.padEnd(6, '0')
                                };
                                
                                // Auto-index to partner_lookup so future logins are instant
                                try {
                                    const lKey = Engine.toLookupKey(username);
                                    await firebase.database().ref(`admin_recovery/partner_lookup/${lKey}`).set(rec);
                                    if (pA) await firebase.database().ref(`admin_recovery/partner_lookup/${Engine.toLookupKey(pA)}`).set({
                                        folder: fName, side: 'A', pass: passA, name: pA, authEmail: fAuthEmail, authPass: passA.padEnd(6, '0')
                                    });
                                    if (pB) await firebase.database().ref(`admin_recovery/partner_lookup/${Engine.toLookupKey(pB)}`).set({
                                        folder: fName, side: 'B', pass: passB, name: pB, authEmail: fAuthEmail, authPass: passA.padEnd(6, '0')
                                    });
                                } catch (idxErr) {}
                                break;
                            }
                        }
                    } catch (mSearchErr) {
                        console.warn("Direct users search note:", mSearchErr.message);
                    }
                }

                if (rec) {
                    targetFolder = rec.folder;
                    side = rec.side || 'A';
                    matchedPassword = rec.pass;
                    folderAuthEmail = rec.authEmail || Engine.toSafeAuthEmail(rec.folder);
                    folderAuthPass = (rec.authPass || rec.pass || safePass).padEnd(6, '0');
                    partnerDisplayName = rec.name || username;

                    // Verify password
                    const inputPass = password.trim();
                    const passMatches = (inputPass === rec.pass) || 
                                        (rec.altPass && inputPass === rec.altPass) ||
                                        (inputPass.padEnd(6, '0') === (rec.pass || '').padEnd(6, '0'));
                    
                    if (!passMatches) {
                        throw new Error("❌ Invalid Password for " + username + " 🔒 / كلمة المرور غير صحيحة");
                    }

                    // Authenticate with Firebase Auth using shared folder account
                    let authUid = 'partner_' + targetFolder;
                    try {
                        const cred = await firebase.auth().signInWithEmailAndPassword(folderAuthEmail, folderAuthPass);
                        if (cred && cred.user) authUid = cred.user.uid;
                    } catch (signInErr) {
                        console.warn("Folder Auth sign-in note:", signInErr.message);
                        // If folder account not in Firebase Auth, auto-provision it
                        try {
                            const cred = await firebase.auth().createUserWithEmailAndPassword(folderAuthEmail, folderAuthPass);
                            if (cred && cred.user) authUid = cred.user.uid;
                        } catch (createErr) {
                            // If still fails, ensure auth via master or anonymous
                            await Engine.ensureAuth(targetFolder);
                            if (firebase.auth().currentUser) {
                                authUid = firebase.auth().currentUser.uid;
                            }
                        }
                    }

                    const sessionData = {
                        id: targetFolder,
                        uid: authUid,
                        role: 'user',
                        side: side,
                        partnerName: partnerDisplayName,
                        authEmail: folderAuthEmail,
                        authPass: folderAuthPass,
                        lastLogin: Date.now()
                    };

                    localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                    localStorage.setItem('userRole', 'user');
                    localStorage.setItem('zekra_partner_side', side);
                    localStorage.setItem('zekra_partner_name', partnerDisplayName);

                    return { success: true, user: targetFolder, role: 'user', side: side, partnerName: partnerDisplayName };
                }
            } catch (lookupErr) {
                if (lookupErr.message && lookupErr.message.includes("Invalid Password")) {
                    throw lookupErr;
                }
                console.warn("Public partner lookup fallback:", lookupErr);
            }

            

            const email = lowerUser.includes('@') ? lowerUser : lowerUser + "@zekra.app";
            
            try {
                const cred = await firebase.auth().signInWithEmailAndPassword(email, safePass);
                const user = cred.user;
                const role = 'user';

                // Use folder name as session id for proper data isolation
                const sessionId = targetFolder || username;

                const sessionData = {
                    id: sessionId, uid: user.uid, role: role, lastLogin: Date.now()
                };
                if (side) sessionData.side = side;

                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                localStorage.setItem('userRole', 'user');
                return { success: true, user: sessionId, role: role, side: side };
            } catch (authError) {
                // If account doesn't exist, auto-create it
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                    console.warn("🛡️ Account not found, auto-creating:", email);
                    
                    const secondary = firebase.initializeApp(firebaseConfig, "LoginProvision_" + Date.now());
                    try {
                        const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePass);
                        const user = cred.user;
                        const role = 'user';

                        // Use folder name for auto-created accounts too
                        const sessionId = targetFolder || username;

                        localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                            id: sessionId, uid: user.uid, role: role, lastLogin: Date.now()
                        }));
                        if (side) {
                            const s = JSON.parse(localStorage.getItem(Engine.SESSION_KEY));
                            s.side = side;
                            localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(s));
                        }
                        localStorage.setItem('userRole', 'user');
                        return { success: true, user: sessionId, role: role, side: side, note: "Account was auto-created." };
                    } catch (createError) {
                        console.error("🛡️ Auto-creation failed:", createError.message);
                        throw new Error("❌ Authentication failed: Account not found and auto-creation failed. (" + createError.message + ")");
                    } finally {
                        await secondary.delete();
                    }
                }
                throw authError;
            }
        }

        static async logout() {
            try {
                await Promise.race([
                    firebase.auth().signOut(),
                    new Promise(resolve => setTimeout(resolve, 1200))
                ]);
            } catch (e) { /* session may already be cleared */ }
            localStorage.removeItem(Engine.SESSION_KEY);
            sessionStorage.clear();
            window.location.replace("login.html");
        }

        static getCurrentUser() {
            const raw = localStorage.getItem(Engine.SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        }

        static setActiveUID(uid) {
            sessionStorage.setItem('zekra_master_view_uid', uid);
        }

        static setOverride(bool) {
            sessionStorage.setItem('zekra_admin_override', bool ? 'true' : 'false');
        }

        static isOverride() {
            if (Engine.isMaster()) return true;
            return sessionStorage.getItem('zekra_admin_override') === 'true';
        }

        static getCurrentRole() {
            if (Engine.isMaster()) return 'master';
            const user = Engine.getCurrentUser();
            return user ? user.role : 'user';
        }

        static checkSession(redirectIfFail = true) {
            const urlParams = new URLSearchParams(window.location.search);
            const directUID = urlParams.get('v');
            const adminEdit = urlParams.get('admin_edit');

            if (directUID) {
                const targetSide = urlParams.get('side');
                const targetName = urlParams.get('n');
                
                // If the URL has a side parameter, it is an NFC link intended for a user.
                const role = (adminEdit === 'true' || (!targetSide && Engine.isMaster())) ? 'master' : 'user';
                
                const sessionData = {
                    id: directUID, 
                    uid: directUID, 
                    role: role, 
                    lastLogin: Date.now()
                };
                
                if (targetSide) sessionData.side = targetSide;
                if (targetName) sessionData.displayName = targetName;
                
                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify(sessionData));
                
                if (adminEdit === 'true') sessionStorage.setItem('zekra_admin_override', 'true');
                
                // Strip the param for a clean experience
                window.history.replaceState({}, document.title, window.location.pathname);
                return true;
            }
            const session = localStorage.getItem(Engine.SESSION_KEY);
            if (!session) {
                if (redirectIfFail) window.location.href = "login.html";
                return false;
            }
            return true;
        }

        static async initSystem() {
            const user = Engine.getCurrentUser();
            if (!user || user.role === 'master') return { partnerName: "Master HQ", p1: "Master", p2: "Admin", locked: false };
            try {
                const snap = await firebase.database().ref(`users/${user.id}/settings`).once('value');
                const s = snap.val() || {};
                return { 
                    partnerName: s.partnerName || "Soulmates", 
                    p1: s.partnerA || user.id, 
                    p2: s.partnerB || "Partner B", 
                    locked: !!s.locked 
                };
            } catch (e) { 
                console.debug("initSystem: settings read skipped (no permission or offline)"); 
                return { partnerName: "Soulmates", p1: "Partner A", p2: "Partner B", locked: false }; 
            }
        }

        static async getPartnerData() {
            const user = Engine.getCurrentUser();
            if (!user) return { me: "Guest", partner: "Partner" };
            const data = await Engine.initSystem();
            const isP1 = user.id.toLowerCase() === data.p1.toLowerCase();
            return { me: isP1 ? data.p1 : data.p2, partner: isP1 ? data.p2 : data.p1 };
        }

        static async getCards() {
            const user = Engine.getCurrentUser();
            if (!user) return {};
            const uid = Engine.getActiveUID();
            const snap = await firebase.database().ref(`users/${uid}/cards`).once('value');
            const allCards = snap.val() || {};
            const sessionID = window.ZEKRA_SESSION_ID || 'global';
            const isolated = {};
            for (const [id, data] of Object.entries(allCards)) {
                if (id.includes(sessionID) || data.status === 'ordered') isolated[id] = data;
            }
            return isolated;
        }

        static async saveCard(id, updates) {
            const user = Engine.getCurrentUser();
            if (!user) return;
            const uid = Engine.getActiveUID();
            const sessionID = window.ZEKRA_SESSION_ID || 'global';
            const isolatedId = id.includes(sessionID) ? id : `${sessionID}_${id}`;
            await firebase.database().ref(`users/${uid}/cards/${isolatedId}`).update(updates);
        }

        static async testConnection() {
            return new Promise(r => {
                firebase.database().ref('.info/connected').on('value', s => r(s.val() === true));
                setTimeout(() => r(false), 15000); // Increased timeout to 15 seconds for slower networks
            });
        }

        static async adminGetCouples() {
            if (!Engine.isMaster()) throw new Error("Denied");
            const snap = await firebase.database().ref('users').once('value');
            return snap.val() || {};
        }

        static listenToCouples(callback) {
            if (!Engine.isMaster()) return;
            firebase.database().ref('users').on('value', snap => {
                callback(snap.val() || {});
            });
        }

        static listenToVault(uid, callback) {
            if (!uid) return;
            firebase.database().ref(`users/${uid}`).on('value', snap => {
                callback(snap.val() || {});
            });
        }

        static async markActivated(uid) {
            if (!uid) return;
            const ref = firebase.database().ref(`users/${uid}/settings/isActivated`);
            const snap = await ref.once('value');
            if (!snap.val()) {
                await ref.set(true);
                await firebase.database().ref(`users/${uid}/settings/activatedAt`).set(firebase.database.ServerValue.TIMESTAMP);
                // Log the activation event
                await firebase.database().ref('master_logs/activations').push({
                    uid: uid,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    event: "First-Time Card Activation"
                });
            }
        }

        static async updateMasterConfig(u, p) {
            if (!Engine.isMaster()) throw new Error("Permission Denied");
            await firebase.database().ref('admin_config/master').set({
                u: u,
                p: p,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        }

        static async generateNfcToken(uid) {
            if (!Engine.isMaster()) throw new Error("Denied");
            const token = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            await firebase.database().ref(`users/${uid}/settings/nfcToken`).set(token);
            return token;
        }

        static async loginWithToken(token) {
            const snap = await firebase.database().ref('users').once('value');
            const users = snap.val() || {};
            for (let uid in users) {
                if (users[uid].settings && users[uid].settings.nfcToken === token) {
                    const user = users[uid];
                    localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                        id: user.u, uid: uid, role: user.role || 'user', lastLogin: Date.now()
                    }));
                    return { success: true, user: user.u, role: user.role || 'user' };
                }
            }
            throw new Error("Invalid or expired NFC Token");
        }

        static async provisionPair(u1, p1, u2, p2, linkAuth, startDate) {
            if (!Engine.isMaster()) throw new Error("Denied");
            const taken = await Engine.isIdentityTaken(u1, u1, u2);
            if (taken === "folder") throw new Error(`Folder "${u1}" already exists. Choose a different folder name.`);
            if (taken === "username") throw new Error(`Username "${u2 || u1}" is already taken. Use a unique username.`);
            const secondary = firebase.initializeApp(firebaseConfig, "Secondary");
            try {
                const email = u1.toLowerCase() + "@zekra.app";
                const cred = await secondary.auth().createUserWithEmailAndPassword(email, p1.padEnd(6, '0'));
                
                // Initialize Dual-Auth Identities
                const dualAuth = {
                    a_u: u1,
                    a_p: p1,
                    b_u: u2 || "",
                    b_p: p2 || p1
                };

                await firebase.database().ref(`users/${u1.toLowerCase()}`).set({
                    u: u1,
                    uid: cred.user.uid,
                    role: 'user',
                    created: Date.now(),
                    settings: {
                        partnerA: u1,
                        partnerB: u2 || "Partner",
                        locked: false,
                        dualAuth: dualAuth,
                        sd: startDate || ""
                    }
                });
            } catch (e) { console.warn("Provisioning issue", e); }
            await secondary.delete();
        }

        static async createNewUser(username, password) {
            if (!Engine.isMaster()) throw new Error("Unauthorized");
            const taken = await Engine.isIdentityTaken(username, username, "");
            if (taken === "folder") throw new Error(`User "${username}" already exists.`);
            if (taken === "username") throw new Error(`Username "${username}" is already taken.`);
            const lowerUser = username.toLowerCase();
            const email = lowerUser.includes('@') ? lowerUser : `${lowerUser}@zekra.app`;
            const secondary = firebase.initializeApp(firebaseConfig, "Secondary_" + Date.now());
            try {
                const cred = await secondary.auth().createUserWithEmailAndPassword(email, password);
                await firebase.database().ref(`users/${username.toLowerCase()}`).set({
                    u: username,
                    uid: cred.user.uid,
                    role: 'user',
                    created: Date.now(),
                    data: {
                        n: username,
                        w: "Welcome to your new Sanctuary.",
                        bg: "#FCE4EC",
                        coins: 100
                    },
                    settings: {
                        locked: false,
                        dualAuth: {
                            a_u: username,
                            a_p: password,
                            b_u: "Partner",
                            b_p: password
                        }
                    }
                });
                                // 6. Register in Public Partner Lookup (admin_recovery/partner_lookup)
                try {
                    const lookupUpdates = {};
                    const folderAuthMail = email;
                    const keyA = Engine.toLookupKey(userA);
                    const keyB = Engine.toLookupKey(userB);
                    const keyFolder = Engine.toLookupKey(folderName);

                    if (keyA) {
                        lookupUpdates[keyA] = {
                            folder: folderName, side: 'A', pass: passA, name: userA, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    if (keyB) {
                        lookupUpdates[keyB] = {
                            folder: folderName, side: 'B', pass: passB, name: userB, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    if (keyFolder) {
                        lookupUpdates[keyFolder] = {
                            folder: folderName, side: 'A', pass: passA, altPass: passB, name: folderName, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    await firebase.database().ref('admin_recovery/partner_lookup').update(lookupUpdates);
                    console.log("âœ… Partner lookup indexed for:", userA, "&", userB);
                } catch(e) {
                    console.warn("Could not index partner lookup:", e.message);
                }
                return true;
            } catch (e) {
                console.error("User creation failed", e);
                throw e;
            } finally {
                await secondary.delete();
            }
        }

        static async createNewFolderAccount(folderName, userA, passA, userB, passB) {
            if (!Engine.isMaster()) throw new Error("Unauthorized");
            const taken = await Engine.isIdentityTaken(folderName, userA, userB);
            if (taken === "folder") throw new Error(`Folder "${folderName}" already exists. Choose a different folder name.`);
            if (taken === "username") throw new Error(`One of the usernames "${userA}" or "${userB}" is already taken. Use unique usernames.`);
            const lowerFolder = folderName.toLowerCase();
            const email = Engine.toSafeAuthEmail(folderName);
            const secondary = firebase.initializeApp(firebaseConfig, "Secondary_" + Date.now());
            try {
                // 1. Pad passwords to at least 6 characters (Firebase requirement)
                const safePassA = passA.padEnd(6, '0');
                const safePassB = passB.padEnd(6, '0');

                // 2. Create the Auth account for the folder
                let folderUid = 'folder_' + Date.now();
                try {
                    const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePassA);
                    if (cred && cred.user) folderUid = cred.user.uid;
                    await secondary.auth().signOut();
                } catch (e) {
                    console.warn("Folder Auth creation note:", e.message);
                }
                
                // 3. Create the Auth account for Partner A
                try {
                    await secondary.auth().createUserWithEmailAndPassword(Engine.toSafeAuthEmail(userA), safePassA);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner A Auth creation skipped:", e.message); }
                
                // 4. Create the Auth account for Partner B
                try {
                    await secondary.auth().createUserWithEmailAndPassword(Engine.toSafeAuthEmail(userB), safePassB);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner B Auth creation skipped:", e.message); }

                // 5. Save to Database
                await firebase.database().ref(`users/${lowerFolder}`).set({
                    u: folderName,
                    uid: folderUid,
                    role: 'user',
                    created: Date.now(),
                    groupId: folderName,
                    data: {
                        n: folderName,
                        w: "Welcome to your new Sanctuary.",
                        bg: "#FCE4EC",
                        coins: 100
                    },
                    settings: {
                        locked: false,
                        dualAuth: {
                            a_u: userA,
                            a_p: passA,
                            b_u: userB,
                            b_p: passB
                        }
                    }
                });
                                // 6. Register in Public Partner Lookup (admin_recovery/partner_lookup)
                try {
                    const lookupUpdates = {};
                    const folderAuthMail = email;
                    const keyA = Engine.toLookupKey(userA);
                    const keyB = Engine.toLookupKey(userB);
                    const keyFolder = Engine.toLookupKey(folderName);

                    if (keyA) {
                        lookupUpdates[keyA] = {
                            folder: folderName, side: 'A', pass: passA, name: userA, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    if (keyB) {
                        lookupUpdates[keyB] = {
                            folder: folderName, side: 'B', pass: passB, name: userB, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    if (keyFolder) {
                        lookupUpdates[keyFolder] = {
                            folder: folderName, side: 'A', pass: passA, altPass: passB, name: folderName, authEmail: folderAuthMail, authPass: safePassA
                        };
                    }
                    await firebase.database().ref('admin_recovery/partner_lookup').update(lookupUpdates);
                    console.log("âœ… Partner lookup indexed for:", userA, "&", userB);
                } catch(e) {
                    console.warn("Could not index partner lookup:", e.message);
                }
                return true;
            } catch (e) {
                console.error("Folder creation failed", e);
                throw e;
            } finally {
                await secondary.delete();
            }
        }


        /**
         * Re-indexes all existing vaults and their partners into admin_recovery/partner_lookup
         */
        static async syncAllVaultsToLookup() {
            try {
                const snap = await firebase.database().ref('users').once('value');
                const users = snap.val() || {};
                const updates = {};
                for (const [folderName, data] of Object.entries(users)) {
                    if (folderName === 'master' || !data) continue;
                    const auth = data?.settings?.dualAuth || {};
                    const identity = data?.identity || {};
                    const userA = identity.parentA || auth.a_u || data?.data?.parentA_name || '';
                    const userB = identity.parentB || auth.b_u || data?.data?.parentB_name || '';
                    const passA = auth.a_p || '00000000';
                    const passB = auth.b_p || passA;
                    const email = folderName.toLowerCase() + '@zekra.app';

                    if (userA) {
                        updates[Engine.toLookupKey(userA)] = {
                            folder: folderName, side: 'A', pass: passA, name: userA, authEmail: email, authPass: passA
                        };
                    }
                    if (userB) {
                        updates[Engine.toLookupKey(userB)] = {
                            folder: folderName, side: 'B', pass: passB, name: userB, authEmail: email, authPass: passA
                        };
                    }
                    updates[Engine.toLookupKey(folderName)] = {
                        folder: folderName, side: 'A', pass: passA, altPass: passB, name: folderName, authEmail: email, authPass: passA
                    };
                }
                if (Object.keys(updates).length > 0) {
                    await firebase.database().ref('admin_recovery/partner_lookup').update(updates);
                    console.log('âœ… Partner lookup synchronized successfully for', Object.keys(updates).length, 'keys');
                }
            } catch (e) {
                console.warn('syncAllVaultsToLookup skipped:', e.message);
            }
        }

        static async deleteUserAccount(username) {
            if (!Engine.isMaster()) throw new Error("Unauthorized");
            
            // 1. Get user data to find UID and password
            const snap = await firebase.database().ref(`users/${username.toLowerCase()}`).once('value');
            const data = snap.val();
            if (!data) throw new Error("User not found in database.");

            const lowerUser = username.toLowerCase();
            const email = lowerUser.includes('@') ? lowerUser : `${lowerUser}@zekra.app`;
            const password = data.settings?.dualAuth?.a_p || data.p; 
            
            if (password) {
                const secondary = firebase.initializeApp(firebaseConfig, "Secondary_" + Date.now());
                try {
                    await secondary.auth().signInWithEmailAndPassword(email, password);
                    await secondary.auth().currentUser.delete();
                } catch (e) {
                    console.error("Auth account deletion failed:", e);
                } finally {
                    await secondary.delete();
                }
            }

            // 2. Delete from Database
            await firebase.database().ref(`users/${username.toLowerCase()}`).remove();
            return true;
        }


        static syncFrame(callback) {
            return (window.requestAnimationFrame || (cb => setTimeout(cb, 16)))(callback);
        }
    }
// =========================
// v4.4.1 PATCHES (Gallery, Fonts, Auto-Sync)
// =========================

// Debounced auto-sync scheduler
Engine.__sync = Engine.__sync || { timer: null, lastHash: null, inFlight: false };

Engine.__hashPayload = function(obj) {
    try { return JSON.stringify(obj); } catch (e) { return String(Date.now()); }
};

Engine.scheduleAutoCloudSync = function(getPayload, opts) {
    const debounceMs = (opts && typeof opts.debounceMs === 'number') ? opts.debounceMs : 850;
    let payload = getPayload ? getPayload() : null;
    if (!payload) return;

    const hash = Engine.__hashPayload(payload);
    if (Engine.__sync.lastHash === hash) return;
    Engine.__sync.lastHash = hash;

    if (Engine.__sync.timer) clearTimeout(Engine.__sync.timer);

    Engine.__sync.timer = setTimeout(async () => {
        if (Engine.__sync.inFlight) return;
        if (typeof window.pushToCloud !== 'function') return;

        Engine.__sync.inFlight = true;
        try {
            await window.pushToCloud();
        } catch (e) {
            console.error('Auto-sync pushToCloud failed:', e);
        } finally {
            Engine.__sync.inFlight = false;
        }
    }, debounceMs);
};

// Media detection helpers
Engine.isVideoFile = function(fileOrTypeOrName) {
    const type = (typeof fileOrTypeOrName === 'object' && fileOrTypeOrName && fileOrTypeOrName.type) ? fileOrTypeOrName.type : '';
    const name = (typeof fileOrTypeOrName === 'object' && fileOrTypeOrName && fileOrTypeOrName.name) ? fileOrTypeOrName.name : '';
    const t = String(type || '').toLowerCase();
    const n = String(name || '').toLowerCase();
    if (t.startsWith('video/')) return true;
    return /\.(mp4|mov|webm|ogg|m4v|avi|mkv)(\?.*)?$/.test(n);
};

Engine.inferMediaType = function(file) {
    return Engine.isVideoFile(file) ? 'video' : 'image';
};

Engine.readFileAsDataURL = function(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = () => reject(new Error('Failed to read file'));
        fr.onload = () => resolve(fr.result);
        fr.readAsDataURL(file);
    });
};

Engine.prepareGalleryMediaItem = async function(file, caption) {
    const type = Engine.inferMediaType(file);
    const src = await Engine.readFileAsDataURL(file);
    return {
        id: 'gal_' + Date.now() + '_' + Math.random().toString(16).slice(2),
        type,
        src,
        caption: String(caption || '').trim(),
        createdAt: Date.now()
    };
};

// Font application for Name + Page Message
Engine.normalizeFontFamily = function(selValue) {
    if (!selValue) return "'Nunito'";
    const v = String(selValue).trim();
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v;
    return "'" + v.replace(/^'+|'+$/g, '') + "'";
};

Engine.applyFontToNameAndMessages = function(fontNameFamily, fontMsgFamily) {
    const famName = Engine.normalizeFontFamily(fontNameFamily);
    const famMsg = Engine.normalizeFontFamily(fontMsgFamily);

    const nameEl = document.getElementById('ui-n');
    const storyEl = document.getElementById('ui-story-text');
    const msgEl = document.getElementById('ui-msg');

    if (nameEl) nameEl.style.fontFamily = famName;
    if (storyEl) storyEl.style.fontFamily = famMsg;
    if (msgEl) msgEl.style.fontFamily = famMsg;
};

window.SanctuaryEngine = Engine;

})();
