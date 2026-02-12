import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import JsonLd from '@/components/JsonLd';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Calculadora CLT vs PJ 2026 | Compare Salário Líquido Real',
    template: '%s | Calculadora CLT vs PJ',
  },
  description:
    'Descubra se vale a pena virar PJ. Compare salário líquido CLT x PJ com impostos atualizados de 2026 (INSS, IRRF, Simples Nacional, Anexo III e Fator R).',
  keywords: [
    'clt vs pj',
    'calculadora clt pj',
    'salário líquido pj',
    'simples nacional 2026',
    'fator r',
    'pj ou clt',
    'calcular imposto pj',
    'programador pj',
  ],
  // TODO: generate new code
  // verification: {
  //   google: 'CODE',
  // },
  authors: [{ name: 'Seu Nome ou Marca' }],
  openGraph: {
    title: 'CLT ou PJ? Veja qual paga mais (Cálculo Exato 2026)',
    description:
      'Recebeu uma proposta PJ e não sabe se compensa? Nossa calculadora detalha todos os impostos e te mostra o dinheiro real no bolso.',
    url: 'https://clt-pj-calculator.vercel.app', // TODO: adjust later
    siteName: 'Calculadora CLT vs PJ',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://clt-pj-calculator.vercel.app', // TODO: adjust later
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
