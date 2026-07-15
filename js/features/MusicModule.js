/**
 * ZEKRA MUSIC MODULE v4.4.1
 * Smart music player with Spotify, YouTube, vinyl player, and lyrics fetching.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    const Music = {};
    let vAudio = new Audio();
    let isPlaying = false;

    // ─── Render Smart Player ─────────────────────────────────
    Music.render = function(url, lyrics) {
        const spr = document.getElementById('spotify-container');
        const vpl = document.getElementById('vinyl-player');
        const lyBox = document.getElementById('lyrics-display');

        if (!spr || !vpl || !url || url === 'undefined' || url === 'null' || url === '') {
            if (spr) spr.classList.add('hidden');
            if (vpl) vpl.classList.add('hidden');
            return;
        }

        if (url.includes('spotify.link')) {
            spr.classList.remove('hidden');
            vpl.classList.add('hidden');
            spr.innerHTML = `<div class="bg-black/60 backdrop-blur-sm text-white p-6 rounded-2xl text-center text-sm font-medium border border-white/20">
                <i class="ri-error-warning-line text-2xl mb-2 block text-pink-400"></i>
                Shortened links not supported.<br>
                <span class="text-[10px] opacity-70">Use 'Share > Copy Song Link' in Spotify.</span>
            </div>`;
            return;
        }

        const isSpotify = url.includes('spotify.com') && (url.includes('/track/') || url.includes('/playlist/') || url.includes('/album/') || url.includes('/artist/') || url.includes('/embed/'));

        if (isSpotify) {
            spr.classList.remove('hidden');
            vpl.classList.add('hidden');
            let embedUrl = url.split('?')[0];
            if (embedUrl.includes('spotify.com') && !embedUrl.includes('/embed/')) {
                if (embedUrl.includes('/track/')) embedUrl = embedUrl.replace('/track/', '/embed/track/');
                else if (embedUrl.includes('/playlist/')) embedUrl = embedUrl.replace('/playlist/', '/embed/playlist/');
                else if (embedUrl.includes('/album/')) embedUrl = embedUrl.replace('/album/', '/embed/album/');
                else if (embedUrl.includes('/artist/')) embedUrl = embedUrl.replace('/artist/', '/embed/artist/');
            }
            spr.innerHTML = `<iframe style="border-radius:12px" src="${embedUrl}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
            if (lyBox) lyBox.classList.add('hidden');
        } else {
            spr.classList.add('hidden');
            vpl.classList.remove('hidden');
            const state = ZEKRA.state ? ZEKRA.state.get() : {};
            document.getElementById('v-title').innerText = state.title || "Unknown Track";
            document.getElementById('v-artist').innerText = state.artist || "Unknown Artist";
            const vArt = document.getElementById('v-art');
            if (vArt) {
                vArt.src = state.art || ZEKRA.DEFAULT_ART;
                vArt.onerror = () => { vArt.src = ZEKRA.DEFAULT_ART; vArt.onerror = null; };
            }
            if (vAudio.src !== url && (url.match(/\.(mp3|wav|ogg|m4a|aac)$/i) || !url.includes('http'))) {
                vAudio.pause();
                vAudio = new Audio(url);
                isPlaying = false;
                Music._updateUI();
            }
            if (lyBox) {
                if (lyrics && lyrics.trim() !== "") {
                    lyBox.classList.remove('hidden');
                    const p = lyBox.querySelector('p');
                    if (p) p.innerText = lyrics;
                } else {
                    lyBox.classList.add('hidden');
                }
            }
        }
    };

    // ─── Toggle Play ─────────────────────────────────────────
    Music.togglePlay = function() {
        if (isPlaying) {
            vAudio.pause();
        } else {
            vAudio.play().catch(() => alert("Click again to play!"));
        }
        isPlaying = !isPlaying;
        Music._updateUI();
    };

    Music._updateUI = function() {
        const box = document.getElementById('vinyl-box');
        const icon = document.getElementById('v-play-icon');
        if (box) box.classList.toggle('spinning', isPlaying);
        if (icon) icon.className = isPlaying ? 'ri-pause-fill text-2xl' : 'ri-play-fill text-2xl';
    };

    // ─── Fetch Lyrics & Art ──────────────────────────────────
    Music.fetchDetails = async function() {
        const state = ZEKRA.state ? ZEKRA.state.get() : {};
        const t = document.getElementById('vaultState-at')?.value?.trim() || state.title || "";
        const a = document.getElementById('vaultState-aa')?.value?.trim() || state.artist || "";
        if (!t || !a || t === "Memory Song" || a === "Artist") return;

        try {
            const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(a)}/${encodeURIComponent(t)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.lyrics) {
                    state.lyrics = data.lyrics;
                    if (ZEKRA.state) ZEKRA.state.scheduleLocalSave();
                }
            }
        } catch (e) { /* lyrics unavailable */ }

        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(a + ' ' + t)}&entity=song&limit=1`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results[0] && data.results[0].artworkUrl100) {
                    state.art = data.results[0].artworkUrl100.replace('100x100', '400x400');
                    if (ZEKRA.state) ZEKRA.state.scheduleLocalSave();
                }
            }
        } catch (e) { /* art unavailable */ }
    };

    // ─── Play/Pause handlers ─────────────────────────────────
    vAudio.onended = () => { isPlaying = false; Music._updateUI(); };
    vAudio.onplay = () => { isPlaying = true; Music._updateUI(); };

    window.ZEKRA.Music = Music;
    console.log('✅ ZEKRA: MusicModule loaded.');
})();