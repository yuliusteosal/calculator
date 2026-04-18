/* ============================================================
   CALCUL — Kalkulator Pintar
   script.js  (v4 — Focus Mode + Universal NLP Engine)
   ============================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════
   STATE
════════════════════════════════════════════════════════════ */
const state = {
  current:    '0',
  previous:   null,
  operator:   null,
  justEvaled: false,
  waitingOp:  false,
};

/* ════════════════════════════════════════════════════════════
   DOM REFS
════════════════════════════════════════════════════════════ */
const displayMain      = document.getElementById('display-main');
const displayExpr      = document.getElementById('display-expression');
const btnAC            = document.getElementById('btn-ac');
const nlpToggle        = document.getElementById('nlp-toggle');
const nlpOverlay       = document.getElementById('nlp-overlay');
const nlpBackBtn       = document.getElementById('nlp-back-btn');
const nlpClearChatBtn  = document.getElementById('nlp-clear-chat-btn');
const nlpTextarea      = document.getElementById('nlp-textarea');
const nlpSendBtn       = document.getElementById('nlp-send-btn');
const nlpChat          = document.getElementById('nlp-chat');

/* ════════════════════════════════════════════════════════════
   DISPLAY HELPERS
════════════════════════════════════════════════════════════ */
function formatDisplay(numStr) {
  const s = String(numStr);
  if (s.endsWith('.')) return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  return parseFloat(n.toPrecision(10)).toString();
}

function updateDisplay(val, expr) {
  const str = val !== undefined ? String(val) : state.current;
  displayMain.textContent = formatDisplay(str);
  if (expr !== undefined) displayExpr.textContent = expr;
  const len = displayMain.textContent.length;
  displayMain.classList.remove('shrink-2', 'shrink-3');
  if (len > 10)      displayMain.classList.add('shrink-3');
  else if (len > 7)  displayMain.classList.add('shrink-2');
  displayMain.classList.remove('flash');
  void displayMain.offsetWidth;
  displayMain.classList.add('flash');
}

function syncAC() {
  btnAC.textContent = (state.current === '0' && !state.previous) ? 'AC' : 'C';
}

/* ════════════════════════════════════════════════════════════
   CALCULATOR CORE
════════════════════════════════════════════════════════════ */
function calculate(a, b, op) {
  const x = parseFloat(a), y = parseFloat(b);
  switch (op) {
    case '+': return x + y;
    case '−': return x - y;
    case '×': return x * y;
    case '÷': return y === 0 ? 'Error' : x / y;
    default:  return b;
  }
}

function trimResult(n) {
  if (typeof n !== 'number') return String(n);
  return parseFloat(n.toPrecision(10)).toString();
}

function handleNumber(d) {
  if (state.waitingOp)   { state.current = d; state.waitingOp = false; }
  else if (state.justEvaled) { state.current = d; state.previous = null; state.operator = null; state.justEvaled = false; }
  else { state.current = (state.current === '0' && d !== '.') ? d : (state.current.length < 12 ? state.current + d : state.current); }
  updateDisplay(state.current); syncAC(); setActiveOp(null);
}

function handleDecimal() {
  if (state.waitingOp) { state.current = '0.'; state.waitingOp = false; }
  else if (!state.current.includes('.')) { state.current += '.'; }
  updateDisplay(state.current);
}

function handleOperator(op) {
  state.justEvaled = false;
  if (state.operator && !state.waitingOp && state.previous !== null) {
    const r = calculate(state.previous, state.current, state.operator);
    if (r === 'Error') { handleError(); return; }
    const rs = trimResult(r);
    state.previous = rs; state.current = rs;
    updateDisplay(rs);
  } else {
    state.previous = state.current;
  }
  state.operator = op; state.waitingOp = true;
  displayExpr.textContent = `${formatDisplay(state.previous)} ${op}`;
  setActiveOp(op); syncAC();
}

function handleEquals() {
  if (!state.operator || !state.previous) return;
  const r = calculate(state.previous, state.current, state.operator);
  if (r === 'Error') { handleError(); return; }
  const rs = trimResult(r);
  displayExpr.textContent = `${formatDisplay(state.previous)} ${state.operator} ${formatDisplay(state.current)} =`;
  state.current = rs; state.previous = null; state.operator = null;
  state.justEvaled = true; state.waitingOp = false;
  updateDisplay(rs); setActiveOp(null); syncAC();
}

function handleClear() {
  if (btnAC.textContent === 'AC') {
    state.current = '0'; state.previous = null; state.operator = null;
    state.justEvaled = false; state.waitingOp = false;
    displayExpr.textContent = ''; setActiveOp(null);
  } else {
    state.current = '0'; state.waitingOp = false; state.justEvaled = false;
  }
  updateDisplay(state.current); syncAC();
}

function handleDelete() {
  if (state.justEvaled || state.waitingOp) return;
  state.current = state.current.length > 1 ? state.current.slice(0, -1) : '0';
  updateDisplay(state.current); syncAC();
}

function handlePercent() {
  const v = parseFloat(state.current);
  if (isNaN(v)) return;
  state.current = trimResult(state.previous !== null && state.operator
    ? (parseFloat(state.previous) * v) / 100
    : v / 100);
  updateDisplay(state.current); syncAC();
}

function handleError() {
  state.current = 'Error'; state.previous = null; state.operator = null;
  state.waitingOp = false; state.justEvaled = true;
  displayExpr.textContent = '';
  updateDisplay(state.current); setActiveOp(null); syncAC();
}

