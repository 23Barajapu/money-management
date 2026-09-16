import React from 'react';
import { Wallet, Landmark, Smartphone, PiggyBank, PieChart, ShieldCheck } from 'lucide-react';

export default function PortfolioDistribution({
  wallets = [],
  savings = [],
  totalBalance = 0,
  cashBalance = 0,
  cashlessBalance = 0,
  formatIDR,
  currency = 'IDR',
  t = (k) => k
}) {
  const totalSavings = savings.reduce((sum, s) => sum + (parseFloat(s.current_amount) || 0), 0);
  const grandNetWorth = totalBalance + totalSavings;

  // Wallet colors palette for visual distinctiveness
  const colorPalette = [
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#f97316'  // Orange
  ];

  const getWalletIcon = (w) => {
    const nameLower = (w.name || '').toLowerCase();
    if (nameLower.includes('bank') || nameLower.includes('bca') || nameLower.includes('mandiri') || nameLower.includes('bri') || nameLower.includes('bni') || nameLower.includes('jago') || nameLower.includes('seabank')) {
      return <Landmark size={18} />;
    }
    if (nameLower.includes('gopay') || nameLower.includes('ovo') || nameLower.includes('dana') || nameLower.includes('shopeepay') || nameLower.includes('linkaja')) {
      return <Smartphone size={18} />;
    }
    return <Wallet size={18} />;
  };

  return (
    <div className="card portfolio-distribution-card" style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="var(--accent-color)" />
            {t('portfolioAllocation') || 'Distribusi & Alokasi Portofolio'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Breakdown komposisi aset likuid & alokasi dompet
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 600 }}>
            {wallets.length} Dompet / Rekening
          </span>
          {savings.length > 0 && (
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-color)', fontWeight: 600 }}>
              {savings.length} Target Tabungan
            </span>
          )}
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      {grandNetWorth > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', gap: '2px' }}>
            {wallets.map((w, index) => {
              const share = grandNetWorth > 0 ? Math.max(0, (w.balance / grandNetWorth) * 100) : 0;
              if (share <= 0) return null;
              const color = colorPalette[index % colorPalette.length];
              return (
                <div
                  key={w.id || index}
                  title={`${w.name}: ${share.toFixed(1)}%`}
                  style={{
                    width: `${share}%`,
                    background: color,
                    transition: 'width 0.4s ease'
                  }}
                />
              );
            })}
            {totalSavings > 0 && (
              <div
                title={`Target Tabungan: ${((totalSavings / grandNetWorth) * 100).toFixed(1)}%`}
                style={{
                  width: `${(totalSavings / grandNetWorth) * 100}%`,
                  background: '#6366f1',
                  transition: 'width 0.4s ease'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Asset Grid Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {wallets.map((w, index) => {
          const share = grandNetWorth > 0 ? Math.max(0, (w.balance / grandNetWorth) * 100) : 0;
          const color = colorPalette[index % colorPalette.length];
          const isSeaBank = (w.name || '').toLowerCase().includes('seabank');

          return (
            <div
              key={w.id || index}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent Line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${color}20`,
                      color: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {getWalletIcon(w)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {w.name}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {w.type === 'cash' ? t('cashAssets') || 'Tunai' : t('digitalAssets') || 'Digital/Bank'}
                    </span>
                  </div>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: color, background: `${color}15`, padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                  {share.toFixed(1)}%
                </span>
              </div>

              <div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.01em' }}>
                  {formatIDR(w.balance)}
                </span>
                {isSeaBank && (
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                    <ShieldCheck size={11} /> {w.balance >= 150000000 ? 'Bunga 3,5% p.a.' : 'Bunga 2,5% p.a.'}
                  </span>
                )}
              </div>

              {/* Mini progress bar */}
              <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(share, 100)}%`, height: '100%', background: color, borderRadius: '2px' }} />
              </div>
            </div>
          );
        })}

        {/* Savings Goals Block if exist */}
        {savings.length > 0 && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.04)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#6366f1' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <PiggyBank size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'block' }}>
                    {t('savingGoalsAssets') || 'Target Tabungan'}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {savings.length} Target Aktif
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99, 102, 241, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                {grandNetWorth > 0 ? ((totalSavings / grandNetWorth) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block' }}>
                {formatIDR(totalSavings)}
              </span>
            </div>

            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${grandNetWorth > 0 ? Math.min((totalSavings / grandNetWorth) * 100, 100) : 0}%`, height: '100%', background: '#6366f1', borderRadius: '2px' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
