import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Landmark, 
  Smartphone, 
  PiggyBank, 
  PieChart, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Percent,
  TrendingUp
} from 'lucide-react';

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
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [hoveredAssetId, setHoveredAssetId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'digital', 'cash', 'savings'

  const totalSavings = useMemo(() => {
    return (savings || []).reduce((sum, s) => sum + (parseFloat(s.current_amount) || 0), 0);
  }, [savings]);

  const grandNetWorth = useMemo(() => {
    return totalBalance + totalSavings;
  }, [totalBalance, totalSavings]);

  // Color palette for distinctive slices
  const colorPalette = [
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Indigo / Purple
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#3b82f6', // Blue
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#a855f7'  // Violet
  ];

  // Consolidate all asset items
  const allAssets = useMemo(() => {
    const list = [];
    
    (wallets || []).forEach((w, i) => {
      const share = grandNetWorth > 0 ? (w.balance / grandNetWorth) * 100 : 0;
      list.push({
        id: w.id || `wallet_${i}`,
        name: w.name,
        type: w.type === 'cash' ? 'cash' : 'digital',
        typeLabel: w.type === 'cash' ? (t('cashAssets') || 'Tunai') : (t('digitalAssets') || 'Digital / Bank'),
        balance: w.balance,
        share: Math.max(0, share),
        color: colorPalette[i % colorPalette.length],
        isSeaBank: (w.name || '').toLowerCase().includes('seabank'),
        isSaving: false
      });
    });

    if (totalSavings > 0) {
      const savingsShare = grandNetWorth > 0 ? (totalSavings / grandNetWorth) * 100 : 0;
      list.push({
        id: 'savings_group',
        name: t('savingGoalsAssets') || 'Target Tabungan',
        type: 'savings',
        typeLabel: `${savings.length} Target Aktif`,
        balance: totalSavings,
        share: Math.max(0, savingsShare),
        color: '#6366f1',
        isSeaBank: false,
        isSaving: true
      });
    }

    return list;
  }, [wallets, savings, totalSavings, grandNetWorth, t]);

  // Filtered asset list
  const filteredAssets = useMemo(() => {
    if (activeFilter === 'digital') return allAssets.filter(a => a.type === 'digital');
    if (activeFilter === 'cash') return allAssets.filter(a => a.type === 'cash');
    if (activeFilter === 'savings') return allAssets.filter(a => a.type === 'savings');
    return allAssets;
  }, [allAssets, activeFilter]);

  // SVG Donut calculation
  const donutRadius = 70;
  const donutCircumference = 2 * Math.PI * donutRadius; // ≈ 439.82

  let accumulatedPercent = 0;
  const donutSlices = useMemo(() => {
    let currentOffset = 0;
    return allAssets
      .filter(a => a.balance > 0)
      .map(a => {
        const strokeDasharray = `${(a.share / 100) * donutCircumference} ${donutCircumference}`;
        const strokeDashoffset = -currentOffset;
        currentOffset += (a.share / 100) * donutCircumference;

        return {
          ...a,
          strokeDasharray,
          strokeDashoffset
        };
      });
  }, [allAssets, donutCircumference]);

  // Active highlighted asset (either hovered or clicked)
  const activeAsset = useMemo(() => {
    const targetId = hoveredAssetId || selectedAssetId;
    if (!targetId) return null;
    return allAssets.find(a => a.id === targetId) || null;
  }, [hoveredAssetId, selectedAssetId, allAssets]);

  const getWalletIcon = (asset) => {
    if (asset.isSaving) return <PiggyBank size={18} />;
    const nameLower = (asset.name || '').toLowerCase();
    if (nameLower.includes('bank') || nameLower.includes('bca') || nameLower.includes('mandiri') || nameLower.includes('bri') || nameLower.includes('bni') || nameLower.includes('jago') || nameLower.includes('seabank')) {
      return <Landmark size={18} />;
    }
    if (nameLower.includes('gopay') || nameLower.includes('ovo') || nameLower.includes('dana') || nameLower.includes('shopeepay') || nameLower.includes('linkaja')) {
      return <Smartphone size={18} />;
    }
    return <Wallet size={18} />;
  };

  const liquidRatio = grandNetWorth > 0 ? (totalBalance / grandNetWorth) * 100 : 100;
  const savedRatio = grandNetWorth > 0 ? (totalSavings / grandNetWorth) * 100 : 0;

  return (
    <div className="card portfolio-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={20} color="var(--accent-color)" />
            {t('portfolioAllocation') || 'Distribusi & Alokasi Portofolio'}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Pantau alokasi aset likuid, dompet digital, dan target tabungan secara real-time
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto', maxWidth: '100%', paddingBottom: '0.2rem' }}>
          <button
            className={`portfolio-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Semua ({allAssets.length})
          </button>
          <button
            className={`portfolio-filter-btn ${activeFilter === 'digital' ? 'active' : ''}`}
            onClick={() => setActiveFilter('digital')}
          >
            Bank & Digital ({wallets.filter(w => w.type !== 'cash').length})
          </button>
          <button
            className={`portfolio-filter-btn ${activeFilter === 'cash' ? 'active' : ''}`}
            onClick={() => setActiveFilter('cash')}
          >
            Tunai ({wallets.filter(w => w.type === 'cash').length})
          </button>
          {totalSavings > 0 && (
            <button
              className={`portfolio-filter-btn ${activeFilter === 'savings' ? 'active' : ''}`}
              onClick={() => setActiveFilter('savings')}
            >
              Tabungan ({savings.length})
            </button>
          )}
        </div>
      </div>

      {/* Interactive Main Body: 2 Columns (Donut Chart Left, Asset Cards Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* Column 1: Interactive SVG Donut & Liquidity Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
          
          <div className="portfolio-donut-container" style={{ width: '200px', height: '200px' }}>
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Track Circle */}
              <circle
                cx="100"
                cy="100"
                r={donutRadius}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="14"
              />

              {/* Animated Asset Donut Segments */}
              {donutSlices.map((slice) => {
                const isSelected = (selectedAssetId === slice.id) || (hoveredAssetId === slice.id);
                return (
                  <circle
                    key={slice.id}
                    className={`portfolio-donut-segment ${isSelected ? 'active' : ''}`}
                    cx="100"
                    cy="100"
                    r={donutRadius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isSelected ? 18 : 14}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    opacity={activeAsset && !isSelected ? 0.35 : 1}
                    onMouseEnter={() => setHoveredAssetId(slice.id)}
                    onMouseLeave={() => setHoveredAssetId(null)}
                    onClick={() => setSelectedAssetId(selectedAssetId === slice.id ? null : slice.id)}
                  />
                );
              })}
            </svg>

            {/* Dynamic Center Details */}
            <div className="portfolio-donut-center">
              {activeAsset ? (
                <div>
                  <span style={{ fontSize: '0.65rem', color: activeAsset.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    {activeAsset.share.toFixed(1)}% PORSI
                  </span>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '0.1rem 0' }}>
                    {activeAsset.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: activeAsset.color, display: 'block' }}>
                    {formatIDR(activeAsset.balance)}
                  </span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    NET WORTH
                  </span>
                  <strong style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', margin: '0.15rem 0' }}>
                    {formatIDR(grandNetWorth)}
                  </strong>
                  <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Sparkles size={10} /> {allAssets.length} Akun Aset
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Liquidity Ratio Summary */}
          <div style={{ width: '100%', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
              <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Wallet size={12} /> Aset Likuid ({liquidRatio.toFixed(0)}%)
              </span>
              <span style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <PiggyBank size={12} /> Ditabung ({savedRatio.toFixed(0)}%)
              </span>
            </div>

            {/* Dual animated ratio bar */}
            <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)', gap: '2px' }}>
              <div
                style={{
                  width: `${liquidRatio}%`,
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  transition: 'width 0.5s ease'
                }}
              />
              <div
                style={{
                  width: `${savedRatio}%`,
                  background: '#6366f1',
                  transition: 'width 0.5s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Interactive Asset Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {filteredAssets.map((asset) => {
            const isSelected = (selectedAssetId === asset.id) || (hoveredAssetId === asset.id);

            return (
              <div
                key={asset.id}
                className={`portfolio-asset-card ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredAssetId(asset.id)}
                onMouseLeave={() => setHoveredAssetId(null)}
                onClick={() => setSelectedAssetId(selectedAssetId === asset.id ? null : asset.id)}
              >
                {/* Top Colored Accent Stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: asset.color }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: `${asset.color}20`,
                        color: asset.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      {getWalletIcon(asset)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {asset.name}
                      </strong>
                      <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)' }}>
                        {asset.typeLabel}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: asset.color,
                      background: `${asset.color}15`,
                      padding: '0.15rem 0.4rem',
                      borderRadius: '6px',
                      flexShrink: 0
                    }}
                  >
                    {asset.share.toFixed(1)}%
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', letterSpacing: '-0.01em' }}>
                    {formatIDR(asset.balance)}
                  </span>
                  {asset.isSeaBank && (
                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                      <ShieldCheck size={11} /> {asset.balance >= 150000000 ? 'Bunga 3,5% p.a.' : 'Bunga 2,5% p.a.'}
                    </span>
                  )}
                </div>

                {/* Animated Mini Progress Bar */}
                <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    className="portfolio-progress-bar-fill"
                    style={{
                      width: `${Math.min(asset.share, 100)}%`,
                      background: asset.color
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