function setActiveOp(op) {
  document.querySelectorAll('.btn-op').forEach(b => b.classList.toggle('active', b.dataset.value === op));
}

/* ════════════════════════════════════════════════════════════
   BUTTON EVENTS
════════════════════════════════════════════════════════════ */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('pointerdown',  () => btn.classList.add('pressed'));
  btn.addEventListener('pointerup',    () => btn.classList.remove('pressed'));
  btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
  btn.addEventListener('click', () => {
    const { action, value } = btn.dataset;
    if (action === 'number')   handleNumber(value);
    if (action === 'operator') handleOperator(value);
    if (action === 'equals')   handleEquals();
    if (action === 'clear')    handleClear();
    if (action === 'delete')   handleDelete();
    if (action === 'decimal')  handleDecimal();
    if (action === 'percent')  handlePercent();
  });
});

document.addEventListener('keydown', e => {
  if (document.activeElement === nlpTextarea) return;
  const k = e.key;
  if (/^[0-9]$/.test(k))              handleNumber(k);
  else if (k === '.')                  handleDecimal();
  else if (k === '+')                  handleOperator('+');
  else if (k === '-')                  handleOperator('−');
  else if (k === '*')                  handleOperator('×');
  else if (k === '/') { e.preventDefault(); handleOperator('÷'); }
  else if (k === 'Enter' || k === '=') handleEquals();
  else if (k === 'Backspace')          handleDelete();
  else if (k === 'Escape')             handleClear();
  else if (k === '%')                  handlePercent();
});


/* ════════════════════════════════════════════════════════════
   FOCUS MODE — OPEN / CLOSE
════════════════════════════════════════════════════════════ */
function openNLPFocus() {
  document.body.classList.add('nlp-focus');
  nlpOverlay.removeAttribute('aria-hidden');
  nlpOverlay.setAttribute('aria-modal', 'true');
  // Inject intro if chat is empty
  if (nlpChat.children.length === 0) injectIntro();
  setTimeout(() => nlpTextarea.focus(), 480);
}

function closeNLPFocus() {
  document.body.classList.remove('nlp-focus');
  nlpOverlay.setAttribute('aria-hidden', 'true');
  nlpOverlay.removeAttribute('aria-modal');
}

nlpToggle.addEventListener('click', openNLPFocus);
nlpBackBtn.addEventListener('click', closeNLPFocus);

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.body.classList.contains('nlp-focus')) {
    closeNLPFocus();
  }
});

/* ════════════════════════════════════════════════════════════
   FORMATTERS
════════════════════════════════════════════════════════════ */
function formatRp(n) {
  if (typeof n !== 'number') return String(n);
  const abs = Math.abs(n);
  const s = Number.isInteger(abs)
    ? abs.toString()
    : parseFloat(abs.toPrecision(9)).toString();
  const parts = s.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'Rp\u00a0' + parts.join(',');
}

function formatNum(n) {
  if (typeof n !== 'number') return String(n);
  const abs = Math.abs(n);
  const s = Number.isInteger(abs)
    ? abs.toString()
    : parseFloat(abs.toPrecision(9)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}


/* ════════════════════════════════════════════════════════════
   ██████  UNIVERSAL NLP ENGINE  v4  ██████

   Hierarchy:
   1. detectSpecialPattern()   — dedicated parsers for well-known
        structures (discount, tax, fuel ratio, salary, per-person)
   2. parseGeneral()           — tokenise on operator keywords,
        evaluate left-to-right
   3. buildResponse()          — context-aware human-readable reply
════════════════════════════════════════════════════════════ */

/* ── Normalize: clean punctuation, Rp prefix, Indonesian thousands ── */
function normalizeText(raw) {
  let t = raw.toLowerCase().trim();

  // Indonesian thousands separator: "10.000" → "10000", "1.500.000" → "1500000"
  t = t.replace(/(\d)\.(\d{3})(?=\D|$)/g, '$1$2');
  t = t.replace(/(\d)\.(\d{3})(?=\D|$)/g, '$1$2'); // second pass for chained groups
  // Comma-as-thousands: "10,000" → "10000"
  t = t.replace(/(\d),(\d{3})(?=\D|$)/g, '$1$2');

  // Unit shorthands — MUST run BEFORE stripping dots so "1.5 juta" stays intact
  t = t.replace(/\brp\.?\s*/gi, '');
  // Support decimal multipliers: "1.5 juta" → 1500000, "2.5jt" → 2500000
  t = t.replace(/(\d+(?:\.\d+)?)\s*jt\b/g,   (_, n) => String(Math.round(parseFloat(n) * 1000000)));
  t = t.replace(/(\d+(?:\.\d+)?)\s*juta\b/g,  (_, n) => String(Math.round(parseFloat(n) * 1000000)));
  t = t.replace(/(\d+(?:\.\d+)?)\s*rb\b/g,    (_, n) => String(Math.round(parseFloat(n) * 1000)));
  t = t.replace(/(\d+(?:\.\d+)?)\s*ribu\b/g,  (_, n) => String(Math.round(parseFloat(n) * 1000)));
  t = t.replace(/(\d+(?:\.\d+)?)\s*k\b/g,     (_, n) => String(Math.round(parseFloat(n) * 1000)));

  // NOW safe to strip remaining dots and punctuation
  t = t
    .replace(/[-–—]/g, ' ')
    .replace(/[?!.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Re-glue compound keywords
  t = t.replace(/masing masing/g, 'masing-masing');
  t = t.replace(/rata rata/g, 'rata-rata');
  t = t.replace(/per orang/g, 'per-orang');
  t = t.replace(/tiap orang/g, 'tiap-orang');
  t = t.replace(/bagi rata/g, 'bagi-rata');
  t = t.replace(/per bulan/g, 'per-bulan');

  return t;
}

/* ── Grab every number token from a string ── */
function allNumbers(str) {
  const matches = str.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(',', '.')));
}

/* ── Indonesian word-to-number table ── */
const ID_WORDS = {
  nol:0, satu:1, dua:2, tiga:3, empat:4, lima:5,
  enam:6, tujuh:7, delapan:8, sembilan:9,
  sepuluh:10, sebelas:11,
  belas:10,        // "dua belas" handled below
  puluh:10,
  ratus:100, ribu:1000, juta:1000000, miliar:1000000000,
};

function idWordToNum(phrase) {
  phrase = phrase.trim().toLowerCase();
  if (!phrase) return NaN;
  const direct = parseFloat(phrase);
  if (!isNaN(direct)) return direct;

  const tokens = phrase.split(/\s+/);
  let total = 0, current = 0;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const lit = parseFloat(tok);
    if (!isNaN(lit)) { current += lit; continue; }

    if (tok === 'sepuluh')  { current += 10; continue; }
    if (tok === 'sebelas')  { current += 11; continue; }
    if (tok === 'seratus')  { current = (current || 1) * 100; continue; }
    if (tok === 'seribu')   { total += (current || 1) * 1000; current = 0; continue; }
    if (tok === 'sejuta')   { total += (current || 1) * 1e6;  current = 0; continue; }

    if (tok === 'belas') {
      if (current >= 1 && current <= 9) current += 10;
      continue;
    }

    const val = ID_WORDS[tok];
    if (val === undefined) return NaN;

    if (val === 100)      { current = (current || 1) * 100; }
    else if (val >= 1000) { total += (current || 1) * val; current = 0; }
    else if (val === 10)  { current = (current || 1) * 10; }
    else                  { current += val; }
  }
  return total + current;
}

