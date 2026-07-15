/**
 * ZEKRA CHAT MODULE v4.4.1
 * Private messaging with media, voice, and presence.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    let _chatListenerAttached = false;
    let mediaRecorder = null;
    let chunks = [];
    let recordTimer = null;
    let activeStream = null;

    const Chat = {};

    // ─── Listen to Incoming Messages ──────────────────────────
    Chat.listen = function() {
        if (_chatListenerAttached) return;
        const uid = SanctuaryEngine.getActiveUID();
        if (!uid || uid === 'undefined' || uid === 'null') return;
        const chatMsgs = document.getElementById('soul-chat-msgs');
        if (!chatMsgs) return;
        _chatListenerAttached = true;

        const fb = window.ZEKRA.firebase;
        if (!fb || !fb.db) return;

        fb.db.ref(`users/${uid}/messages`).on('value', (snap) => {
            chatMsgs.innerHTML = '';
            snap.forEach(m => {
                const data = m.val();
                const session = SanctuaryEngine.getCurrentUser();
                const myId = session ? (session.side || session.id) : 'guest';
                const isMe = data.user === myId || data.user === session.id;

                const b = document.createElement('div');
                b.className = `msg-bubble ${isMe ? 'msg-me' : 'msg-them'}`;

                let content = '';
                if (data.type === 'image') {
                    content = `<img src="${data.url}" loading="lazy" class="msg-img" onclick="window.open('${data.url}')">`;
                } else if (data.type === 'audio') {
                    content = Chat._renderAudioMsg(m.key, data.url);
                } else {
                    content = `<div>${data.txt}</div>`;
                }
                b.innerHTML = `${content}<div class="msg-time">${data.at}</div>`;
                chatMsgs.appendChild(b);
            });
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
        });
    };

    // ─── Render Audio Message ────────────────────────────────
    Chat._renderAudioMsg = function(key, url) {
        return `
            <div class="flex items-center gap-2 w-[220px] cursor-pointer rounded-[20px] bg-white/20 backdrop-blur-sm pr-3 pl-1 py-1 relative overflow-hidden"
                 onclick="window.playVoiceMsg('${key}', '${url}')">
                <div id="v-prog-${key}" class="absolute left-0 top-0 bottom-0 bg-white/30 transition-all duration-75 z-0" style="width:0%"></div>
                <div class="relative z-10 flex items-center justify-between w-full">
                    <i id="v-icon-${key}" class="ri-play-fill text-2xl opacity-80 cursor-pointer"></i>
                    <div class="flex-1 flex items-center h-5 opacity-60 px-1 gap-[2px] cursor-pointer">
                        <div class="w-[2px] h-2 bg-current rounded-full"></div>
                        <div class="w-[2px] h-4 bg-current rounded-full"></div>
                        <div class="w-[2px] h-3 bg-current rounded-full"></div>
                        <div class="w-[2px] h-5 bg-current rounded-full"></div>
                        <div class="w-[2px] h-2 bg-current rounded-full"></div>
                    </div>
                    <span id="v-time-${key}" class="text-[10px] font-bold opacity-70 tracking-widest ml-1 w-6 text-right">0:00</span>
                </div>
            </div>`;
    };

    // ─── Send Text Message ───────────────────────────────────
    Chat.send = function(text) {
        const fb = window.ZEKRA.firebase;
        const uid = SanctuaryEngine.getActiveUID();
        if (!fb || !uid) return;
        const now = new Date();
        const session = SanctuaryEngine.getCurrentUser();
        fb.db.ref(`users/${uid}/messages`).push({
            user: session ? (session.side || session.id) : 'guest',
            at: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
            type: 'text',
            txt: text
        });
    };

    // ─── Send Image ──────────────────────────────────────────
    Chat.sendImage = async function(file) {
        ZEKRA.loading(true);
        try {
            const url = await ZEKRA.Uploader.upload(file, { maxW: 800, qual: 0.7 });
            const fb = window.ZEKRA.firebase;
            const uid = SanctuaryEngine.getActiveUID();
            const now = new Date();
            const session = SanctuaryEngine.getCurrentUser();
            if (fb && uid) {
                fb.db.ref(`users/${uid}/messages`).push({
                    user: session ? (session.side || session.id) : 'guest',
                    at: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
                    type: 'image',
                    url: url
                });
            }
        } catch (err) {
            alert("Upload failed: " + err.message);
        }
        ZEKRA.loading(false);
    };

    // ─── Send Voice Message ──────────────────────────────────
    Chat.startRecording = async function() {
        try {
            activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordTimer = setTimeout(() => {
                mediaRecorder = new MediaRecorder(activeStream);
                mediaRecorder.ondataavailable = ev => chunks.push(ev.data);
                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    chunks = [];
                    Chat._cleanupRecording();
                    ZEKRA.loading(true);
                    try {
                        const url = await ZEKRA.Uploader.uploadRaw(blob);
                        const fb = window.ZEKRA.firebase;
                        const uid = SanctuaryEngine.getActiveUID();
                        const now = new Date();
                        const session = SanctuaryEngine.getCurrentUser();
                        if (fb && uid) {
                            fb.db.ref(`users/${uid}/messages`).push({
                                user: session ? (session.side || session.id) : 'guest',
                                at: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'),
                                type: 'audio',
                                url: url
                            });
                        }
                    } catch (e) {
                        alert("Voice upload failed");
                    }
                    ZEKRA.loading(false);
                };
                mediaRecorder.start();
                const actionBtn = document.getElementById('msg-action-btn');
                if (actionBtn) actionBtn.classList.add('msg-recording');
                const wave = document.getElementById('msg-wave');
                if (wave) wave.classList.add('show');
            }, 300);
        } catch (e) {
            alert("Mic access denied");
        }
    };

    Chat.stopRecording = function() {
        clearTimeout(recordTimer);
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        Chat._cleanupRecording();
    };

    Chat._cleanupRecording = function() {
        const actionBtn = document.getElementById('msg-action-btn');
        if (actionBtn) actionBtn.classList.remove('msg-recording');
        const wave = document.getElementById('msg-wave');
        if (wave) wave.classList.remove('show');
        if (activeStream) {
            activeStream.getTracks().forEach(t => t.stop());
            activeStream = null;
        }
    };

    window.ZEKRA.Chat = Chat;
    console.log('✅ ZEKRA: ChatModule loaded.');
})();