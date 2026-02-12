import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value,
  );

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
  }).format(value);

export const formatMoneyInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  const withoutLeadingZeros = numbers.replace(/^0+/, '') || '0';
  return Number(withoutLeadingZeros).toLocaleString('pt-BR');
};

export const parseMoney = (value: string): number => {
  const numbers = value.replace(/\D/g, '');
  return numbers ? Number(numbers) : 0;
};