/* ════════════════════════════════════════════════════════════
   SPECIAL PATTERN DETECTORS
   Each returns a structured object or null.
════════════════════════════════════════════════════════════ */

/* 1. DISCOUNT — "diskon X% dari Y" / "X persen dari Y" */
function detectDiscount(t) {
  // diskon + percentage + base price
  const re = /(?:diskon\s+)?(\d+(?:[.,]\d+)?)\s*(?:%|persen)\s+(?:dari|dr)?\s*(\d[\d]*)/i;
  const m = re.exec(t);
  if (!m) return null;
  const pct  = parseFloat(m[1]);
  const base = parseFloat(m[2]);
  if (isNaN(pct) || isNaN(base)) return null;
  const disc  = (pct / 100) * base;
  const after = base - disc;
  return { type: 'discount', pct, base, disc, after };
}

/* 2. TAX — "pajak X%" or "ppn X%" on a base price */
function detectTax(t) {
  // Guard: if there's also a discount keyword, let detectDiscountTax handle it
  if (/\bdiskon\b/i.test(t)) return null;

  // Pattern A: <base> [kena|...] pajak/ppn/tax <pct> [%|persen]
  // Handles: "pajak ppn", "ppn pajak", "pajak", "ppn", "tax", "bunga", "charge"
  // e.g. "450.000 kena pajak ppn 11 persen" | "50rb pajak 10%" | "100000 ppn 11%"
  const reA = /(\d+)\s+(?:kena\s+|ditambah\s+|plus\s+|terkena\s+|dengan\s+)?(?:pajak(?:\s+ppn)?|ppn(?:\s+pajak)?|tax|bunga|charge)\s+(\d+(?:[.,]\d+)?)(?:\s*(?:%|persen))?/i;

  // Pattern B: pajak/ppn/tax <pct>% dari <base>
  // e.g. "pajak 10% dari 50000"
  const reB = /(?:pajak(?:\s+ppn)?|ppn(?:\s+pajak)?|tax|bunga|charge)\s+(\d+(?:[.,]\d+)?)\s*(?:%|persen)\s+(?:dari|untuk|atas)?\s*(\d+)/i;

  let base, pct;

  const mA = reA.exec(t);
  if (mA) {
    base = parseFloat(mA[1]);
    pct  = parseFloat(mA[2]);
  } else {
    const mB = reB.exec(t);
    if (!mB) return null;
    pct  = parseFloat(mB[1]);
    base = parseFloat(mB[2]);
  }

  if (isNaN(base) || isNaN(pct) || pct <= 0) return null;
  // Tax ALWAYS adds to the total — never subtracts
  const taxAmt = (pct / 100) * base;
  const total  = base + taxAmt;   // e.g. 450.000 + 49.500 = 499.500
  return { type: 'tax', base, pct, taxAmt, total };
}

/* 3. DISCOUNT + TAX — "diskon X% dan pajak Y%" on a single price */
function detectDiscountTax(t) {
  const discRe = /(\d+(?:[.,]\d+)?)\s*(?:%|persen)\s+(?:dan|lalu)?\s*(?:pajak|ppn)\s*(\d+(?:[.,]\d+)?)\s*(?:%|persen)?/i;
  const m = discRe.exec(t);
  if (!m) return null;
  // Find the base price separately — first large number in the string
  const nums = allNumbers(t);
  const base = nums.find(n => n > 100) || null;
  if (!base) return null;
  const discPct = parseFloat(m[1]);
  const taxPct  = parseFloat(m[2]);
  if (isNaN(discPct) || isNaN(taxPct)) return null;
  const afterDisc = base - (discPct / 100) * base;
  const taxAmt    = (taxPct / 100) * afterDisc;
  const final     = afterDisc + taxAmt;
  return { type: 'discount_tax', base, discPct, taxPct, afterDisc, taxAmt, final };
}

