import { C, CX, label, chapterTag, glowDot, narration, plan, speech, mount, chapterAlpha, titleCard, chip, panel, arrow } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787';

// Caption markup: [[keyword]] is highlighted (see runtime/kit.js). Audio: `npm run narrate -- computer-science/g9-encryption`.
const TXT = {
  en1: 'On a public network, a hacker, or [[eavesdropper]], can [[intercept]] your data.',
  en2: '[[Encryption]] makes data unreadable. It cannot stop interception, but it stops the data [[making sense]].',
  sy1: '[[Symmetric encryption]] uses the [[same key]] to encrypt and to decrypt.',
  sy2: 'Example: shift every letter by [[3]]: HELLO becomes KHOOR. Both sides must [[share the key]].',
  as1: '[[Asymmetric encryption]] uses two keys: a [[public key]] and a [[private key]].',
  as2: 'The receiver encrypts with the [[public key]]; only the sender\'s [[private key]] can decrypt.',
};
const nar = await narration('computer-science/grade-9-data-transmission/encryption', TXT);
const { caption, spoken } = nar;
const P = plan(nar, { why: ['en1', 'en2'], sym: ['sy1', 'sy2'], asym: ['as1', 'as2'] });
const { CS, T } = P;
const sp = speech(nar, CS);

// ---- icons ---------------------------------------------------------------------------
function person(ctx, x, y, name, color, alpha, hood = false) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = hood ? 'rgba(255,107,107,0.25)' : 'rgba(255,255,255,0.05)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - 50, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 66, y + 70); ctx.quadraticCurveTo(x, y - 30, x + 66, y + 70); ctx.stroke();
  ctx.restore();
  label(ctx, name, x, y + 110, { size: 30, mono: true, color, alpha, weight: 700 });
}
function key(ctx, x, y, color, alpha, s = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, 22 * s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 22 * s, y); ctx.lineTo(x + 100 * s, y); ctx.moveTo(x + 76 * s, y); ctx.lineTo(x + 76 * s, y + 20 * s); ctx.moveTo(x + 96 * s, y); ctx.lineTo(x + 96 * s, y + 16 * s); ctx.stroke(); ctx.restore();
}
function padlock(ctx, x, y, color, alpha, open = false) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); if (open) ctx.arc(x + 12, y - 20, 22, Math.PI, 0.1 * Math.PI); else ctx.arc(x, y - 20, 22, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(x - 32, y - 20, 64, 50, 10); ctx.fill(); ctx.restore();
}
const scramble = (s, seed) => [...s].map((ch, i) => '#@%&$?!*+=x9kQ'[(ch.charCodeAt(0) + i * 7 + seed) % 14]).join('');
const shift = (s, n) => [...s].map((ch) => String.fromCharCode(((ch.charCodeAt(0) - 65 + n + 26) % 26) + 65)).join('');

