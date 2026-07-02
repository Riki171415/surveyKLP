import { jStat } from 'jstat';

/**
 * Calculates the Standardized Mean Difference (SMD) for covariates.
 * Useful for Love Plots.
 */
export function calculateSMD(dataset, treatmentFn, covariates) {
  const treatment = [];
  const control = [];

  dataset.forEach(d => {
    const isT = treatmentFn(d);
    const w = d._weight || 1;
    // We duplicate or fractionalize based on weight for simple stats,
    // but mathematically we compute weighted mean and variance.
    if (isT) treatment.push({ ...d, w });
    else control.push({ ...d, w });
  });

  const getWeightedStats = (arr, valFn) => {
    let sumW = 0, sumWX = 0;
    arr.forEach(d => {
      const v = valFn(d);
      sumW += d.w;
      sumWX += d.w * v;
    });
    if (sumW === 0) return { mean: 0, variance: 0 };
    const mean = sumWX / sumW;

    let sumWXX = 0;
    arr.forEach(d => {
      const v = valFn(d);
      sumWXX += d.w * Math.pow(v - mean, 2);
    });
    const variance = sumWXX / sumW;
    return { mean, variance };
  };

  const results = [];

  covariates.forEach(cov => {
    // Determine unique categories
    const uniqueVals = new Set(dataset.map(d => d[cov] || 'Unknown'));
    uniqueVals.forEach(val => {
      const valFn = d => (d[cov] === val ? 1 : 0);
      const tStats = getWeightedStats(treatment, valFn);
      const cStats = getWeightedStats(control, valFn);

      const pooledSD = Math.sqrt((tStats.variance + cStats.variance) / 2);
      const smd = pooledSD === 0 ? 0 : Math.abs(tStats.mean - cStats.mean) / pooledSD;

      results.push({
        variable: `${cov}: ${val}`,
        smd: isNaN(smd) ? 0 : smd,
        tMean: tStats.mean,
        cMean: cStats.mean
      });
    });
  });

  return results.sort((a, b) => b.smd - a.smd); // Sort by highest imbalance
}

/**
 * Group Propensity Scores into bins for Histogram
 */
export function getPropensityScoreHistogram(dataset, treatmentFn) {
  const bins = Array.from({ length: 10 }, (_, i) => ({
    bin: `${(i / 10).toFixed(1)} - ${((i + 1) / 10).toFixed(1)}`,
    Ada: 0,
    Tanpa: 0
  }));

  dataset.forEach(d => {
    const ps = d._propensityScore || 0;
    let binIdx = Math.floor(ps * 10);
    if (binIdx >= 10) binIdx = 9;
    if (binIdx < 0) binIdx = 0;

    const w = d._weight || 1;
    if (treatmentFn(d)) {
      bins[binIdx].Ada += w;
    } else {
      bins[binIdx].Tanpa += w;
    }
  });

  // Round values
  return bins.map(b => ({ ...b, Ada: Number(b.Ada.toFixed(1)), Tanpa: Number(b.Tanpa.toFixed(1)) }));
}

/**
 * Perform a weighted T-Test for a continuous outcome
 */
export function performTTest(dataset, treatmentFn, outcomeFn) {
  let sumW_T = 0, sumWX_T = 0, sumWXX_T = 0;
  let sumW_C = 0, sumWX_C = 0, sumWXX_C = 0;
  
  dataset.forEach(d => {
    const isT = treatmentFn(d);
    const w = d._weight || 1;
    const x = outcomeFn(d);
    if (isNaN(x)) return;

    if (isT) {
      sumW_T += w;
      sumWX_T += w * x;
      sumWXX_T += w * x * x;
    } else {
      sumW_C += w;
      sumWX_C += w * x;
      sumWXX_C += w * x * x;
    }
  });

  if (sumW_T === 0 || sumW_C === 0) return null;

  const mean_T = sumWX_T / sumW_T;
  const mean_C = sumWX_C / sumW_C;

  // Weighted variance estimation
  const var_T = (sumWXX_T - (sumWX_T * sumWX_T) / sumW_T) / (sumW_T - 1);
  const var_C = (sumWXX_C - (sumWX_C * sumWX_C) / sumW_C) / (sumW_C - 1);

  // Welch's t-test
  const se_T = var_T / sumW_T; // Using sumW as approx N
  const se_C = var_C / sumW_C;
  
  const se = Math.sqrt(se_T + se_C);
  const tStat = se === 0 ? 0 : (mean_T - mean_C) / se;
  
  // Degrees of freedom (Welch-Satterthwaite)
  let df = 1000; // fallback
  if (se_T + se_C > 0) {
    df = Math.pow(se_T + se_C, 2) / 
         ((Math.pow(se_T, 2) / (sumW_T - 1)) + (Math.pow(se_C, 2) / (sumW_C - 1)));
  }

  const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));

  return {
    meanT: mean_T,
    meanC: mean_C,
    diff: mean_T - mean_C,
    tStat,
    pValue,
    isSignificant: pValue < 0.05
  };
}

