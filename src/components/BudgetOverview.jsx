import React, { useMemo } from 'react';

export default function BudgetOverview({ transactions = [], monthlyIncome = 0, paydayDate = 1, formatIDR, currency = 'IDR' }) {
  const { totalCycleIncome, spentPokok, spentBebas, spentInvestasi, savedDarurat } = useMemo(() => {
    const now = new Date();
    let cycleStart, cycleEnd;
    const pDate = parseInt(paydayDate);

    if (now.getDate() >= pDate) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, pDate - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth(), pDate - 1, 23, 59, 59);
    }

    let cycleInc = 0;
    let pokok = 0;
    let bebas = 0;
    let investasi = 0;
    let darurat = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d >= cycleStart && d <= cycleEnd) {
        if (t.type === 'income') {
          cycleInc += t.amount;
        } else if (t.type === 'expense' || t.type === 'deposit') {
          const cat = (t.category || '').toLowerCase();
          if (cat.includes('investasi') || cat.includes('saham') || cat.includes('crypto') || cat.includes('reksa') || cat.includes('emas') || cat.includes('etf') || cat.includes('obligasi') || cat.includes('edukasi') || cat.includes('kursus')) {
            investasi += t.amount;
          } else if (cat.includes('hiburan') || cat.includes('belanja') || cat.includes('gaya') || cat.includes('bebas') || cat.includes('streaming') || cat.includes('dining') || cat.includes('jajan') || cat.includes('hobi')) {
            bebas += t.amount;
          } else if (t.type === 'deposit' || cat.includes('tabungan') || cat.includes('darurat')) {
            darurat += t.amount;
          } else {
            pokok += t.amount;
          }
        }
      }
    });

    return { 
      totalCycleIncome: cycleInc, 
      spentPokok: pokok, 
      spentBebas: bebas, 
      spentInvestasi: investasi, 
      savedDarurat: darurat 
    };
  }, [transactions, paydayDate]);

  const income = Math.max(0, monthlyIncome > 0 ? monthlyIncome : totalCycleIncome);

  const allocations = [
    {
      name: 'Kebutuhan Pokok (50%)',
      spent: spentPokok,
      limit: income * 0.50,
      color: '#8b5cf6'
    },
    {
      name: 'Kebutuhan Bebas (5%)',
      spent: spentBebas,
      limit: income * 0.05,
      color: '#ec4899'
    },
    {
      name: 'Investasi (30%)',
      spent: spentInvestasi,
      limit: income * 0.30,
      color: '#10b981'
    },
    {
      name: 'Dana Darurat (15%)',
      spent: savedDarurat,
      limit: income * 0.15,
      color: '#06b6d4'
    }
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Alokasi Keuangan 50-5-30-15
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Lacak realisasi alokasi penghasilan siklus ini
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
        {allocations.map((item, idx) => {
          const pct = item.limit > 0 ? Math.min(Math.round((item.spent / item.limit) * 100), 100) : 0;
          const isOver = item.limit > 0 && item.spent > item.limit && idx < 2; // Pokok or Bebas over-budget

          return (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <strong style={{ color: isOver ? 'var(--expense-color)' : 'var(--text-primary)' }}>
                    {formatIDR ? formatIDR(item.spent) : `Rp ${item.spent}`}
                  </strong> / {formatIDR ? formatIDR(item.limit) : `Rp ${item.limit}`}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="progress-bar-container" style={{ height: '0.45rem', margin: 0, flex: 1, background: 'rgba(255,255,255,0.06)' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${pct}%`,
                      background: isOver ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)' : item.color
                    }}
                  ></div>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '0.375rem', 
                  background: isOver ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)', 
                  color: isOver ? '#ef4444' : item.color,
                  minWidth: '42px',
                  textAlign: 'center',
                  flexShrink: 0
                }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