mount({
  plan: P,
  init: () => ({}),
  draws: {
    title(ctx, t) {
      const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
      const msg = 'HELLO';
      [...msg].forEach((ch, i) => {
        const k = range(t, 0.6 + i * 0.1, 1.6 + i * 0.1);
        label(ctx, k < 0.5 ? ch : shift(ch, 3), CX - 200 + i * 100, 200, { size: 74, mono: true, weight: 700, color: k < 0.5 ? C.text : C.electron, alpha: a * 0.3 });
      });
      titleCard(ctx, t, T, { l1: 'How does', l2: 'encryption work?', sub: 'Unit 2 · Data transmission · Grade 9', tint: C.electron, size: 108 });
    },

    why(ctx, t) {
      const a = chapterAlpha(T, 'why', t), lt = t - T.why[0];
      chapterTag(ctx, '01', 'Why encrypt?', a);
      const k = easeOut(range(lt, 0.3, 1));
      person(ctx, 360, 470, 'sender', C.electron, a * k);
      person(ctx, 1560, 470, 'receiver', GREEN, a * k);
      ctx.save(); ctx.globalAlpha = a * k * 0.6; ctx.strokeStyle = C.dim; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(470, 470); ctx.lineTo(1450, 470); ctx.stroke(); ctx.restore();
      label(ctx, 'public network', CX, 545, { size: 24, mono: true, color: C.dim, alpha: a * k, weight: 500 });
      const ek = range(lt, sp('en1', 0.35), sp('en1', 0.35) + 0.8);
      person(ctx, CX, 260, 'eavesdropper', C.proton, a * ek, true);
      ctx.save(); ctx.globalAlpha = a * ek * 0.8; ctx.strokeStyle = C.proton; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(CX, 405); ctx.lineTo(CX, 470); ctx.stroke(); ctx.restore();

      const enc = easeInOut(range(lt, CS.en2 + 0.4, CS.en2 + 1.6));
      const plain = 'my password is 1234';
      // packet on the wire
      const u = ((lt - 1.0) * 0.22) % 1;
      const px = lerp(500, 1420, u < 0 ? 0 : u);
      const shown = enc > 0.5 ? scramble(plain, 3) : plain;
      chip(ctx, shown, px - measureText(ctx, shown) / 2 - 18, 470, { color: enc > 0.5 ? C.electron : C.gold, size: 32, alpha: a * range(lt, 1, 1.6), family: '"IBM Plex Mono", monospace' });
      // what the eavesdropper sees
      const sk = range(lt, sp('en1', 0.7), sp('en1', 0.7) + 0.7);
      label(ctx, 'eavesdropper sees:', CX - 20, 690, { size: 24, mono: true, color: C.dim, alpha: a * sk, align: 'right', weight: 500 });
      label(ctx, enc > 0.5 ? scramble(plain, 3) : plain, CX + 10, 690, { size: 36, mono: true, weight: 700, color: enc > 0.5 ? C.electron : C.proton, alpha: a * sk, align: 'left' });
      const vk = range(lt, CS.en2 + 1.6, CS.en2 + 2.4);
      label(ctx, 'still intercepted, but it makes no sense', CX, 760, { size: 30, mono: true, color: GREEN, alpha: a * vk, weight: 700 });
      caption(ctx, 'en1', a, lt, CS.en1);
      caption(ctx, 'en2', a, lt, CS.en2);
    },

    sym(ctx, t) {
      const a = chapterAlpha(T, 'sym', t), lt = t - T.sym[0];
      chapterTag(ctx, '02', 'Symmetric encryption', a);
      const k = easeOut(range(lt, 0.3, 1));
      person(ctx, 340, 400, 'sender', C.electron, a * k);
      person(ctx, 1580, 400, 'receiver', GREEN, a * k);
      const kk = range(lt, sp('sy1', 0.3), sp('sy1', 0.3) + 0.8);
      key(ctx, 480, 380, C.gold, a * kk, 1.1); key(ctx, 1360, 380, C.gold, a * kk, 1.1);
      label(ctx, 'same key', 600, 340, { size: 26, mono: true, color: C.gold, alpha: a * kk, weight: 700 });
      label(ctx, 'same key', 1470, 340, { size: 26, mono: true, color: C.gold, alpha: a * kk, weight: 700 });
      arrow(ctx, 720, 400, 1220, 400, C.dim, a * kk, 5);
      label(ctx, 'encrypted message', CX, 370, { size: 24, mono: true, color: C.dim, alpha: a * kk, weight: 500 });

      // the shift-by-3 example
      const ex = range(lt, sp('sy2', 0.05), sp('sy2', 0.05) + 0.8);
      const word = 'HELLO', enc = shift(word, 3);
      label(ctx, 'key = shift by 3', CX, 590, { size: 34, mono: true, weight: 700, color: C.gold, alpha: a * ex });
      [...word].forEach((ch, i) => {
        const x = CX - 200 + i * 100, kk2 = easeInOut(range(lt, sp('sy2', 0.2 + i * 0.07), sp('sy2', 0.2 + i * 0.07) + 0.8));
        label(ctx, ch, x, 660, { size: 60, mono: true, weight: 700, alpha: a * ex });
        arrow(ctx, x, 690, x, 740, C.electron, a * ex * kk2, 4);
        label(ctx, enc[i], x, 790, { size: 60, mono: true, weight: 700, color: C.electron, alpha: a * kk2 });
      });
      label(ctx, 'plaintext', CX - 320, 660, { size: 22, mono: true, color: C.dim, alpha: a * ex, align: 'right', weight: 500 });
      label(ctx, 'ciphertext', CX - 320, 790, { size: 22, mono: true, color: C.electron, alpha: a * ex, align: 'right', weight: 500 });
      label(ctx, 'shift back by 3 to decrypt', CX + 380, 725, { size: 24, mono: true, color: GREEN, alpha: a * range(lt, sp('sy2', 0.6), sp('sy2', 0.6) + 0.8), align: 'left', weight: 600 });
      label(ctx, '⚠ the key must be shared safely', CX, 860, { size: 28, mono: true, color: C.proton, alpha: a * range(lt, sp('sy2', 0.8), sp('sy2', 0.8) + 0.8), weight: 700 });
      caption(ctx, 'sy1', a, lt, CS.sy1);
      caption(ctx, 'sy2', a, lt, CS.sy2);
    },

    asym(ctx, t) {
      const a = chapterAlpha(T, 'asym', t), lt = t - T.asym[0];
      chapterTag(ctx, '03', 'Asymmetric encryption', a);
      const p1 = a * (1 - range(lt, CS.as2 - 0.3, CS.as2 + 0.3)), p2 = a * range(lt, CS.as2, CS.as2 + 0.6);
      if (p1 > 0) {
        const kk = easeOut(range(lt, sp('as1', 0.3), sp('as1', 0.3) + 0.8));
        panel(ctx, 260, 300, 620, 380, C.gold, p1 * kk);
        key(ctx, 460, 440, C.gold, p1 * kk, 1.6);
        label(ctx, 'PUBLIC key', 570, 350, { size: 44, mono: true, weight: 700, color: C.gold, alpha: p1 * kk });
        label(ctx, 'made available to everybody', 570, 570, { size: 26, mono: true, color: C.dim, alpha: p1 * kk, weight: 500 });
        label(ctx, 'used to encrypt', 570, 620, { size: 26, mono: true, color: C.gold, alpha: p1 * kk, weight: 600 });
        const pk = easeOut(range(lt, sp('as1', 0.6), sp('as1', 0.6) + 0.8));
        panel(ctx, 1040, 300, 620, 380, C.proton, p1 * pk);
        key(ctx, 1240, 440, C.proton, p1 * pk, 1.6);
        label(ctx, 'PRIVATE key', 1350, 350, { size: 44, mono: true, weight: 700, color: C.proton, alpha: p1 * pk });
        label(ctx, 'known only to its owner', 1350, 570, { size: 26, mono: true, color: C.dim, alpha: p1 * pk, weight: 500 });
        label(ctx, 'used to decrypt', 1350, 620, { size: 26, mono: true, color: C.proton, alpha: p1 * pk, weight: 600 });
      }
      if (p2 > 0) {
        person(ctx, 260, 420, 'sender', C.electron, p2);
        person(ctx, 1660, 420, 'receiver', GREEN, p2);
        const steps = [
          { at: sp('as2', 0.1), text: '1  sender shares the public key', x0: 380, x1: 1540, y: 320, color: C.gold },
          { at: sp('as2', 0.35), text: '2  receiver encrypts with the public key', x0: 1540, x1: 380, y: 440, color: C.electron },
          { at: sp('as2', 0.65), text: '3  only the private key decrypts', x0: 0, x1: 0, y: 560, color: C.proton },
        ];
        steps.forEach((s, i) => {
          const k = range(lt, s.at, s.at + 0.8);
          if (i < 2) { arrow(ctx, s.x0, s.y, lerp(s.x0, s.x1, easeOut(k)), s.y, s.color, p2 * Math.min(1, k * 4), 6); }
          label(ctx, s.text, CX, s.y - 34, { size: 30, mono: true, weight: 700, color: s.color, alpha: p2 * k });
        });
        const dk = range(lt, sp('as2', 0.65), sp('as2', 0.65) + 0.8);
        key(ctx, 300, 600, C.proton, p2 * dk, 1.0);
        padlock(ctx, 1660, 650, C.gold, p2 * dk * 0.0);
        label(ctx, 'sender decrypts with the private key', 760, 630, { size: 26, mono: true, color: C.proton, alpha: p2 * dk, align: 'left', weight: 600 });
        void padlock;
      }
      caption(ctx, 'as1', a, lt, CS.as1);
      caption(ctx, 'as2', a, lt, CS.as2);
    },

    outro(ctx, t) {
      const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
      const s = spoken('outro') ?? 5;
      chip(ctx, 'one shared key  (symmetric)', CX - 400, 340, { color: C.gold, size: 50, alpha: a * range(lt, 0.4, 1.1), w: 800, weight: 700 });
      chip(ctx, 'public + private key  (asymmetric)', CX - 400, 470, { color: C.electron, size: 50, alpha: a * range(lt, 0.4 + s * 0.35, 1.1 + s * 0.35), w: 800, weight: 700 });
      label(ctx, 'interceptors see only scrambled data', CX, 690, { size: 58, weight: 700, color: GREEN, alpha: a * range(lt, 0.4 + s * 0.7, 1.1 + s * 0.7) });
    },
  },
});

function measureText(ctx, text) {
  ctx.save(); ctx.font = '600 32px "IBM Plex Mono", monospace'; const w = ctx.measureText(text).width; ctx.restore();
  return w;
}
