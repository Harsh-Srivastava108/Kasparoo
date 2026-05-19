// Analysis engine — scores store data across 5 dimensions

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

// ─── 1. Product Data Quality (30%) ───
export function analyzeProductQuality(products, productPages = []) {
  if (!products.length) return { score: 0, details: {}, issues: [] };
  const issues = [];
  let descScore = 0, imgScore = 0, variantScore = 0, priceScore = 0, tagScore = 0;

  // Score image alt-texts from sampled product pages
  let altScore = 0;
  let totalAltImages = 0;
  productPages.forEach((pp) => {
    const alts = pp.imageAlts || [];
    alts.forEach((img) => {
      totalAltImages++;
      const alt = (img.alt || '').trim().toLowerCase();
      if (!alt || alt.length < 3) altScore += 0;
      else if (/^(image|photo|picture|img|product|untitled)$/i.test(alt)) altScore += 20;
      else if (alt.length > 10) altScore += 100;
      else altScore += 50;
    });
  });
  const imageAltQuality = totalAltImages > 0 ? clamp(altScore / totalAltImages) : 50;

  products.forEach((p) => {
    // Description completeness
    const descLen = (p.body_html || '').replace(/<[^>]*>/g, '').trim().length;
    if (descLen > 300) descScore += 100;
    else if (descLen > 100) descScore += 60;
    else if (descLen > 30) descScore += 30;
    else descScore += 0;

    // Image coverage
    const imgCount = (p.images || []).length;
    if (imgCount >= 4) imgScore += 100;
    else if (imgCount >= 2) imgScore += 60;
    else if (imgCount >= 1) imgScore += 30;
    else imgScore += 0;

    // Variant clarity
    const variants = p.variants || [];
    const hasGenericOptions = variants.some((v) =>
      v.title === 'Default Title' || v.option1 === 'Default'
    );
    if (variants.length > 1 && !hasGenericOptions) variantScore += 100;
    else if (variants.length === 1) variantScore += 70;
    else variantScore += 30;

    // Price transparency
    if (p.variants?.[0]?.price) priceScore += 70;
    if (p.variants?.[0]?.compare_at_price) priceScore += 30;
    else priceScore += 0;

    // Tags
    if ((p.tags || []).length >= 3) tagScore += 100;
    else if ((p.tags || []).length >= 1) tagScore += 50;
    else tagScore += 0;
  });

  const n = products.length;
  const details = {
    descriptionCompleteness: clamp(descScore / n),
    imageCoverage: clamp(imgScore / n),
    imageAltQuality,
    variantClarity: clamp(variantScore / n),
    priceTransparency: clamp(priceScore / n),
    tagStructure: clamp(tagScore / n),
  };

  // Generate issues
  if (details.descriptionCompleteness < 50) issues.push({
    severity: 'critical', area: 'Product Descriptions',
    message: 'Most product descriptions are too short for AI agents to understand what you sell.',
    fix: 'Expand each product description to 300+ characters. Include materials, dimensions, use cases, and who the product is for.',
    impact: 25, effort: 'medium',
  });
  if (details.imageCoverage < 50) issues.push({
    severity: 'high', area: 'Product Images',
    message: 'Products lack sufficient images. AI agents use image count as a quality signal.',
    fix: 'Add at least 4 images per product showing different angles, scale, and context of use.',
    impact: 15, effort: 'medium',
  });
  if (details.variantClarity < 50) issues.push({
    severity: 'medium', area: 'Variant Labels',
    message: 'Product variants use generic labels like "Default Title" instead of descriptive names.',
    fix: 'Rename variant options to descriptive labels (e.g., "Size: Medium", "Color: Ocean Blue").',
    impact: 10, effort: 'easy',
  });
  if (details.tagStructure < 50) issues.push({
    severity: 'medium', area: 'Product Tags',
    message: 'Products lack tags/categories, making it harder for AI to classify and recommend them.',
    fix: 'Add at least 3 relevant tags per product (e.g., category, use-case, material, audience).',
    impact: 10, effort: 'easy',
  });
  if (details.imageAltQuality < 40) issues.push({
    severity: 'high', area: 'Image Alt Text',
    message: 'Product images lack descriptive alt text. AI agents read alt text to understand what products look like.',
    fix: 'Add descriptive alt text to every product image (e.g., "Navy blue merino wool running shoe, side view") instead of generic or empty values.',
    impact: 12, effort: 'easy',
  });

  const score = clamp(
    details.descriptionCompleteness * 0.30 +
    details.imageCoverage * 0.20 +
    details.imageAltQuality * 0.10 +
    details.variantClarity * 0.15 +
    details.priceTransparency * 0.15 +
    details.tagStructure * 0.10
  );

  return { score, details, issues };
}

