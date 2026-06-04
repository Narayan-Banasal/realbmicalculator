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
  shouldTriggerAlert,
  type UnitSystem,
} from '../lib/bmi';

const STORAGE_UNITS = 'rbmi-units';
const STORAGE_ALERT = 'rbmi-alert-dismissed';

export function initBmiCalculator() {
  const root = document.getElementById('bmi-calculator');
  if (!root) return;

  let units: UnitSystem =
    (localStorage.getItem(STORAGE_UNITS) as UnitSystem) || 'metric';
  let alertDismissed = sessionStorage.getItem(STORAGE_ALERT) === '1';

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
    alertBanner: document.getElementById('bmi-alert-banner')!,
    alertOverlay: document.getElementById('bmi-alert-overlay')!,
    sceneCards: document.querySelectorAll<HTMLElement>('[data-scene-card]'),
    galleryCards: document.querySelectorAll<HTMLElement>('[data-gallery-card]'),
    bodyViz: document.getElementById('body-viz') as HTMLCanvasElement | null,
    vizStatus: document.getElementById('viz-status')!,
    vizOverlay: document.getElementById('viz-overlay')!,
    vizWarning: document.getElementById('viz-warning')!,
    recsPanel: document.getElementById('recs-panel')!,
    recsContent: document.getElementById('recs-content')!,
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
    high: { cm: 165, kg: 95, ft: 5, inch: 5, lb: 209 },
  };

  root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = presets[btn.dataset.preset!];
      if (!p) return;
      alertDismissed = false;
      sessionStorage.removeItem(STORAGE_ALERT);
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

  // Update recs live if age/gender change while result is shown (more personal value)
  const ageInp = document.getElementById('age');
  if (ageInp) ageInp.addEventListener('input', () => {
    if (!els.resultPanel.classList.contains('hidden')) calc();
  });
  document.querySelectorAll('input[name="gender"]').forEach((r) => {
    r.addEventListener('change', () => {
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

  // === New: Live reacting 3D-ish body viz (canvas) ===
  // Updates on every input for immediate "the model acts based on your values".
  // Torso "fat" width reacts to BMI, overall scale to height, color/warning to category.
  // Mouse tilt for 3D feel. No extra deps. More value & attention than static category cards.
  function drawBodyViz(bmi: number, hCm: number, wKg: number) {
    const canvas = els.bodyViz;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = 150;
    const baseSkin = '#fcd34d';
    const cat = categorize(bmi);

    const hScale = Math.max(0.65, Math.min(1.35, hCm / 170));
    const fat = Math.max(0.55, Math.min(1.9, (bmi - 14) / 13));

    // head
    ctx.save();
    ctx.fillStyle = baseSkin;
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 55, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // eyes
    ctx.fillStyle = '#111827';
    ctx.fillRect(cx - 10, 48, 5, 5);
    ctx.fillRect(cx + 5, 48, 5, 5);

    // mouth expression based on bmi
    ctx.beginPath();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    if (bmi < 18.5) {
      ctx.arc(cx, 68, 7, Math.PI, 0, true); // frown
    } else if (bmi > 30) {
      ctx.arc(cx, 70, 6, 0, Math.PI, true); // downturn
    } else {
      ctx.arc(cx, 66, 5, 0, Math.PI); // smile
    }
    ctx.stroke();
    ctx.restore();

    // torso (main reacting part - "3D" with gradient for depth)
    const tTop = 82;
    const tH = Math.round(105 * hScale);
    const tW = Math.round(52 * fat);
    const tLeft = cx - tW / 2;
    const grad = ctx.createLinearGradient(tLeft, tTop, tLeft + tW * 0.3, tTop + tH);
    grad.addColorStop(0, cat.color);
    grad.addColorStop(0.6, cat.color);
    grad.addColorStop(1, '#1f2937');
    ctx.fillStyle = grad;
    ctx.fillRect(tLeft, tTop, tW, tH);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.strokeRect(tLeft, tTop, tW, tH);

    // arms (thicker with fat)
    ctx.strokeStyle = baseSkin;
    ctx.lineWidth = Math.max(8, 11 * (fat * 0.5 + 0.7));
    ctx.lineCap = 'round';
    const armY = tTop + 18;
    ctx.beginPath();
    ctx.moveTo(tLeft, armY);
    ctx.lineTo(tLeft - 28 * fat, armY + 75 * hScale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tLeft + tW, armY);
    ctx.lineTo(tLeft + tW + 28 * fat, armY + 75 * hScale);
    ctx.stroke();

    // legs
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = Math.max(9, 13 * (fat * 0.4 + 0.8));
    const legTop = tTop + tH;
    ctx.beginPath();
    ctx.moveTo(cx - 6, legTop);
    ctx.lineTo(cx - 18 * fat, legTop + 95 * hScale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 6, legTop);
    ctx.lineTo(cx + 18 * fat, legTop + 95 * hScale);
    ctx.stroke();

    // status text on canvas bottom
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 11px system-ui';
    ctx.textAlign = 'center';
    let s = `BMI ${bmi.toFixed(1)} • ${cat.label}`;
    if (bmi >= 30) s += ' — Risk';
    else if (bmi < 18.5) s += ' — Focus';
    ctx.fillText(s, cx, 365);

    // mouse 3D tilt (simple)
    // (handler added below)
  }

  function updateLiveViz() {
    const canvas = els.bodyViz;
    if (!canvas) return;
    let h = 170, w = 70, bmi = 22;
    if (units === 'metric') {
      h = parseFloat(els.heightCm.value) || 170;
      w = parseFloat(els.weightKg.value) || 70;
      const hm = h / 100;
      bmi = w / (hm * hm);
    } else {
      const ft = parseFloat(els.heightFt.value) || 5;
      const inch = parseFloat(els.heightIn.value) || 10;
      h = (ft * 12 + inch) * 2.54;
      w = parseFloat(els.weightLb.value) || 160;
      const totalIn = ft * 12 + inch;
      bmi = (703 * w) / (totalIn * totalIn);
    }
    drawBodyViz(bmi, h, w);
  }

  // mouse tilt for 3D model feel (on the canvas)
  if (els.bodyViz) {
    els.bodyViz.addEventListener('mousemove', (e) => {
      const r = els.bodyViz!.getBoundingClientRect();
      const mx = ((e.clientX - r.left) / r.width - 0.5) * 18;
      els.bodyViz!.style.transform = `perspective(700px) rotateY(${mx}deg)`;
    });
    els.bodyViz.addEventListener('mouseleave', () => {
      if (els.bodyViz) els.bodyViz.style.transform = '';
    });
  }

  function updateRecs(bmi: number, cat: any, heightM: number) {
    const panel = els.recsPanel;
    const cont = els.recsContent;
    if (!panel || !cont) return;
    if (!bmi || (cat.id !== 'obese' && cat.id !== 'underweight')) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');

    const range = healthyWeightRangeKg(heightM);
    const curW = units === 'metric' ? parseFloat(els.weightKg.value) || 70 : lbToKg(parseFloat(els.weightLb.value) || 160);
    const ageEl = document.getElementById('age') as HTMLInputElement | null;
    const gEl = document.querySelector('input[name="gender"]:checked') as HTMLInputElement | null;
    const age = ageEl && ageEl.value ? parseInt(ageEl.value) : 30;
    const g = gEl ? gEl.value : 'unspecified';

    let html = '';
    if (cat.id === 'obese') {
      const toLose = Math.max(0, (curW - range.hi)).toFixed(1);
      html = `<p class="font-medium">BMI ${bmi.toFixed(1)} — ${cat.label}</p>
        <p>Target upper healthy: <strong>${range.hi.toFixed(1)} kg</strong> (lose ~${toLose} kg safely).</p>
        <ul class="mt-1 text-xs list-disc pl-4 space-y-0.5">
          <li>~500 kcal daily deficit (diet + movement) for ~0.5 kg/week.</li>
          <li>${age}yo ${g}: emphasize protein + veg, 150+ min brisk activity/week + strength 2x.</li>
          <li>Track waist too. Sleep 7-9h. Small wins add up fast.</li>
        </ul>`;
    } else {
      const toGain = Math.max(0, (range.lo - curW)).toFixed(1);
      html = `<p class="font-medium">BMI ${bmi.toFixed(1)} — ${cat.label}</p>
        <p>Target lower healthy: <strong>${range.lo.toFixed(1)} kg</strong> (gain ~${toGain} kg gradually).</p>
        <ul class="mt-1 text-xs list-disc pl-4 space-y-0.5">
          <li>Add calorie-dense nutritious foods (nuts, yogurt, oils, fruits).</li>
          <li>${age}yo ${g}: resistance training to gain muscle, not just fat.</li>
          <li>If loss was unintentional, speak with a clinician soon.</li>
        </ul>`;
    }
    cont.innerHTML = html;
  }

  function applyAlert(bmi: number) {
    const level = shouldTriggerAlert(bmi);
    const body = document.body;
    body.classList.remove('bmi-alert-caution', 'bmi-alert-critical');
    els.alertBanner.classList.add('hidden');
    els.alertOverlay.classList.add('hidden');
    if (!level || alertDismissed) return;

    if (level === 'critical') {
      body.classList.add('bmi-alert-critical');
      els.alertOverlay.classList.remove('hidden');
      // stronger screen redness + personal alarming message for impact
      els.alertOverlay.style.background = 'radial-gradient(ellipse at center, rgba(239,68,68,0.55), rgba(127,29,29,0.35))';
    } else {
      body.classList.add('bmi-alert-caution');
    }
    els.alertBanner.classList.remove('hidden');
    const title = document.getElementById('alert-title')!;
    const msg = document.getElementById('alert-message')!;
    if (bmi >= 30) {
      title.textContent = bmi >= 35 ? '⚠ SEVERE HEALTH RISK' : '⚠ ELEVATED BMI — ACT NOW';
      msg.textContent =
        bmi >= 35
          ? 'Your BMI indicates severe obesity. This significantly raises risks for diabetes, heart disease & more. See a doctor soon and start small sustainable changes today.'
          : 'Obese range. Risks rise with time. Use the plan below to begin reversing it safely.';
    } else {
      title.textContent = '⚠ LOW BMI NOTICE';
      msg.textContent =
        'Below healthy. Unintended loss needs evaluation. Focus on nutrient-rich intake and strength to rebuild safely.';
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
      document.body.classList.remove('bmi-alert-caution', 'bmi-alert-critical');
      els.alertBanner.classList.add('hidden');
      els.alertOverlay.classList.add('hidden');
      if (els.recsPanel) els.recsPanel.classList.add('hidden');
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

    updateLiveViz(); // ensure live even on full calc

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
    applyAlert(bmi);
    updateRecs(bmi, cat, heightM);
  }

  document.getElementById('dismiss-alert')?.addEventListener('click', () => {
    alertDismissed = true;
    sessionStorage.setItem(STORAGE_ALERT, '1');
    document.body.classList.remove('bmi-alert-caution', 'bmi-alert-critical');
    els.alertBanner.classList.add('hidden');
    els.alertOverlay.classList.add('hidden');
  });

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

  setUnits(units);
  updateLiveViz(); // initial live body model
}