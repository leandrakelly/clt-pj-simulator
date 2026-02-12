export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculadora CLT vs PJ',
    url: 'https://clt-pj-calculator.vercel.app', // TODO: adjust later
    description:
      'Ferramenta financeira para comparação de contratos de trabalho, cálculo de impostos (Simples Nacional, IRPF) e conversão de salário CLT para PJ.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
    },
    featureList:
      'Comparação CLT x PJ, Cálculo de Fator R, Simulação Simples Nacional, Cálculo de Salário Líquido',
    author: {
      '@type': 'Person',
      name: 'Seu Nome',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