// ─── 2. Trust Signals (20%) ───
export function analyzeTrustSignals(homepage, products) {
  const issues = [];
  const details = {};

  // Brand consistency
  const brandName = homepage.meta?.title?.split(/[|\-–—]/).map(s => s.trim())[0] || '';
  const ogMatch = homepage.meta?.ogTitle?.includes(brandName);
  details.brandConsistency = brandName && ogMatch ? 100 : brandName ? 50 : 10;

  // Contact info
  let contactScore = 0;
  if (homepage.hasContactPage) contactScore += 40;
  if (homepage.hasEmail) contactScore += 30;
  if (homepage.hasPhone) contactScore += 30;
  details.contactInfo = clamp(contactScore);

  // Social proof
  const socialCount = (homepage.socialLinks || []).length;
  details.socialProof = clamp(socialCount >= 4 ? 100 : socialCount >= 2 ? 60 : socialCount >= 1 ? 30 : 0);

  // Reviews presence (from product data)
  const productsWithVendor = products.filter((p) => p.vendor && p.vendor.length > 1).length;
  details.vendorPresence = clamp((productsWithVendor / Math.max(products.length, 1)) * 100);

  if (details.contactInfo < 50) issues.push({
    severity: 'high', area: 'Contact Information',
    message: 'No visible contact information found. AI agents may flag this store as untrustworthy.',
    fix: 'Add a contact page with email, phone number, and physical address. Link it from your footer.',
    impact: 20, effort: 'easy',
  });
  if (details.socialProof < 40) issues.push({
    severity: 'medium', area: 'Social Proof',
    message: 'Few or no social media links found. Social presence helps AI agents validate legitimacy.',
    fix: 'Add links to your active social media profiles in the footer of every page.',
    impact: 10, effort: 'easy',
  });
  if (details.brandConsistency < 60) issues.push({
    severity: 'high', area: 'Brand Consistency',
    message: 'Your brand name is inconsistent across meta tags. AI agents may struggle to identify you.',
    fix: 'Ensure your brand name is identical in the page title, Open Graph tags, and schema markup.',
    impact: 15, effort: 'easy',
  });

  const score = clamp(
    details.brandConsistency * 0.30 +
    details.contactInfo * 0.30 +
    details.socialProof * 0.20 +
    details.vendorPresence * 0.20
  );

  return { score, details, issues };
}

// ─── 3. Policy & FAQ Clarity (20%) ───

function analyzePolicyClarity(text, type) {
  if (!text) return { score: 0, signals: {} };
  const t = text.toLowerCase();
  if (type === 'shipping') {
    const signals = {
      hasTimeframe: /\d+\s*(day|business day|week|hour)/i.test(t),
      hasCost: /(free|flat rate|\$\d+|shipping cost|no.*charge|complimentary)/i.test(t),
      hasRegions: /(domestic|international|worldwide|united states|US|UK|canada|europe|global)/i.test(t),
      hasTracking: /(track|tracking number|tracking info)/i.test(t),
    };
    const found = Object.values(signals).filter(Boolean).length;
    return { score: clamp((found / 4) * 100), signals };
  }
  if (type === 'return') {
    const signals = {
      hasTimeframe: /\d+\s*(day|week|calendar|business)/i.test(t),
      hasConditions: /(unworn|unused|original.*packaging|tags.*attached|unopened)/i.test(t),
      hasFreeReturn: /(free return|free exchange|no.*cost|prepaid.*label)/i.test(t),
      hasProcess: /(contact|email|request|initiate|RMA|return.*form)/i.test(t),
    };
    const found = Object.values(signals).filter(Boolean).length;
    return { score: clamp((found / 4) * 100), signals };
  }
  return { score: text.length > 200 ? 80 : 40, signals: {} };
}

