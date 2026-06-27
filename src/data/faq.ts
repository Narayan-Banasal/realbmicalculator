export const faqItems = [
  {
    question: "What is BMI?",
    answer:
      "BMI (Body Mass Index) is a number calculated from your height and weight. It is widely used as a screening tool to estimate whether a person is underweight, normal weight, overweight, or obese. The WHO and CDC use it for population-level health screening.",
  },
  {
    question: "How do I calculate BMI?",
    answer:
      "Metric: BMI = weight in kilograms ÷ (height in meters)². Imperial: BMI = 703 × weight in pounds ÷ (height in inches)². Our calculator updates your result instantly as you move the sliders or type values.",
  },
  {
    question: "What is a healthy BMI?",
    answer:
      "For most adults, WHO defines a healthy BMI as 18.5 to 24.9. Below 18.5 is underweight; 25–29.9 is overweight; 30 or above is obese. Individual health depends on many factors beyond BMI alone, including muscle mass, age, and body fat distribution.",
  },
  {
    question: "Is BMI accurate for everyone?",
    answer:
      "No. BMI does not distinguish muscle from fat. Athletes and bodybuilders often register as 'overweight' or 'obese' despite low body fat. Older adults may have a normal BMI but elevated fat mass. It also doesn't account for fat distribution — abdominal fat carries higher metabolic risk than hip fat.",
  },
  {
    question: "What is the BMI formula in kg and cm?",
    answer:
      "Divide weight (kg) by the square of height (m). Convert cm to m first — divide by 100. Example: 70 kg and 175 cm → 70 ÷ (1.75 × 1.75) = 70 ÷ 3.0625 ≈ 22.9.",
  },
  {
    question: "What is the BMI formula in pounds and inches?",
    answer:
      "BMI = (weight in lbs × 703) ÷ (height in inches)². Example: 5'9\" (69 inches) and 160 lbs → (160 × 703) ÷ (69 × 69) = 112,480 ÷ 4,761 ≈ 23.6.",
  },
  {
    question: "Can I use this BMI calculator for children?",
    answer:
      "This tool is designed for adults aged 18 and older. Children and teens need age- and sex-specific BMI percentiles, because their healthy range changes as they grow. Consult your paediatrician for an age-appropriate assessment.",
  },
  {
    question: "What is BMI Prime?",
    answer:
      "BMI Prime is your BMI divided by 25 (the upper limit of the normal range). A value below 1.0 means you are within or below the normal range; above 1.0 means you are in the overweight or obese range. It lets you compare across populations more easily.",
  },
  {
    question: "What is ideal body weight?",
    answer:
      "Ideal body weight (IBW) estimates the optimal weight for a given height, independent of BMI. A common formula (Devine) for men: 50 kg + 2.3 kg per inch over 5 feet. For women: 45.5 kg + 2.3 kg per inch over 5 feet. Our calculator shows this alongside your BMI result.",
  },
  {
    question: "How often should I check my BMI?",
    answer:
      "Checking every 1–3 months is enough for most people who are monitoring a health goal. Day-to-day fluctuations from water retention and food can distort the reading. Focus on the trend over weeks rather than a single number.",
  },
  {
    question: "Does BMI differ for men and women?",
    answer:
      "The mathematical formula is the same. However, women naturally carry more body fat than men at the same BMI, due to differences in hormones and reproductive physiology. Some researchers use body-fat percentage or waist-to-height ratio as better gender-specific measures.",
  },
  {
    question: "What BMI is considered morbidly obese?",
    answer:
      "A BMI of 40 or above is classified as Class III obesity (sometimes called morbid obesity). BMI 35–39.9 is Class II. BMI 30–34.9 is Class I. All three classes carry elevated health risks and may qualify for medical weight management.",
  },
  {
    question: "Can BMI be used during pregnancy?",
    answer:
      "No. Weight gain is expected and healthy during pregnancy, so BMI is not a useful indicator during that period. Pre-pregnancy BMI is used to guide recommended weight-gain ranges, but your obstetrician is the right person to track pregnancy weight goals.",
  },
  {
    question: "Does ethnicity affect BMI interpretation?",
    answer:
      "Yes. Research shows that people of Asian descent may experience higher metabolic risk at lower BMI thresholds. The WHO recommends lower BMI cut-points for Asian populations (e.g., overweight from BMI 23, obese from BMI 27.5). Our calculator uses the standard WHO thresholds for all adults.",
  },
  {
    question: "Is this calculator free and private?",
    answer:
      "Yes. All calculations happen instantly in your browser — no data is sent to a server. Your height and weight are never stored online. We use localStorage only to remember your unit preference (kg vs lb) and your recent BMI history on your own device.",
  },
  {
    question: "What does BMI not measure?",
    answer:
      "BMI does not measure body fat percentage, muscle mass, bone density, fat distribution, cardiovascular fitness, blood pressure, blood sugar, or any metabolic marker. It is a simple screening number — use it as a starting point, not a diagnosis.",
  },
] as const;