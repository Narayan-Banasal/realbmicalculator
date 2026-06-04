export type UnitSystem = 'metric' | 'us';
export type BmiCategoryId = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface BmiCategory {
  id: BmiCategoryId;
  label: string;
  shortLabel: string;
  min: number;
  max: number;
  color: string;
  description: string;
  healthNote: string;
  exampleBmi: number;
  alertLevel: 'none' | 'caution' | 'critical';
}

export const BMI_CATEGORIES: BmiCategory[] = [
  {
    id: 'underweight',
    label: 'Underweight',
    shortLabel: 'Under',
    min: 0,
    max: 18.5,
    color: '#3b82f6',
    description: 'Below the healthy range — may indicate insufficient nutrition or other factors.',
    healthNote: 'Consider speaking with a clinician if unintentional weight loss is involved.',
    exampleBmi: 17.2,
    alertLevel: 'caution',
  },
  {
    id: 'normal',
    label: 'Normal weight',
    shortLabel: 'Healthy',
    min: 18.5,
    max: 25,
    color: '#10b981',
    description: 'Within the WHO healthy range for most adults.',
    healthNote: 'BMI is a screening tool — muscle mass and body composition still matter.',
    exampleBmi: 22.4,
    alertLevel: 'none',
  },
  {
    id: 'overweight',
    label: 'Overweight',
    shortLabel: 'Over',
    min: 25,
    max: 30,
    color: '#f59e0b',
    description: 'Above the healthy range — elevated risk for some conditions over time.',
    healthNote: 'Lifestyle changes and medical guidance can help reduce long-term risk.',
    exampleBmi: 27.5,
    alertLevel: 'caution',
  },
  {
    id: 'obese',
    label: 'Obese',
    shortLabel: 'Obese',
    min: 30,
    max: 60,
    color: '#ef4444',
    description: 'Significantly above the healthy range — higher associated health risks.',
    healthNote: 'We recommend discussing results with a healthcare provider.',
    exampleBmi: 33.8,
    alertLevel: 'critical',
  },
];

export function categorize(bmi: number): BmiCategory {
  if (bmi < 18.5) return BMI_CATEGORIES[0];
  if (bmi < 25) return BMI_CATEGORIES[1];
  if (bmi < 30) return BMI_CATEGORIES[2];
  return BMI_CATEGORIES[3];
}

export function markerPosition(bmi: number, min = 15, max = 40): number {
  return Math.min(100, Math.max(0, ((bmi - min) / (max - min)) * 100));
}

export function healthyWeightRangeKg(heightM: number): { lo: number; hi: number } {
  return {
    lo: 18.5 * heightM * heightM,
    hi: 24.9 * heightM * heightM,
  };
}

export function calcBmiMetric(cm: number, kg: number): { bmi: number; heightM: number } | null {
  if (cm <= 0 || kg <= 0) return null;
  const heightM = cm / 100;
  return { bmi: kg / (heightM * heightM), heightM };
}

export function calcBmiUs(ft: number, inch: number, lb: number): { bmi: number; heightM: number } | null {
  const totalIn = ft * 12 + inch;
  if (totalIn <= 0 || lb <= 0) return null;
  const heightM = totalIn * 0.0254;
  return { bmi: (703 * lb) / (totalIn * totalIn), heightM };
}

export function kgToLb(kg: number): number {
  return kg * 2.20462;
}

export function lbToKg(lb: number): number {
  return lb / 2.20462;
}

export function cmToFeetIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn % 12);
  return { ft, inch: inch === 12 ? 0 : inch };
}

export function feetInToCm(ft: number, inch: number): number {
  return (ft * 12 + inch) * 2.54;
}

export function shouldTriggerAlert(bmi: number): 'critical' | 'caution' | null {
  if (bmi >= 35 || bmi < 16) return 'critical';
  if (bmi >= 30 || bmi < 17) return 'caution';
  return null;
}