export function analyzePolicies(policies, faq) {
  const issues = [];
  const details = {};

  const refund = policies['/policies/refund-policy'];
  const shipping = policies['/policies/shipping-policy'];
  const privacy = policies['/policies/privacy-policy'];
  const terms = policies['/policies/terms-of-service'];

  const shippingClarity = analyzePolicyClarity(shipping, 'shipping');
  const returnClarity = analyzePolicyClarity(refund, 'return');

  details.returnPolicy = refund ? (refund.length > 200 ? 100 : 50) : 0;
  details.returnClarity = refund ? returnClarity.score : 0;
  details.shippingPolicy = shipping ? (shipping.length > 200 ? 100 : 50) : 0;
  details.shippingClarity = shipping ? shippingClarity.score : 0;
  details.privacyPolicy = privacy ? (privacy.length > 100 ? 100 : 50) : 0;
  details.termsOfService = terms ? (terms.length > 100 ? 100 : 50) : 0;
  details.faqCoverage = faq.exists ? (faq.content.length > 500 ? 100 : 60) : 0;

  if (details.returnPolicy === 0) issues.push({
    severity: 'critical', area: 'Return Policy',
    message: 'No return/refund policy found. This is a major red flag for AI shopping agents.',
    fix: 'Create a clear return policy at Settings → Policies in Shopify. Include timeframes, conditions, and process.',
    impact: 25, effort: 'easy',
  });
  else if (details.returnClarity < 50) {
    const missing = [];
    if (!returnClarity.signals.hasTimeframe) missing.push('return timeframe (e.g., "30 days")');
    if (!returnClarity.signals.hasConditions) missing.push('return conditions (e.g., "unworn, with tags")');
    if (!returnClarity.signals.hasProcess) missing.push('return process (e.g., "email us to initiate")');
    issues.push({
      severity: 'high', area: 'Return Policy Clarity',
      message: `Your return policy exists but lacks key details. AI agents can't confidently tell shoppers about returns.`,
      fix: `Add specific details: ${missing.join(', ')}. AI agents need concrete info to recommend purchases.`,
      impact: 12, effort: 'easy',
    });
  }
  if (details.shippingPolicy === 0) issues.push({
    severity: 'critical', area: 'Shipping Policy',
    message: 'No shipping policy found. AI agents cannot tell customers about delivery expectations.',
    fix: 'Add a shipping policy specifying delivery times, costs, regions served, and tracking availability.',
    impact: 20, effort: 'easy',
  });
  else if (details.shippingClarity < 50) {
    const missing = [];
    if (!shippingClarity.signals.hasTimeframe) missing.push('delivery timeframe (e.g., "5-7 business days")');
    if (!shippingClarity.signals.hasCost) missing.push('shipping cost (e.g., "free over $50")');
    if (!shippingClarity.signals.hasRegions) missing.push('regions served (e.g., "US and Canada")');
    issues.push({
      severity: 'high', area: 'Shipping Policy Clarity',
      message: `Your shipping policy exists but is vague. AI agents can't give shoppers specific delivery expectations.`,
      fix: `Add specific details: ${missing.join(', ')}. Shoppers asking ChatGPT "how long does shipping take?" need a real answer.`,
      impact: 12, effort: 'easy',
    });
  }
  if (details.faqCoverage === 0) issues.push({
    severity: 'high', area: 'FAQ Page',
    message: 'No FAQ page found. FAQ content directly feeds AI agent answers to customer questions.',
    fix: 'Create a comprehensive FAQ page covering: sizing, materials, shipping times, returns, care instructions.',
    impact: 20, effort: 'medium',
  });

  const score = clamp(
    details.returnPolicy * 0.20 +
    details.returnClarity * 0.05 +
    details.shippingPolicy * 0.20 +
    details.shippingClarity * 0.05 +
    details.faqCoverage * 0.25 +
    details.privacyPolicy * 0.10 +
    details.termsOfService * 0.15
  );

  return { score, details, issues };
}

// ─── 4. Structured Data Quality (20%) ───
function hasSchemaType(schema, typeName) {
  const t = schema['@type'];
  if (!t) return false;
  if (Array.isArray(t)) return t.some((x) => x === typeName);
  return t === typeName;
}

