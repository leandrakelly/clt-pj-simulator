export const CONSTANTS = {
  MINIMUM_WAGE: 1518.0,
  MAX_INSS: 8157.41,
  IRRF_SIMPLIFIED_DISCOUNT: 564.8,
  DEDUCTION_PER_DEPENDENT: 189.59,
};

const INSS_TABLE = [
  { limit: 1518.0, rate: 0.075 },
  { limit: 2793.88, rate: 0.09 },
  { limit: 4190.83, rate: 0.12 },
  { limit: Infinity, rate: 0.14 },
];

const IRRF_TABLE = [
  { limit: 2259.2, rate: 0, deduction: 0 },
  { limit: 2826.65, rate: 0.075, deduction: 169.44 },
  { limit: 3751.05, rate: 0.15, deduction: 381.44 },
  { limit: 4664.68, rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.0 },
];

/**
 * Simples Nacional Tables (Annexes III and V) - LC nº 123/2006
 * (Current values, RBT12 brackets rarely change annually)
 * Formula: (RBT12 * NominalRate - Deduction) / RBT12
 */
const SIMPLES_ANEXO_III = [
  { limit: 180000, rate: 0.06, deduction: 0 },
  { limit: 360000, rate: 0.112, deduction: 9360 },
  { limit: 720000, rate: 0.135, deduction: 17640 },
  { limit: 1800000, rate: 0.16, deduction: 35640 },
  { limit: 3600000, rate: 0.21, deduction: 125640 },
  { limit: 4800000, rate: 0.33, deduction: 648000 },
];

const SIMPLES_ANEXO_V = [
  { limit: 180000, rate: 0.155, deduction: 0 },
  { limit: 360000, rate: 0.18, deduction: 4500 },
  { limit: 720000, rate: 0.195, deduction: 9900 },
  { limit: 1800000, rate: 0.205, deduction: 17100 },
  { limit: 3600000, rate: 0.23, deduction: 62100 },
  { limit: 4800000, rate: 0.305, deduction: 540000 },
];

export interface CLTResult {
  grossSalary: number;
  benefits: number;
  inss: number;
  irrf: number;
  netSalary: number;
  netTotalMonthly: number;
  net13th: number;
  netVacation: number;
  totalYearlyNet: number;
}

export interface PJResult {
  grossInvoice: number;
  taxModel: 'Simples Nacional (Anexo III)' | 'Simples Nacional (Anexo V)';
  effectiveTaxRate: number;
  taxes: number;
  proLabore: number;
  inssProLabore: number;
  irrfProLabore: number;
  accountantCost: number;
  netIncome: number;
  totalYearlyNet: number;
}

/**
 * Calculates Progressive INSS (Social Security).
 * The calculation is done slice by slice of the salary.
 */
function calculateINSS(gross: number): number {
  const base = Math.min(gross, CONSTANTS.MAX_INSS);
  let tax = 0;
  let previousLimit = 0;

  for (const range of INSS_TABLE) {
    if (base > previousLimit) {
      const taxableSlice = Math.min(base, range.limit) - previousLimit;
      tax += taxableSlice * range.rate;
      previousLimit = range.limit;
    }
  }
  return tax;
}

/**
 * Calculates IRRF comparing Legal Model vs. Simplified Model.
 * The government always applies whichever is more beneficial (lower tax) for the taxpayer.
 */
function calculateIRRF(gross: number, inss: number): number {
  const legalBase = gross - inss;
  let legalTax = 0;

  for (const range of IRRF_TABLE) {
    if (legalBase <= range.limit) {
      legalTax = legalBase * range.rate - range.deduction;
      break;
    }
    if (range.limit === Infinity) {
      legalTax = legalBase * range.rate - range.deduction;
    }
  }

  const simpleBase = gross - CONSTANTS.IRRF_SIMPLIFIED_DISCOUNT;
  let simpleTax = 0;

  for (const range of IRRF_TABLE) {
    if (simpleBase <= range.limit) {
      simpleTax = simpleBase * range.rate - range.deduction;
      break;
    }
    if (range.limit === Infinity) {
      simpleTax = simpleBase * range.rate - range.deduction;
    }
  }

  return Math.max(0, Math.min(legalTax, simpleTax));
}

/**
 * Calculates the effective rate for Simples Nacional using the official formula.
 * Effective Rate = (RBT12 * NominalRate - Deduction) / RBT12
 */
function getSimplesEffectiveRate(
  annualRevenue: number,
  annex: 'III' | 'V',
): number {
  const table = annex === 'III' ? SIMPLES_ANEXO_III : SIMPLES_ANEXO_V;

  const bracket =
    table.find((item) => annualRevenue <= item.limit) ||
    table[table.length - 1];

  const effectiveRate =
    (annualRevenue * bracket.rate - bracket.deduction) / annualRevenue;

  return effectiveRate;
}

export function calculateCLT(
  grossSalary: number,
  benefits: number = 0,
): CLTResult {
  const inss = calculateINSS(grossSalary);
  const irrf = calculateIRRF(grossSalary, inss);
  const netSalary = grossSalary - inss - irrf;

  const netTotalMonthly = netSalary + benefits;

  const inss13 = calculateINSS(grossSalary);
  const irrf13 = calculateIRRF(grossSalary, inss13);
  const net13th = grossSalary - inss13 - irrf13;

  const vacationGross = grossSalary + grossSalary / 3;
  const inssVacation = calculateINSS(vacationGross);
  const irrfVacation = calculateIRRF(vacationGross, inssVacation);
  const netVacation = vacationGross - inssVacation - irrfVacation;

  const totalYearlyNet =
    netSalary * 12 + benefits * 12 + net13th + (netVacation - netSalary);

  return {
    grossSalary,
    benefits,
    inss,
    irrf,
    netSalary,
    netTotalMonthly,
    net13th,
    netVacation,
    totalYearlyNet,
  };
}

export function calculatePJ(
  grossInvoice: number,
  accountantCost: number = 300,
): PJResult {
  const annualRevenue = grossInvoice * 12;

  // --- FACTOR R STRATEGY ---
  // To qualify for Annex III (cheaper), the payroll (Pro-labore + INSS) must be >= 28% of revenue.
  // Calculation: IdealProLabore = Revenue * 0.28
  const idealProLabore = grossInvoice * 0.28;
  const actualProLabore = Math.max(idealProLabore, CONSTANTS.MINIMUM_WAGE);

  let chosenAnnex: 'III' | 'V';

  if (actualProLabore / grossInvoice >= 0.28) {
    chosenAnnex = 'III';
  } else {
    chosenAnnex = 'III';
  }

  const effectiveRate = getSimplesEffectiveRate(annualRevenue, chosenAnnex);
  const dasTax = grossInvoice * effectiveRate;

  const inssPartner = Math.min(
    actualProLabore * 0.11,
    CONSTANTS.MAX_INSS * 0.11,
  );

  const irrfProLabore = calculateIRRF(actualProLabore, inssPartner);
  const netProLabore = actualProLabore - inssPartner - irrfProLabore;

  const companyProfit =
    grossInvoice - dasTax - accountantCost - actualProLabore;

  const netIncome = netProLabore + companyProfit;

  return {
    grossInvoice,
    taxModel: `Simples Nacional (Anexo ${chosenAnnex})`,
    effectiveTaxRate: effectiveRate,
    taxes: dasTax,
    proLabore: actualProLabore,
    inssProLabore: inssPartner,
    irrfProLabore,
    accountantCost,
    netIncome,
    totalYearlyNet: netIncome * 12,
  };
}
