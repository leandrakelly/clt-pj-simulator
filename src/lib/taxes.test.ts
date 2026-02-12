import { describe, expect, it } from 'vitest';

import { calculateCLT, calculatePJ } from './taxes';

describe('CLT Salary Calculator', () => {
  it('should correctly calculate taxes for a standard salary of 10k', () => {
    const result = calculateCLT(10000);

    expect(result.grossSalary).toBe(10000);
    expect(result.inss).toBeGreaterThan(900);
    expect(result.inss).toBeLessThan(960);
    expect(result.irrf).toBeGreaterThan(1000);
    expect(result.netSalary).toBeLessThan(result.grossSalary);
    expect(result.totalYearlyNet).toBeGreaterThan(result.netSalary * 12);
  });

  it('should apply tax exemption for minimum wage', () => {
    const result = calculateCLT(1518);

    expect(result.irrf).toBe(0);
    expect(result.netSalary).toBeCloseTo(1518 - result.inss);
  });

  it('should respect the INSS ceiling for high salaries', () => {
    const resultHigh = calculateCLT(15000);
    const resultCeiling = calculateCLT(20000);

    expect(resultHigh.inss).toBeCloseTo(resultCeiling.inss);
  });

  it('should reduce IRRF when dependents are included', () => {
    const resultNoDependents = calculateCLT(7000, 0);
    const resultWithDependents = calculateCLT(7000, 2);

    expect(resultWithDependents.irrf).toBeLessThan(resultNoDependents.irrf);
    expect(resultWithDependents.netSalary).toBeGreaterThan(
      resultNoDependents.netSalary,
    );
  });
});

describe('PJ Simples Nacional Calculator', () => {
  it('should apply Factor R optimization strategy for 10k revenue', () => {
    const result = calculatePJ(10000);

    expect(result.proLabore).toBeCloseTo(2800);
    expect(result.taxModel).toContain('Anexo III');
    expect(result.effectiveTaxRate).toBeCloseTo(0.06);
    expect(result.taxes).toBeCloseTo(600);
  });

  it('should calculate progressive effective rate for high revenue', () => {
    const result = calculatePJ(30000);

    expect(result.taxModel).toContain('Anexo III');
    expect(result.effectiveTaxRate).toBeGreaterThan(0.06);
    expect(result.taxes).toBeGreaterThan(30000 * 0.06);
  });

  it('should ensure Pro-labore is never below minimum wage', () => {
    const result = calculatePJ(2000);

    expect(result.proLabore).toBeGreaterThanOrEqual(1518);
  });

  it('should yield higher net income than CLT for the same gross amount', () => {
    const cltResult = calculateCLT(10000);
    const pjResult = calculatePJ(10000);

    expect(pjResult.netIncome).toBeGreaterThan(cltResult.netSalary);
  });
});
