import { C, CX, CY, label, chapterTag, narration, plan, speech, mount, chapterAlpha, titleCard, panel, measure } from '/runtime/kit.js';

const { clamp, lerp, range, easeOut, easeInOut, fadeWindow } = Scene;

const GREEN = '#7ee787', VIOLET = '#b48cff';
const THINK = 4; // seconds to think between the question and the answer
const LETTERS = ['A', 'B', 'C', 'D'];

// One entry per question. `q` / `a` are the on-screen captions; the spoken text is in narration.json.
const QUIZ = [
  { topic: 'Data packets', color: C.electron, q: 'Which part of a data packet holds the sequence number?',
    opts: ['the payload', 'the header', 'the trailer'], ans: 1,
    why: ['The header holds:', 'sender IP · receiver IP', 'sequence number · packet size'] },
  { topic: 'Packet switching', color: C.electron, q: 'Packets from the same message:',
    opts: ['always arrive in order', 'can take different routes and arrive out of order', 'must all follow one route'], ans: 1,
    why: ['Routers pick a route for each packet.', 'The receiver reassembles them', 'using the sequence numbers.'] },
  { topic: 'Transmission modes', color: C.gold, q: 'Which transmission mode is a walkie-talkie?',
    opts: ['simplex', 'half-duplex', 'full-duplex'], ans: 1,
    why: ['Half-duplex: both directions,', 'but NOT at the same time.'] },
  { topic: 'Serial vs parallel', color: C.gold, q: 'Which type of transmission works better over long distances?',
    opts: ['serial', 'parallel'], ans: 0,
    why: ['Serial: one bit at a time on one wire,', 'synchronised over distance.', 'Parallel suffers skew and crosstalk.'] },
  { topic: 'Parallel problems', color: C.gold, q: 'Bits arriving at slightly different times in parallel transmission is called:',
    opts: ['crosstalk', 'skew', 'parity'], ans: 1,
    why: ['Skew: bits arrive out of sync.', 'Crosstalk = interference between wires.', 'Parity = an error check.'] },
  { topic: 'Parity bit', color: C.proton, q: 'Even parity. The 7 data bits are 0110111. What is the parity bit?',
    opts: ['0', '1'], ans: 1, bits: '0110111',
    why: ['Count the 1s in 0110111: five (odd).', 'Parity bit = 1 → six 1s (even).'] },
  { topic: 'Parity block', color: C.proton, q: 'In a parity block, one row and one column fail their parity check. This tells us:',
    opts: ['the whole block was lost', 'the wrong bit is where they cross', 'the parity byte was not sent'], ans: 1,
    why: ['The bit at the crossing is wrong.', 'Flip it back to correct the error.'] },
  { topic: 'Check digits', color: VIOLET, q: 'What is the check digit for the code 31415?',
    opts: ['4', '6', '8'], ans: 1,
    why: ['3×1 + 1×2 + 4×3 + 1×4 + 5×5', '= 3 + 2 + 12 + 4 + 25 = 46', '46 ÷ 10 → remainder 6'] },
  { topic: 'Error detection', color: VIOLET, q: 'The receiver sends an acknowledgement; the sender resends after a timeout. Which method?',
    opts: ['checksum', 'echo check', 'ARQ'], ans: 2,
    why: ['ARQ: automatic repeat request.', 'ACK → send next block.', 'Timeout or NACK → send again.'] },
  { topic: 'Encryption', color: C.electron, q: 'Which encryption uses a public key and a private key?',
    opts: ['symmetric', 'asymmetric'], ans: 1,
    why: ['Asymmetric: public key + private key.', 'Symmetric: one shared key.', 'Encryption does not stop interception,', 'it stops the data making sense.'] },
];

