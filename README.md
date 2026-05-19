# Kasparoo AI Readiness Scanner

> **Track 5: AI Representation Optimizer** — Kasparoo Internship Challenge

A merchant-facing diagnostic tool that shows Shopify store owners how AI shopping agents (ChatGPT, Gemini, Perplexity, CoPilot) perceive and represent their products — and what they should improve to maximize visibility in Shopify's Agentic Storefronts ecosystem.

## 🎯 What It Does

Paste any Shopify store URL and get an instant, comprehensive AI readiness audit:

1. **5-Dimension Scoring** — Product data quality, trust signals, policy clarity, structured data, and conversational readiness
2. **AI Shopping Simulator** — See simulated Q&A conversations showing how ChatGPT/Gemini/Perplexity respond when shoppers ask about your products
3. **Business Impact Summary** — Translates technical scores into business language ("AI agents skip your store in ~47% of recommendations")
4. **Quick Wins** — Easy, high-impact fixes merchants can do today
5. **Prioritized Action Plan** — Ranked improvements with severity, effort, and point impact, including auto-generated JSON-LD snippets
6. **Per-Product Breakdown** — Data quality scores for every product in the catalog
7. **Report Exporting** — One-click PDF export to share insights with your team

## 🧠 Product Thinking

### The Problem

Shopify's [Agentic Storefronts](https://shopify.com/agentic-storefronts) automatically syndicate store data to AI shopping channels — ChatGPT, Google Gemini, Perplexity, and CoPilot. When this data is incomplete, ambiguous, or contradictory, AI agents either **skip the merchant** or **misrepresent their products**.

Most merchants don't know what AI agents see. They can't inspect the data pipeline. They don't know if their return policy is structured enough for an AI to confidently recommend purchases, or if their product descriptions give AI enough context to compare against competitors.

### Our Solution

We built a **zero-friction diagnostic tool** — no app installation, no API keys, no Shopify Partner account required. Merchants paste their URL and get a complete readiness report in under 60 seconds.

### Design Decision: Public Data Scanning vs. Shopify App

We deliberately chose to scan **publicly available** Shopify data (`products.json`, homepage HTML, policies, FAQ pages) rather than building a Shopify Admin API app. Here's why:

| Approach | Admin API App | Our Public Scanner |
|----------|---------------|-------------------|
| **Setup** | Install app, configure API keys | Paste a URL |
| **Scope** | Only stores you own | Any live Shopify store |
| **Perspective** | What's in the backend | **What AI agents actually see** |
| **Competitive analysis** | ❌ | ✅ Scan competitor stores |
| **Time to value** | Minutes to set up | Instant |

**Key insight:** AI shopping agents don't have Admin API access. They see public data — the same data we scan. This makes our tool's perspective more authentic than an Admin API app.

## 🏗 Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Route   │────▶│  Extractor   │
│   (React)    │     │  /api/scan   │     │  (cheerio)   │
│              │◀────│              │◀────│              │
│  - ScoreGauge│     │  Validates   │     │  Fetches:    │
│  - RadarChart│     │  + orchestr. │     │  - products  │
│  - Q&A Sim   │     │              │     │  - policies  │
│  - ActionPlan│     │              │     │  - homepage   │
│  - QuickWins │     ├──────────────┤     │  - FAQ       │
│  - ImpactSum │     │   Analyzer   │     │  - JSON-LD   │
│  - ProdTable │     │  (5 dims)    │     │  - schema    │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Tech Stack

- **Framework:** Next.js 16.2.6 with Turbopack
- **Frontend:** React 19, Chart.js + react-chartjs-2
- **Scraping:** Cheerio (HTML parsing), native fetch with timeout/abort
- **Styling:** Custom CSS with dark glassmorphism theme, CSS animations

### Analysis Dimensions

| Dimension | Weight | What We Score |
|-----------|--------|---------------|
| Product Data Quality | 30% | Description length, image count, variant clarity, tags, pricing |
| Trust Signals | 20% | Brand consistency, contact info, social links, meta data |
| Policy & FAQ Clarity | 20% | Return/shipping/privacy/terms policies, FAQ coverage |
| Structured Data | 20% | JSON-LD schema (Product, Organization, BreadcrumbList) |
| AI Conversational Readiness | 10% | Description comparability, Q&A-readiness, specification depth |

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/kasparoo.git
cd kasparoo

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and paste any Shopify store URL to scan.

### Example Stores to Try

- `allbirds.com` — Score: ~53 (Good product data, weak policies)
- `gymshark.com` — Score: ~40 (Large catalog, structured data gaps)

## 📁 Project Structure

```
src/
├── app/
│   ├── page.js              # Main page with state management
│   ├── globals.css           # Design system + component styles
│   ├── layout.js             # Root layout with metadata
│   └── api/scan/route.js     # POST endpoint for scanning
├── components/
│   ├── ScoreGauge.js         # Animated SVG score ring
│   ├── RadarChart.js         # Chart.js 5-axis radar
│   ├── DimensionCard.js      # Per-dimension score card
│   ├── PerceptionSimulator.js # AI Q&A conversation simulator
│   ├── ImpactSummary.js      # Business impact cards
│   ├── QuickWins.js          # Easy high-impact fixes
│   ├── ActionPlan.js         # Ranked issue list
│   ├── ExportButton.js       # PDF report generation
│   └── ProductTable.js       # Per-product data table
└── lib/
    ├── extractor.js          # Shopify data fetching + scraping
    └── analyzer.js           # 5-dimension scoring engine
```

## 🔑 Key Features

### AI Shopping Simulator
Instead of generic "current vs. ideal" text, we simulate real conversations:
- **"Hey ChatGPT, what's a good shoe from Allbirds?"** → Shows what ChatGPT would say now vs. after optimization
- **"Gemini, does this store offer free returns?"** → Reveals policy visibility gaps
- **"Compare Product A vs Product B"** → Demonstrates description completeness issues

### Business Impact Framing
We translate scores into merchant-friendly language:
- "AI recommendation rate: ~40%" instead of "Score: 53"
- "3 critical data gaps prevent confident AI recommendations"
- "Projected score after fixes: 53 → 74"

### Advanced Diagnostics
- **Alt-text Scoring:** Evaluates image accessibility and AI understandability
- **Category-Aware Advice Engine:** Provides tailored recommendations based on product types
- **Auto-Generating JSON-LD:** Generates copy-paste ready structured data snippets

### Zero-Friction UX
- No sign-up, no API keys, no Shopify app installation
- Paste URL → Get report in ~30-60 seconds
- Works on any public Shopify store
- **PDF Report Export:** Download and share the comprehensive audit with stakeholders

## 📄 License

Built for the Kasparoo Internship Challenge — Track 5: AI Representation Optimizer.
