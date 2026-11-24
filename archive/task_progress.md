# Task Progress: vault.html Fixes

## Issue 1: Font Dropdown Fix
- [x] Add dynamic Google Font injection when user selects a font in #user-name-font or #big-msg-font
- [x] Change select elements to immediately apply style.fontFamily to preview elements on change
- [x] Save font selection to vaultState on change

## Issue 2: Video Upload Fix
- [x] Change accept="image/*" to accept="image/*,video/*" on: #float-file, #logo-file, #c1-file, #c2-file, #bg-file, #mood-file, #my-file, #so-file
- [x] Update upload handlers to differentiate video vs image files (skip compression for video)
- [x] Ensure Cloudinary upload works for video files (auto switch /video/upload vs /image/upload)
- [x] Update gallery button handler to render <video> tag for video types

## Issue 3: Live Chat Repair
- [x] Add video message rendering in chat listener (data.type === 'video')
- [x] Verify postToChat sends correct sender, text, timestamp data
- [x] Ensure onValue listener continuously updates UI

## Issue 4: Real-time Multi-tenant Vault Sync (Fixed Oct 2026)
- [x] Unstaged obsolete legacy vault.html (v3.2.1)
- [x] Restored and repaired _buildUICore() and buildUI() flow
- [x] Declared _buildUITimer and _journeyRendered
- [x] Restored renderSmartPlayer, updateVinylUI, and fetchSmartDetails()
- [x] Wired svDB() to trigger pushToCloud() to sync media/edits between couple in real-time
- [x] Verified zero console/runtime errors across vault.html, login.html, index.html, studio.html, checkout.html
