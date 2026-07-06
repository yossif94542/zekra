<<<<<<< HEAD
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
        static EMERGENCY_RESET = false;
        static SESSION_KEY = "zekra_session_id";
        static version = "4.4.0";

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
            if (local && local.uid) return local.uid;
            
            const user = firebase.auth().currentUser;
            return user ? user.uid : null;
        }

        /**
         * MASTER BYPASS: Directly signs in with the master account credentials
         * to retrieve the real Firebase Auth UID, then stores the session
         * in localStorage so vault.html recognizes the user as the true master.
         * 
         * This bypasses the normal login flow and hardcodes the master session.
         */
        static async bypassMasterLogin() {
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
            // This prevents the 400 error from even being attempted
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
                
                // Try to sign in / create in background silently (non-blocking)
                Engine.bypassMasterLogin().catch(() => {});
                
                return { success: true, user: Engine.MASTER_USERNAME, role: 'master', uid: 'master_root' };
            }

            // 1. Check for Dynamic Master Override (admin_config) — gracefully skip if no permission
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
                    } catch (e) { /* admin_config write failed — non-critical */ }
                    return { success: true, user: username, role: 'master' };
                }
            } catch (e) { /* Master config check skipped (no permission or offline) — non-critical */ }

            // 2. Standard Firebase Auth Flow with Auto-Provision for regular users
            const email = lowerUser.includes('@') ? lowerUser : lowerUser + "@zekra.app";
            
            try {
                const cred = await firebase.auth().signInWithEmailAndPassword(email, safePass);
                const user = cred.user;
                
                const role = 'master';

                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                    id: username, uid: user.uid, role: role, lastLogin: Date.now()
                }));
                localStorage.setItem('userRole', 'master');
                return { success: true, user: username, role: role };
            } catch (authError) {
                // If account doesn't exist, auto-create it
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                    console.warn("🛡️ Account not found, auto-creating:", email);
                    
                    const secondary = firebase.initializeApp(firebaseConfig, "LoginProvision_" + Date.now());
                    try {
                        const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePass);
                        const user = cred.user;
                        
                        const role = 'master';

                        localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                            id: username, uid: user.uid, role: role, lastLogin: Date.now()
                        }));
                        localStorage.setItem('userRole', 'master');
                        return { success: true, user: username, role: role, note: "Account was auto-created." };
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
                            b_u: "Soulmate",
                            b_p: password
                        }
                    }
                });
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
            const lowerFolder = folderName.toLowerCase();
            const email = `${lowerFolder}@zekra.app`;
            const secondary = firebase.initializeApp(firebaseConfig, "Secondary_" + Date.now());
            try {
                // 1. Pad passwords to at least 6 characters (Firebase requirement)
                const safePassA = passA.padEnd(6, '0');
                const safePassB = passB.padEnd(6, '0');

                // 2. Create the Auth account for the folder
                const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePassA);
                await secondary.auth().signOut();
                
                // 3. Create the Auth account for Partner A
                try {
                    await secondary.auth().createUserWithEmailAndPassword(`${userA.toLowerCase()}@zekra.app`, safePassA);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner A Auth creation skipped:", e.message); }
                
                // 4. Create the Auth account for Partner B
                try {
                    await secondary.auth().createUserWithEmailAndPassword(`${userB.toLowerCase()}@zekra.app`, safePassB);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner B Auth creation skipped:", e.message); }

                // 5. Save to Database
                await firebase.database().ref(`users/${lowerFolder}`).set({
                    u: folderName,
                    uid: cred.user.uid,
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
                return true;
            } catch (e) {
                console.error("Folder creation failed", e);
                throw e;
            } finally {
                await secondary.delete();
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
    window.SanctuaryEngine = Engine;

})();
=======
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
        static EMERGENCY_RESET = false;
        static SESSION_KEY = "zekra_session_id";
        static version = "4.4.0";

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
            if (local && local.uid) return local.uid;
            
            const user = firebase.auth().currentUser;
            return user ? user.uid : null;
        }

        /**
         * MASTER BYPASS: Directly signs in with the master account credentials
         * to retrieve the real Firebase Auth UID, then stores the session
         * in localStorage so vault.html recognizes the user as the true master.
         * 
         * This bypasses the normal login flow and hardcodes the master session.
         */
        static async bypassMasterLogin() {
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
            // This prevents the 400 error from even being attempted
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
                
                // Try to sign in / create in background silently (non-blocking)
                Engine.bypassMasterLogin().catch(() => {});
                
                return { success: true, user: Engine.MASTER_USERNAME, role: 'master', uid: 'master_root' };
            }

            // 1. Check for Dynamic Master Override (admin_config) — gracefully skip if no permission
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
                    } catch (e) { /* admin_config write failed — non-critical */ }
                    return { success: true, user: username, role: 'master' };
                }
            } catch (e) { /* Master config check skipped (no permission or offline) — non-critical */ }

            // 2. Standard Firebase Auth Flow with Auto-Provision for regular users
            const email = lowerUser.includes('@') ? lowerUser : lowerUser + "@zekra.app";
            
            try {
                const cred = await firebase.auth().signInWithEmailAndPassword(email, safePass);
                const user = cred.user;
                
                const role = 'master';

                localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                    id: username, uid: user.uid, role: role, lastLogin: Date.now()
                }));
                localStorage.setItem('userRole', 'master');
                return { success: true, user: username, role: role };
            } catch (authError) {
                // If account doesn't exist, auto-create it
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                    console.warn("🛡️ Account not found, auto-creating:", email);
                    
                    const secondary = firebase.initializeApp(firebaseConfig, "LoginProvision_" + Date.now());
                    try {
                        const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePass);
                        const user = cred.user;
                        
                        const role = 'master';

                        localStorage.setItem(Engine.SESSION_KEY, JSON.stringify({
                            id: username, uid: user.uid, role: role, lastLogin: Date.now()
                        }));
                        localStorage.setItem('userRole', 'master');
                        return { success: true, user: username, role: role, note: "Account was auto-created." };
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
                            b_u: "Soulmate",
                            b_p: password
                        }
                    }
                });
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
            const lowerFolder = folderName.toLowerCase();
            const email = `${lowerFolder}@zekra.app`;
            const secondary = firebase.initializeApp(firebaseConfig, "Secondary_" + Date.now());
            try {
                // 1. Pad passwords to at least 6 characters (Firebase requirement)
                const safePassA = passA.padEnd(6, '0');
                const safePassB = passB.padEnd(6, '0');

                // 2. Create the Auth account for the folder
                const cred = await secondary.auth().createUserWithEmailAndPassword(email, safePassA);
                await secondary.auth().signOut();
                
                // 3. Create the Auth account for Partner A
                try {
                    await secondary.auth().createUserWithEmailAndPassword(`${userA.toLowerCase()}@zekra.app`, safePassA);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner A Auth creation skipped:", e.message); }
                
                // 4. Create the Auth account for Partner B
                try {
                    await secondary.auth().createUserWithEmailAndPassword(`${userB.toLowerCase()}@zekra.app`, safePassB);
                    await secondary.auth().signOut();
                } catch (e) { console.warn("Partner B Auth creation skipped:", e.message); }

                // 5. Save to Database
                await firebase.database().ref(`users/${lowerFolder}`).set({
                    u: folderName,
                    uid: cred.user.uid,
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
                return true;
            } catch (e) {
                console.error("Folder creation failed", e);
                throw e;
            } finally {
                await secondary.delete();
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
    window.SanctuaryEngine = Engine;

})();
>>>>>>> 1211f50 (nuclear reset page + firebase rules public)
