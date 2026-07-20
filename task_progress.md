# Task Progress: vault.html Fixes

## Issue 1: Font Dropdown Fix
- [ ] Add dynamic Google Font injection when user selects a font in #user-name-font or #big-msg-font
- [ ] Change select elements to immediately apply style.fontFamily to preview elements on change
- [ ] Save font selection to vaultState on change

## Issue 2: Video Upload Fix
- [ ] Change accept="image/*" to accept="image/*,video/*" on: #float-file, #logo-file, #c1-file, #c2-file, #bg-file, #mood-file, #my-file, #so-file
- [ ] Update upload handlers to differentiate video vs image files (skip compression for video)
- [ ] Ensure Firebase Storage upload works for video files
- [ ] Update gallery button handler to render <video> tag for video types

## Issue 3: Live Chat Repair
- [ ] Add video message rendering in chat listener (data.type === 'video')
- [ ] Verify postToChat sends correct sender, text, timestamp data
- [ ] Ensure onValue listener continuously updates UI