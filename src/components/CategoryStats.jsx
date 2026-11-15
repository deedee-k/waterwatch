import React from 'react';
import { useLanguage } from '../lib/i18n';

/**
 * Renders per‑category statistics for a given list of reports.
 * Expected props:
 *   - reports: array of report objects (must contain `category_id`)
 *   - categories: object keyed by id with at least `name_en` and `name_st`
 */
export default function CategoryStats({ reports, categories }) {
  const { lang } = useLanguage();
  const counts = {};
  reports.forEach(r => {
    const cid = r.category_id || 'unknown';
    counts[cid] = (counts[cid] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return (
    <div className="category-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
      {entries.map(([cid, cnt]) => (
        <div key={cid} className="card" style={{ background: 'white', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-600)' }}>{cid === 'unknown' ? (lang === 'st' ? 'Ntlha e sa tsejoeng' : 'Unknown') : (categories[cid]?.name_en || categories[cid]?.name_st || cid)}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)' }}>{cnt}</div>
        </div>
      ))}
    </div>
  );
}