/* 4. PERCENTAGE OF — "X% dari Y" (no discount keyword) */
function detectPercentOf(t) {
  const re = /(\d+(?:[.,]\d+)?)\s*(?:%|persen)\s+(?:dari|x|×)\s+(\d[\d]*)/i;
  const m = re.exec(t);
  if (!m) return null;
  const pct  = parseFloat(m[1]);
  const base = parseFloat(m[2]);
  if (isNaN(pct) || isNaN(base)) return null;
  return { type: 'percent_of', pct, base, result: (pct / 100) * base };
}

/* 5. FUEL RATIO — "X km butuh Y liter, kalau Z km berapa?" */
function detectFuelRatio(t) {
  const re = /(\d[\d.,]*)\s*(?:km|kilometer)?\s+(?:butuh|pakai|perlu|menggunakan|memakai)\s+(\d[\d.,]*)\s*(?:liter|l)\b.*?(\d[\d.,]*)\s*(?:km|kilometer)/i;
  const m = re.exec(t);
  if (!m) return null;
  const distBase   = parseFloat(m[1].replace(/\./g,''));
  const fuelBase   = parseFloat(m[2]);
  const distQuery  = parseFloat(m[3].replace(/\./g,''));
  if ([distBase, fuelBase, distQuery].some(isNaN)) return null;
  const fuelNeeded = (distQuery / distBase) * fuelBase;
  return { type: 'fuel_ratio', distBase, fuelBase, distQuery, fuelNeeded };
}

/* 6. SALARY / REMAINING — multiple deductions from a base amount */
function detectSalary(t) {
  if (!/\b(gaji|upah|penghasilan|pendapatan|income|tabungan|saldo|modal)\b/i.test(t)) return null;
  const nums = allNumbers(t);
  if (nums.length < 2) return null;
  // First number = base (gaji/saldo), subsequent numbers = deductions
  const base       = nums[0];
  const deductions = nums.slice(1);
  // Chained subtraction: base - ded1 - ded2 - ... (left-to-right)
  let remainder = base;
  for (const d of deductions) remainder -= d;
  const totalDed = deductions.reduce((a, b) => a + b, 0);
  return { type: 'salary', base, deductions, totalDed, remainder };
}

/* 7. PER PERSON — split a total among N people */
function detectPerPerson(t) {
  const re = /(?:dibagi(?:\s+rata)?|bagi(?:\s+rata)?|bagi-rata|split)\s+(?:untuk\s+|ke\s+|oleh\s+|sama\s+)?(\d+)\s*(?:orang|siswa|murid|anggota|peserta|teman|orang)/i;
  const m = re.exec(t);
  if (!m) return null;
  const people = parseInt(m[1]);
  if (!people || people === 0) return null;
  const nums   = allNumbers(t);
  const total  = nums.find(n => n > people); // biggest number is likely the total
  if (!total) return null;
  return { type: 'per_person', total, people, each: total / people };
}

/* 8. GENERIC MULTI-DEDUCTION — "A dikurangi B, C, D, sisa?" */
function detectMultiDeduct(t) {
  // Expanded trigger keywords for deduction context
  const hasDeductKeyword = /\b(dikurangi|kurang|minus|bayar|beli|cicilan|pengeluaran|berkurang|raib)\b/i.test(t);
  // Expanded trigger keywords for remainder context
  const hasRemainKeyword = /\b(sisa|kembalian|kembali|tersisa|habis|kurang)\b/i.test(t);

  if (!hasDeductKeyword && !hasRemainKeyword) return null;
  // Need at least a deduction keyword to avoid false positives from stray "sisa"
  if (!hasDeductKeyword) return null;

  const nums = allNumbers(t);
  if (nums.length < 2) return null;
  const base       = nums[0];
  const deductions = nums.slice(1);
  // Chained left-to-right subtraction
  let remainder = base;
  for (const d of deductions) remainder -= d;
  const totalDed = deductions.reduce((a, b) => a + b, 0);
  return { type: 'multi_deduct', base, deductions, totalDed, remainder };
}

/* ── Master special detector — tries all patterns, first wins ── */
function detectSpecialPattern(t) {
  // Order matters — more specific first
  return (
    detectDiscountTax(t) ||
    detectDiscount(t)    ||
    detectTax(t)         ||
    detectFuelRatio(t)   ||
    detectSalary(t)      ||
    detectPerPerson(t)   ||
    detectMultiDeduct(t) ||
    detectPercentOf(t)   ||
    null
  );
}

/* ════════════════════════════════════════════════════════════
   GENERAL TOKENISER
   Splits on Indonesian operator keywords → numbers + ops array
════════════════════════════════════════════════════════════ */
const OP_ENTRIES = [
  { kw:['ditambah dengan','ditambahkan dengan','ditambah','ditambahkan','tambah','plus','dan','lalu','kemudian','serta','bonus','tambahan','tips','charge'], op:'+' },
  { kw:['dikurangi dengan','dikurangkan dengan','dikurangi','dikurangkan','dikurang','kurang','minus','pengeluaran','cicilan','berkurang','raib'], op:'−' },
  { kw:['dikalikan dengan','dikalikan','dikali dengan','dikali','kali','masing-masing','tiap','setiap','per'], op:'×' },
  { kw:['dibagi dengan','dibagikan dengan','dibagi','dibagikan','bagi','rata-rata','bagi-rata','dibagi-rata'], op:'÷' },
];