/**
 * Basic Matrix Operations for Regression
 */
const transpose = m => m[0].map((_, i) => m.map(row => row[i]));
const multiply = (a, b) => a.map(row => transpose(b).map(col => row.reduce((sum, val, i) => sum + val * col[i], 0)));

// Inverse of a matrix using Gauss-Jordan (with partial pivoting and ridge penalty to prevent singularity)
function invertMatrix(M) {
  const n = M.length;
  const I = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const A = M.map((row, i) => [...row, ...I[i]]);

  for (let i = 0; i < n; i++) {
    // Add small ridge penalty if diagonal is exactly 0
    if (A[i][i] === 0) A[i][i] = 1e-8;
    
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
    }
    
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    
    if (Math.abs(A[i][i]) < 1e-10) {
      // Singular matrix fallback, add ridge
      A[i][i] += 1e-5;
    }
    
    const diag = A[i][i];
    for (let k = 0; k < 2 * n; k++) A[i][k] /= diag;
    
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = A[k][i];
        for (let j = 0; j < 2 * n; j++) A[k][j] -= factor * A[i][j];
      }
    }
  }
  return A.map(row => row.slice(n));
}

/**
 * Multivariate Linear Regression: Y = X * B + e
 */
export function performMultivariateRegression(dataset, treatmentFn, outcomeFn, categoricalCovariates) {
  // Extract Y
  const Y = dataset.map(d => [outcomeFn(d) || 0]);
  
  // Extract X
  // 1. Intercept
  // 2. Treatment (has_spkklp)
  // 3. Dummies for covariates
  
  const uniqueCats = {};
  categoricalCovariates.forEach(cov => {
    uniqueCats[cov] = Array.from(new Set(dataset.map(d => d[cov] || 'Unknown')));
    // Drop first category to avoid multicollinearity (dummy variable trap)
    uniqueCats[cov].shift(); 
  });

  const X = dataset.map(d => {
    const row = [1, treatmentFn(d) ? 1 : 0]; // Intercept and Treatment
    categoricalCovariates.forEach(cov => {
      const val = d[cov] || 'Unknown';
      uniqueCats[cov].forEach(cat => {
        row.push(val === cat ? 1 : 0);
      });
    });
    return row;
  });

  // Calculate Beta = (X^T * X)^-1 * X^T * Y
  const Xt = transpose(X);
  const XtX = multiply(Xt, X);
  
  // Add small ridge to diagonal to prevent singularity issues with many sparse dummies
  for(let i=0; i<XtX.length; i++) XtX[i][i] += 1e-6; 

  const XtX_inv = invertMatrix(XtX);
  const XtY = multiply(Xt, Y);
  const Beta = multiply(XtX_inv, XtY).map(r => r[0]);

  // Calculate Standard Errors
  const N = X.length;
  const K = X[0].length;
  
  const Y_pred = multiply(X, Beta.map(b => [b]));
  let rss = 0;
  for (let i = 0; i < N; i++) rss += Math.pow(Y[i][0] - Y_pred[i][0], 2);
  const sigma2 = rss / (N - K);

  const varBeta = XtX_inv.map(row => row.map(val => val * sigma2));
  const seBeta = varBeta.map((row, i) => Math.sqrt(row[i]));

  // T-stats and P-values
  const df = N - K;
  const tStats = Beta.map((b, i) => b / seBeta[i]);
  const pValues = tStats.map(t => 2 * (1 - jStat.studentt.cdf(Math.abs(t), df)));

  // Return the coefficient for Treatment (which is index 1)
  return {
    treatmentEffect: Beta[1],
    standardError: seBeta[1],
    tStat: tStats[1],
    pValue: pValues[1],
    isSignificant: pValues[1] < 0.05,
    rSquared: 1 - (rss / (jStat.variance(Y.map(y=>y[0])) * N)) // Approx R^2
  };
}
