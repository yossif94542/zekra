#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('vault.html', 'r', encoding='utf-8') as f:
    vault = f.read()

changes = 0

# ====================================================================
# FIX 1: Fix the broken listenToVault identity sync block
# The problem: The old code removal left an orphaned opening brace { 
# after the listenToVault callback start, causing the entire script to break.
# ====================================================================

# Find the problematic pattern: the listenToVault callback now has
# the identity sync inserted AFTER the opening {, but before the vaultData.data check
# Let's find the exact broken pattern and fix it

# The correct structure should be:
# SanctuaryEngine.listenToVault(vaultId, vaultData => {
#     ... identity sync ...
#     const data = vaultData.data;
#     if (data) { ... }

# Check for orphaned braces after the identity sync block
old_identity_block = """                        // ★ FIX: Update hero title from mainTitle or data.n
                        const idData = vaultData.identity || {};
                        const configData = vaultData.config || {};
                        const vaultDataN = vaultData.data ? vaultData.data.n : null;
                        const newTitle = idData.mainTitle || configData.mainTitle || vaultDataN;
                        if (newTitle) {
                            const uiN = document.getElementById('ui-n');
                            if (uiN) uiN.innerText = newTitle;
                        }"""

# Check what's immediately after this block
idx = vault.find(old_identity_block)
if idx >= 0:
    after = idx + len(old_identity_block)
    next_50 = vault[after:after+80]
    print(f'Context after identity block: ...{next_50.replace(chr(10),\" \")}...')
    
    # The block should be followed by the data extraction: const data = vaultData.data;
    # But if we see orphaned things like "});" or misaligned braces, fix them
    if 'const data =' not in next_50 and 'vaultData.data' not in next_50:
        print('WARNING: Identity block is not properly followed by data extraction!')
        # Find the actual data extraction that follows
        data_pos = vault.find('const data = vaultData.data;', idx)
        if data_pos >= 0:
            # Remove everything between the identity block end and the data extraction
            between = vault[len(old_identity_block):data_pos]
            print(f'  Found data extraction at offset {data_pos - idx}')
            print(f'  Stale code between: {between[:80].replace(chr(10),\" \")}...')
            # Replace the broken section
            old_broken = vault[idx:data_pos]
            new_fixed = old_identity_block + '\n                        ' + vault[data_pos:]
            vault = vault.replace(old_broken, new_fixed, 1)
            changes += 1
            print('✅ Fixed identity block positioning before data extraction')
else:
    print('⚠️ Could not find identity sync block - checking for alternate pattern...')
    idx = vault.find('Update hero title from mainTitle or data.n')
    if idx >= 0:
        print(f'  Found at position {idx}')
        # Show surrounding context
        print(vault[max(0,idx-50):idx+300])

# ====================================================================
# FIX 2: Check for missing closing parentheses in the pre-auth login block
# ====================================================================
# The pre-auth block was inserted into vault.html. Check it's properly closed.
idx = vault.find('Identity-based authentication using matched folder')
if idx >= 0:
    # Find the closing of this block - should end with }
    # Look for the next "// 3. Standard Firebase Auth Flow"
    next_section = vault.find('// 3. Standard Firebase Auth Flow', idx)
    if next_section >= 0:
        # The block should end with } before the next section
        block_between = vault[idx:next_section]
        # Count opening and closing braces
        opens = block_between.count('{')
        closes = block_between.count('}')
        print(f'Pre-auth block: opens={{ {opens} closes=}} {closes}')
        if opens > closes:
            print(f'WARNING: Missing {opens - closes} closing braces!')
            # Add missing braces before the next section
            missing = '}' * (opens - closes)
            vault = vault[:next_section] + '\n' + missing + '\n' + vault[next_section:]
            changes += 1
            print(f'✅ Added {opens - closes} missing closing braces')
        elif closes > opens:
            print(f'WARNING: Extra {closes - opens} closing braces')
    else:
        print('⚠️ Could not find end of pre-auth block')

# ====================================================================
# FIX 3: Ensure the _buildUICore simplified block is properly closed
# ====================================================================
idx = vault.find('const uiN = document.getElementById(\'ui-n\')')
if idx >= 0:
    # Find the end of this block (after uiN.style.fontFamily)
    end = vault.find('uiN.style.fontFamily', idx)
    if end >= 0:
        # Get the block from the simplified patch
        block_start = vault.rfind('// ★ FIX:', 0, idx)
        if block_start < 0:
            block_start = vault.rfind('const uiN', 0, idx)
        # Count braces from the simplified section
        block_text = vault[block_start:end+80]
        in_code = vault[block_start:end+80]
        opens = in_code.count('{')
        closes = in_code.count('}')
        print(f'_buildUICore uiN block: opens={{ {opens} closes=}} {closes}')
        if opens != closes:
            print(f'WARNING: Brace mismatch in _buildUICore uiN block')
            # Find the actual simplified code
            simp_idx = vault.find('const sessionID', idx)
            if simp_idx >= 0 and simp_idx < end:
                simp_end = vault.find('};', end) + 2
                old_simp = vault[simp_idx-20:simp_end]
                new_simp = """const sessionID = (SanctuaryEngine.getCurrentUser() && SanctuaryEngine.getCurrentUser().id) || 'Vault';
                        const displayName = vaultState.n || sessionID || 'Zekra Vault';
                        uiN.innerText = displayName;
                    uiN.style.fontFamily = vaultState.userNameFont || "'Nunito'";"""
                vault = vault.replace(old_simp, new_simp)
                changes += 1
                print('✅ Fixed _buildUICore uiN block braces')

# ====================================================================
# FIX 4: General syntax scan for obvious errors
# ====================================================================
# Find any remaining cases where `gs(` is used (should be properly defined as window.gs)
# Check the gs function definition exists
if 'window.gs = function' in vault or 'window.gs = (id' in vault or 'const gs =' in vault:
    print('✅ gs() function is properly defined')
else:
    # Check if it's defined via a different pattern
    gs_def = vault.find('window.gs')
    if gs_def >= 0:
        snippet = vault[gs_def:gs_def+200].replace(chr(10), ' ')
        print(f'  gs definition found: ...{snippet[:150]}...')
    else:
        print('WARNING: gs() function might not be defined! Check for missing definition.')
        # The gs definition should exist from the original code
        # It might have been accidentally removed

# ====================================================================
# Write the file
# ====================================================================
with open('vault.html', 'w', encoding='utf-8') as f:
    f.write(vault)

print(f'\n🎉 Total changes applied: {changes}')