const ALL_OPS = OP_ENTRIES
  .flatMap(e => e.kw.map(k => ({ kw: k, op: e.op })))
  .sort((a, b) => b.kw.length - a.kw.length);

function buildOpRegex() {
  const escaped = ALL_OPS.map(e =>
    e.kw.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&').replace(/\s+/g, '\\s+')
  );
  return new RegExp(`(${escaped.join('|')})`, 'gi');
}
const OP_REGEX = buildOpRegex();

function matchOp(str) {
  const s = str.trim().toLowerCase();
  return ALL_OPS.find(e =>
    new RegExp(
      `^${e.kw.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&').replace(/\s+/g, '\\s+')}$`, 'i'
    ).test(s)
  );
}

function extractNumbers(seg) {
  const result = [];
  const digits = [];
  let s = seg.replace(/\b\d+(?:[.,]\d+)?\b/g, m => {
    digits.push(parseFloat(m.replace(',', '.')));
    return `__N${digits.length - 1}__`;
  });

  const words = s.split(/\s+/);
  let i = 0;
  while (i < words.length) {
    const w  = words[i];
    const ph = w.match(/^__N(\d+)__$/);
    if (ph) { result.push(digits[+ph[1]]); i++; continue; }

    let best = NaN, bestLen = 0;
    for (let len = Math.min(5, words.length - i); len >= 1; len--) {
      const phrase = words.slice(i, i + len).join(' ')
        .replace(/__N(\d+)__/g, (_, idx) => digits[+idx]);
      const n = idWordToNum(phrase);
      if (!isNaN(n)) { best = n; bestLen = len; break; }
    }
    if (!isNaN(best)) { result.push(best); i += bestLen; }
    else i++;
  }
  return result;
}

function parseGeneral(text) {
  const segments = text.split(OP_REGEX).map(s => s.trim()).filter(Boolean);
  if (segments.length < 3) return null;

  const numbers = [], operators = [];
  for (const seg of segments) {
    const opMatch = matchOp(seg);
    if (opMatch) { operators.push(opMatch.op); continue; }
    const nums = extractNumbers(seg);
    if (nums.length === 0) continue;
    for (let i = 0; i < nums.length; i++) {
      numbers.push(nums[i]);
      if (i < nums.length - 1) operators.push('×');
    }
  }
  if (numbers.length < 2 || operators.length !== numbers.length - 1) return null;
  return { numbers, operators };
}

/* ── Master parser ── */
function parseIndonesian(rawText) {
  const text     = normalizeText(rawText);
  const special  = detectSpecialPattern(text);
  if (special) return { special, originalText: rawText, text };

  const general = parseGeneral(text);
  if (!general) return null;
  return { ...general, originalText: rawText, text };
}

/* ════════════════════════════════════════════════════════════
   CONVERSATIONAL INTENT ENGINE
   Runs BEFORE math NLP. Returns { reply } or null.
════════════════════════════════════════════════════════════ */
const CONV_INTENTS = [
  /* ── Greeting ── */
  {
    pattern: /\b(halo|hai|hi|hey|selamat\s*(pagi|siang|sore|malam)|hei|p+agi|assalamu|salam)\b/i,
    replies: [
      'Halo! Ada yang bisa saya bantu hitung hari ini? 😊',
      'Hai! Saya siap membantu perhitungan kamu.',
      'Halo! Ceritakan soal hitunganmu, saya siap membantu.',
    ],
  },
  /* ── Identity: siapa kamu / namamu ── */
  {
    pattern: /\b(siapa\s*(kamu|anda|namamu|dirimu|nama\s*kamu)|kamu\s*(siapa|apa)|nama\s*mu|namamu)\b/i,
    replies: [
      'Saya adalah <strong>Asisten Hitung</strong> — kalkulator pintar berbasis NLP yang bisa memahami soal cerita dalam bahasa Indonesia.',
      'Nama saya <strong>Asisten Hitung</strong>. Saya dirancang untuk membantu kamu menghitung dengan cara yang natural, cukup ceritakan soalnya!',
      'Saya <strong>Asisten Hitung</strong>, asisten kalkulator yang bisa memahami bahasa Indonesia secara natural.',
    ],
  },
  /* ── Capabilities ── */
  {
    pattern: /\b(apa\s*(yang\s*)?(bisa|dapat)\s*(kamu|anda|kau)\s*(lakukan|bantu|hitung)?|kamu\s*bisa\s*apa|fitur|kemampuan|fungsi\s*mu)\b/i,
    replies: [
      'Saya bisa membantu kamu menghitung:\n• 🏷️ <strong>Diskon</strong> — "diskon 20% dari 150.000"\n• 💰 <strong>Sisa gaji</strong> — "gaji 5 juta dikurangi kos 1.5 juta"\n• 🧾 <strong>Pajak/PPN</strong> — "harga 450rb kena pajak ppn 11%"\n• ⛽ <strong>Bensin</strong> — "10 km butuh 1 liter, kalau 50 km berapa?"\n• 👥 <strong>Bagi rata</strong> — "tagihan 300rb dibagi 4 orang"\n• ➕ <strong>Aritmatika umum</strong> dalam bahasa natural',
      'Kemampuan saya meliputi: menghitung diskon, pajak, sisa gaji, bagi rata, rasio bensin, dan berbagai soal cerita matematika dalam bahasa Indonesia. Cukup ketik soalnya secara natural!',
    ],
  },
  /* ── How to use ── */
  {
    pattern: /\b(cara\s*(pakai|menggunakan|menggunakannya|memakai)|bagaimana\s*(cara|caranya)|gimana\s*(cara)?|petunjuk|tutorial|contoh\s*soal)\b/i,
    replies: [
      'Mudah! Cukup ketik soalmu secara natural. Contoh:\n• "Beli baju 120rb diskon 25% jadi berapa?"\n• "Gaji 4 juta, bayar kos 800rb dan makan 600rb, sisa?"\n• "Harga 200.000 kena ppn 11 persen"\n• "Tagihan makan 450rb dibagi 3 orang"',
    ],
  },
  /* ── Thanks ── */
  {
    pattern: /\b(terima\s*kasih|makasih|thanks|thx|tq|mantap|keren|bagus|hebat|oke\s*banget|oke\s*deh)\b/i,
    replies: [
      'Sama-sama! Senang bisa membantu. Ada soal lain yang ingin dihitung?',
      'Dengan senang hati! Jangan ragu bertanya lagi ya.',
      'Terima kasih kembali! Ada yang lain yang perlu saya bantu?',
    ],
  },
  /* ── Who made you ── */
  {
    pattern: /\b(siapa\s*(yang\s*)?(buat|membuat|bikin|menciptakan|ciptakan|develop|rancang)|dibuat\s*(oleh|siapa)|pembuatmu|siapa\s*penciptamu)\b/i,
    replies: [
      'Saya dibuat sebagai proyek kalkulator pintar berbasis NLP untuk membantu perhitungan sehari-hari dalam bahasa Indonesia.',
    ],
  },
  /* ── Feelings / smalltalk ── */
  {
    pattern: /\b(apa\s*kabar|kabarmu|lagi\s*apa|kamu\s*(baik|sehat|oke)|how\s*are\s*you)\b/i,
    replies: [
      'Saya baik dan siap membantu! Kamu mau menghitung apa hari ini?',
      'Baik, siap membantu! Ada soal yang perlu diselesaikan?',
    ],
  },
  /* ── Goodbye ── */
  {
    pattern: /\b(dadah|bye|sampai\s*jumpa|selamat\s*tinggal|pamit|cabut|ciao)\b/i,
    replies: [
      'Sampai jumpa! Jangan ragu kembali kalau ada yang perlu dihitung. 👋',
      'Dadah! Semoga harimu menyenangkan. 😊',
    ],
  },
];

