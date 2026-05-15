import { NextResponse } from 'next/server';
import { validateShopifyStore, extractAllData } from '@/lib/extractor';
import { runFullAnalysis } from '@/lib/analyzer';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Store URL is required' }, { status: 400 });
    }

    // Normalize URL
    let storeUrl = url.trim();
    if (!storeUrl.startsWith('http')) {
      storeUrl = 'https://' + storeUrl;
    }
    storeUrl = storeUrl.replace(/\/+$/, '');

    // Validate it's a Shopify store
    const isShopify = await validateShopifyStore(storeUrl);
    if (!isShopify) {
      return NextResponse.json(
        { error: 'This doesn\'t appear to be a Shopify store, or the store is not publicly accessible. Make sure the URL is correct and the store is live.' },
        { status: 400 }
      );
    }

    // Extract all data
    const data = await extractAllData(storeUrl);

    // Run analysis
    const results = runFullAnalysis(data);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'An error occurred while scanning the store. Please try again.' },
      { status: 500 }
    );
  }
}
