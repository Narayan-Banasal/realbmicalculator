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

import * as THREE from 'three';

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
      updateLiveModel();
      calc();
    });
    number.addEventListener('input', () => {
      syncFromNumber(range, number);
      updateLiveModel();
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
      updateLiveModel();
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
      updateLiveModel();
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
      updateLiveModel(); // live 3D gender proportion change
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
    updateLiveModel();
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

  // (2D viz code removed; real Three.js 3D model code is now in place at the end of the init function)

    // torso (main reacting part - "3D" with gradient for depth)
    const tTop = 82;
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
      updateLiveModel();
      return;
    }

    const { bmi, heightM } = result;
    const cat = categorize(bmi);
    els.resultPanel.classList.remove('hidden');
    els.bmiValue.textContent = bmi.toFixed(1);
    els.bmiCategory.textContent = cat.label;
    els.bmiCategory.style.backgroundColor = cat.color;
    els.bmiMarker.style.left = `${markerPosition(bmi)}%`;

    updateLiveModel(); // ensure live even on full calc

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
    updateLiveModel(); // keep 3D model in sync with final result + gender
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

  // === Three.js 3D model init and update (real 3D, interactive rotate, gender specific, live update without resetting view/rotation) ===
  // This replaces the previous 2D canvas. The model is a stylized but person-like 3D figure.
  // Drag the canvas to rotate (preserves rotation across live updates - fixes the "pointer jumps to lowest/reset view" issue).
  // Updates on input changes for height/weight (fat/scale), gender (different body composition).
  // Color by BMI category for alarming (red for bad).
  let threeRenderer: THREE.WebGLRenderer | null = null;
  let threeScene: THREE.Scene | null = null;
  let threeCamera: THREE.PerspectiveCamera | null = null;
  let bodyGroup: THREE.Group | null = null;
  let torso: THREE.Mesh | null = null;
  let head: THREE.Mesh | null = null;
  let lArm: THREE.Mesh | null = null;
  let rArm: THREE.Mesh | null = null;
  let lLeg: THREE.Mesh | null = null;
  let rLeg: THREE.Mesh | null = null;
  let rotY = 0.3;
  let rotX = 0.15;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  function initThree(canvas: HTMLCanvasElement) {
    if (threeRenderer) return;
    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    threeRenderer.setSize(canvas.clientWidth || 320, canvas.clientHeight || 320);
    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    threeCamera.position.set(0, 1.1, 2.8);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444466, 1.0);
    threeScene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.7);
    dir.position.set(2, 3, 1);
    threeScene.add(dir);

    bodyGroup = new THREE.Group();
    threeScene.add(bodyGroup);

    const skin = new THREE.MeshPhongMaterial({ color: 0xdeb887, shininess: 8 });
    const clothes = new THREE.MeshPhongMaterial({ color: 0x334155, shininess: 2 });

    // Head
    head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), skin);
    head.position.y = 1.65;
    bodyGroup.add(head);

    // Torso (will be scaled for gender/BMI)
    torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.55, 18), clothes);
    torso.position.y = 1.25;
    bodyGroup.add(torso);

    // Arms
    const armG = new THREE.CylinderGeometry(0.05, 0.055, 0.48, 10);
    lArm = new THREE.Mesh(armG, skin);
    lArm.position.set(-0.28, 1.42, 0);
    lArm.rotation.z = 0.5;
    bodyGroup.add(lArm);
    rArm = new THREE.Mesh(armG, skin);
    rArm.position.set(0.28, 1.42, 0);
    rArm.rotation.z = -0.5;
    bodyGroup.add(rArm);

    // Legs
    const legG = new THREE.CylinderGeometry(0.065, 0.07, 0.6, 10);
    lLeg = new THREE.Mesh(legG, clothes);
    lLeg.position.set(-0.12, 0.85, 0);
    bodyGroup.add(lLeg);
    rLeg = new THREE.Mesh(legG, clothes);
    rLeg.position.set(0.12, 0.85, 0);
    bodyGroup.add(rLeg);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshPhongMaterial({ color: 0xddd, shininess: 0 }));
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = 0.52;
    threeScene.add(floor);

    // Mouse drag rotate (left/right primarily)
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointerup', (e) => {
      dragging = false;
      canvas.releasePointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging || !bodyGroup) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.0045;
      rotX = Math.max(-0.6, Math.min(0.7, rotX - dy * 0.003));
      bodyGroup.rotation.y = rotY;
      bodyGroup.rotation.x = rotX;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvas.addEventListener('dblclick', () => {
      if (bodyGroup) {
        rotY = 0.3;
        rotX = 0.15;
        bodyGroup.rotation.set(rotX, rotY, 0);
      }
    });
    canvas.style.cursor = 'grab';

    // Render loop
    function loop() {
      requestAnimationFrame(loop);
      if (threeRenderer && threeScene && threeCamera) threeRenderer.render(threeScene, threeCamera);
    }
    loop();

    // Resize
    const onR = () => {
      if (!threeCamera || !threeRenderer) return;
      const w = canvas.clientWidth, h = canvas.clientHeight || 320;
      threeCamera.aspect = w / h;
      threeCamera.updateProjectionMatrix();
      threeRenderer.setSize(w, h);
    };
    window.addEventListener('resize', onR);
    setTimeout(onR, 80);

    bodyGroup.rotation.set(rotX, rotY, 0);
  }

  function updateThreeModel(bmi: number, hCm: number, gender: 'male' | 'female') {
    if (!bodyGroup || !torso || !head || !lArm || !rArm || !lLeg || !rLeg) return;

    const fat = Math.max(0.55, Math.min(1.65, (bmi - 16) / 11));
    const hS = Math.max(0.78, Math.min(1.22, hCm / 170));

    // Gender specific proportions (composition changes)
    const male = gender === 'male';
    const sh = male ? 1.22 : 0.88; // shoulder
    const hp = male ? 0.88 : 1.22; // hip

    // Torso girth and shape from BMI + gender
    const r = 0.155 * (0.75 + fat * 0.55);
    torso.scale.set(sh * (0.75 + (fat - 0.6) * 0.4), hS, hp * (0.75 + (fat - 0.6) * 0.4));
    torso.position.y = 1.25 * hS;

    // Head
    head.scale.setScalar(hS);
    head.position.y = 1.65 * hS;

    // Limbs
    const lt = 1 + (fat - 1) * 0.2;
    lArm.scale.set(lt, hS, lt);
    rArm.scale.set(lt, hS, lt);
    lLeg.scale.set(lt * 0.92, hS * 1.05, lt * 0.92);
    rLeg.scale.set(lt * 0.92, hS * 1.05, lt * 0.92);
    lArm.position.y = 1.42 * hS;
    rArm.position.y = 1.42 * hS;
    lLeg.position.y = 0.82 * hS;
    rLeg.position.y = 0.82 * hS;

    // Category color (alarming)
    const c = new THREE.Color(categorize(bmi).color);
    if (torso.material instanceof THREE.MeshPhongMaterial) torso.material.color.copy(c);
    const skinC = c.clone().lerp(new THREE.Color(0xdeb887), 0.35);
    if (head.material instanceof THREE.MeshPhongMaterial) head.material.color.copy(skinC);
    if (lArm.material instanceof THREE.MeshPhongMaterial) lArm.material.color.copy(skinC);
    if (rArm.material instanceof THREE.MeshPhongMaterial) rArm.material.color.copy(skinC);

    // Preserve user rotation
    bodyGroup.rotation.y = rotY;
    bodyGroup.rotation.x = rotX;
  }

  function updateLiveModel() {
    const c = els.bodyViz;
    if (!c) return;
    if (!threeRenderer) initThree(c);

    let hCm = 170, bmi = 22;
    const g = (document.querySelector('input[name="gender"]:checked') as HTMLInputElement)?.value as 'male' | 'female' || 'male';

    if (units === 'metric') {
      hCm = parseFloat(els.heightCm.value) || 170;
      const w = parseFloat(els.weightKg.value) || 70;
      bmi = w / ((hCm / 100) ** 2);
    } else {
      const ft = parseFloat(els.heightFt.value) || 5;
      const in_ = parseFloat(els.heightIn.value) || 10;
      hCm = (ft * 12 + in_) * 2.54;
      const wLb = parseFloat(els.weightLb.value) || 160;
      const totalIn = ft * 12 + in_;
      bmi = (703 * wLb) / (totalIn * totalIn);
    }

    updateThreeModel(bmi, hCm, g);
  }

  // initial
  setUnits(units);
  updateLiveModel();
}