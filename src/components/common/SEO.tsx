import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonical?: string;
}

const defaultSEO = {
  title: 'MapleBear - Gerenciamento de Licenças Canva',
  description: 'Sistema de gerenciamento de licenças Canva para escolas MapleBear. Controle completo de usuários, vouchers e análises.',
  keywords: 'maplebear, canva, licenças, gestão escolar, educação, vouchers',
  author: 'MapleBear',
  ogImage: '/og-image.png',
};

export const SEO = ({
  title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  author = defaultSEO.author,
  ogTitle,
  ogDescription,
  ogImage = defaultSEO.ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  canonical,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${defaultSEO.title}` : defaultSEO.title;
  const finalOgTitle = ogTitle || fullTitle;
  const finalOgDescription = ogDescription || description;
  const finalCanonical = canonical || window.location.href;

  return (
    <Helmet>
      {/* Metadados básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={finalCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={ogImage} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      <meta property="og:site_name" content="MapleBear Canva" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Metadados adicionais */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Portuguese" />
    </Helmet>
  );
};

export default SEO;
