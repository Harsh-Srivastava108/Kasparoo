// Analysis engine — scores store data across 5 dimensions

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

// ─── 1. Product Data Quality (30%) ───
export function analyzeProductQuality(products) {
  if (!products.length) return { score: 0, details: {}, issues: [] };
  const issues = [];
  let descScore = 0, imgScore = 0, variantScore = 0, priceScore = 0, tagScore = 0;

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

  const score = clamp(
    details.descriptionCompleteness * 0.35 +
    details.imageCoverage * 0.25 +
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
export function analyzePolicies(policies, faq) {
  const issues = [];
  const details = {};

  const refund = policies['/policies/refund-policy'];
  const shipping = policies['/policies/shipping-policy'];
  const privacy = policies['/policies/privacy-policy'];
  const terms = policies['/policies/terms-of-service'];

  details.returnPolicy = refund ? (refund.length > 200 ? 100 : 50) : 0;
  details.shippingPolicy = shipping ? (shipping.length > 200 ? 100 : 50) : 0;
  details.privacyPolicy = privacy ? (privacy.length > 100 ? 100 : 50) : 0;
  details.termsOfService = terms ? (terms.length > 100 ? 100 : 50) : 0;
  details.faqCoverage = faq.exists ? (faq.content.length > 500 ? 100 : 60) : 0;

  if (details.returnPolicy === 0) issues.push({
    severity: 'critical', area: 'Return Policy',
    message: 'No return/refund policy found. This is a major red flag for AI shopping agents.',
    fix: 'Create a clear return policy at Settings → Policies in Shopify. Include timeframes, conditions, and process.',
    impact: 25, effort: 'easy',
  });
  if (details.shippingPolicy === 0) issues.push({
    severity: 'critical', area: 'Shipping Policy',
    message: 'No shipping policy found. AI agents cannot tell customers about delivery expectations.',
    fix: 'Add a shipping policy specifying delivery times, costs, regions served, and tracking availability.',
    impact: 20, effort: 'easy',
  });
  if (details.faqCoverage === 0) issues.push({
    severity: 'high', area: 'FAQ Page',
    message: 'No FAQ page found. FAQ content directly feeds AI agent answers to customer questions.',
    fix: 'Create a comprehensive FAQ page covering: sizing, materials, shipping times, returns, care instructions.',
    impact: 20, effort: 'medium',
  });

  const score = clamp(
    details.returnPolicy * 0.25 +
    details.shippingPolicy * 0.25 +
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

// ─── Overall Analysis ───
export function runFullAnalysis(data) {
  const productQuality = analyzeProductQuality(data.products);
  const trustSignals = analyzeTrustSignals(data.homepage, data.products);
  const policyClarity = analyzePolicies(data.policies, data.faq);
  const structuredData = analyzeStructuredData(data.homepage, data.productPages);
  const aiReadiness = analyzeAIReadiness(data.products);

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
  ].sort((a, b) => {
    const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) return sevOrder[a.severity] - sevOrder[b.severity];
    return (b.impact || 0) - (a.impact || 0);
  });

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

  return { current, ideal, gaps };
}
