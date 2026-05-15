'use client';
import { useState } from 'react';

function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

const INITIAL_DISPLAY = 10;

export default function ProductTable({ products }) {
  const [showAll, setShowAll] = useState(false);

  if (!products || !products.length) return null;

  const displayProducts = showAll ? products : products.slice(0, INITIAL_DISPLAY);
  const hasMore = products.length > INITIAL_DISPLAY;

  return (
    <div className="product-table-section">
      <div className="section-header">
        <h3>📦 Per-Product Breakdown</h3>
        <p>Data quality analysis for each product ({products.length} total).</p>
      </div>
      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Description</th>
              <th>Images</th>
              <th>Tags</th>
              <th>Variants</th>
              <th>Price</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {displayProducts.map((product, i) => {
              const sc = getScoreClass(product.score);
              return (
                <tr key={i}>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {product.title}
                  </td>
                  <td>
                    <span className={`score-${product.descriptionLength > 300 ? 'excellent' : product.descriptionLength > 100 ? 'fair' : 'poor'}`}>
                      {product.descriptionLength} chars
                    </span>
                  </td>
                  <td>
                    <span className={`score-${product.imageCount >= 4 ? 'excellent' : product.imageCount >= 2 ? 'fair' : 'poor'}`}>
                      {product.imageCount}
                    </span>
                  </td>
                  <td>
                    <span className={`score-${product.tagCount >= 3 ? 'excellent' : product.tagCount >= 1 ? 'fair' : 'poor'}`}>
                      {product.tagCount}
                    </span>
                  </td>
                  <td>{product.variantCount}</td>
                  <td>{product.hasPrice ? '✅' : '❌'}</td>
                  <td>
                    <span className={`product-score-pill pill-${sc}`}>
                      {product.score}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          className="btn-show-more"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? `Show Less ↑`
            : `Show All ${products.length} Products ↓`}
        </button>
      )}
    </div>
  );
}
