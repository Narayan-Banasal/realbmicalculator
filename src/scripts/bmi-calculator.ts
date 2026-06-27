import {
  calcBmiMetric,
  calcBmiUs,
  calcBmiStone,
  categorize,
  cmToFeetIn,
  feetInToCm,
  healthyWeightRangeKg,
  kgToLb,
  kgToStone,
  lbToKg,
  stoneToKg,
  markerPosition,
  type UnitSystem,
} from '../lib/bmi';

import { initBodyViz, updateBodyViz } from './body-viz';

const STORAGE_UNITS   = 'rbmi-units';
const STORAGE_HISTORY = 'rbmi-history';

// ── i18n string bridge ─────────────────────────────────────────────────────
// Set by the inline script in BmiCalculator.astro before this module loads.
interface BmiI18n {
  healthy_range: string; healthy_wt: string; ideal: string; prime: string;
  screening: string; copy: string; copied: string; share_x: string; share_wa: string;
  waist_low: string; waist_mod: string; waist_high: string; waist_risk_report: string;
}
declare global { interface Window { __BMI_I18N?: BmiI18n; } }
function str(key: keyof BmiI18n, fallback: string): string {
  return window.__BMI_I18N?.[key] ?? fallback;
}

// ── History ────────────────────────────────────────────────────────────────
interface HistoryEntry { bmi: number; label: string; ts: number; }

function saveHistory(bmi: number, label: string) {
  let h: HistoryEntry[] = [];
  try { h = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); } catch { /* ignore */ }
  h.unshift({ bmi: parseFloat(bmi.toFixed(1)), label, ts: Date.now() });
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(h.slice(0, 5)));
}

