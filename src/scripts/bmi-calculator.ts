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
    bodyCanvas: document.getElementById('body-canvas') as HTMLCanvasElement,
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

  // Real 3D reacting body model (three.js). Gender specific proportions (shoulders/hips/chest),
  // continuous torso+belly+limb girth from BMI, height proportion, fast drag yaw (state preserved on value change),
  // no control takeover, simple status only.
  let renderer: THREE.WebGLRenderer | null = null;
  let scene: THREE.Scene | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let figure: THREE.Group | null = null;
  let headM: THREE.Mesh, torsoM: THREE.Mesh, bellyM: THREE.Mesh;
  let lUpperArm: THREE.Mesh, lLowerArm: THREE.Mesh, lHand: THREE.Mesh;
  let rUpperArm: THREE.Mesh, rLowerArm: THREE.Mesh, rHand: THREE.Mesh;
  let lUpperLeg: THREE.Mesh, lLowerLeg: THREE.Mesh, lFoot: THREE.Mesh;
  let rUpperLeg: THREE.Mesh, rLowerLeg: THREE.Mesh, rFoot: THREE.Mesh;
  let groundM: THREE.Mesh;
  let vizInited = false;

  function initThreeViz() {
    const canvas = els.bodyCanvas;
    if (!canvas || vizInited) return;
    vizInited = true;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min((window.devicePixelRatio || 1), 2));
    renderer.setSize(320, 400);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(38, 320 / 400, 0.1, 10);
    camera.position.set(0, 1.05, 2.35);
    camera.lookAt(0, 0.95, 0);

    const amb = new THREE.AmbientLight(0xffffff, 0.65);
    const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(1.5, 2.5, 3);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.35); dir2.position.set(-2, 1, -1.5);
    scene.add(amb, dir, dir2);

    createFigure();
    if (figure) figure.rotation.y = 0.32; // nice default 3/4
    renderThree();

    // Fast drag rotate (yaw only), rotation state lives on figure so value updates never yank it
    let isDrag = false;
    let lastX = 0;
    const onDown = (e: PointerEvent) => {
      isDrag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!isDrag || !figure) return;
      const dx = e.clientX - lastX;
      figure.rotation.y += dx * 0.0055; // fast + responsive
      lastX = e.clientX;
      renderThree();
    };
    const onUp = (e?: PointerEvent) => {
      isDrag = false; if (e && e.pointerId) canvas.releasePointerCapture(e.pointerId);
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);
    canvas.addEventListener('dblclick', () => {
      if (figure) { figure.rotation.y = 0.32; renderThree(); }
    });
  }

  function createFigure() {
    if (!scene) return;
    figure = new THREE.Group();

    const skin = 0xF2C6A0;
    const bodyCol = 0x334155;
    const limbCol = 0x475569;

    const mSkin = new THREE.MeshPhongMaterial({ color: skin, shininess: 8 });
    const mBody = new THREE.MeshPhongMaterial({ color: bodyCol, shininess: 5 });
    const mLimb = new THREE.MeshPhongMaterial({ color: limbCol, shininess: 3 });

    // subtle ground
    groundM = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.018, 28), new THREE.MeshPhongMaterial({ color: 0xE2E8F0, shininess: 0 }));
    groundM.position.y = 0.009;
    figure.add(groundM);

    // head
    headM = new THREE.Mesh(new THREE.SphereGeometry(0.205, 26, 26), mSkin);
    headM.position.y = 1.38;
    figure.add(headM);

    // neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.12, 14), mSkin);
    neck.position.y = 1.22;
    figure.add(neck);

    // torso tapered
    torsoM = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.215, 0.58, 18, 1), mBody);
    torsoM.position.y = 0.88;
    figure.add(torsoM);

    // belly (reacts strongly to high BMI)
    bellyM = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 14), mBody);
    bellyM.position.set(0, 0.68, 0.02);
    figure.add(bellyM);

    // arms
    function mkArm(left: boolean) {
      const s = left ? -1 : 1;
      const ua = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.34, 10), mLimb);
      ua.position.set(s * 0.30, 1.12, 0); ua.rotation.z = s * -0.9; figure.add(ua);
      const la = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.30, 10), mLimb);
      la.position.set(s * 0.48, 0.88, 0); la.rotation.z = s * -0.35; figure.add(la);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), mSkin);
      h.position.set(s * 0.57, 0.72, 0); figure.add(h);
      if (left) { lUpperArm = ua; lLowerArm = la; lHand = h; } else { rUpperArm = ua; rLowerArm = la; rHand = h; }
    }
    mkArm(true); mkArm(false);

    // legs
    function mkLeg(left: boolean) {
      const s = left ? -1 : 1;
      const ul = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 0.42, 12), mLimb);
      ul.position.set(s * 0.17, 0.52, 0); figure.add(ul);
      const ll = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.065, 0.40, 12), mLimb);
      ll.position.set(s * 0.18, 0.18, 0); figure.add(ll);
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), mLimb);
      f.position.set(s * 0.20, 0.03, 0.05); figure.add(f);
      if (left) { lUpperLeg = ul; lLowerLeg = ll; lFoot = f; } else { rUpperLeg = ul; rLowerLeg = ll; rFoot = f; }
    }
    mkLeg(true); mkLeg(false);

    scene.add(figure);
  }

  function renderThree() {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function updateFigure(hCm: number, bmi: number, gender: 'male' | 'female') {
    if (!figure) { initThreeViz(); if (!figure) return; }

    const hf = Math.max(0.58, Math.min(1.65, (hCm || 170) / 170));

    // continuous fat from bmi (no categories)
    let fat = 1.0;
    if (bmi < 18.5) fat = 0.68 + (bmi / 18.5) * 0.32;
    else if (bmi < 25) fat = 1.0 + ((bmi - 18.5) / 6.5) * 0.18;
    else if (bmi < 30) fat = 1.18 + ((bmi - 25) / 5) * 0.28;
    else fat = 1.46 + Math.min(0.7, (bmi - 30) / 18);
    fat = Math.max(0.65, Math.min(2.15, fat));

    // height y-scale + shift to keep feet grounded in view
    figure.scale.set(1, hf, 1);
    figure.position.y = (hf - 1) * -0.32;

    // torso width/depth by fat (main "act")
    const tw = 0.95 + (fat - 1) * 0.85;
    const td = 0.82 + (fat - 1) * 0.65;
    torsoM.scale.set(tw, 1, td);

    // belly grows + protrudes
    const bs = 0.55 + (fat - 1) * 0.9;
    bellyM.scale.set(bs * 0.95, bs * 0.7, bs * 0.85);
    bellyM.position.z = 0.02 + Math.max(0, (fat - 1.1) * 0.06);

    // gender + fat adjusted shoulder/hip + limb girth
    const sh = (gender === 'male' ? 1.12 : 0.88) * (1 + (fat - 1) * 0.12);
    const hp = (gender === 'male' ? 0.88 : 1.14) * (1 + (fat - 1) * 0.1);

    if (lUpperArm) { lUpperArm.position.x = -0.30 * sh; lUpperArm.scale.set(1 + (fat - 1) * 0.18, 1, 1 + (fat - 1) * 0.12); }
    if (rUpperArm) { rUpperArm.position.x = 0.30 * sh; rUpperArm.scale.set(1 + (fat - 1) * 0.18, 1, 1 + (fat - 1) * 0.12); }
    if (lLowerArm) lLowerArm.scale.set(1 + (fat - 1) * 0.16, 1, 1 + (fat - 1) * 0.1);
    if (rLowerArm) rLowerArm.scale.set(1 + (fat - 1) * 0.16, 1, 1 + (fat - 1) * 0.1);

    const lx = 0.17 * hp;
    if (lUpperLeg) { lUpperLeg.position.x = -lx; lUpperLeg.scale.set(1 + (fat - 1) * 0.22, 1, 1 + (fat - 1) * 0.14); }
    if (rUpperLeg) { rUpperLeg.position.x = lx; rUpperLeg.scale.set(1 + (fat - 1) * 0.22, 1, 1 + (fat - 1) * 0.14); }
    if (lLowerLeg) lLowerLeg.scale.set(1 + (fat - 1) * 0.18, 1, 1 + (fat - 1) * 0.1);
    if (rLowerLeg) rLowerLeg.scale.set(1 + (fat - 1) * 0.18, 1, 1 + (fat - 1) * 0.1);
    if (lFoot) lFoot.position.x = -lx * 1.05;
    if (rFoot) rFoot.position.x = lx * 1.05;

    renderThree();

    if (els.bodyStatus) {
      const cat = categorize(bmi);
      els.bodyStatus.textContent = `${cat.label} • ${bmi.toFixed(1)} (3D illustrative)`;
    }
  }

  function updateLiveViz() {
    let h = 170, w = 70, bmi = 22;
    const gEl = document.querySelector('input[name="gender"]:checked');
    const gender = ((gEl ? gEl.value : 'male') as 'male' | 'female');
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
    if (!vizInited) initThreeViz();
    updateFigure(h, bmi, gender);
  }

  // init 3D + first render
  initThreeViz();

  // initial units + viz
  setUnits(units);
  updateLiveViz();
}