/**
 * detectConversation(raw)
 * Returns { reply: string } if input matches a conversational intent,
 * or null if it should be passed to math NLP.
 */
function detectConversation(raw) {
  const t = raw.toLowerCase().trim();

  // If the input has strong math signals, skip conversation entirely
  const hasMathSignal = /\d/.test(t) ||
    /\b(berapa|hitung|kalkulasi|diskon|pajak|ppn|gaji|sisa|bagi|dikurangi|ditambah|dikali|dibagi|persen|%|juta|ribu|rb|jt)\b/.test(t);

  // Only skip if it has math signals AND no conversational opener
  const hasConvOpener = /\b(halo|hai|siapa|apa|kamu|nama|bisa|terima|makasih|bye|dadah|kabar|cara)\b/.test(t);

  if (hasMathSignal && !hasConvOpener) return null;

  for (const intent of CONV_INTENTS) {
    if (intent.pattern.test(t)) {
      const pool = intent.replies;
      return { reply: pool[Math.floor(Math.random() * pool.length)] };
    }
  }

  // If no math signal and no matched intent → unknown question fallback
  if (!hasMathSignal) {
    return {
      reply: 'Maaf, saya belum memahami pertanyaan tersebut. Tapi saya siap membantu menghitung apa saja — coba ceritakan soal matematikamu! 😊',
    };
  }

  return null;
}

/* ── Evaluate ── */
function evaluateParsed(parsed) {
  if (parsed.special) {
    const sp = parsed.special;
    const map = {
      discount:      sp.after,
      tax:           sp.total,
      discount_tax:  sp.final,
      percent_of:    sp.result,
      fuel_ratio:    sp.fuelNeeded,
      salary:        sp.remainder,
      per_person:    sp.each,
      multi_deduct:  sp.remainder,
    };
    const val = map[sp.type];
    if (val === undefined) return { error: 'Tipe perhitungan tidak dikenali.' };
    return { value: val };
  }

  let acc = parsed.numbers[0];
  for (let i = 0; i < parsed.operators.length; i++) {
    const r = calculate(String(acc), String(parsed.numbers[i + 1]), parsed.operators[i]);
    if (r === 'Error') return { error: 'Pembagian dengan nol tidak bisa dilakukan.' };
    acc = r;
  }
  return { value: acc };
}

/* ── Expression string for display ── */
function buildExprStr(numbers, operators) {
  const parts = [];
  for (let i = 0; i < numbers.length; i++) {
    parts.push(formatNum(numbers[i]));
    if (i < operators.length) parts.push(operators[i]);
  }
  return parts.join(' ') + ' = ';
}