export function analyzeStructuredData(homepage, productPages) {
  const issues = [];
  const details = {};

  // Check homepage JSON-LD
  const allSchemas = [...(homepage.jsonLd || [])];
  productPages.forEach((pp) => allSchemas.push(...(pp.jsonLd || [])));

  // Flatten @graph arrays and deeply nested structures
  const flat = [];
  function collectSchemas(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { obj.forEach(collectSchemas); return; }
    flat.push(obj);
    if (obj['@graph']) collectSchemas(obj['@graph']);
  }
  allSchemas.forEach(collectSchemas);

  const hasOrg = flat.some((s) => hasSchemaType(s, 'Organization') || hasSchemaType(s, 'Store') || hasSchemaType(s, 'OnlineStore'));
  const hasProduct = flat.some((s) => hasSchemaType(s, 'Product'));
  const hasBreadcrumb = flat.some((s) => hasSchemaType(s, 'BreadcrumbList'));
  const hasWebSite = flat.some((s) => hasSchemaType(s, 'WebSite'));

  details.organizationSchema = hasOrg ? 100 : 0;
  details.productSchema = hasProduct ? 100 : 0;
  details.breadcrumbSchema = hasBreadcrumb ? 100 : 0;
  details.websiteSchema = hasWebSite ? 100 : 0;

  // Check product schema fields
  const productSchema = flat.find((s) => hasSchemaType(s, 'Product'));
  let fieldScore = 0;
  if (productSchema) {
    const requiredFields = ['name', 'image', 'description', 'brand', 'sku', 'offers'];
    const present = requiredFields.filter((f) => productSchema[f]);
    fieldScore = clamp((present.length / requiredFields.length) * 100);
    const hasRating = productSchema.aggregateRating || productSchema.review;
    details.ratingSchema = hasRating ? 100 : 0;
  } else {
    details.ratingSchema = 0;
  }
  details.productSchemaFields = fieldScore;

  if (!hasProduct) issues.push({
    severity: 'critical', area: 'Product Schema',
    message: 'No Product JSON-LD schema detected. AI agents heavily rely on structured data.',
    fix: 'Add JSON-LD Product schema to every product page with name, description, image, brand, SKU, price, and availability.',
    impact: 30, effort: 'hard',
  });
  if (!hasOrg) issues.push({
    severity: 'high', area: 'Organization Schema',
    message: 'No Organization schema found. AI agents use this to understand your brand identity.',
    fix: 'Add Organization JSON-LD to your homepage with name, logo, URL, and social profiles.',
    impact: 15, effort: 'medium',
  });
  if (details.ratingSchema === 0) issues.push({
    severity: 'medium', area: 'Review Schema',
    message: 'No AggregateRating schema found. Review data helps AI agents assess product quality.',
    fix: 'Integrate a reviews app that adds AggregateRating schema to product pages.',
    impact: 10, effort: 'medium',
  });

  const score = clamp(
    details.productSchema * 0.30 +
    details.productSchemaFields * 0.25 +
    details.organizationSchema * 0.15 +
    details.ratingSchema * 0.15 +
    details.breadcrumbSchema * 0.10 +
    details.websiteSchema * 0.05
  );

  return { score, details, issues };
}

// ─── 5. AI Conversational Readiness (10%) ───
export function analyzeAIReadiness(products) {
  if (!products.length) return { score: 0, details: {}, issues: [] };
  const issues = [];
  let comparisonScore = 0, useCaseScore = 0, uvpScore = 0, answerabilityScore = 0;

  const specKeywords = ['weight', 'dimension', 'material', 'size', 'capacity', 'watt', 'volt', 'inch', 'cm', 'ml', 'oz', 'gram', 'kg', 'lb'];
  const useCaseKeywords = ['perfect for', 'ideal for', 'great for', 'designed for', 'best for', 'suitable for', 'recommended for', 'works with'];
  const uvpKeywords = ['unique', 'only', 'exclusive', 'patented', 'award', 'best-selling', 'premium', 'handmade', 'organic', 'sustainable', 'innovative'];

  products.forEach((p) => {
    const desc = (p.body_html || '').replace(/<[^>]*>/g, '').toLowerCase();

    // Comparison-friendly data (has specs)
    const hasSpecs = specKeywords.some((kw) => desc.includes(kw));
    comparisonScore += hasSpecs ? 100 : 0;

    // Use-case clarity
    const hasUseCase = useCaseKeywords.some((kw) => desc.includes(kw));
    useCaseScore += hasUseCase ? 100 : 0;

    // Unique value proposition
    const hasUVP = uvpKeywords.some((kw) => desc.includes(kw));
    uvpScore += hasUVP ? 100 : 0;

    // Question-answerable
    answerabilityScore += desc.length > 200 && (hasSpecs || hasUseCase) ? 100 : desc.length > 100 ? 40 : 0;
  });

  const n = products.length;
  const details = {
    comparisonFriendly: clamp(comparisonScore / n),
    useCaseClarity: clamp(useCaseScore / n),
    uniqueValueProp: clamp(uvpScore / n),
    questionAnswerable: clamp(answerabilityScore / n),
  };

  if (details.comparisonFriendly < 40) issues.push({
    severity: 'high', area: 'Product Specifications',
    message: 'Products lack technical specs (weight, dimensions, materials). AI agents need these for comparisons.',
    fix: 'Add measurable specifications to every product: weight, dimensions, materials, capacity, etc.',
    impact: 20, effort: 'medium',
  });
  if (details.useCaseClarity < 40) issues.push({
    severity: 'high', area: 'Use-Case Descriptions',
    message: 'Products don\'t explain who they\'re for. AI agents can\'t answer "Is this good for me?"',
    fix: 'Add use-case statements like "Perfect for [audience]" or "Designed for [situation]" to each description.',
    impact: 15, effort: 'easy',
  });

  const score = clamp(
    details.comparisonFriendly * 0.30 +
    details.useCaseClarity * 0.30 +
    details.uniqueValueProp * 0.20 +
    details.questionAnswerable * 0.20
  );

  return { score, details, issues };
}

