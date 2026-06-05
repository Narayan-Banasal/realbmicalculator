import {
  calcBmiMetric,
  calcBmiUs,
  categorize,
  cmToFeetIn,
  feetInToCm,
  healthyWeightRangeKg,
  kgToLb,
  lbToKg,
  markerPosition,
  type UnitSystem,
} from '../lib/bmi';

const STORAGE_UNITS = 'rbmi-units';

export function initBmiCalculator() {
  const root = document.getElementById('bmi-calculator');
  if (!root) return;

  let units: UnitSystem =
    (localStorage.getItem(STORAGE_UNITS) as UnitSystem) || 'metric';

  const els = {
    metricPanel: document.getElementById('height-metric')!,
    usPanel: document.getElementById('height-us')!,
    resultPanel: document.getElementById('result-panel')!,
    bmiValue: document.getElementById('bmi-value')!,
    bmiCategory: document.getElementById('bmi-category')!,
    bmiMarker: document.getElementById('bmi-marker')!,
    resultDetails: document.getElementById('result-details')!,
    unitToggle: document.getElementById('unit-toggle')!,
    unitKnob: document.getElementById('unit-knob')!,
    heightCm: document.getElementById('height-cm') as HTMLInputElement,
    heightCmRange: document.getElementById('height-cm-range') as HTMLInputElement,
    weightKg: document.getElementById('weight-kg') as HTMLInputElement,
    weightKgRange: document.getElementById('weight-kg-range') as HTMLInputElement,
    heightFt: document.getElementById('height-ft') as HTMLInputElement,
    heightFtRange: document.getElementById('height-ft-range') as HTMLInputElement,
    heightIn: document.getElementById('height-in') as HTMLInputElement,
    heightInRange: document.getElementById('height-in-range') as HTMLInputElement,
    weightLb: document.getElementById('weight-lb') as HTMLInputElement,
    weightLbRange: document.getElementById('weight-lb-range') as HTMLInputElement,
    displayHeight: document.getElementById('display-height')!,
    displayWeight: document.getElementById('display-weight')!,
    bodyModelContainer: document.getElementById('body-model-container')!,
    bodyModel: document.getElementById('body-model') as HTMLImageElement,
    bodyStatus: document.getElementById('body-status')!,
  };

  function syncPair(range: HTMLInputElement, number: HTMLInputElement, decimals = 0) {
    const v = parseFloat(range.value);
    number.value = decimals ? v.toFixed(decimals) : String(Math.round(v));
  }

  function syncFromNumber(range: HTMLInputElement, number: HTMLInputElement) {
    const v = parseFloat(number.value);
    if (!isNaN(v)) range.value = String(v);
  }

  function bindSlider(range: HTMLInputElement, number: HTMLInputElement, decimals = 0) {
    range.addEventListener('input', () => {
      syncPair(range, number, decimals);
      updateLiveViz();
      calc();
    });
    number.addEventListener('input', () => {
      syncFromNumber(range, number);
      updateLiveViz();
      calc();
    });
  }

  bindSlider(els.heightCmRange, els.heightCm);
  bindSlider(els.weightKgRange, els.weightKg, 1);
  bindSlider(els.heightFtRange, els.heightFt);
  bindSlider(els.heightInRange, els.heightIn);
  bindSlider(els.weightLbRange, els.weightLb, 1);

  function nudge(id: string, delta: number) {
    const input = document.getElementById(id) as HTMLInputElement;
    const range = document.getElementById(`${id}-range`) as HTMLInputElement | null;
    const step = parseFloat(input.step) || 1;
    const min = parseFloat(input.min) || 0;
    const max = parseFloat(input.max) || 9999;
    let v = (parseFloat(input.value) || 0) + delta * step;
    v = Math.min(max, Math.max(min, v));
    input.value = String(Number.isInteger(step) ? Math.round(v) : Number(v.toFixed(1)));
    if (range) range.value = input.value;
    calc();
  }

  root.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach((btn) => {
    btn.addEventListener('click', () => {
      nudge(btn.dataset.nudge!, parseFloat(btn.dataset.delta!));
      updateLiveViz();
    });
  });

  const presets: Record<string, { cm: number; kg: number; ft: number; inch: number; lb: number }> = {
    average: { cm: 170, kg: 70, ft: 5, inch: 10, lb: 160 },
    athlete: { cm: 178, kg: 82, ft: 5, inch: 10, lb: 181 },
  };

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = presets[btn.dataset.preset!];
      if (!p) return;
      els.heightCm.value = String(p.cm);
      els.heightCmRange.value = String(p.cm);
      els.weightKg.value = String(p.kg);
      els.weightKgRange.value = String(p.kg);
      els.heightFt.value = String(p.ft);
      els.heightFtRange.value = String(p.ft);
      els.heightIn.value = String(p.inch);
      els.heightInRange.value = String(p.inch);
      els.weightLb.value = String(p.lb);
      els.weightLbRange.value = String(p.lb);
      updateLiveViz();
      calc();
    });
  });

  const ageInp = document.getElementById('age');
  if (ageInp) ageInp.addEventListener('input', () => {
    if (!els.resultPanel.classList.contains('hidden')) calc();
  });
  document.querySelectorAll('input[name="gender"]').forEach((r) => {
    r.addEventListener('change', () => {
      updateLiveViz(); // live body viz update on gender
      if (!els.resultPanel.classList.contains('hidden')) calc();
    });
  });

  function convertUnitsOnSwitch(target: UnitSystem) {
    if (target === 'us' && units === 'metric') {
      const cm = parseFloat(els.heightCm.value) || 170;
      const kg = parseFloat(els.weightKg.value) || 70;
      const { ft, inch } = cmToFeetIn(cm);
      els.heightFt.value = String(ft);
      els.heightFtRange.value = String(ft);
      els.heightIn.value = String(inch);
      els.heightInRange.value = String(inch);
      const lb = kgToLb(kg);
      els.weightLb.value = lb.toFixed(1);
      els.weightLbRange.value = lb.toFixed(1);
    } else if (target === 'metric' && units === 'us') {
      const ft = parseFloat(els.heightFt.value) || 5;
      const inch = parseFloat(els.heightIn.value) || 10;
      const lb = parseFloat(els.weightLb.value) || 160;
      const cm = feetInToCm(ft, inch);
      els.heightCm.value = String(Math.round(cm));
      els.heightCmRange.value = String(Math.round(cm));
      const kg = lbToKg(lb);
      els.weightKg.value = kg.toFixed(1);
      els.weightKgRange.value = kg.toFixed(1);
    }
  }

  function setUnits(u: UnitSystem) {
    convertUnitsOnSwitch(u);
    units = u;
    localStorage.setItem(STORAGE_UNITS, u);
    els.metricPanel.classList.toggle('hidden', u !== 'metric');
    els.usPanel.classList.toggle('hidden', u !== 'us');
    els.unitToggle.setAttribute('aria-checked', u === 'us' ? 'true' : 'false');
    els.unitToggle.dataset.units = u;
    document.dispatchEvent(new CustomEvent('rbmi:units', { detail: { units: u } }));
    updateLiveViz();
    calc();
  }

  els.unitToggle.addEventListener('click', () => {
    setUnits(units === 'metric' ? 'us' : 'metric');
  });

  function updateDisplays(bmi: number | null) {
    if (units === 'metric') {
      const cm = parseFloat(els.heightCm.value) || 0;
      const kg = parseFloat(els.weightKg.value) || 0;
      els.displayHeight.textContent = `${cm} cm`;
      els.displayWeight.textContent = `${kg} kg · ${kgToLb(kg).toFixed(1)} lb`;
    } else {
      const ft = parseFloat(els.heightFt.value) || 0;
      const inch = parseFloat(els.heightIn.value) || 0;
      const lb = parseFloat(els.weightLb.value) || 0;
      els.displayHeight.textContent = `${ft}'${inch}"`;
      els.displayWeight.textContent = `${lb} lb · ${lbToKg(lb).toFixed(1)} kg`;
    }
    if (bmi != null) {
      document.dispatchEvent(
        new CustomEvent('rbmi:result', { detail: { bmi, category: categorize(bmi) } }),
      );
    }
  }

  function calc() {
    let result: { bmi: number; heightM: number } | null = null;

    if (units === 'metric') {
      result = calcBmiMetric(
        parseFloat(els.heightCm.value),
        parseFloat(els.weightKg.value),
      );
    } else {
      result = calcBmiUs(
        parseFloat(els.heightFt.value) || 0,
        parseFloat(els.heightIn.value) || 0,
        parseFloat(els.weightLb.value),
      );
    }

    updateDisplays(result?.bmi ?? null);

    if (!result || !isFinite(result.bmi)) {
      els.resultPanel.classList.add('hidden');
      updateLiveViz();
      return;
    }

    const { bmi, heightM } = result;
    const cat = categorize(bmi);
    els.resultPanel.classList.remove('hidden');
    els.bmiValue.textContent = bmi.toFixed(1);
    els.bmiCategory.textContent = cat.label;
    els.bmiCategory.style.backgroundColor = cat.color;
    els.bmiMarker.style.left = `${markerPosition(bmi)}%`;

    const range = healthyWeightRangeKg(heightM);
    const prime = (bmi / 25).toFixed(2);
    const lines = [
      `Healthy BMI range: 18.5 – 24.9 kg/m²`,
      units === 'metric'
        ? `Healthy weight for your height: ${range.lo.toFixed(1)} – ${range.hi.toFixed(1)} kg`
        : `Healthy weight for your height: ${kgToLb(range.lo).toFixed(1)} – ${kgToLb(range.hi).toFixed(1)} lb`,
      `BMI Prime: ${prime}`,
      cat.healthNote,
    ];
    els.resultDetails.innerHTML = lines.map((t) => `<li>${t}</li>`).join('');

    updateLiveViz();
  }

  document.getElementById('copy-result')?.addEventListener('click', async () => {
    const params = new URLSearchParams({ units });
    if (units === 'metric') {
      params.set('cm', els.heightCm.value);
      params.set('kg', els.weightKg.value);
    } else {
      params.set('ft', els.heightFt.value);
      params.set('in', els.heightIn.value);
      params.set('lb', els.weightLb.value);
    }
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}?${params}`);
  });

  const p = new URLSearchParams(location.search);
  if (p.get('units') === 'us') units = 'us';
  if (p.get('cm')) {
    els.heightCm.value = p.get('cm')!;
    els.heightCmRange.value = p.get('cm')!;
  }
  if (p.get('kg')) {
    els.weightKg.value = p.get('kg')!;
    els.weightKgRange.value = p.get('kg')!;
  }
  if (p.get('ft')) {
    els.heightFt.value = p.get('ft')!;
    els.heightFtRange.value = p.get('ft')!;
  }
  if (p.get('in')) {
    els.heightIn.value = p.get('in')!;
    els.heightInRange.value = p.get('in')!;
  }
  if (p.get('lb')) {
    els.weightLb.value = p.get('lb')!;
    els.weightLbRange.value = p.get('lb')!;
  }

  // Real pictures (photorealistic generated full-body people).
  // The picture itself changes when weight/BMI or gender changes (different body type photo).
  // The displayed height of the person in the frame changes with the height input (taller = more vertical space).
  const bodyImages: Record<string, string> = {
    'male-underweight': '/images/bodies/male-underweight.jpg',
    'male-normal': '/images/bodies/male-normal.jpg',
    'male-overweight': '/images/bodies/male-overweight.jpg',
    'male-obese': '/images/bodies/male-obese.jpg',
    'female-underweight': '/images/bodies/female-underweight.jpg',
    'female-normal': '/images/bodies/female-normal.jpg',
    'female-overweight': '/images/bodies/female-overweight.jpg',
    'female-obese': '/images/bodies/female-obese.jpg',
  };

  let currentBodySrc = '';

  function updateLiveViz() {
    const img = els.bodyModel;
    if (!img) return;

    let h = 170;
    let w = 70;
    let bmi = 22;
    const gEl = document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null;
    const gender = (gEl?.value || 'male') as 'male' | 'female';

    if (units === 'metric') {
      h = parseFloat(els.heightCm.value) || 170;
      w = parseFloat(els.weightKg.value) || 70;
      if (h > 0) bmi = w / ((h / 100) ** 2);
    } else {
      const ft = parseFloat(els.heightFt.value) || 5;
      const inch = parseFloat(els.heightIn.value) || 10;
      h = (ft * 12 + inch) * 2.54;
      w = parseFloat(els.weightLb.value) || 160;
      const totalIn = ft * 12 + inch;
      if (totalIn > 0) bmi = (703 * w) / (totalIn * totalIn);
    }

    const cat = categorize(bmi);
    const key = `${gender}-${cat.id}`;
    const newSrc = bodyImages[key] || bodyImages['male-normal'];

    // Change the real picture when the body type (weight) or gender changes.
    // Smooth fade to avoid jarring switch.
    if (newSrc !== currentBodySrc) {
      currentBodySrc = newSrc;
      img.style.transition = 'opacity 140ms linear, height 140ms linear';
      img.style.opacity = '0.4';
      setTimeout(() => {
        img.src = newSrc;
        img.style.opacity = '1';
      }, 80);
    }

    // Height controls how tall the real person photo appears inside the fixed box.
    // This gives direct visual feedback for height changes without distorting the photo.
    const minH = 100;
    const maxH = 250;
    const t = Math.max(0, Math.min(1, (h - minH) / (maxH - minH)));
    const heightPercent = 52 + t * 42; // 52% for short → ~94% for very tall
    img.style.height = `${heightPercent.toFixed(1)}%`;
    img.style.width = 'auto';

    if (els.bodyStatus) {
      els.bodyStatus.textContent = `${cat.label} • ${bmi.toFixed(1)} (illustrative)`;
    }
  }

  // initial
  setUnits(units);
  updateLiveViz();
}