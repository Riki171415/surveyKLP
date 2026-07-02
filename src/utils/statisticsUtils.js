// src/utils/statisticsUtils.js

/**
 * Shuffle array using Fisher-Yates
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 1. Random Sampling (1:1)
 * Takes a random sample of the larger group to match the size of the smaller group.
 */
export function performRandomSampling(dataset, treatmentFn) {
  const treatment = dataset.filter(treatmentFn);
  const control = dataset.filter(d => !treatmentFn(d));

  const minSize = Math.min(treatment.length, control.length);
  
  const sampledTreatment = shuffleArray(treatment).slice(0, minSize);
  const sampledControl = shuffleArray(control).slice(0, minSize);

  return [...sampledTreatment, ...sampledControl];
}

/**
 * Calculate Propensity Score using a Naive Bayes approximation for categorical covariates.
 * P(T=1 | X) = P(X | T=1) * P(T=1) / (P(X|T=1)*P(T=1) + P(X|T=0)*P(T=0))
 */
function calculatePropensityScores(dataset, treatmentFn, covariates) {
  const treatment = dataset.filter(treatmentFn);
  const control = dataset.filter(d => !treatmentFn(d));

  const pT1 = treatment.length / dataset.length;
  const pT0 = control.length / dataset.length;

  const probs = {};

  covariates.forEach(cov => {
    probs[cov] = { t1: {}, t0: {} };
    // Frequencies in Treatment
    treatment.forEach(d => {
      const val = d[cov] || 'unknown';
      probs[cov].t1[val] = (probs[cov].t1[val] || 0) + 1;
    });
    // Frequencies in Control
    control.forEach(d => {
      const val = d[cov] || 'unknown';
      probs[cov].t0[val] = (probs[cov].t0[val] || 0) + 1;
    });

    // Convert to probabilities with Laplace smoothing
    const uniqueVals = new Set([...Object.keys(probs[cov].t1), ...Object.keys(probs[cov].t0)]);
    const v = uniqueVals.size;
    
    uniqueVals.forEach(val => {
      probs[cov].t1[val] = ((probs[cov].t1[val] || 0) + 1) / (treatment.length + v);
      probs[cov].t0[val] = ((probs[cov].t0[val] || 0) + 1) / (control.length + v);
    });
  });

  // Calculate score for each item
  return dataset.map(d => {
    let pX_T1 = 1;
    let pX_T0 = 1;

    covariates.forEach(cov => {
      const val = d[cov] || 'unknown';
      pX_T1 *= probs[cov].t1[val] || (1 / (treatment.length + 1));
      pX_T0 *= probs[cov].t0[val] || (1 / (control.length + 1));
    });

    const numerator = pX_T1 * pT1;
    const denominator = numerator + (pX_T0 * pT0);
    const score = denominator === 0 ? 0 : numerator / denominator;

    return { ...d, _propensityScore: score };
  });
}

/**
 * 2. Propensity Score Matching (Nearest Neighbor 1:1)
 */
export function performPSM(dataset, treatmentFn, covariates) {
  const scoredData = calculatePropensityScores(dataset, treatmentFn, covariates);
  
  let treatment = scoredData.filter(treatmentFn);
  let control = scoredData.filter(d => !treatmentFn(d));

  const matched = [];
  
  // To avoid mutating the original arrays while finding matches
  let availableControls = [...control];

  // Match each treatment to the closest control
  treatment.forEach(t => {
    if (availableControls.length === 0) return;

    let bestMatchIdx = 0;
    let minDiff = Infinity;

    availableControls.forEach((c, idx) => {
      const diff = Math.abs(t._propensityScore - c._propensityScore);
      if (diff < minDiff) {
        minDiff = diff;
        bestMatchIdx = idx;
      }
    });

    matched.push(t);
    matched.push(availableControls[bestMatchIdx]);
    
    // Remove matched control
    availableControls.splice(bestMatchIdx, 1);
  });

  return matched;
}

/**
 * 3. Inverse Probability Weighting (IPW)
 * Adds `_weight` property to dataset.
 */
export function performIPW(dataset, treatmentFn, covariates) {
  const scoredData = calculatePropensityScores(dataset, treatmentFn, covariates);
  
  return scoredData.map(d => {
    const isT = treatmentFn(d);
    // Add small epsilon to avoid division by zero or infinity
    const ps = Math.max(0.01, Math.min(0.99, d._propensityScore));
    const weight = isT ? 1 / ps : 1 / (1 - ps);
    
    return { ...d, _weight: weight };
  });
}

/**
 * 4. Stratified Analysis (Exact Matching)
 * Keeps only records that belong to a strata (combination of covariates)
 * that contains AT LEAST ONE treatment and AT LEAST ONE control.
 */
export function performStratifiedMatching(dataset, treatmentFn, covariates) {
  const strata = {};

  dataset.forEach(d => {
    const key = covariates.map(cov => d[cov] || 'unknown').join('|');
    if (!strata[key]) strata[key] = { treatment: [], control: [] };
    
    if (treatmentFn(d)) {
      strata[key].treatment.push(d);
    } else {
      strata[key].control.push(d);
    }
  });

  let matched = [];
  
  Object.values(strata).forEach(group => {
    // Only include if both treatment and control exist in this strata
    if (group.treatment.length > 0 && group.control.length > 0) {
      // Optional: balance them by taking min(T, C)
      const minSize = Math.min(group.treatment.length, group.control.length);
      const sampledT = shuffleArray(group.treatment).slice(0, minSize);
      const sampledC = shuffleArray(group.control).slice(0, minSize);
      
      matched = matched.concat(sampledT, sampledC);
    }
  });

  return matched;
}