function renderHistory(container: HTMLElement) {
  let h: HistoryEntry[] = [];
  try { h = JSON.parse(localStorage.getItem(STORAGE_HISTORY) || '[]'); } catch { /* ignore */ }
  if (!h.length) { container.classList.add('hidden'); return; }
  container.classList.remove('hidden');
  container.querySelector('[data-history-list]')!.innerHTML = h.map((e) => {
    const date = new Date(e.ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `<li class="flex justify-between text-xs py-1 border-b border-(--color-hairline)/50 last:border-0">
      <span class="text-(--color-mute)">${date}</span>
      <span class="font-semibold tabular-nums text-(--color-ink)">${e.bmi}</span>
      <span class="text-(--color-body)">${e.label}</span>
    </li>`;
  }).join('');
}

// ── Body fat estimate (Deurenberg formula) ─────────────────────────────────
// BF% = (1.20 × BMI) + (0.23 × age) − (10.8 × sex) − 5.4 (sex: male=1, female=0)
function estimateBodyFat(bmi: number, age: number, isMale: boolean): number {
  return (1.20 * bmi) + (0.23 * age) - (10.8 * (isMale ? 1 : 0)) - 5.4;
}

// ── Waist risk (Waist-to-Height Ratio NICE guidelines) ──────────────────────
function waistRisk(waistCm: number, heightCm: number): 'low' | 'moderate' | 'high' {
  if (!heightCm || heightCm <= 0) return 'low';
  const ratio = waistCm / heightCm;
  if (ratio < 0.5) return 'low';
  if (ratio < 0.6) return 'moderate';
  return 'high';
}

export function initBmiCalculator() {
  const root = document.getElementById('bmi-calculator');
  if (!root) return;

  let units: UnitSystem = (localStorage.getItem(STORAGE_UNITS) as UnitSystem) || 'metric';

  const els = {
    metricPanel:    document.getElementById('height-metric')!,
    usPanel:        document.getElementById('height-us')!,
    stonePanel:     document.getElementById('height-stone')!,
    resultPanel:    document.getElementById('result-panel')!,
    bmiValue:       document.getElementById('bmi-value')!,
    bmiCategory:    document.getElementById('bmi-category')!,
    bmiMarker:      document.getElementById('bmi-marker')!,
    resultDetails:  document.getElementById('result-details')!,
    displayHeight:  document.getElementById('display-height')!,
    displayWeight:  document.getElementById('display-weight')!,
    bodyCanvas:     document.getElementById('body-canvas') as HTMLCanvasElement,
    bodyStatus:     document.getElementById('body-status')!,
    historyPanel:   document.getElementById('history-panel'),
    sharePanel:     document.getElementById('share-panel'),
    bfPanel:        document.getElementById('bf-panel'),
    bfValue:        document.getElementById('bf-value'),
    waistInput:     document.getElementById('waist-cm') as HTMLInputElement | null,
    waistRiskEl:    document.getElementById('waist-risk'),
    // Metric
    heightCm:       document.getElementById('height-cm')       as HTMLInputElement,
    heightCmRange:  document.getElementById('height-cm-range') as HTMLInputElement,
    weightKg:       document.getElementById('weight-kg')       as HTMLInputElement,
    weightKgRange:  document.getElementById('weight-kg-range') as HTMLInputElement,
    // US (lb)
    heightFt:       document.getElementById('height-ft')       as HTMLInputElement,
    heightFtRange:  document.getElementById('height-ft-range') as HTMLInputElement,
    heightIn:       document.getElementById('height-in')       as HTMLInputElement,
    heightInRange:  document.getElementById('height-in-range') as HTMLInputElement,
    weightLb:       document.getElementById('weight-lb')       as HTMLInputElement,
    weightLbRange:  document.getElementById('weight-lb-range') as HTMLInputElement,
    // Stone
    heightFtSt:       document.getElementById('height-ft-st')       as HTMLInputElement,
    heightFtStRange:  document.getElementById('height-ft-st-range') as HTMLInputElement,
    heightInSt:       document.getElementById('height-in-st')       as HTMLInputElement,
    heightInStRange:  document.getElementById('height-in-st-range') as HTMLInputElement,
    weightSt:         document.getElementById('weight-st')          as HTMLInputElement,
    weightStRange:    document.getElementById('weight-st-range')    as HTMLInputElement,
    weightStLb:       document.getElementById('weight-stlb')        as HTMLInputElement,
    weightStLbRange:  document.getElementById('weight-stlb-range')  as HTMLInputElement,
  };

  if (els.bodyCanvas) initBodyViz(els.bodyCanvas);

  // ── Slider sync helpers ───────────────────────────────────────────────────
  function syncPair(range: HTMLInputElement, number: HTMLInputElement, decimals = 0) {
    const v = parseFloat(range.value);
    number.value = decimals ? v.toFixed(decimals) : String(Math.round(v));
  }
  function syncFromNumber(range: HTMLInputElement, number: HTMLInputElement) {
    const v = parseFloat(number.value);
    if (!isNaN(v)) range.value = String(v);
  }
  function bindSlider(range: HTMLInputElement, number: HTMLInputElement, decimals = 0) {
    range.addEventListener('input', () => { syncPair(range, number, decimals); updateViz(); calc(); });
    number.addEventListener('input', () => { syncFromNumber(range, number); updateViz(); calc(); });
  }

  bindSlider(els.heightCmRange, els.heightCm);
  bindSlider(els.weightKgRange, els.weightKg, 1);
  bindSlider(els.heightFtRange, els.heightFt);
  bindSlider(els.heightInRange, els.heightIn);
  bindSlider(els.weightLbRange, els.weightLb, 1);
  bindSlider(els.heightFtStRange, els.heightFtSt);
  bindSlider(els.heightInStRange, els.heightInSt);
  bindSlider(els.weightStRange, els.weightSt);
  bindSlider(els.weightStLbRange, els.weightStLb);

  // ── Nudge buttons ─────────────────────────────────────────────────────────
  function nudge(id: string, delta: number) {
    const input = document.getElementById(id) as HTMLInputElement;
    const range = document.getElementById(`${id}-range`) as HTMLInputElement | null;
    const stepStr = input.step || '';
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    const min   = parseFloat(input.min)  || 0;
    const max   = parseFloat(input.max)  || 9999;
    let v = (parseFloat(input.value) || 0) + delta;
    v = Math.min(max, Math.max(min, v));
    input.value = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
    if (range) range.value = input.value;
    updateViz();
    calc();
  }

  root.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach((btn) => {
    btn.addEventListener('click', () => nudge(btn.dataset.nudge!, parseFloat(btn.dataset.delta!)));
  });

  // ── Presets ───────────────────────────────────────────────────────────────
  const presets: Record<string, { cm: number; kg: number; ft: number; inch: number; lb: number }> = {
    average: { cm: 170, kg: 70,  ft: 5, inch: 10, lb: 160 },
    athlete: { cm: 178, kg: 82,  ft: 5, inch: 10, lb: 181 },
  };

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = presets[btn.dataset.preset!];
      if (!p) return;
      els.heightCm.value       = String(p.cm);
      els.heightCmRange.value  = String(p.cm);
      els.weightKg.value       = String(p.kg);
      els.weightKgRange.value  = String(p.kg);
      els.heightFt.value       = String(p.ft);
      els.heightFtRange.value  = String(p.ft);
      els.heightIn.value       = String(p.inch);
      els.heightInRange.value  = String(p.inch);
      els.weightLb.value       = String(p.lb);
      els.weightLbRange.value  = String(p.lb);
      // sync stone panel too
      const st = kgToStone(p.kg);
      els.heightFtSt.value     = String(p.ft);
      els.heightInSt.value     = String(p.inch);
      els.weightSt.value       = String(st.stone);
      els.weightStLb.value     = String(st.lb);
      if (els.waistInput) {
        const isFemale = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null)?.value === 'female';
        if (btn.dataset.preset === 'average') {
          els.waistInput.value = isFemale ? '75' : '85';
        } else if (btn.dataset.preset === 'athlete') {
          els.waistInput.value = isFemale ? '72' : '82';
        }
      }
      updateViz();
      calc();
    });
  });

  // ── Gender / age listeners ────────────────────────────────────────────────
  const ageInp = document.getElementById('age') as HTMLInputElement | null;
  if (ageInp) ageInp.addEventListener('input', () => {
    if (!els.resultPanel.classList.contains('hidden')) calc();
  });
  document.querySelectorAll('input[name="gender"]').forEach((r) => {
    r.addEventListener('change', () => { updateViz(); if (!els.resultPanel.classList.contains('hidden')) calc(); });
  });

  // ── Waist input listener ──────────────────────────────────────────────────
  if (els.waistInput) {
    let lastValue = els.waistInput.value;
    els.waistInput.addEventListener('input', () => {
      const currentValue = els.waistInput.value;
      if (!lastValue && currentValue === els.waistInput.min) {
        // If it was empty and jumped to min (40) via spinner/arrow click, set to placeholder default
        const isFemale = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null)?.value === 'female';
        els.waistInput.value = isFemale ? '75' : '85';
      }
      lastValue = els.waistInput.value;
      updateViz();
      if (!els.resultPanel.classList.contains('hidden')) calc();
    });
  }

  // ── Unit switching (3-state) ──────────────────────────────────────────────
  function getHeightCm(): number {
    if (units === 'metric') return parseFloat(els.heightCm.value) || 170;
    if (units === 'us')     return feetInToCm(parseFloat(els.heightFt.value) || 5, parseFloat(els.heightIn.value) || 10);
    return feetInToCm(parseFloat(els.heightFtSt.value) || 5, parseFloat(els.heightInSt.value) || 10);
  }
  function getWeightKg(): number {
    if (units === 'metric') return parseFloat(els.weightKg.value) || 70;
    if (units === 'us')     return lbToKg(parseFloat(els.weightLb.value) || 160);
    return stoneToKg(parseFloat(els.weightSt.value) || 11, parseFloat(els.weightStLb.value) || 0);
  }

  function setUnits(u: UnitSystem) {
    // Convert current values to new unit system
    const prevCm = getHeightCm();
    const prevKg = getWeightKg();

    units = u;
    localStorage.setItem(STORAGE_UNITS, u);

    // Populate new panel's inputs
    if (u === 'metric') {
      els.heightCm.value = els.heightCmRange.value = String(Math.round(prevCm));
      els.weightKg.value = els.weightKgRange.value = prevKg.toFixed(1);
    } else if (u === 'us') {
      const { ft, inch } = cmToFeetIn(prevCm);
      els.heightFt.value = els.heightFtRange.value = String(ft);
      els.heightIn.value = els.heightInRange.value = String(inch);
      const lb = kgToLb(prevKg);
      els.weightLb.value = els.weightLbRange.value = lb.toFixed(1);
    } else {
      const { ft, inch } = cmToFeetIn(prevCm);
      els.heightFtSt.value = els.heightFtStRange.value = String(ft);
      els.heightInSt.value = els.heightInStRange.value = String(inch);
      const { stone, lb } = kgToStone(prevKg);
      els.weightSt.value   = els.weightStRange.value   = String(stone);
      els.weightStLb.value = els.weightStLbRange.value = String(lb);
    }

    // Show/hide panels
    els.metricPanel.classList.toggle('hidden', u !== 'metric');
    els.usPanel.classList.toggle('hidden',     u !== 'us');
    els.stonePanel.classList.toggle('hidden',  u !== 'stone');

    // Update tab buttons
    document.querySelectorAll<HTMLButtonElement>('.unit-tab').forEach((btn) => {
      const active = btn.dataset.unit === u;
      btn.setAttribute('aria-pressed', String(active));
    });

    document.dispatchEvent(new CustomEvent('rbmi:units', { detail: { units: u } }));
    updateViz();
    calc();
  }

  // Bind 3-state unit tabs
  document.querySelectorAll<HTMLButtonElement>('.unit-tab').forEach((btn) => {
    btn.addEventListener('click', () => setUnits(btn.dataset.unit as UnitSystem));
  });

  // ── Display sync ──────────────────────────────────────────────────────────
  function updateDisplays(bmi: number | null) {
    const cm = getHeightCm();
    const kg = getWeightKg();
    if (units === 'metric') {
      els.displayHeight.textContent = `${Math.round(cm)} cm`;
      els.displayWeight.textContent = `${kg.toFixed(1)} kg · ${kgToLb(kg).toFixed(1)} lb`;
    } else if (units === 'us') {
      const ft   = parseFloat(els.heightFt.value) || 0;
      const inch = parseFloat(els.heightIn.value) || 0;
      const lb   = parseFloat(els.weightLb.value) || 0;
      els.displayHeight.textContent = `${ft}'${inch}"`;
      els.displayWeight.textContent = `${lb} lb · ${lbToKg(lb).toFixed(1)} kg`;
    } else {
      const st  = parseFloat(els.weightSt.value) || 0;
      const stlb = parseFloat(els.weightStLb.value) || 0;
      const ft   = parseFloat(els.heightFtSt.value) || 0;
      const inch = parseFloat(els.heightInSt.value) || 0;
      els.displayHeight.textContent = `${ft}'${inch}"`;
      els.displayWeight.textContent = `${st}st ${stlb}lb · ${kg.toFixed(1)} kg`;
    }
    if (bmi != null) {
      document.dispatchEvent(new CustomEvent('rbmi:result', { detail: { bmi, category: categorize(bmi) } }));
    }
  }

  // ── Body viz update ───────────────────────────────────────────────────────
  function updateViz() {
    const gEl    = document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null;
    const gender = (gEl?.value || 'male') as 'male' | 'female';
    const cm     = getHeightCm();
    const kg     = getWeightKg();
    const bmi    = cm > 0 ? kg / ((cm / 100) ** 2) : 22;
    const waistCm = els.waistInput ? (parseFloat(els.waistInput.value) || 0) : 0;
    updateBodyViz({ gender, bmi, heightCm: cm, waistCm });
    if (els.bodyStatus) {
      const cat = categorize(bmi);
      els.bodyStatus.textContent = `${cat.label} · BMI ${bmi.toFixed(1)}`;
    }
  }

  // ── Calc ──────────────────────────────────────────────────────────────────
  function calc() {
    let result: { bmi: number; heightM: number } | null = null;

    if (units === 'metric') {
      result = calcBmiMetric(parseFloat(els.heightCm.value), parseFloat(els.weightKg.value));
    } else if (units === 'us') {
      result = calcBmiUs(
        parseFloat(els.heightFt.value) || 0,
        parseFloat(els.heightIn.value) || 0,
        parseFloat(els.weightLb.value),
      );
    } else {
      result = calcBmiStone(
        parseFloat(els.heightFtSt.value) || 0,
        parseFloat(els.heightInSt.value) || 0,
        parseFloat(els.weightSt.value)   || 0,
        parseFloat(els.weightStLb.value) || 0,
      );
    }

    updateDisplays(result?.bmi ?? null);

    if (!result || !isFinite(result.bmi)) {
      els.resultPanel.classList.add('hidden');
      return;
    }

    const { bmi, heightM } = result;
    const cat = categorize(bmi);
    els.resultPanel.classList.remove('hidden');
    els.bmiValue.textContent    = bmi.toFixed(1);
    els.bmiCategory.textContent = cat.label;
    els.bmiCategory.style.backgroundColor = cat.color;
    els.bmiMarker.style.left    = `${markerPosition(bmi)}%`;

    const range = healthyWeightRangeKg(heightM);
    const prime = (bmi / 25).toFixed(2);

    // Ideal weight — Devine formula
    const gEl    = document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null;
    const isMale = gEl?.value !== 'female';
    const heightInTotal = heightM * 39.3701;
    const inchOver5ft   = Math.max(0, heightInTotal - 60);
    const idealKg       = (isMale ? 50 : 45.5) + 2.3 * inchOver5ft;

    const wtLabel = (lo: number, hi: number) => units === 'metric'
      ? `${lo.toFixed(1)} – ${hi.toFixed(1)} kg`
      : units === 'us'
      ? `${kgToLb(lo).toFixed(1)} – ${kgToLb(hi).toFixed(1)} lb`
      : (() => { const a = kgToStone(lo); const b = kgToStone(hi); return `${a.stone}st ${a.lb}lb – ${b.stone}st ${b.lb}lb`; })();

    // ── Waist circumference risk ──────────────────────────────────────────
    const waistCm = parseFloat(els.waistInput?.value ?? '');
    let waistLine = '';
    if (els.waistRiskEl && !isNaN(waistCm) && waistCm > 0) {
      const cm = getHeightCm();
      const risk = waistRisk(waistCm, cm);
      const riskLabel = str(
        risk === 'low' ? 'waist_low' : risk === 'moderate' ? 'waist_mod' : 'waist_high',
        risk
      );
      els.waistRiskEl.textContent = riskLabel;
      waistLine = `${str('waist_risk_report', 'Waist risk')}: ${riskLabel}`;
    } else if (els.waistRiskEl) {
      els.waistRiskEl.textContent = '';
    }

    const lines = [
      str('healthy_range', 'Healthy BMI range: 18.5 – 24.9 kg/m²'),
      `${str('healthy_wt', 'Healthy weight for your height')}: ${wtLabel(range.lo, range.hi)}`,
      `${str('ideal', 'Ideal weight (Devine formula)')}: ${wtLabel(idealKg - 2, idealKg + 2)}`,
      ...(waistLine ? [waistLine] : []),
      `${str('prime', 'BMI Prime')}: ${prime}`,
      str('screening', 'BMI is a screening tool — muscle mass and body composition still matter'),
    ];
    els.resultDetails.innerHTML = lines.map((t) => `<li>${t}</li>`).join('');

    // ── Body fat estimate ────────────────────────────────────────────────────
    const ageInp = document.getElementById('age') as HTMLInputElement | null;
    const age    = parseFloat(ageInp?.value ?? '');
    if (els.bfPanel && els.bfValue && !isNaN(age) && age >= 2 && age <= 120) {
      const bf = estimateBodyFat(bmi, age, isMale);
      els.bfValue.textContent = `${Math.max(0, bf).toFixed(1)}%`;
      els.bfPanel.classList.remove('hidden');
    } else if (els.bfPanel) {
      els.bfPanel.classList.add('hidden');
    }

    // Save history
    saveHistory(bmi, cat.shortLabel);
    if (els.historyPanel) renderHistory(els.historyPanel);

    // Update share panel
    if (els.sharePanel) {
      const shareUrl  = buildShareUrl();
      const shareText = `My BMI is ${bmi.toFixed(1)} (${cat.label}) — check yours:`;
      const twitterBtn = document.getElementById('share-twitter') as HTMLAnchorElement | null;
      const waBtn      = document.getElementById('share-whatsapp') as HTMLAnchorElement | null;
      if (twitterBtn) twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      if (waBtn)      waBtn.href      = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
      els.sharePanel.classList.remove('hidden');
    }
  }

  // ── Share / copy ──────────────────────────────────────────────────────────
  function buildShareUrl() {
    const params = new URLSearchParams({ units });
    if (units === 'metric') {
      params.set('cm', els.heightCm.value);
      params.set('kg', els.weightKg.value);
    } else if (units === 'us') {
      params.set('ft', els.heightFt.value);
      params.set('in', els.heightIn.value);
      params.set('lb', els.weightLb.value);
    } else {
      params.set('ft', els.heightFtSt.value);
      params.set('in', els.heightInSt.value);
      params.set('st', els.weightSt.value);
      params.set('stlb', els.weightStLb.value);
    }
    return `${location.origin}${location.pathname}?${params}`;
  }

  document.getElementById('copy-result')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(buildShareUrl());
    const btn = document.getElementById('copy-result')!;
    const orig = btn.textContent;
    btn.textContent = str('copied', '✓ Copied!');
    setTimeout(() => { btn.textContent = orig; }, 1800);
  });

  document.getElementById('print-result')?.addEventListener('click', () => {
    window.print();
  });

  // ── URL params restore ─────────────────────────────────────────────────────
  const p = new URLSearchParams(location.search);
  if (p.get('units') === 'us' || p.get('units') === 'stone') units = p.get('units') as UnitSystem;
  if (p.get('cm'))   { els.heightCm.value    = p.get('cm')!;   els.heightCmRange.value   = p.get('cm')!; }
  if (p.get('kg'))   { els.weightKg.value    = p.get('kg')!;   els.weightKgRange.value   = p.get('kg')!; }
  if (p.get('ft'))   { els.heightFt.value    = p.get('ft')!;   els.heightFtRange.value   = p.get('ft')!; }
  if (p.get('in'))   { els.heightIn.value    = p.get('in')!;   els.heightInRange.value   = p.get('in')!; }
  if (p.get('lb'))   { els.weightLb.value    = p.get('lb')!;   els.weightLbRange.value   = p.get('lb')!; }
  if (p.get('st'))   { els.weightSt.value    = p.get('st')!;   els.weightStRange.value   = p.get('st')!; }
  if (p.get('stlb')) { els.weightStLb.value  = p.get('stlb')!; els.weightStLbRange.value = p.get('stlb')!; }

  // ── Boot ──────────────────────────────────────────────────────────────────
  setUnits(units);
  updateViz();
  if (els.historyPanel) renderHistory(els.historyPanel);
}