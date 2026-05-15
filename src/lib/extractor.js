import * as cheerio from 'cheerio';

const FETCH_TIMEOUT = 15000;

async function safeFetch(url, options = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIReadinessAudit/1.0)',
        ...options.headers,
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}

export async function validateShopifyStore(url) {
  const res = await safeFetch(`${url}/products.json?limit=1`);
  if (!res) return false;
  try {
    const data = await res.json();
    return Array.isArray(data.products);
  } catch {
    return false;
  }
}

export async function fetchProducts(storeUrl) {
  const res = await safeFetch(`${storeUrl}/products.json?limit=250`);
  if (!res) return [];
  try {
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export async function fetchCollections(storeUrl) {
  const res = await safeFetch(`${storeUrl}/collections.json`);
  if (!res) return [];
  try {
    const data = await res.json();
    return data.collections || [];
  } catch {
    return [];
  }
}

export async function fetchHomepage(storeUrl) {
  const res = await safeFetch(storeUrl);
  if (!res) return { html: '', meta: {}, jsonLd: [] };
  const html = await res.text();
  const $ = cheerio.load(html);

  const meta = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
    favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '',
  };

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      jsonLd.push(JSON.parse($(el).html()));
    } catch {}
  });

  const socialLinks = [];
  $('a[href*="facebook.com"], a[href*="instagram.com"], a[href*="twitter.com"], a[href*="tiktok.com"], a[href*="youtube.com"], a[href*="linkedin.com"], a[href*="pinterest.com"], a[href*="x.com/"]').each((_, el) => {
    socialLinks.push($(el).attr('href'));
  });

  const hasContactPage = $('a[href*="contact"], a[href*="Contact"]').length > 0;
  const hasEmail = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) !== null;
  const hasPhone = html.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/) !== null;

  return { html, meta, jsonLd, socialLinks: [...new Set(socialLinks)], hasContactPage, hasEmail, hasPhone };
}

export async function fetchPolicies(storeUrl) {
  const policyPaths = [
    '/policies/refund-policy',
    '/policies/shipping-policy',
    '/policies/privacy-policy',
    '/policies/terms-of-service',
  ];

  // Also try alternate paths that some Shopify stores use
  const altPaths = {
    '/policies/shipping-policy': ['/pages/shipping', '/pages/shipping-policy', '/pages/delivery'],
    '/policies/refund-policy': ['/pages/returns', '/pages/return-policy', '/pages/refund-policy'],
  };

  const results = {};
  const promises = policyPaths.map(async (path) => {
    const res = await safeFetch(`${storeUrl}${path}`);
    if (res) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const text = $('.shopify-policy__body, .rte, main, article').text().trim();
      if (text.length > 20) {
        results[path] = text;
        return;
      }
    }

    // Try alternate paths if the standard one doesn't work
    const alts = altPaths[path];
    if (alts) {
      for (const alt of alts) {
        const altRes = await safeFetch(`${storeUrl}${alt}`);
        if (!altRes) continue;
        const html = await altRes.text();
        const $ = cheerio.load(html);
        const text = $('main, article, .page-content, .rte').text().trim();
        if (text.length > 20) {
          results[path] = text;
          return;
        }
      }
    }

    results[path] = null;
  });

  await Promise.all(promises);
  return results;
}

export async function fetchProductPage(storeUrl, productHandle) {
  const res = await safeFetch(`${storeUrl}/products/${productHandle}`);
  if (!res) return { jsonLd: [], hasReviews: false, imageAlts: [] };
  const html = await res.text();
  const $ = cheerio.load(html);

  const jsonLd = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html());
      jsonLd.push(parsed);
    } catch {}
  });

  const hasReviews = html.includes('review') || html.includes('rating') || html.includes('star');
  const imageAlts = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src.includes('product') || src.includes('cdn.shopify')) {
      imageAlts.push({ src, alt: alt.trim() });
    }
  });

  return { jsonLd, hasReviews, imageAlts };
}

export async function fetchFAQPage(storeUrl) {
  const possiblePaths = ['/pages/faq', '/pages/faqs', '/pages/frequently-asked-questions', '/pages/help', '/pages/customer-service'];
  for (const path of possiblePaths) {
    const res = await safeFetch(`${storeUrl}${path}`);
    if (!res) continue;
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('main, article, .page-content, .rte').text().trim();
    if (text.length > 50) return { exists: true, content: text, path };
  }
  return { exists: false, content: '', path: '' };
}

export async function extractAllData(storeUrl) {
  const url = storeUrl.replace(/\/+$/, '');

  const [products, collections, homepage, policies, faq] = await Promise.all([
    fetchProducts(url),
    fetchCollections(url),
    fetchHomepage(url),
    fetchPolicies(url),
    fetchFAQPage(url),
  ]);

  // Sample up to 5 product pages for detailed schema analysis (increased from 3)
  const sampleProducts = products.slice(0, 5);
  const productPages = await Promise.all(
    sampleProducts.map((p) => fetchProductPage(url, p.handle))
  );

  return {
    storeUrl: url,
    products,
    collections,
    homepage,
    policies,
    faq,
    productPages,
    extractedAt: new Date().toISOString(),
  };
}