const TXT = { in1: 'Ten quick questions on [[data transmission]]: listen, [[think]], then check.' };
QUIZ.forEach((Q, i) => {
  TXT[`q${i + 1}`] = `Question ${i + 1}: choose [[${LETTERS.slice(0, Q.opts.length).join(', ')}]]`;
  TXT[`a${i + 1}`] = `Answer: [[${LETTERS[Q.ans]}: ${Q.opts[Q.ans]}]]`;
});
const nar = await narration('computer-science/grade-9-data-transmission/quiz', TXT, { hold: THINK });
const { caption, spoken } = nar;
const chapters = { intro: ['in1'] };
QUIZ.forEach((_, i) => { chapters[`q${i + 1}`] = [`q${i + 1}`, `a${i + 1}`]; });
const P = plan(nar, chapters);
const { CS, T } = P;
const sp = speech(nar, CS);

function wrap(ctx, text, maxW, size) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (measure(ctx, test, size, 700) > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  lines.push(cur);
  return lines;
}

function progress(ctx, current, a) {
  for (let i = 0; i < QUIZ.length; i++) {
    const x = 1300 + i * 52, done = i < current, now = i === current;
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = done ? GREEN : now ? C.gold : 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(x, 90, now ? 14 : 10, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

function drawQuestion(ctx, t, i) {
  const name = `q${i + 1}`, Q = QUIZ[i];
  const a = chapterAlpha(T, name, t), lt = t - T[name][0];
  const qid = `q${i + 1}`, aid = `a${i + 1}`;
  chapterTag(ctx, String(i + 1).padStart(2, '0'), Q.topic, a);
  progress(ctx, i, a);

  // the question
  const size = Q.q.length > 60 ? 46 : 54;
  const lines = wrap(ctx, Q.q, 1400, size);
  const k = easeOut(range(lt, 0.3, 1.0));
  lines.forEach((ln, j) => label(ctx, ln, CX, 220 + j * (size + 14), { size, weight: 700, alpha: a * k }));
  const oy0 = 220 + lines.length * (size + 14) + 50;

  // the options appear as they are read out
  const sQ = CS[qid] + 0.5 + (spoken(qid) ?? 6) * 0.3, dur = (spoken(qid) ?? 6) * 0.6;
  const reveal = CS[aid] + 0.5 + 0.4; // the correct answer lights up as the answer is announced
  Q.opts.forEach((opt, j) => {
    const y = oy0 + j * 104, ok = easeOut(range(lt, sQ + (dur * j) / Q.opts.length, sQ + (dur * j) / Q.opts.length + 0.6));
    const rv = easeInOut(range(lt, reveal, reveal + 0.6));
    const correct = j === Q.ans;
    const col = rv > 0 ? (correct ? GREEN : C.dim) : Q.color;
    const al = a * ok * (rv > 0 && !correct ? 1 - rv * 0.6 : 1);
    panel(ctx, 340 + (1 - ok) * 50, y - 42, 1240, 84, col, al, correct && rv > 0 ? 0.14 : 0.05, 20);
    ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = col + '33'; ctx.strokeStyle = col; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(400 + (1 - ok) * 50, y, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    label(ctx, LETTERS[j], 400 + (1 - ok) * 50, y, { size: 36, mono: true, weight: 700, alpha: al });
    label(ctx, opt, 460 + (1 - ok) * 50, y, { size: 38, weight: 600, alpha: al, align: 'left' });
    if (rv > 0) label(ctx, correct ? '✓' : '✗', 1540, y, { size: 48, weight: 700, color: correct ? GREEN : C.proton, alpha: a * rv });
  });

  // countdown while thinking
  const ts = CS[qid] + 0.5 + (spoken(qid) ?? 6), remaining = ts + THINK - lt;
  const ck = range(lt, ts - 0.3, ts) * (1 - range(lt, ts + THINK, ts + THINK + 0.4));
  if (ck > 0) {
    const cx = 1740, cy = 250, r = 62, frac = clamp(remaining / THINK, 0, 1);
    ctx.save(); ctx.globalAlpha = a * ck; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = frac < 0.35 ? C.proton : C.gold; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.restore();
    label(ctx, String(Math.max(1, Math.ceil(remaining))), cx, cy, { size: 64, mono: true, weight: 700, alpha: a * ck, color: C.gold });
    label(ctx, 'think!', cx, cy + 100, { size: 24, mono: true, color: C.dim, alpha: a * ck, weight: 600 });
  }

  // the explanation
  const ek = easeOut(range(lt, reveal + 0.3, reveal + 1.1));
  if (ek > 0) {
    const py = oy0 + Q.opts.length * 104 - 20, ph = 40 + Q.why.length * 40 + (Q.bits ? 60 : 0);
    panel(ctx, 340, py, 1240, ph, GREEN, a * ek, 0.05, 20);
    let yy = py + 40;
    if (Q.bits) {
      [...Q.bits].forEach((b, j) => label(ctx, b, 480 + j * 60, yy, { size: 34, mono: true, weight: 700, alpha: a * ek, color: b === '1' ? C.gold : C.dim }));
      yy += 60;
    }
    Q.why.forEach((ln, j) => label(ctx, ln, 380, yy + j * 40, { size: 28, mono: true, weight: 500, alpha: a * ek * range(lt, reveal + 0.4 + j * 0.35, reveal + 0.9 + j * 0.35), align: 'left' }));
  }
  caption(ctx, qid, a, lt, CS[qid]);
  caption(ctx, aid, a, lt, CS[aid]);
}

const draws = {
  title(ctx, t) {
    const a = fadeWindow(t, 0, T.title[1], 0.6, 0.6);
    for (let i = 0; i < 10; i++) {
      ctx.save(); ctx.globalAlpha = a * 0.5 * range(t, 0.3 + i * 0.1, 0.8 + i * 0.1); ctx.fillStyle = i % 2 ? C.gold : C.electron;
      ctx.beginPath(); ctx.arc(CX - 270 + i * 60, 220, 14, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    titleCard(ctx, t, T, { l1: 'Unit 2 quiz:', l2: 'data transmission', sub: 'Grade 9 · 10 questions · pause and think', tint: C.gold, size: 108 });
  },
  intro(ctx, t) {
    const a = chapterAlpha(T, 'intro', t), lt = t - T.intro[0];
    chapterTag(ctx, '00', 'How it works', a);
    [['1', 'listen to the question', C.electron], ['2', 'think for a few seconds', C.gold], ['3', 'check the answer', GREEN]].forEach(([n, txt, col], i) => {
      const at = 0.9 + i * 1.3, k = easeOut(range(lt, at, at + 0.8)), y = 330 + i * 150;
      panel(ctx, 420 + (1 - k) * 60, y - 56, 1080, 112, col, a * k, 0.05, 24);
      label(ctx, n, 500 + (1 - k) * 60, y, { size: 64, mono: true, weight: 700, color: col, alpha: a * k });
      label(ctx, txt, 580 + (1 - k) * 60, y, { size: 50, weight: 600, alpha: a * k, align: 'left' });
    });
    caption(ctx, 'in1', a, lt, CS.in1);
  },
  outro(ctx, t) {
    const a = fadeWindow(t, T.outro[0], T.outro[1], 0.7, 0.8), lt = t - T.outro[0];
    label(ctx, 'Quiz complete!', CX, CY - 150, { size: 100, weight: 700, color: GREEN, alpha: a * range(lt, 0.3, 1.1) });
    label(ctx, 'Review any topic you missed', CX, CY - 20, { size: 54, weight: 600, alpha: a * range(lt, 1.2, 2) });
    ['packets', 'modes', 'serial/parallel', 'errors', 'encryption'].forEach((tp, i) => {
      label(ctx, tp, CX - 480 + i * 240, CY + 110, { size: 28, mono: true, color: [C.electron, C.gold, C.gold, C.proton, C.electron][i], alpha: a * range(lt, 1.8 + i * 0.2, 2.4 + i * 0.2), weight: 600 });
    });
  },
};
QUIZ.forEach((_, i) => { draws[`q${i + 1}`] = (ctx, t) => drawQuestion(ctx, t, i); });

mount({ plan: P, init: () => ({}), draws });