/* ════════════════════════════════════════════════════════════
   CONTEXT-AWARE RESPONSE BUILDER
   Returns { answer: string, steps: string[] }
════════════════════════════════════════════════════════════ */
function buildResponse(parsed, value) {
  const sp  = parsed.special;
  const txt = (parsed.originalText || '').toLowerCase();

  /* ── Special type responses ── */
  if (sp) {
    switch (sp.type) {

      case 'discount':
        return {
          answer: `Harga setelah diskon ${sp.pct}% adalah ${formatRp(sp.after)}`,
          steps: [
            `Harga awal          : ${formatRp(sp.base)}`,
            `Diskon ${sp.pct}%         : − ${formatRp(sp.disc)}`,
            `─────────────────────────`,
            `Harga akhir         : ${formatRp(sp.after)}`,
          ],
        };

      case 'tax':
        return {
          answer: `Total harga setelah pajak ${sp.pct}% adalah ${formatRp(sp.total)}`,
          steps: [
            `Harga awal          : ${formatRp(sp.base)}`,
            `Pajak ${sp.pct}%          : + ${formatRp(sp.taxAmt)}`,
            `─────────────────────────`,
            `Total               : ${formatRp(sp.total)}`,
          ],
        };

      case 'discount_tax':
        return {
          answer: `Harga akhir setelah diskon ${sp.discPct}% dan pajak ${sp.taxPct}% adalah ${formatRp(sp.final)}`,
          steps: [
            `Harga awal          : ${formatRp(sp.base)}`,
            `Diskon ${sp.discPct}%         : − ${formatRp(sp.base - sp.afterDisc)}`,
            `Setelah diskon      : ${formatRp(sp.afterDisc)}`,
            `Pajak ${sp.taxPct}%          : + ${formatRp(sp.taxAmt)}`,
            `─────────────────────────`,
            `Harga akhir         : ${formatRp(sp.final)}`,
          ],
        };

      case 'percent_of':
        return {
          answer: `${sp.pct}% dari ${formatRp(sp.base)} adalah ${formatRp(sp.result)}`,
          steps: [
            `${sp.pct} ÷ 100 × ${formatNum(sp.base)} = ${formatNum(sp.result)}`,
          ],
        };

      case 'fuel_ratio': {
        const km = formatNum(sp.distQuery);
        const lt = parseFloat(sp.fuelNeeded.toPrecision(4));
        return {
          answer: `Untuk menempuh ${km} km, bensin yang dibutuhkan adalah ${lt} liter`,
          steps: [
            `Rasio efisiensi     : ${formatNum(sp.distBase)} km / ${sp.fuelBase} liter`,
            `Konsumsi per km     : ${parseFloat((sp.fuelBase / sp.distBase).toPrecision(4))} liter/km`,
            `─────────────────────────`,
            `${km} km × ${parseFloat((sp.fuelBase / sp.distBase).toPrecision(4))} = ${lt} liter`,
          ],
        };
      }

      case 'salary': {
        const deducStr = sp.deductions.map(d => `  − ${formatRp(d)}`).join('\n');
        return {
          answer: sp.remainder >= 0
            ? `Sisa uang setelah pengeluaran adalah ${formatRp(sp.remainder)}`
            : `Pengeluaran melebihi pemasukan sebesar ${formatRp(Math.abs(sp.remainder))}`,
          steps: [
            `Pemasukan           : ${formatRp(sp.base)}`,
            ...sp.deductions.map(d => `Pengeluaran         : − ${formatRp(d)}`),
            `─────────────────────────`,
            `Sisa                : ${formatRp(sp.remainder)}`,
          ],
        };
      }

      case 'per_person':
        return {
          answer: `Setiap orang membayar ${formatRp(sp.each)}`,
          steps: [
            `Total tagihan       : ${formatRp(sp.total)}`,
            `Jumlah orang        : ${sp.people} orang`,
            `─────────────────────────`,
            `Per orang           : ${formatRp(sp.each)}`,
          ],
        };

      case 'multi_deduct':
        return {
          answer: sp.remainder >= 0
            ? `Sisa setelah semua pengurangan adalah ${formatRp(sp.remainder)}`
            : `Kekurangan sebesar ${formatRp(Math.abs(sp.remainder))}`,
          steps: [
            `Nilai awal          : ${formatRp(sp.base)}`,
            ...sp.deductions.map(d => `Dikurangi           : − ${formatRp(d)}`),
            `─────────────────────────`,
            `Sisa                : ${formatRp(sp.remainder)}`,
          ],
        };
    }
  }

  /* ── General expression responses ── */
  const { numbers, operators } = parsed;
  const exprStr = buildExprStr(numbers, operators);
  const valFmt  = formatNum(value);
  const rpFmt   = formatRp(value);
  const neg     = value < 0;
  const steps   = [`${exprStr}${valFmt}`];

  if (/\b(beli|membeli|belanja|bayar|harga|toko|baju|sepatu|tas|barang|produk|cicilan|pengeluaran)\b/.test(txt))
    return { answer: `Total yang harus dibayar adalah ${rpFmt}`, steps };

  if (/\b(sisa|kembalian|kembali|uang sisa|sisa uang)\b/.test(txt))
    return {
      answer: neg
        ? `Uangmu kurang ${formatRp(Math.abs(value))}`
        : `Sisa uangmu adalah ${rpFmt}`,
      steps,
    };

  if (/\b(uang|duit|tabungan|gaji|modal|untung|rugi|profit|laba)\b/.test(txt))
    return { answer: `Hasilnya adalah ${rpFmt}`, steps };

  if (/\b(orang|siswa|murid|anggota|peserta|tiap-orang|per-orang)\b/.test(txt))
    return { answer: `Setiap orang mendapat ${rpFmt}`, steps };

  if (/\b(km|kilometer|meter|jarak|perjalanan|tempuh)\b/.test(txt))
    return { answer: `Total jarak yang ditempuh adalah ${formatNum(value)} km`, steps };

  if (/\b(liter|bensin|bbm|bahan bakar|solar|premium|konsumsi)\b/.test(txt))
    return { answer: `Jumlah yang dibutuhkan adalah ${formatNum(value)} liter`, steps };

  if (/\b(kg|gram|kilogram|ton|berat)\b/.test(txt))
    return { answer: `Total beratnya adalah ${formatNum(value)} kg`, steps };

  if (/\b(nilai|skor|poin|angka|ujian|rapor)\b/.test(txt))
    return { answer: `Total nilainya adalah ${formatNum(value)}`, steps };

  return { answer: `Hasil perhitungannya adalah ${valFmt}`, steps };
}