// ─── Category Detection ───
function detectStoreCategory(products) {
  const cats = { apparel: 0, electronics: 0, beauty: 0, food: 0, home: 0, sports: 0, jewelry: 0 };
  const patterns = {
    apparel: /shirt|shoe|dress|jacket|pants|hoodie|sweater|sock|hat|cap|legging|bra|underwear|skirt|blouse|coat|sneaker|boot|sandal|tee|polo|denim|jeans|apparel|clothing|wear/i,
    electronics: /phone|laptop|tablet|charger|cable|headphone|speaker|camera|battery|adapter|usb|bluetooth|wireless|smart.*watch|earbuds|monitor|keyboard|mouse/i,
    beauty: /serum|cream|moisturizer|lipstick|mascara|foundation|concealer|skincare|shampoo|conditioner|perfume|fragrance|lotion|cleanser|toner|makeup|cosmetic|nail.*polish/i,
    food: /coffee|tea|chocolate|snack|protein|supplement|vitamin|organic|spice|sauce|honey|oil|flour|candy|cookie|granola|matcha|collagen/i,
    home: /candle|pillow|blanket|mug|bowl|plate|vase|lamp|rug|towel|curtain|frame|shelf|storage|decor|furniture/i,
    sports: /yoga|gym|fitness|workout|running|cycling|hiking|swim|surf|ski|golf|tennis|exercise|athletic/i,
    jewelry: /ring|necklace|bracelet|earring|pendant|chain|gold|silver|diamond|gemstone|watch|cuff|anklet/i,
  };
  products.forEach((p) => {
    const text = `${p.title} ${p.product_type || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
    Object.keys(patterns).forEach((cat) => {
      if (patterns[cat].test(text)) cats[cat]++;
    });
  });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return { primary: 'general', confidence: 0 };
  const total = products.length;
  return {
    primary: sorted[0][0],
    secondary: sorted[1]?.[1] > 0 ? sorted[1][0] : null,
    confidence: Math.round((sorted[0][1] / total) * 100),
  };
}

function getCategoryLabel(cat) {
  const labels = {
    apparel: 'Apparel & Fashion', electronics: 'Electronics & Tech', beauty: 'Beauty & Skincare',
    food: 'Food & Beverages', home: 'Home & Living', sports: 'Sports & Fitness',
    jewelry: 'Jewelry & Accessories', general: 'General Merchandise',
  };
  return labels[cat] || 'General Merchandise';
}

function getCategoryIssues(category, products, data) {
  const issues = [];
  const cat = category.primary;
  if (cat === 'apparel') {
    const hasSizing = data.faq.exists && /size|sizing|fit/i.test(data.faq.content);
    if (!hasSizing) issues.push({
      severity: 'high', area: 'Sizing Guide',
      message: 'Clothing stores need sizing info. AI agents can\'t recommend apparel without size guidance.',
      fix: 'Add a sizing guide page or include size charts in product descriptions. Mention fit (slim, regular, oversized) in each product.',
      impact: 15, effort: 'medium',
    });
  }
  if (cat === 'electronics') {
    const hasSpecs = products.filter((p) => {
      const d = (p.body_html || '').toLowerCase();
      return /watt|volt|mah|ghz|ram|storage|resolution|battery/i.test(d);
    }).length;
    if (hasSpecs < products.length * 0.5) issues.push({
      severity: 'high', area: 'Technical Specifications',
      message: 'Electronics products need detailed specs. AI agents compare specs when recommending tech products.',
      fix: 'Add structured specs: power, battery, dimensions, compatibility, warranty period. Use a consistent format across all products.',
      impact: 18, effort: 'medium',
    });
  }
  if (cat === 'beauty') {
    const hasIngredients = products.filter((p) =>
      /ingredient|contains|formulated with|key.*ingredient/i.test(p.body_html || '')
    ).length;
    if (hasIngredients < products.length * 0.3) issues.push({
      severity: 'high', area: 'Ingredient Information',
      message: 'Beauty products need ingredient lists. AI agents check for allergens and active ingredients when recommending.',
      fix: 'Add ingredient lists and highlight key active ingredients. Mention if products are vegan, cruelty-free, or dermatologist-tested.',
      impact: 15, effort: 'medium',
    });
  }
  if (cat === 'food') {
    const hasNutrition = products.filter((p) =>
      /calorie|nutrition|serving|allergen|gluten|dairy|nut.*free/i.test(p.body_html || '')
    ).length;
    if (hasNutrition < products.length * 0.3) issues.push({
      severity: 'high', area: 'Nutrition & Allergen Info',
      message: 'Food products need nutrition and allergen information for AI agents to make safe recommendations.',
      fix: 'Add nutritional info, ingredient lists, and allergen warnings. Mention dietary compatibility (vegan, gluten-free, etc.).',
      impact: 15, effort: 'medium',
    });
  }
  return issues;
}

// ─── JSON-LD Snippet Generation ───
function generateSchemaFixes(data, issues) {
  const storeName = data.homepage.meta?.title?.split(/[|\-–—]/)[0]?.trim() || 'Your Store';
  const storeUrl = data.storeUrl;
  const logoUrl = data.homepage.meta?.ogImage || `${storeUrl}/logo.png`;
  const socialLinks = data.homepage.socialLinks || [];
  const sample = data.products[0];

  issues.forEach((issue) => {
    if (issue.area === 'Organization Schema') {
      issue.codeSnippet = {
        language: 'json',
        label: 'Organization JSON-LD — paste into theme.liquid before </head>',
        code: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: storeName,
          url: storeUrl,
          logo: logoUrl,
          ...(socialLinks.length > 0 ? { sameAs: socialLinks.slice(0, 5) } : {}),
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', url: `${storeUrl}/pages/contact` },
        }, null, 2),
      };
    }
    if (issue.area === 'Product Schema' && sample) {
      issue.codeSnippet = {
        language: 'json',
        label: 'Product JSON-LD — add to product template',
        code: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: sample.title || 'Product Name',
          image: sample.images?.[0]?.src || `${storeUrl}/product-image.jpg`,
          description: (sample.body_html || '').replace(/<[^>]*>/g, '').slice(0, 160) || 'Product description here',
          brand: { '@type': 'Brand', name: storeName },
          sku: sample.variants?.[0]?.sku || 'SKU-001',
          offers: {
            '@type': 'Offer',
            price: sample.variants?.[0]?.price || '0.00',
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            url: `${storeUrl}/products/${sample.handle}`,
          },
        }, null, 2),
      };
    }
    if (issue.area === 'Review Schema') {
      issue.codeSnippet = {
        language: 'json',
        label: 'AggregateRating — add inside Product JSON-LD',
        code: JSON.stringify({
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.5',
            reviewCount: '127',
            bestRating: '5',
            worstRating: '1',
          },
        }, null, 2),
      };
    }
  });
}

// ─── Overall Analysis ───
export function runFullAnalysis(data) {
  const productQuality = analyzeProductQuality(data.products, data.productPages);
  const trustSignals = analyzeTrustSignals(data.homepage, data.products);
  const policyClarity = analyzePolicies(data.policies, data.faq);
  const structuredData = analyzeStructuredData(data.homepage, data.productPages);
  const aiReadiness = analyzeAIReadiness(data.products);

  // Detect store category
  const category = detectStoreCategory(data.products);
  const categoryIssues = getCategoryIssues(category, data.products, data);

  const overallScore = clamp(
    productQuality.score * 0.30 +
    trustSignals.score * 0.20 +
    policyClarity.score * 0.20 +
    structuredData.score * 0.20 +
    aiReadiness.score * 0.10
  );

  // Merge & sort all issues
  const allIssues = [
    ...productQuality.issues,
    ...trustSignals.issues,
    ...policyClarity.issues,
    ...structuredData.issues,
    ...aiReadiness.issues,
    ...categoryIssues,
  ].sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return (b.impact || 0) - (a.impact || 0);
  });

  // Generate JSON-LD code snippets for structured data issues
  generateSchemaFixes(data, allIssues);

  // Generate perception texts
  const perception = generatePerception(data, overallScore);

  // Per-product summary (all products)
  const productSummary = data.products.map((p) => {
    const desc = (p.body_html || '').replace(/<[^>]*>/g, '').trim();
    const imgCount = (p.images || []).length;
    const tags = (typeof p.tags === 'string' ? p.tags.split(', ') : p.tags) || [];
    return {
      title: p.title,
      handle: p.handle,
      descriptionLength: desc.length,
      imageCount: imgCount,
      tagCount: tags.length,
      hasPrice: !!p.variants?.[0]?.price,
      hasComparePrice: !!p.variants?.[0]?.compare_at_price,
      variantCount: (p.variants || []).length,
      score: clamp(
        (desc.length > 300 ? 30 : desc.length > 100 ? 15 : 0) +
        (imgCount >= 4 ? 25 : imgCount >= 2 ? 15 : imgCount >= 1 ? 5 : 0) +
        (tags.length >= 3 ? 15 : tags.length >= 1 ? 8 : 0) +
        (p.variants?.[0]?.price ? 15 : 0) +
        15
      ),
    };
  });

  return {
    storeUrl: data.storeUrl,
    storeName: data.homepage.meta?.title?.split(/[|\-–—]/)[0]?.trim() || data.storeUrl,
    overallScore,
    category: {
      primary: getCategoryLabel(category.primary),
      secondary: category.secondary ? getCategoryLabel(category.secondary) : null,
      confidence: category.confidence,
    },
    dimensions: {
      productQuality: { ...productQuality, label: 'Product Data Quality', weight: 30 },
      trustSignals: { ...trustSignals, label: 'Trust Signals', weight: 20 },
      policyClarity: { ...policyClarity, label: 'Policy & FAQ Clarity', weight: 20 },
      structuredData: { ...structuredData, label: 'Structured Data', weight: 20 },
      aiReadiness: { ...aiReadiness, label: 'AI Conversational Readiness', weight: 10 },
    },
    issues: allIssues,
    perception,
    productSummary,
    productCount: data.products.length,
    collectionCount: data.collections.length,
    scannedAt: data.extractedAt,
  };
}

function generatePerception(data, score) {
  const name = data.homepage.meta?.title?.split(/[|\-–—]/)[0]?.trim() || 'this store';
  const productCount = data.products.length;
  const hasReturns = !!data.policies['/policies/refund-policy'];
  const hasShipping = !!data.policies['/policies/shipping-policy'];
  const hasFaq = data.faq.exists;
  const sampleProducts = data.products.slice(0, 3).map((p) => p.title).join(', ');

  let current = `"${name}" is a Shopify store`;
  if (productCount > 0) current += ` with ${productCount} products including ${sampleProducts || 'various items'}.`;
  else current += ' with no publicly visible products.';

  if (!hasReturns && !hasShipping) {
    current += ' I could not find clear return or shipping policies, so I cannot confidently recommend this store for purchases.';
  } else if (!hasReturns) {
    current += ' The store has a shipping policy but no clear return policy, which makes purchase recommendations risky.';
  } else if (!hasShipping) {
    current += ' A return policy exists but shipping details are unclear.';
  } else {
    current += ' The store has both return and shipping policies available.';
  }

  if (score < 40) {
    current += ' Overall, I have limited data to accurately describe this store\'s products and would likely skip it in recommendations.';
  } else if (score < 70) {
    current += ' I have moderate data about this store but may miss key details when recommending their products.';
  }

  let ideal = `"${name}" is a trusted online store specializing in high-quality products.`;
  ideal += ` They offer ${productCount} carefully curated products with detailed specifications, multiple images, and clear pricing.`;
  ideal += ' Their transparent return and shipping policies, combined with verified customer reviews, make them a confident recommendation.';
  ideal += ' Each product description clearly explains who it\'s for, how it compares, and what makes it unique.';
  if (hasFaq) ideal += ' They maintain a comprehensive FAQ that addresses common customer concerns.';
  else ideal += ' A comprehensive FAQ would further strengthen their AI representation.';

  const gaps = [];
  if (!hasReturns) gaps.push('Missing return policy prevents confident purchase recommendations');
  if (!hasShipping) gaps.push('Unclear shipping details leave customers with unanswered logistics questions');
  if (!hasFaq) gaps.push('No FAQ means common questions go unanswered by AI agents');
  if (data.products.some((p) => (p.body_html || '').replace(/<[^>]*>/g, '').length < 100)) {
    gaps.push('Short product descriptions limit AI\'s ability to compare and recommend products');
  }
  if ((data.homepage.socialLinks || []).length === 0) {
    gaps.push('No social media presence reduces trust verification for AI agents');
  }

  // Generate Q&A scenarios
  const qaScenarios = generateQAScenarios(data, { hasReturns, hasShipping, hasFaq, name, score });

  return { current, ideal, gaps, qaScenarios };
}

function generateQAScenarios(data, ctx) {
  const scenarios = [];
  const products = data.products;
  const sample = products[0];
  const sampleDesc = sample ? (sample.body_html || '').replace(/<[^>]*>/g, '').trim() : '';
  const samplePrice = sample?.variants?.[0]?.price;
  const productType = sample?.product_type || 'products';

  // Scenario 1: Product recommendation
  if (sample) {
    const priceInfo = samplePrice ? ` ($${samplePrice})` : '';
    scenarios.push({
      question: `What's a good ${productType || 'product'} from ${ctx.name}?`,
      currentAnswer: sampleDesc.length > 150
        ? `${ctx.name} sells ${sample.title}${priceInfo}. ${sampleDesc.slice(0, 120)}... However, I don't have enough detail to explain what makes this product special compared to alternatives.`
        : `${ctx.name} has a product called "${sample.title}"${priceInfo}, but the description is very brief so I can't tell you much about its features, materials, or who it's best for.`,
      idealAnswer: `${ctx.name}'s ${sample.title}${priceInfo} is one of their top products. It features detailed specifications, ${(sample.images || []).length}+ product images, and clear sizing/variant options. ${ctx.hasReturns ? 'They offer easy returns' : 'Returns policy available'}, making it a low-risk purchase. Customers can also find this product through Shopify's Agentic Storefronts in ChatGPT and Gemini.`,
    });
  }

  // Scenario 2: Return policy question
  scenarios.push({
    question: `Does ${ctx.name} offer free returns?`,
    currentAnswer: ctx.hasReturns
      ? `${ctx.name} has a return policy, but I can't determine the specific timeframes, conditions, or whether returns are free. You'll need to check their website directly.`
      : `I couldn't find a clear return policy for ${ctx.name}. I'd recommend caution when purchasing, as I can't guarantee you'll be able to return items if they don't meet your expectations.`,
    idealAnswer: `Yes! ${ctx.name} has a transparent return policy clearly stated on their store. The policy details timeframes, conditions, and the return process — making it easy for shoppers to buy with confidence. This information is structured for AI agents to surface automatically.`,
  });

  // Scenario 3: Product comparison
  if (products.length >= 2) {
    const p1 = products[0];
    const p2 = products[1];
    scenarios.push({
      question: `Compare "${p1.title}" vs "${p2.title}"`,
      currentAnswer: `Both products are from ${ctx.name}. "${p1.title}" is priced at $${p1.variants?.[0]?.price || '?'} and "${p2.title}" at $${p2.variants?.[0]?.price || '?'}. Unfortunately, the product descriptions don't include enough specifications (dimensions, materials, use cases) for me to make a meaningful comparison.`,
      idealAnswer: `Great question! "${p1.title}" ($${p1.variants?.[0]?.price || 'N/A'}) is designed for [specific use case] with [key specs], while "${p2.title}" ($${p2.variants?.[0]?.price || 'N/A'}) is better suited for [different use case]. Both have detailed specifications, multiple images, and verified reviews to help you decide. ${ctx.name} offers easy returns on both.`,
    });
  }

  // Scenario 4: Trust question
  scenarios.push({
    question: `Is ${ctx.name} a trustworthy store for online shopping?`,
    currentAnswer: ctx.score >= 60
      ? `${ctx.name} appears to be a legitimate Shopify store with ${products.length} products. ${ctx.hasReturns && ctx.hasShipping ? 'They have return and shipping policies.' : 'However, some trust signals like clear policies or reviews are missing.'} I'd recommend verifying independently before making a large purchase.`
      : `I have limited information about ${ctx.name}. ${!ctx.hasReturns ? 'No return policy was found.' : ''} ${!ctx.hasShipping ? 'Shipping details are unclear.' : ''} ${(data.homepage.socialLinks || []).length === 0 ? 'No social media presence was detected.' : ''} I'd suggest researching further before purchasing.`,
    idealAnswer: `${ctx.name} is a verified Shopify merchant with ${products.length} products, transparent return and shipping policies, active social media presence, and structured data that passes Google's rich results validation. Their store is optimized for Shopify's Agentic Storefronts, meaning product data is syndicated to ChatGPT, Gemini, and Perplexity with full trust signals.`,
  });

  return scenarios;
}
