#!/usr/bin/env python3
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

with open('vault.html', 'r', encoding='utf-8') as f:
    vault = f.read()

changes = 0

# ====================================================================
# FIX 1: Fix the broken listenToVault identity sync insertion
# ====================================================================
old_id_block = """                        // ★ FIX: Update hero title from mainTitle or data.n
                        const idData = vaultData.identity || {};
                        const configData = vaultData.config || {};
                        const vaultDataN = vaultData.data ? vaultData.data.n : null;
                        const newTitle = idData.mainTitle || configData.mainTitle || vaultDataN;
                        if (newTitle) {
                            const uiN = document.getElementById('ui-n');
                            if (uiN) uiN.innerText = newTitle;
                        }"""

idx = vault.find(old_id_block)
if idx >= 0:
    after = idx + len(old_id_block)
    next_chunk = vault[after:after+100]
    # Clean up for printing
    clean = next_chunk.replace('\n', ' ').strip()
    print(f"Context after identity block: ...{clean[:70]}...")
    
    # Check if the data extraction is orphaned
    if 'const data =' not in next_chunk and 'vaultData.data' not in next_chunk:
        print('WARNING: Identity block not followed by data extraction!')
        data_pos = vault.find('const data = vaultData.data;', idx)
        if data_pos >= 0:
            # Remove stale code between identity block and data extraction
            old_broken = vault[idx:data_pos]
            new_fixed = old_id_block + '\n                        ' + vault[data_pos:]
            vault = vault.replace(old_broken, new_fixed, 1)
            changes += 1
            print('Fixed identity block positioning')
    else:
        print('Identity block correctly positioned')
else:
    print('Identity block not found')

# ====================================================================
# FIX 2: Check pre-auth login block braces
# ====================================================================
idx = vault.find('Identity-based authentication using matched folder')
if idx >= 0:
    next_section = vault.find('// 3. Standard Firebase Auth Flow', idx)
    if next_section >= 0:
        block = vault[idx:next_section]
        opens = block.count('{')
        closes = block.count('}')
        print(f'Pre-auth block: opens={opens} closes={closes}')
        if opens > closes:
            missing = '}' * (opens - closes)
            vault = vault[:next_section] + '\n' + missing + '\n' + vault[next_section:]
            changes += 1
            print(f'Added {opens - closes} missing closing braces')
    else:
        print('Could not find end of pre-auth block')
else:
    print('Pre-auth block not found')

# ====================================================================
# FIX 3: Check _buildUICore uiN block braces
# ====================================================================
idx = vault.find("const uiN = document.getElementById('ui-n')")
if idx >= 0:
    end = vault.find('uiN.style.fontFamily', idx)
    if end >= 0:
        block_start = vault.rfind('//', 0, idx)
        if block_start < 0:
            block_start = vault.rfind('const uiN', 0, idx)
        block_text = vault[block_start:end+80]
        opens = block_text.count('{')
        closes = block_text.count('}')
        print(f'buildUICore uiN block: opens={opens} closes={closes}')
        if opens != closes:
            print('WARNING: Brace mismatch in buildUICore uiN block')
    else:
        print('Could not find uiN.style.fontFamily')
else:
    print('buildUICore uiN block not found')

# ====================================================================
# FIX 4: Check gs function definition exists
# ====================================================================
gs_def = vault.find('window.gs')
if gs_def >= 0:
    # Check it's defined as a function
    snippet = vault[gs_def:gs_def+150].replace('\n', ' ')
    print(f'gs definition: ...{snippet[:120]}...')
    if 'function' in snippet[0:100] or '=' in snippet[0:100]:
        print('gs() function is properly defined')
    else:
        print('WARNING: gs definition may be incomplete')
else:
    print('WARNING: gs() function definition not found!')

# ====================================================================
# Write the file
# ====================================================================
with open('vault.html', 'w', encoding='utf-8') as f:
    f.write(vault)

print(f'\nTotal changes applied: {changes}')