/* ════════════════════════════════════════════════════════════
   CHAT UI HELPERS
════════════════════════════════════════════════════════════ */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scrollChatBottom() {
  requestAnimationFrame(() => { nlpChat.scrollTop = nlpChat.scrollHeight; });
}

function addBubble(cls, html) {
  const div = document.createElement('div');
  div.className = 'nlp-bubble ' + cls;
  div.innerHTML = html;
  nlpChat.appendChild(div);
  scrollChatBottom();
  return div;
}

function injectIntro() {
  addBubble('nlp-bubble--bot nlp-bubble--intro',
    `<p>Halo! Saya siap bantu kamu menghitung dalam bahasa Indonesia. ✦</p>
     <p>Ceritakan soalmu secara natural — saya mengerti berbagai konteks: belanja, gaji, bensin, diskon, pajak, dan bagi rata.</p>`
  );
}

function addUserBubble(text) {
  addBubble('nlp-bubble--user', escapeHtml(text));
}

function addThinkingBubble() {
  return addBubble('nlp-bubble--bot nlp-bubble--thinking',
    `<div class="nlp-dots"><span></span><span></span><span></span></div>`);
}

function addResultBubble(answer, steps) {
  const highlighted = answer.replace(
    /(Rp[\u00a0\s]?[\d.,]+|[\d.,]+ (?:km|liter|kg|gram|orang))/g,
    '<span class="nlp-highlight">$1</span>'
  );
  const stepsHtml = steps && steps.length
    ? `<div class="nlp-result-steps">${steps.map(s => escapeHtml(s)).join('<br>')}</div>`
    : '';
  addBubble('nlp-bubble--bot',
    `<div class="nlp-result-answer">${highlighted}</div>${stepsHtml}`
  );
}

function addErrorBubble(msg, hint) {
  addBubble('nlp-bubble--bot nlp-bubble--error',
    `⚠ ${escapeHtml(msg)}` +
    (hint ? `<span class="nlp-error-hint">${escapeHtml(hint)}</span>` : '')
  );
}

function addConvBubble(html) {
  addBubble('nlp-bubble--bot nlp-bubble--conv', html);
}

/* ── Clear chat ── */
nlpClearChatBtn.addEventListener('click', () => {
  nlpChat.innerHTML = '';
  injectIntro();
});


/* ════════════════════════════════════════════════════════════
   MAIN NLP HANDLER
════════════════════════════════════════════════════════════ */
let nlpBusy = false;

function handleNLP() {
  if (nlpBusy) return;
  const raw = nlpTextarea.value.trim();
  if (!raw) { nlpTextarea.focus(); return; }

  addUserBubble(raw);
  nlpTextarea.value = '';
  nlpTextarea.style.height = 'auto';
  nlpBusy = true;
  nlpSendBtn.disabled = true;

  const thinkBubble = addThinkingBubble();
  const delay = 650 + Math.random() * 400;

  setTimeout(() => {
    thinkBubble.remove();

    // ── STEP 1: Check for conversational intent FIRST ──
    const conv = detectConversation(raw);
    if (conv) {
      addConvBubble(conv.reply);
      nlpBusy = false; nlpSendBtn.disabled = false;
      scrollChatBottom();
      return;
    }

    // ── STEP 2: Fall through to math NLP ──
    const parsed = parseIndonesian(raw);

    if (!parsed) {
      addErrorBubble(
        'Maaf, saya tidak bisa memahami soal itu.',
        'Coba: "diskon 20% dari 150.000" atau "gaji 5 juta dikurangi kos 1.5 juta sisa berapa"'
      );
      nlpBusy = false; nlpSendBtn.disabled = false;
      return;
    }

    const { value, error } = evaluateParsed(parsed);
    if (error) {
      addErrorBubble(error);
      nlpBusy = false; nlpSendBtn.disabled = false;
      return;
    }

    const { answer, steps } = buildResponse(parsed, value);
    addResultBubble(answer, steps);

    // Push result into calculator display
    const rs = trimResult(value);
    state.current    = rs;
    state.previous   = null;
    state.operator   = null;
    state.waitingOp  = false;
    state.justEvaled = true;
    if (parsed.numbers) {
      displayExpr.textContent = buildExprStr(parsed.numbers, parsed.operators) + rs;
    }
    updateDisplay(rs); setActiveOp(null); syncAC();

    nlpBusy = false; nlpSendBtn.disabled = false;
    scrollChatBottom();
  }, delay);
}

nlpSendBtn.addEventListener('click', handleNLP);

nlpTextarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNLP(); }
});

nlpTextarea.addEventListener('input', () => {
  nlpTextarea.style.height = 'auto';
  nlpTextarea.style.height = Math.min(nlpTextarea.scrollHeight, 140) + 'px';
});

/* ── Example chips: click to fill textarea ── */
document.querySelectorAll('.nlp-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    nlpTextarea.value = chip.dataset.eg || chip.textContent.replace(/^[^ ]+ /, '');
    nlpTextarea.dispatchEvent(new Event('input'));
    nlpTextarea.focus();
  });
});


/* ════════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════════ */
updateDisplay('0', '');
syncAC();
