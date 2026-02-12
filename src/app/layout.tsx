import './globals.css';

import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import JsonLd from '@/components/JsonLd';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
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
    url: 'https://clt-pj-simulator.vercel.app/',
    siteName: 'Calculadora CLT vs PJ',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://clt-pj-simulator.vercel.app/',
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
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-[#020617] font-sans text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-100`}
      >
        <JsonLd />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
