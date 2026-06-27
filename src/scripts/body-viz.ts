/**
 * body-viz.ts — High-quality 2D canvas human body visualization.
 *
 * Approach: smooth bezier paths drawn back-to-front, proper 7.5-head anatomy,
 * tricolor front-lit skin gradient, extended BMI/height scaling with no hard caps.
 * Female hair is drawn BEFORE the skull so it never obscures the face.
 */

export type BodyGender = 'male' | 'female';
export interface BodyParams { gender: BodyGender; bmi: number; heightCm: number; waistCm?: number; }

const W = 320, H = 420, CX = 160;

// ── Palette ───────────────────────────────────────────────────────────────────
const SKIN_LIT   = '#fde0c4';
const SKIN_BASE  = '#e09870';
const SKIN_SHADE = '#b86030';
const SKIN_DEEP  = '#904020';
const HAIR_D     = '#231206';
const HAIR_M     = '#3d2010';
const SHIRT      = '#1a1a30';
const SHIRT_HI   = '#28283e';
const PANTS      = '#141424';
const PANTS_HI   = '#1e1e32';
const SHOE_COL   = '#0f0f1e';

const BADGE: Record<string, { label: string; fill: string; glow: string }> = {
  underweight: { label: 'Underweight',   fill: '#3b82f6', glow: 'rgba(59,130,246,0.22)' },
  normal:      { label: 'Normal weight', fill: '#10b981', glow: 'rgba(16,185,129,0.22)' },
  overweight:  { label: 'Overweight',   fill: '#f59e0b', glow: 'rgba(245,158,11,0.22)'  },
  obese:       { label: 'Obese',         fill: '#ef4444', glow: 'rgba(239,68,68,0.22)'  },
};

function bmiCat(bmi: number) {
  return bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';
}

// ── Shape parameters ──────────────────────────────────────────────────────────
interface S {
  sw: number;   // shoulder half-width
  cw: number;   // chest half-width (below shoulder)
  ww: number;   // waist half-width
  hw: number;   // hip half-width
  tw: number;   // thigh half-width (from leg centre)
  kw: number;   // knee half-width
  vw: number;   // calf half-width
  akw: number;  // ankle half-width
  auw: number;  // upper arm half-width
  alw: number;  // forearm half-width
  belly: number;// belly forward bulge
  bust: number; // female bust protrusion
  gap: number;  // half leg-gap from centreline
}

/**
 * Derives body shape from BMI.  f = 0 at BMI 22, < 0 = thin, > 0 = fat.
 * No hard upper cap — extreme obesity continues to grow.
 */
