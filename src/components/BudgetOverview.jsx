import React from 'react';

export default function BudgetOverview({ transactions = [], formatIDR }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Categories and default/tracked budgets
  const defaultCategories = [
    { name: 'Makanan & Belanja', limit: 2500000, key: 'Makanan' },
    { name: 'Transportasi', limit: 1200000, key: 'Transportasi' },
    { name: 'Hiburan & Gaya Hidup', limit: 1000000, key: 'Hiburan' },
    { name: 'Tagihan & Utilita', limit: 1500000, key: 'Tagihan' },
  ];

  const categorySpending = defaultCategories.map(cat => {
    const spent = transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && 
               d.getMonth() === currentMonth && 
               (t.type === 'expense' || t.type === 'deposit') &&
               (t.category === cat.key || t.category?.includes(cat.key));
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const pct = cat.limit > 0 ? Math.min(Math.round((spent / cat.limit) * 100), 100) : 0;
    const isOver = spent > cat.limit;

    return {
      ...cat,
      spent,
      pct,
      isOver
    };
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Budget Overview</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tracked by category</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>...</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
        {categorySpending.map((cat, idx) => (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.25rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                <strong style={{ color: cat.isOver ? 'var(--expense-color)' : 'var(--text-primary)' }}>{formatIDR ? formatIDR(cat.spent) : `Rp ${cat.spent}`}</strong> / {formatIDR ? formatIDR(cat.limit) : `Rp ${cat.limit}`}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="progress-bar-container" style={{ height: '0.45rem', margin: 0, flex: 1, background: 'rgba(255,255,255,0.06)' }}>
                <div 
                  className="progress-bar" 
                  style={{ 
                    width: `${cat.pct}%`,
                    background: cat.isOver ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)'
                  }}
                ></div>
              </div>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                padding: '0.15rem 0.5rem', 
                borderRadius: '0.375rem', 
                background: cat.isOver ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', 
                color: cat.isOver ? '#ef4444' : '#f8fafc',
                minWidth: '42px',
                textAlign: 'center',
                flexShrink: 0
              }}>
                {cat.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
