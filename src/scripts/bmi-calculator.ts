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

import * as THREE from 'three';

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
    visualActive: document.getElementById('visual-active-card')!,
    sceneCards: document.querySelectorAll<HTMLElement>('[data-scene-card]'),
    galleryCards: document.querySelectorAll<HTMLElement>('[data-gallery-card]'),
    bodyModelContainer: document.getElementById('body-model-container')!,
    bodyModelInner: document.getElementById('body-model-inner')!,
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

  function highlightVisuals(catId: string, catLabel: string) {
    els.galleryCards.forEach((card) => {
      const active = card.dataset.galleryCard === catId;
      card.classList.toggle('ring-2', active);
      card.classList.toggle('ring-(--color-accent)', active);
      card.classList.toggle('scale-[1.02]', active);
      card.classList.toggle('opacity-50', !active);
    });
    els.sceneCards.forEach((card) => {
      card.classList.toggle('is-active', card.dataset.sceneCard === catId);
    });
    const img = document.querySelector<HTMLImageElement>('#visual-active-img');
    const label = document.querySelector('#visual-active-label');
    if (img) img.src = `/images/bmi/${catId}.svg`;
    if (label) label.textContent = catLabel;
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

    highlightVisuals(cat.id, cat.label);
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

  // Body images (generated realistic dummies for real person look, gender specific)
  const bodyImages = {
    'male-underweight': '/images/bodies/2.jpg',
    'male-normal': '/images/bodies/1.jpg',
    'male-overweight': '/images/bodies/4.jpg',
    'male-obese': '/images/bodies/3.jpg',
    'female-underweight': '/images/bodies/5.jpg',
    'female-normal': '/images/bodies/6.jpg',
    'female-overweight': '/images/bodies/8.jpg',
    'female-obese': '/images/bodies/7.jpg',
  };

  let modelRotY = 0;

  function updateBodyViz() {
    const img = els.bodyModel;
    if (!img) return;
    let h = 170, w = 70, bmi = 22;
    const gEl = document.querySelector('input[name="gender"]:checked');
    const gender = gEl ? gEl.value : 'male';
    if (units === 'metric') {
      h = parseFloat(els.heightCm.value) || 170;
      w = parseFloat(els.weightKg.value) || 70;
      bmi = w / ((h / 100) ** 2);
    } else {
      const ft = parseFloat(els.heightFt.value) || 5;
      const inch = parseFloat(els.heightIn.value) || 10;
      h = (ft * 12 + inch) * 2.54;
      w = parseFloat(els.weightLb.value) || 160;
      const totalIn = ft * 12 + inch;
      bmi = (703 * w) / (totalIn * totalIn);
    }
    const cat = categorize(bmi);
    const key = `${gender}-${cat.id}`;
    const newSrc = bodyImages[key] || bodyImages['male-normal'];
    if (!img.src.endsWith(newSrc)) {
      img.style.opacity = '0.5';
      setTimeout(() => {
        img.src = newSrc;
        img.style.opacity = '1';
      }, 120);
    }
    // live act with scale (continuous feel while sliding, no jump)
    let fatS = 1.0;
    if (cat.id === 'underweight') fatS = 0.78 + (bmi / 18.5) * 0.22;
    else if (cat.id === 'normal') fatS = 0.92 + ((bmi - 18.5) / 6.5) * 0.18;
    else if (cat.id === 'overweight') fatS = 1.0 + ((bmi - 25) / 5) * 0.25;
    else fatS = 1.15 + ((bmi - 30) / 15) * 0.35;
    fatS = Math.max(0.75, Math.min(1.55, fatS));
    img.style.transform = `scaleX(${fatS})`;
    if (els.bodyStatus) {
      els.bodyStatus.textContent = `${cat.label} • ${bmi.toFixed(1)} (illustrative)`;
    }
  }

  // 3D rotate (CSS 3D tilt on container, fast response)
  const modelContainer = els.bodyModelContainer;
  const modelInner = els.bodyModelInner;
  if (modelContainer && modelInner) {
    let isDrag = false;
    let pX = 0;
    modelContainer.addEventListener('pointerdown', (e) => {
      isDrag = true;
      pX = e.clientX;
      modelContainer.setPointerCapture(e.pointerId);
    });
    modelContainer.addEventListener('pointermove', (e) => {
      if (!isDrag) return;
      const dx = e.clientX - pX;
      modelRotY += dx * 0.6; // fast
      modelInner.style.transform = `rotateY(${modelRotY}deg)`;
      pX = e.clientX;
    });
    const stopDrag = (e) => {
      isDrag = false;
      if (e && e.pointerId) modelContainer.releasePointerCapture(e.pointerId);
    };
    modelContainer.addEventListener('pointerup', stopDrag);
    modelContainer.addEventListener('pointerleave', stopDrag);
    modelContainer.addEventListener('dblclick', () => {
      modelRotY = 0;
      modelInner.style.transform = `rotateY(0deg)`;
    });
  }

  function updateLiveViz() {
    updateBodyViz();
  }

  // initial
  setUnits(units);
  updateLiveViz();
}