function deriveShape(g: BodyGender, bmi: number, waistCm?: number): S {
  const bmiClamped = Math.max(13, Math.min(70, bmi));
  const f = Math.max(-0.55, Math.min(2.2, (bmiClamped - 22) / 18));
  const pos = Math.abs(f), sign = f >= 0 ? 1 : -1;

  let shape: S;
  if (g === 'male') {
    shape = {
      sw:   clamp(55 + sign * 16 * pos, 22, 100),
      cw:   clamp(44 + sign * 18 * pos, 20, 95),
      ww:   clamp(30 + sign * 30 * pos, 14, 90),
      hw:   clamp(37 + sign * 20 * pos, 20, 85),
      tw:   clamp(19 + sign * 15 * pos, 9,  54),
      kw:   clamp(14 + sign *  7 * pos, 7,  35),
      vw:   clamp(12 + sign *  6 * pos, 6,  30),
      akw:  clamp( 7 + sign *  2 * pos, 4,  16),
      auw:  clamp(11 + sign *  9 * pos, 5,  38),
      alw:  clamp( 8 + sign *  5 * pos, 4,  24),
      belly: f > 0 ? Math.max(0, (f - 0.04) * 34) : 0,
      bust:  0,
      gap:   clamp(8 + sign * 4 * pos, 5, 24),
    };
  } else {
    shape = {
      sw:   clamp(43 + sign * 13 * pos, 18, 90),
      cw:   clamp(43 + sign * 21 * pos, 20, 95),
      ww:   clamp(26 + sign * 27 * pos, 12, 85),
      hw:   clamp(47 + sign * 24 * pos, 22, 100),
      tw:   clamp(20 + sign * 16 * pos, 9,  58),
      kw:   clamp(14 + sign *  7 * pos, 7,  35),
      vw:   clamp(12 + sign *  6 * pos, 6,  30),
      akw:  clamp( 7 + sign *  2 * pos, 4,  16),
      auw:  clamp( 9 + sign *  8 * pos, 4,  34),
      alw:  clamp( 7 + sign *  5 * pos, 3,  22),
      belly: f > 0 ? Math.max(0, (f - 0.07) * 24) : 0,
      bust:  clamp(11 + f * (f > 0 ? 8 : 5), 3, 32),
      gap:   clamp(10 + sign * 5 * pos, 6, 28),
    };
  }

  if (waistCm && waistCm > 0) {
    const expectedWaist = g === 'male' 
      ? (84 + (bmi - 22) * 3.5) 
      : (74 + (bmi - 22) * 3.0);
    const factor = clamp(waistCm / expectedWaist, 0.75, 1.45);
    shape.ww = clamp(shape.ww * factor, 12, 110);
    if (factor > 1) {
      shape.belly = clamp(shape.belly + (factor - 1) * 30, 0, 80);
    } else {
      shape.belly = clamp(shape.belly * factor, 0, 80);
    }
  }

  return shape;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function lerpShape(a: S, b: S, t: number): S {
  const l = (x: number, y: number) => x + (y - x) * t;
  return {
    sw: l(a.sw,b.sw), cw:l(a.cw,b.cw), ww:l(a.ww,b.ww), hw:l(a.hw,b.hw),
    tw:l(a.tw,b.tw),  kw:l(a.kw,b.kw), vw:l(a.vw,b.vw), akw:l(a.akw,b.akw),
    auw:l(a.auw,b.auw), alw:l(a.alw,b.alw), belly:l(a.belly,b.belly),
    bust:l(a.bust,b.bust), gap:l(a.gap,b.gap),
  };
}

// ── Vertical anchors (7.5-head system, no hard height cap) ───────────────────
interface Anchors {
  hH: number; hHW: number; headCY: number; chinY: number;
  neckBotY: number; shoulderY: number; underarmY: number;
  waistY: number; hipY: number; crotchY: number;
  kneeY: number; ankleY: number; footBotY: number;
  elbowY: number; wristY: number; handBotY: number;
  bustY: number;
}

function buildAnchors(heightCm: number): Anchors {
  // Extended range: 0.55 (140cm) to 1.30 (221cm)
  const hs = Math.max(0.55, Math.min(1.30, heightCm / 170));
  const figH = H * 0.90 * hs;
  const topY = (H - figH) / 2;
  const hH   = figH / 7.5;          // one head height

  return {
    hH, hHW: hH * 0.70,
    headCY:   topY + hH * 0.50,
    chinY:    topY + hH,
    neckBotY: topY + hH * 1.24,
    shoulderY: topY + hH * 1.38,
    underarmY: topY + hH * 2.10,
    bustY:     topY + hH * 2.05,
    waistY:    topY + hH * 3.20,
    hipY:      topY + hH * 3.90,
    crotchY:   topY + hH * 4.30,
    kneeY:     topY + hH * 5.65,
    ankleY:    topY + hH * 7.00,
    footBotY:  topY + figH,
    elbowY:    topY + hH * 3.10,
    wristY:    topY + hH * 4.15,
    handBotY:  topY + hH * 4.65,
  };
}

// ── Main draw function ────────────────────────────────────────────────────────
function drawBody(
  ctx:       CanvasRenderingContext2D,
  s:         S,
  g:         BodyGender,
  bmi:       number,
  heightCm:  number,
) {
  const a   = buildAnchors(heightCm);
  const cat = bmiCat(bmi);
  const bdg = BADGE[cat];

  ctx.clearRect(0, 0, W, H);

  // Background radial glow keyed to BMI category
  const bg = ctx.createRadialGradient(CX, H * 0.48, 20, CX, H * 0.48, 175);
  bg.addColorStop(0, bdg.glow);
  bg.addColorStop(1, 'transparent');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Skin gradient (front-lit, reused for all exposed skin) ─────────────────
  const skinG = ctx.createRadialGradient(
    CX - 15, a.shoulderY + (a.waistY - a.shoulderY) * 0.3, 10,
    CX,      a.shoulderY + (a.waistY - a.shoulderY) * 0.5, Math.max(s.hw, s.sw) + 60,
  );
  skinG.addColorStop(0,   SKIN_LIT);
  skinG.addColorStop(0.35, SKIN_BASE);
  skinG.addColorStop(0.75, SKIN_SHADE);
  skinG.addColorStop(1,   SKIN_DEEP);

  // ── Ground shadow ───────────────────────────────────────────────────────────
  const shadowRX = Math.max(s.hw, s.sw) * 0.65;
  const shadowGrad = ctx.createRadialGradient(CX, a.footBotY, 2, CX, a.footBotY, shadowRX);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
  shadowGrad.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.ellipse(CX, a.footBotY + 4, shadowRX, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = shadowGrad;
  ctx.fill();

  // ── Arms (draw before torso so torso overlaps shoulder join) ───────────────
  for (const lr of [-1, 1] as const) {
    drawArm(ctx, lr, a, s, skinG);
  }

  // ── Legs ────────────────────────────────────────────────────────────────────
  for (const lr of [-1, 1] as const) {
    drawLeg(ctx, lr, a, s, skinG);
  }

  // ── Torso (overlaps arm/leg tops so no gap seams) ───────────────────────────
  drawTorso(ctx, a, s, g, skinG);

  // ── Belly bulge overlay ─────────────────────────────────────────────────────
  if (s.belly > 2) {
    const bAlpha = Math.min(0.55, s.belly / 55);
    const bellyG = ctx.createRadialGradient(CX, a.waistY + 14, 4, CX, a.waistY + 14, s.belly + 18);
    bellyG.addColorStop(0, `rgba(240,155,105,${bAlpha + 0.1})`);
    bellyG.addColorStop(0.6, `rgba(185,100,50,${bAlpha})`);
    bellyG.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.ellipse(CX, a.waistY + 14, s.belly + 12, s.belly * 0.85 + 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = bellyG;
    ctx.fill();
  }

  // ── Female bust ─────────────────────────────────────────────────────────────
  if (g === 'female' && s.bust > 4) {
    for (const lr of [-1, 1] as const) {
      const bx = CX + lr * (s.cw * 0.44);
      const bustGrad = ctx.createRadialGradient(bx - lr * 4, a.bustY - 4, 2, bx, a.bustY, s.bust + 4);
      bustGrad.addColorStop(0, SHIRT_HI);
      bustGrad.addColorStop(1, SHIRT);
      ctx.beginPath();
      ctx.ellipse(bx, a.bustY + s.bust * 0.2, s.bust * 0.88, s.bust * 0.78, 0, 0, Math.PI * 2);
      ctx.fillStyle = bustGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // ── Neck ────────────────────────────────────────────────────────────────────
  const nkHW = Math.max(9, a.hH * 0.14 + s.ww * 0.04);
  const neckG = ctx.createLinearGradient(CX - nkHW, 0, CX + nkHW, 0);
  neckG.addColorStop(0,   SKIN_SHADE);
  neckG.addColorStop(0.4, SKIN_LIT);
  neckG.addColorStop(1,   SKIN_SHADE);
  ctx.beginPath();
  ctx.moveTo(CX - nkHW * 1.15, a.chinY + 1);
  ctx.bezierCurveTo(
    CX - nkHW * 1.1, a.chinY + 6,
    CX - nkHW, a.neckBotY - 4,
    CX - nkHW * 1.05, a.neckBotY,
  );
  ctx.lineTo(CX + nkHW * 1.05, a.neckBotY);
  ctx.bezierCurveTo(
    CX + nkHW, a.neckBotY - 4,
    CX + nkHW * 1.1, a.chinY + 6,
    CX + nkHW * 1.15, a.chinY + 1,
  );
  ctx.closePath();
  ctx.fillStyle = neckG;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // ── Female back hair (drawn BEFORE skull so face is never covered) ───────────
  if (g === 'female') {
    drawFemaleBackHair(ctx, a, a.hH * 0.70);
  }

  // ── Head ────────────────────────────────────────────────────────────────────
  drawHead(ctx, a, s, g);

  // ── BMI badge ───────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font = 'bold 11px system-ui, sans-serif';
  const tw  = ctx.measureText(bdg.label).width;
  const bx  = 14, by = H - 30, bp = 8;
  ctx.beginPath();
  ctx.roundRect(bx, by - 14, tw + bp * 2, 20, 6);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle   = bdg.fill;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle   = '#fff';
  ctx.fillText(bdg.label, bx + bp, by);
  ctx.restore();

  // ── Height label ─────────────────────────────────────────────────────────────
  ctx.save();
  ctx.font      = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(150,150,170,0.8)';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(heightCm)} cm`, W - 10, H - 14);
  ctx.restore();
}

// ── Torso ─────────────────────────────────────────────────────────────────────
function drawTorso(
  ctx: CanvasRenderingContext2D,
  a: Anchors, s: S, g: BodyGender,
  skinG: CanvasGradient,
) {
  // — Shirt (torso shape) —
  const shirtG = ctx.createLinearGradient(CX - s.sw, a.shoulderY, CX + s.sw, a.shoulderY);
  shirtG.addColorStop(0,   SHIRT);
  shirtG.addColorStop(0.5, SHIRT_HI);
  shirtG.addColorStop(1,   SHIRT);

  ctx.beginPath();
  // Left shoulder → left armpit → left waist → left hip → crotch-left
  ctx.moveTo(CX - s.sw * 0.26, a.neckBotY + 1);     // left neck-shoulder
  ctx.bezierCurveTo(
    CX - s.sw * 0.6,  a.shoulderY - 4,               // shoulder curve
    CX - s.sw - 2,    a.shoulderY + 6,
    CX - s.sw - 4,    a.underarmY - 10,              // shoulder point
  );
  ctx.bezierCurveTo(
    CX - s.cw - s.belly * 0.5, a.underarmY + 20,
    CX - s.ww - s.belly * 0.3, a.waistY - 20,
    CX - s.ww - s.belly * 0.2, a.waistY,             // waist
  );
  ctx.bezierCurveTo(
    CX - s.hw - s.belly * 0.1, a.waistY + 20,
    CX - s.hw,                  a.hipY - 10,
    CX - s.gap * 1.1,           a.crotchY,           // crotch left
  );
  ctx.lineTo(CX + s.gap * 1.1, a.crotchY);           // across crotch
  // Right hip → right waist → right armpit → right shoulder
  ctx.bezierCurveTo(
    CX + s.hw,                  a.hipY - 10,
    CX + s.hw + s.belly * 0.1, a.waistY + 20,
    CX + s.ww + s.belly * 0.2, a.waistY,
  );
  ctx.bezierCurveTo(
    CX + s.ww + s.belly * 0.3, a.waistY - 20,
    CX + s.cw + s.belly * 0.5, a.underarmY + 20,
    CX + s.sw + 4,              a.underarmY - 10,
  );
  ctx.bezierCurveTo(
    CX + s.sw + 2, a.shoulderY + 6,
    CX + s.sw * 0.6, a.shoulderY - 4,
    CX + s.sw * 0.26, a.neckBotY + 1,               // right neck-shoulder
  );
  ctx.closePath();
  ctx.fillStyle = shirtG;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // V-neck detail
  ctx.beginPath();
  ctx.moveTo(CX - s.sw * 0.20, a.neckBotY + 2);
  ctx.lineTo(CX, a.neckBotY + 16 + s.ww * 0.06);
  ctx.lineTo(CX + s.sw * 0.20, a.neckBotY + 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // Waist band / belt line
  ctx.beginPath();
  ctx.moveTo(CX - s.ww * 1.05, a.waistY + 8);
  ctx.bezierCurveTo(
    CX - s.ww * 0.5, a.waistY + 10,
    CX + s.ww * 0.5, a.waistY + 10,
    CX + s.ww * 1.05, a.waistY + 8,
  );
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 3;
  ctx.stroke();
}

// ── Leg ───────────────────────────────────────────────────────────────────────
function drawLeg(
  ctx: CanvasRenderingContext2D,
  lr: -1 | 1,   // -1 = left, 1 = right
  a: Anchors, s: S,
  skinG: CanvasGradient,
) {
  const lc = CX + lr * s.gap;   // leg centre X
  const ow = lr * s.tw;          // outer width (away from body centre)
  const iw = -lr * s.tw * 0.72; // inner width (toward centre)

  // — Thigh (skin) —
  const thighG = ctx.createLinearGradient(lc - Math.abs(ow), 0, lc + Math.abs(ow), 0);
  thighG.addColorStop(0,   SKIN_SHADE);
  thighG.addColorStop(0.45, SKIN_LIT);
  thighG.addColorStop(1,   SKIN_SHADE);

  // — Pants (thigh + knee area) —
  const pantsG = ctx.createLinearGradient(lc - Math.abs(ow), 0, lc + Math.abs(ow), 0);
  pantsG.addColorStop(0,   PANTS);
  pantsG.addColorStop(0.5, PANTS_HI);
  pantsG.addColorStop(1,   PANTS);

  // Outer thigh X curves
  const outTopX    = lc + ow;
  const outMidX    = lc + ow * 1.08;
  const outKneeX   = lc + lr * s.kw;
  const outAnkleX  = lc + lr * s.akw * 1.2;

  // Inner thigh X curves
  const inTopX    = lc + iw;
  const inMidX    = lc + iw * 1.08;
  const inKneeX   = lc - lr * s.kw * 0.85;
  const inAnkleX  = lc - lr * s.akw;

  // Calf
  const outCalfX   = lc + lr * s.vw;
  const inCalfX    = lc - lr * s.vw * 0.75;

  // PANTS: from crotch to knee
  const kneePad = 12;
  ctx.beginPath();
  ctx.moveTo(outTopX, a.crotchY - 4);
  ctx.bezierCurveTo(outMidX, a.crotchY + (a.kneeY - a.crotchY) * 0.35,
                    outKneeX + lr * 2, a.kneeY - kneePad,
                    outKneeX, a.kneeY + kneePad);
  ctx.lineTo(inKneeX, a.kneeY + kneePad);
  ctx.bezierCurveTo(inKneeX - lr * 2, a.kneeY - kneePad,
                    inMidX, a.crotchY + (a.kneeY - a.crotchY) * 0.35,
                    inTopX, a.crotchY - 4);
  ctx.closePath();
  ctx.fillStyle = pantsG;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // CALF (skin):
  ctx.beginPath();
  ctx.moveTo(outKneeX, a.kneeY + kneePad);
  ctx.bezierCurveTo(outCalfX + lr * 2, a.kneeY + (a.ankleY - a.kneeY) * 0.4,
                    outCalfX, a.ankleY - 10,
                    outAnkleX, a.ankleY);
  ctx.lineTo(inAnkleX, a.ankleY);
  ctx.bezierCurveTo(inCalfX, a.ankleY - 10,
                    inCalfX - lr * 2, a.kneeY + (a.ankleY - a.kneeY) * 0.4,
                    inKneeX, a.kneeY + kneePad);
  ctx.closePath();
  ctx.fillStyle = thighG;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // SHOE:
  const shoeG = ctx.createLinearGradient(lc - Math.abs(ow), 0, lc + Math.abs(ow), 0);
  shoeG.addColorStop(0,   SHOE_COL);
  shoeG.addColorStop(0.5, '#1a1a30');
  shoeG.addColorStop(1,   SHOE_COL);

  const shoeOut = outAnkleX + lr * 3;
  const shoeIn  = inAnkleX  - lr * 2;
  const toeX    = lc + lr * (s.akw * 1.6 + 8);

  ctx.beginPath();
  ctx.moveTo(outAnkleX, a.ankleY + 1);
  ctx.bezierCurveTo(shoeOut, a.ankleY + 8,  toeX, a.ankleY + 8,    toeX, a.footBotY - 7);
  ctx.bezierCurveTo(toeX, a.footBotY - 2,  inAnkleX + lr * 4, a.footBotY, inAnkleX, a.footBotY - 4);
  ctx.bezierCurveTo(shoeIn, a.footBotY - 8, inAnkleX, a.ankleY + 2, inAnkleX, a.ankleY);
  ctx.closePath();
  ctx.fillStyle   = shoeG;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Shoe sole accent
  ctx.beginPath();
  ctx.moveTo(outAnkleX - lr * 1, a.footBotY - 2);
  ctx.bezierCurveTo(toeX - lr * 2, a.footBotY + 1, inAnkleX + lr * 3, a.footBotY + 1, inAnkleX, a.footBotY - 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth   = 2;
  ctx.stroke();
}

// ── Arm ───────────────────────────────────────────────────────────────────────
function drawArm(
  ctx: CanvasRenderingContext2D,
  lr: -1 | 1,
  a: Anchors, s: S,
  skinG: CanvasGradient,
) {
  // Arm hangs at an angle: shoulder inward, hand lower-outward for relaxed pose
  const shoulderX = CX + lr * (s.sw - 2);
  const elbowX    = CX + lr * (s.sw + s.auw * 0.5 + 4);
  const wristX    = CX + lr * (s.sw + s.auw * 0.4 + 2);

  const armG = ctx.createLinearGradient(
    shoulderX - lr * s.auw, 0, shoulderX + lr * s.auw, 0
  );
  armG.addColorStop(0,   lr < 0 ? SKIN_LIT   : SKIN_SHADE);
  armG.addColorStop(0.5, SKIN_BASE);
  armG.addColorStop(1,   lr < 0 ? SKIN_SHADE : SKIN_LIT);

  const ouW = lr * s.auw;  // outer half-width direction
  const inW = -lr * s.auw * 0.70;

  // Upper arm
  ctx.beginPath();
  ctx.moveTo(shoulderX + ouW, a.underarmY - 8);   // outer shoulder
  ctx.bezierCurveTo(
    elbowX + ouW * 1.05, a.underarmY + (a.elbowY - a.underarmY) * 0.4,
    elbowX + ouW,         a.elbowY - 8,
    elbowX + lr * s.alw, a.elbowY,               // outer elbow
  );
  ctx.lineTo(elbowX - lr * s.alw * 0.8, a.elbowY);  // inner elbow
  ctx.bezierCurveTo(
    elbowX + inW, a.elbowY - 8,
    shoulderX + inW, a.underarmY + (a.elbowY - a.underarmY) * 0.35,
    shoulderX + inW, a.underarmY - 8,            // inner shoulder
  );
  ctx.closePath();
  ctx.fillStyle   = armG;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // Forearm
  const faG = ctx.createLinearGradient(
    wristX - lr * s.alw, 0, wristX + lr * s.alw, 0
  );
  faG.addColorStop(0,   lr < 0 ? SKIN_LIT   : SKIN_SHADE);
  faG.addColorStop(0.5, SKIN_BASE);
  faG.addColorStop(1,   lr < 0 ? SKIN_SHADE : SKIN_LIT);

  ctx.beginPath();
  ctx.moveTo(elbowX + lr * s.alw, a.elbowY);
  ctx.bezierCurveTo(
    wristX + lr * s.alw * 1.04, a.elbowY + (a.wristY - a.elbowY) * 0.4,
    wristX + lr * s.alw,         a.wristY - 5,
    wristX + lr * s.alw * 0.7,  a.wristY,
  );
  ctx.lineTo(wristX - lr * s.alw * 0.6, a.wristY);
  ctx.bezierCurveTo(
    wristX - lr * s.alw,         a.wristY - 5,
    elbowX - lr * s.alw * 0.85, a.elbowY + (a.wristY - a.elbowY) * 0.4,
    elbowX - lr * s.alw * 0.8,  a.elbowY,
  );
  ctx.closePath();
  ctx.fillStyle   = faG;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth   = 0.7;
  ctx.stroke();

  // Hand (simple oval)
  ctx.beginPath();
  ctx.ellipse(
    wristX + lr * s.alw * 0.08,
    a.handBotY - (a.handBotY - a.wristY) * 0.42,
    s.alw * 0.9,
    (a.handBotY - a.wristY) * 0.72,
    lr * 0.12, 0, Math.PI * 2,
  );
  ctx.fillStyle   = faG;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth   = 0.7;
  ctx.stroke();
}

// ── Head & face ────────────────────────────────────────────────────────────────
function drawHead(ctx: CanvasRenderingContext2D, a: Anchors, s: S, g: BodyGender) {
  const { hH, hHW, headCY } = a;
  const hHWg = g === 'female' ? hHW * 0.93 : hHW;  // female slightly narrower

  // ── Skull ──
  const headGrad = ctx.createRadialGradient(
    CX - hHWg * 0.25, headCY - hH * 0.2, 2,
    CX,               headCY,             hHWg * 1.4,
  );
  headGrad.addColorStop(0,   SKIN_LIT);
  headGrad.addColorStop(0.45, SKIN_BASE);
  headGrad.addColorStop(0.85, SKIN_SHADE);
  headGrad.addColorStop(1,   SKIN_DEEP);

  ctx.beginPath();
  // Slightly oval head: wider at cheeks, narrower at chin
  ctx.ellipse(CX, headCY - hH * 0.05, hHWg, hH * 0.54, 0, 0, Math.PI * 2);
  ctx.fillStyle = headGrad;
  ctx.fill();
  ctx.strokeStyle = SKIN_SHADE;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // ── Hair (front/top cap only — back hair drawn before skull in drawBody) ──
  drawHair(ctx, a, g, hHWg);

  // ── Ears ──
  for (const lr of [-1, 1] as const) {
    const earX = CX + lr * hHWg * 0.96;
    const earG = ctx.createRadialGradient(earX, headCY + hH * 0.05, 1, earX, headCY, hH * 0.15);
    earG.addColorStop(0,  SKIN_BASE);
    earG.addColorStop(1,  SKIN_SHADE);
    ctx.beginPath();
    ctx.ellipse(earX, headCY + hH * 0.06, hH * 0.10, hH * 0.16, lr * 0.18, 0, Math.PI * 2);
    ctx.fillStyle   = earG;
    ctx.fill();
    ctx.strokeStyle = SKIN_SHADE;
    ctx.lineWidth   = 0.6;
    ctx.stroke();
    // Inner ear detail
    ctx.beginPath();
    ctx.ellipse(earX + lr * 1, headCY + hH * 0.06, hH * 0.045, hH * 0.09, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(155,80,30,0.4)`;
    ctx.lineWidth   = 0.7;
    ctx.stroke();
  }

  // ── Face features ── (anatomically placed: eyes at 50% head height)
  const eyeY = headCY;                         // eyes at head vertical midpoint
  const eyeSpan = hHWg * 0.38;
  const eyeRW = hH * 0.11, eyeRH = hH * 0.075;

  // Brow ridge shadow
  for (const lr of [-1, 1] as const) {
    const ex = CX + lr * eyeSpan;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - eyeRH * 0.5, eyeRW * 1.1, eyeRH * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150,80,30,0.15)`;
    ctx.fill();
  }

  // Eyes
  for (const lr of [-1, 1] as const) {
    const ex = CX + lr * eyeSpan;

    // White
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, eyeRW, eyeRH, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f8f3ee';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,50,20,0.3)';
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    // Iris
    const irisR = eyeRH * 0.88;
    const irisG = ctx.createRadialGradient(ex - irisR * 0.2, eyeY - irisR * 0.2, 0, ex, eyeY, irisR);
    irisG.addColorStop(0, '#6b8fc4');
    irisG.addColorStop(0.7, '#3a5a90');
    irisG.addColorStop(1,  '#1e3360');
    ctx.beginPath();
    ctx.arc(ex, eyeY, irisR, 0, Math.PI * 2);
    ctx.fillStyle = irisG;
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.arc(ex, eyeY, irisR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a12';
    ctx.fill();

    // Specular highlight
    ctx.beginPath();
    ctx.arc(ex - irisR * 0.3, eyeY - irisR * 0.32, irisR * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.fill();

    // Eyelid line (upper)
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - eyeRH * 0.08, eyeRW, eyeRH, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = `rgba(50,20,10,${g === 'female' ? 0.75 : 0.5})`;
    ctx.lineWidth   = g === 'female' ? 1.3 : 0.9;
    ctx.stroke();

    // Lower lash line
    ctx.beginPath();
    ctx.ellipse(ex, eyeY + eyeRH * 0.05, eyeRW * 0.95, eyeRH * 0.7, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(80,35,15,0.25)';
    ctx.lineWidth   = 0.6;
    ctx.stroke();
  }

  // Eyebrows
  for (const lr of [-1, 1] as const) {
    const ex = CX + lr * eyeSpan;
    const browY = eyeY - eyeRH * 1.7;
    const browInner = ex - lr * eyeRW * 0.7;
    const browOuter = ex + lr * eyeRW * 0.7;
    const arch = g === 'female' ? -hH * 0.02 : -hH * 0.012;

    ctx.beginPath();
    ctx.moveTo(browInner, browY + hH * 0.01);
    ctx.quadraticCurveTo(ex, browY + arch, browOuter, browY + hH * 0.014);
    ctx.strokeStyle = HAIR_M;
    ctx.lineWidth   = g === 'female' ? 1.4 : 2.0;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.lineCap     = 'butt';
  }

  // Nose (subtle form-shading approach)
  const noseTip = eyeY + hH * 0.28;
  const noseW   = hH * 0.095;
  // Nose bridge shadow
  ctx.beginPath();
  ctx.moveTo(CX - noseW * 0.4, eyeY + hH * 0.05);
  ctx.bezierCurveTo(CX - noseW * 0.5, noseTip - hH * 0.06, CX - noseW, noseTip + hH * 0.01, CX - noseW * 0.85, noseTip);
  ctx.strokeStyle = `rgba(150,75,30,0.32)`;
  ctx.lineWidth   = 0.9;
  ctx.stroke();
  // Nose tip underside shadow
  ctx.beginPath();
  ctx.ellipse(CX, noseTip + hH * 0.022, noseW * 0.65, hH * 0.028, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(140,65,25,0.22)`;
  ctx.fill();
  // Nostril dots
  for (const lr of [-1, 1] as const) {
    ctx.beginPath();
    ctx.ellipse(CX + lr * noseW * 0.52, noseTip + hH * 0.015, hH * 0.025, hH * 0.018, lr * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,55,20,0.30)`;
    ctx.fill();
  }

  // Lips
  const lipY  = eyeY + hH * 0.47;
  const lipW  = noseW * 1.7;
  const cupH  = hH * 0.025; // cupid's bow depth
  const lipCol = g === 'female' ? '#c05070' : '#b07060';
  const lipShad = g === 'female' ? '#9a3050' : '#905040';

  // Upper lip
  ctx.beginPath();
  ctx.moveTo(CX - lipW, lipY);
  ctx.bezierCurveTo(CX - lipW * 0.6, lipY - cupH * 0.5, CX - lipW * 0.15, lipY - cupH, CX, lipY - cupH * 1.4);
  ctx.bezierCurveTo(CX + lipW * 0.15, lipY - cupH, CX + lipW * 0.6, lipY - cupH * 0.5, CX + lipW, lipY);
  ctx.bezierCurveTo(CX + lipW * 0.5, lipY + hH * 0.015, CX - lipW * 0.5, lipY + hH * 0.015, CX - lipW, lipY);
  ctx.fillStyle = lipCol;
  ctx.fill();

  // Lower lip
  ctx.beginPath();
  ctx.moveTo(CX - lipW * 0.9, lipY + hH * 0.01);
  ctx.bezierCurveTo(CX - lipW * 0.4, lipY + hH * 0.06, CX + lipW * 0.4, lipY + hH * 0.06, CX + lipW * 0.9, lipY + hH * 0.01);
  ctx.bezierCurveTo(CX + lipW * 0.5, lipY + hH * 0.072, CX - lipW * 0.5, lipY + hH * 0.072, CX - lipW * 0.9, lipY + hH * 0.01);
  ctx.fillStyle = lipShad;
  ctx.fill();

  // Lip highlight
  ctx.beginPath();
  ctx.ellipse(CX, lipY + hH * 0.034, lipW * 0.28, hH * 0.015, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${g === 'female' ? 0.35 : 0.10})`;
  ctx.fill();

  // Chin shadow
  ctx.beginPath();
  ctx.ellipse(CX, a.chinY - hH * 0.05, hHWg * 0.35, hH * 0.06, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(140,65,25,0.10)`;
  ctx.fill();

  // Cheek blush (female)
  if (g === 'female') {
    for (const lr of [-1, 1] as const) {
      const bx = CX + lr * hHWg * 0.62;
      const blushG = ctx.createRadialGradient(bx, eyeY + hH * 0.12, 0, bx, eyeY + hH * 0.12, hH * 0.18);
      blushG.addColorStop(0, 'rgba(220,100,100,0.18)');
      blushG.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.ellipse(bx, eyeY + hH * 0.12, hH * 0.18, hH * 0.10, 0, 0, Math.PI * 2);
      ctx.fillStyle = blushG;
      ctx.fill();
    }
  }
}

// ── Female back hair (drawn BEFORE skull) ────────────────────────────────────
// Only draws the SIDE and BOTTOM portions — the skull ellipse will be drawn
// on top and naturally cover the center, leaving only the outside visible.
function drawFemaleBackHair(ctx: CanvasRenderingContext2D, a: Anchors, hHW: number) {
  const { hH, headCY, chinY } = a;
  const hairG = ctx.createLinearGradient(CX, headCY - hH * 0.3, CX, chinY + hH * 0.5);
  hairG.addColorStop(0,   HAIR_M);
  hairG.addColorStop(0.4, HAIR_D);
  hairG.addColorStop(1,   HAIR_D);

  // Left side strand — stays outside the head oval
  ctx.beginPath();
  ctx.moveTo(CX - hHW * 0.65, headCY - hH * 0.28);
  ctx.bezierCurveTo(
    CX - hHW * 1.10, headCY + hH * 0.05,
    CX - hHW * 1.08, headCY + hH * 0.55,
    CX - hHW * 0.72, chinY + hH * 0.50,
  );
  ctx.bezierCurveTo(
    CX - hHW * 0.40, chinY + hH * 0.58,
    CX - hHW * 0.25, chinY + hH * 0.30,
    CX - hHW * 0.55, headCY + hH * 0.08,
  );
  ctx.bezierCurveTo(
    CX - hHW * 0.72, headCY - hH * 0.12,
    CX - hHW * 0.65, headCY - hH * 0.28,
    CX - hHW * 0.65, headCY - hH * 0.28,
  );
  ctx.fillStyle = hairG;
  ctx.fill();

  // Right side strand
  ctx.beginPath();
  ctx.moveTo(CX + hHW * 0.65, headCY - hH * 0.28);
  ctx.bezierCurveTo(
    CX + hHW * 1.10, headCY + hH * 0.05,
    CX + hHW * 1.08, headCY + hH * 0.55,
    CX + hHW * 0.72, chinY + hH * 0.50,
  );
  ctx.bezierCurveTo(
    CX + hHW * 0.40, chinY + hH * 0.58,
    CX + hHW * 0.25, chinY + hH * 0.30,
    CX + hHW * 0.55, headCY + hH * 0.08,
  );
  ctx.bezierCurveTo(
    CX + hHW * 0.72, headCY - hH * 0.12,
    CX + hHW * 0.65, headCY - hH * 0.28,
    CX + hHW * 0.65, headCY - hH * 0.28,
  );
  ctx.fillStyle = hairG;
  ctx.fill();
}

// ── Hair (front/top cap only) ────────────────────────────────────────────────
function drawHair(
  ctx: CanvasRenderingContext2D,
  a: Anchors,
  g: BodyGender,
  hHW: number,
) {
  const { hH, headCY } = a;
  const topY = headCY - hH * 0.50;

  if (g === 'male') {
    // Short hair: scalp cap
    const hairG = ctx.createRadialGradient(CX - hHW * 0.3, topY, 2, CX, headCY - hH * 0.2, hHW * 1.3);
    hairG.addColorStop(0,  HAIR_M);
    hairG.addColorStop(0.6, HAIR_D);
    hairG.addColorStop(1,  HAIR_D);

    ctx.beginPath();
    ctx.moveTo(CX - hHW * 0.70, headCY - hH * 0.12);
    ctx.bezierCurveTo(
      CX - hHW * 0.88, headCY - hH * 0.24,
      CX - hHW * 0.72, topY + hH * 0.04,
      CX - hHW * 0.30, topY,
    );
    ctx.bezierCurveTo(CX - hHW * 0.1, topY - hH * 0.04, CX + hHW * 0.1, topY - hH * 0.04, CX + hHW * 0.30, topY);
    ctx.bezierCurveTo(
      CX + hHW * 0.72, topY + hH * 0.04,
      CX + hHW * 0.88, headCY - hH * 0.24,
      CX + hHW * 0.70, headCY - hH * 0.12,
    );
    ctx.closePath();
    ctx.fillStyle = hairG;
    ctx.fill();

    // Subtle strand lines
    ctx.strokeStyle = HAIR_D;
    ctx.lineWidth   = 0.6;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(CX + i * hHW * 0.3, topY + hH * 0.02);
      ctx.bezierCurveTo(CX + i * hHW * 0.4, topY + hH * 0.12, CX + i * hHW * 0.5, headCY - hH * 0.18, CX + i * hHW * 0.65, headCY - hH * 0.1);
      ctx.stroke();
    }
  } else {
    // Female: top cap (sides come from back hair drawn before skull)
    const hairG = ctx.createRadialGradient(CX - hHW * 0.25, topY, 2, CX, headCY - hH * 0.1, hHW * 1.2);
    hairG.addColorStop(0,  HAIR_M);
    hairG.addColorStop(0.5, HAIR_D);
    hairG.addColorStop(1,  HAIR_D);

    ctx.beginPath();
    ctx.moveTo(CX - hHW * 0.70, headCY - hH * 0.10);
    ctx.bezierCurveTo(
      CX - hHW * 0.86, headCY - hH * 0.26,
      CX - hHW * 0.60, topY - hH * 0.02,
      CX, topY - hH * 0.04,
    );
    ctx.bezierCurveTo(
      CX + hHW * 0.60, topY - hH * 0.02,
      CX + hHW * 0.86, headCY - hH * 0.26,
      CX + hHW * 0.70, headCY - hH * 0.10,
    );
    ctx.closePath();
    ctx.fillStyle = hairG;
    ctx.fill();

    // Parting / highlight
    ctx.beginPath();
    ctx.ellipse(CX - hHW * 0.12, topY + hH * 0.07, hHW * 0.20, hH * 0.055, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,42,15,0.5)';
    ctx.fill();
  }
}

// ── Animation state ───────────────────────────────────────────────────────────
interface AnimState {
  cur: S; target: S;
  gender: BodyGender;
  bmi: number; height: number;
  rafId: number;
}

let state: AnimState | null = null;
let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;

function animLoop() {
  if (!state || !_ctx) return;
  let settled = true;
  for (const k of Object.keys(state.cur) as (keyof S)[]) {
    const diff = (state.target[k] as number) - (state.cur[k] as number);
    if (Math.abs(diff) > 0.06) {
      (state.cur[k] as number) += diff * 0.12;
      settled = false;
    } else {
      (state.cur[k] as number) = state.target[k] as number;
    }
  }
  drawBody(_ctx, state.cur, state.gender, state.bmi, state.height);
  state.rafId = settled ? 0 : requestAnimationFrame(animLoop);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function initBodyViz(canvas: HTMLCanvasElement) {
  _canvas = canvas;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.cssText = `width:${W}px;height:${H}px;display:block;`;
  _ctx = canvas.getContext('2d')!;
  _ctx.imageSmoothingEnabled = true;
  _ctx.imageSmoothingQuality = 'high';

  const init = deriveShape('male', 22);
  state = { cur: { ...init }, target: { ...init }, gender: 'male', bmi: 22, height: 170, rafId: 0 };
  drawBody(_ctx, state.cur, 'male', 22, 170);
}

export function updateBodyViz(p: BodyParams) {
  if (!state || !_ctx) return;
  state.target = deriveShape(p.gender, p.bmi, p.waistCm);
  state.gender = p.gender;
  state.bmi    = p.bmi;
  state.height = p.heightCm;
  if (state.rafId === 0) state.rafId = requestAnimationFrame(animLoop);
}
