/**
 * ZEKRA ANIMATION ENGINE v4.4.1
 * Firework particles, heart trails, and visual effects with fixed canvas resolution.
 */
window.ZEKRA = window.ZEKRA || {};

(function() {
    'use strict';

    // ─── Fixed Canvas Dimensions (prevents GPU memory leaks) ──
    const FX_W = 480, FX_H = 854;
    let fxRunning = false;
    let fxAnimId = null;
    let pA = [];

    // ─── Firework Particles ───────────────────────────────────
    ZEKRA.fxGo = function() {
        if (ZEKRA.isMobile()) return;
        const fxc = document.getElementById('anim-cvs');
        if (!fxc) return;

        fxc.width = FX_W;
        fxc.height = FX_H;
        fxc.style.width = '100vw';
        fxc.style.height = '100vh';
        const fxctx = fxc.getContext('2d', { desynchronized: true, alpha: true });

        const cx = FX_W / 2, cy = FX_H / 2;
        const count = ZEKRA.isLowPower() ? 25 : 80;
        for (let i = 0; i < count; i++) {
            pA.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 1) * 18,
                s: Math.random() * 12 + 4,
                c: ['#ffb6c1','#db2777','#93c5fd','#c084fc'][Math.floor(Math.random() * 4)],
                a: 0, va: (Math.random() - 0.5) * 12
            });
        }
        if (fxRunning) return;
        fxRunning = true;

        function animate() {
            fxctx.clearRect(0, 0, FX_W, FX_H);
            if (pA.length === 0) {
                fxRunning = false;
                fxAnimId = null;
                return;
            }
            for (let i = pA.length - 1; i >= 0; i--) {
                const p = pA[i];
                fxctx.save();
                fxctx.translate(p.x, p.y);
                fxctx.rotate(p.a * Math.PI / 180);
                fxctx.fillStyle = p.c;
                fxctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
                fxctx.restore();
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.6;
                p.a += p.va;
                if (p.y > FX_H + 20) pA.splice(i, 1);
            }
            fxAnimId = requestAnimationFrame(animate);
        }
        animate();
    };

    // ─── Heart Trail ──────────────────────────────────────────
    const TRX_W = 480, TRX_H = 854;
    let trxRunning = false;
    let trxAnimId = null;
    let trxCtx = null;
    let tA = [];

    ZEKRA.trx = function() {
        if (ZEKRA.isMobile()) return;
        const tc = document.getElementById('trail-cvs');
        if (!tc) return;
        if (!trxCtx) {
            tc.width = TRX_W;
            tc.height = TRX_H;
            tc.style.width = '100vw';
            tc.style.height = '100vh';
            trxCtx = tc.getContext('2d', { desynchronized: true, alpha: true });
        }
        if (trxRunning) return;
        trxRunning = true;

        function animate() {
            trxCtx.clearRect(0, 0, TRX_W, TRX_H);
            const state = ZEKRA.state ? ZEKRA.state.get() : { t: false };
            if (state.t) {
                for (let i = tA.length - 1; i >= 0; i--) {
                    const t = tA[i];
                    trxCtx.beginPath();
                    trxCtx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
                    trxCtx.fillStyle = `rgba(255,105,180,${t.o})`;
                    trxCtx.fill();
                    t.r -= 0.3;
                    t.o -= 0.05;
                    if (t.o <= 0) tA.splice(i, 1);
                }
            }
            if (!state.t && tA.length === 0) {
                trxRunning = false;
                trxAnimId = null;
                return;
            }
            trxAnimId = requestAnimationFrame(animate);
        }
        animate();
    };

    console.log('✅ ZEKRA: AnimationEngine loaded.');
})();