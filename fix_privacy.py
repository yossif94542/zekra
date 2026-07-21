import sys
import io

# Force UTF-8 for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('vault.html', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Sanitize personal data - Replace 'Marium' display names
# placeholder="Marium"
c1 = content.replace('placeholder="Marium"', 'placeholder="Partner B"')
if c1 != content: changes += 1; print('OK placeholder Marium -> Partner B')
content = c1

# "Divine Bounty Granted! +1000 for Marium."
c2 = content.replace('+1000 for Marium.', '+1000 for Partner.')
if c2 != content: changes += 1; print('OK Divine Bounty Marium -> Partner')
content = c2

# "Reset Marium's world"
c3 = content.replace("Reset Marium's world", "Reset Partner's world")
if c3 != content: changes += 1; print('OK Reset Marium -> Partner')
content = c3

# vaultState.dm_large || "Mariumm a8la ma lya..."
c4 = content.replace("Mariumm a8la ma lya...", "My love...")
if c4 != content: changes += 1; print('OK Mariumm a8la -> My love')
content = c4

# Gift sent to Marium!
c5 = content.replace('Gift sent to Marium!', 'Gift sent!')
if c5 != content: changes += 1; print('OK Gift Marium -> generic')
content = c5

# instantly updates Marium's perspective  
c6 = content.replace("// instantly updates Marium's perspective if open", "// instantly updates partner's perspective if open")
if c6 != content: changes += 1; print('OK Marium perspective -> partner')
content = c6

# nameB = auth.b_u || "Marium"
c7 = content.replace('nameB = auth.b_u || "Marium"', 'nameB = auth.b_u || "Partner B"')
if c7 != content: changes += 1; print('OK nameB default Marium -> Partner B')
content = c7

# prov-pb .value.trim() || "Marium"
c8 = content.replace("prov-pb').value.trim() || \"Marium\"", "prov-pb').value.trim() || 'Partner B'")
if c8 != content: changes += 1; print('OK prov-pb Marium -> Partner B')
content = c8

# 2. Replace personal image URLs
c9 = content.replace('https://i.postimg.cc/hvTfzVm3/IMG-7896.jpg', 'https://via.placeholder.com/150')
if c9 != content: changes += 1; print('OK postimg.cc -> via.placeholder.com')
content = c9

# placehold.co defaults
c10 = content.replace('https://placehold.co/400x400/FF7096/white?text=Logo', 'https://via.placeholder.com/100x100/FF7096/FFFFFF?text=Logo')
if c10 != content: changes += 1; print('OK placehold Logo -> via.placeholder')
content = c10

c11 = content.replace('https://placehold.co/400x400/FF7096/white?text=Song+Art', 'https://via.placeholder.com/100x100/FF7096/FFFFFF?text=Art')
if c11 != content: changes += 1; print('OK placehold Song Art -> via.placeholder')
content = c11

c12 = content.replace('https://placehold.co/600x400/FF7096/white?text=Mood', 'https://via.placeholder.com/150x100/FF7096/FFFFFF?text=Mood')
if c12 != content: changes += 1; print('OK placehold Mood -> via.placeholder')
content = c12

for old_url, new_url in [
    ('https://placehold.co/600x400/FF7096/white?text=Memory+1', 'https://via.placeholder.com/150x100/FF7096/FFFFFF?text=Memory+1'),
    ('https://placehold.co/600x400/FF7096/white?text=Memory+2', 'https://via.placeholder.com/150x100/FF7096/FFFFFF?text=Memory+2'),
    ('https://placehold.co/600x400/FF7096/white?text=Memory+3', 'https://via.placeholder.com/150x100/FF7096/FFFFFF?text=Memory+3'),
]:
    if old_url in content:
        content = content.replace(old_url, new_url)
        changes += 1
        print('OK placeholder memory URL replaced')

# 3. Fix updateAdminCreds master section - use firebase.auth().updatePassword
old_master = """                    if (userKey === 'master') {
                        // SECURE MASTER OVERRIDE: Stored in private admin_config node
                        if (!confirm(\"CRITICAL: You are about to change the Master Dashboard credentials. Proceed?\")) return;
                        await SanctuaryEngine.updateMasterConfig(username, password);
                        alert(\"MASTER SECURE KEY UPDATED.\");"""

new_master = """                    if (userKey === 'master') {
                        // FIX: Use Firebase Auth updatePassword for the admin user
                        if (!confirm(\"CRITICAL: You are about to change the Master Dashboard password. Proceed?\")) return;
                        const currentUser = firebase.auth().currentUser;
                        if (currentUser) {
                            await currentUser.updatePassword(password);
                            // Also update stored config for session continuity
                            await window.firebaseData.ref('admin_config/master').update({ u: username, p: password });
                            alert(\"Master password updated successfully via Firebase Auth!\");
                        } else {
                            // Fallback: update database config only
                            await window.firebaseData.ref('admin_config/master').update({ u: username, p: password });
                            alert(\"Master config updated in database (Firebase Auth user not signed in).\");
                        }"""

if old_master in content:
    content = content.replace(old_master, new_master)
    changes += 1
    print('OK Fixed updateAdminCreds master section with Firebase Auth updatePassword')
else:
    print('WARN Could not find old master section - it may have been edited already')

# 4. Remove duplicate old wrapper 
old_wrapper = """window.updateAdminCreds = function (target) {
                const u = document.getElementById(`admin-${target}-user`).value.trim();
                const p = document.getElementById(`admin-${target}-pass`).value.trim();
                if (!u || !p) return alert(\"Please fill in both fields.\");
                if (confirm(`Overwrite ${target} credentials globally?`)) {
                    window.firebaseData.ref(`users/master/meta/credentials/${target}`).set({ u: u, p: p }).then(() => {
                        alert(`${target.toUpperCase()} credentials securely updated.`);
                    }).catch(e => alert(\"Update failed. Check connection.\"));
                }
            };"""

if old_wrapper in content:
    content = content.replace(old_wrapper, '')
    changes += 1
    print('OK Removed duplicate updateAdminCreds wrapper')
else:
    print('WARN Could not find old wrapper to remove')

with open('vault.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nTotal changes applied: {changes}')