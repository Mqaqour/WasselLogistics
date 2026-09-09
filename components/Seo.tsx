import React from 'react';
import { Language } from '../types';

// Canonical origin for the public site. Override per environment with VITE_SITE_URL.
const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://wassel.ps').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/Wassel logo-01.png`;

const BRAND: Record<Language, string> = {
  en: 'Wassel Logistics',
  ar: 'واصل لوجستكس',
};

export interface SeoProps {
  lang: Language;
  /** Page title without the brand suffix. */
  title: string;
  /** Use `title` verbatim — don't append " | {brand}". */
  exactTitle?: boolean;
  description: string;
  /** Path without the locale prefix, e.g. "/" or "/contact". */
  path: string;
  /** Absolute URL or root-relative path to the share image. */
  image?: string;
  noindex?: boolean;
  /** JSON-LD object(s) to embed in the document. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function localizedUrl(path: string, lang: Language): string {
  const clean = path === '/' ? '' : `/${path.replace(/^\/+/, '')}`;
  return `${SITE_URL}/${lang}${clean}`;
}

/**
 * Per-route document metadata. Relies on React 19 hoisting <title>/<meta>/<link>
 * into <head>; JSON-LD <script> tags are read by crawlers anywhere in the document.
 */
export const Seo: React.FC<SeoProps> = ({ lang, title, exactTitle, description, path, image, noindex, jsonLd }) => {
  const brand = BRAND[lang];
  const fullTitle = exactTitle || title.includes(brand) ? title : `${title} | ${brand}`;
  const canonical = localizedUrl(path, lang);
  const ogImage = image
    ? (image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`)
    : DEFAULT_OG_IMAGE;
  const ld = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonical} />

      <link rel="alternate" hrefLang="ar" href={localizedUrl(path, 'ar')} />
      <link rel="alternate" hrefLang="en" href={localizedUrl(path, 'en')} />
      <link rel="alternate" hrefLang="x-default" href={localizedUrl(path, 'ar')} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={brand} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_PS' : 'en_US'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {ld.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
};
