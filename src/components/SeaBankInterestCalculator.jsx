import React, { useState, useMemo } from 'react';
import { Percent, TrendingUp, Info, ShieldCheck, DollarSign, Calendar, ChevronRight, CheckCircle2, Award, Plus } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

export default function SeaBankInterestCalculator({ formatIDR, wallets = [], onAddTransaction, showToast, currency = 'IDR' }) {
  // Find SeaBank wallet if exists
  const seaBankWallet = useMemo(() => {
    return wallets.find(w => w.name.toLowerCase().includes('seabank')) || null;
  }, [wallets]);

  // Initial balance state (auto-fill from SeaBank wallet if available)
  const [selectedWalletId, setSelectedWalletId] = useState(seaBankWallet ? seaBankWallet.id : 'custom');
  
  const initialBalance = useMemo(() => {
    if (selectedWalletId !== 'custom') {
      const found = wallets.find(w => w.id === selectedWalletId);
      return found ? found.balance : 10000000;
    }
    return 10000000; // Default 10 juta
  }, [selectedWalletId, wallets]);

  const { displayValue, rawValue, handleChange, handleBlur, setValue } = useCurrencyInput(currency);

  // Sync input value when wallet changes
  React.useEffect(() => {
    if (selectedWalletId !== 'custom') {
      const found = wallets.find(w => w.id === selectedWalletId);
      if (found) setValue(found.balance.toString());
    }
  }, [selectedWalletId, wallets, setValue]);

  const currentBalance = useMemo(() => {
    if (selectedWalletId !== 'custom') {
      const found = wallets.find(w => w.id === selectedWalletId);
      return found ? parseFloat(found.balance || 0) : 0;
    }
    const parsed = parseFloat(rawValue);
    return isNaN(parsed) ? 0 : parsed;
  }, [selectedWalletId, rawValue, wallets]);

  // SeaBank Interest Calculation Logic
  // Tier 1: Saldo < 150M -> 2.5% p.a.
  // Tier 2: Saldo >= 150M -> 3.5% p.a. (for portion >= 150M)
  const calculation = useMemo(() => {
    const bal = currentBalance;
    if (bal <= 0) {
      return {
        effectiveRate: 2.5,
        grossDaily: 0,
        taxDaily: 0,
        netDaily: 0,
        netMonthly: 0,
        netYearly: 0,
        isTaxed: false,
        tierText: '< Rp 150.000.000 (2,5% p.a.)'
      };
    }

    const TIER_LIMIT = 150000000; // Rp 150.000.000
    const TAX_THRESHOLD = 7500000; // Rp 7.500.000 (Pajak PPh 20%)

    let grossDaily = 0;
    let effectiveRate = 2.5;

    if (bal < TIER_LIMIT) {
      effectiveRate = 2.5;
      grossDaily = (bal * 0.025) / 365;
    } else {
      // Tiered rate: first 150M at 2.5%, remaining at 3.5%
      const tier1Gross = (TIER_LIMIT * 0.025) / 365;
      const tier2Gross = ((bal - TIER_LIMIT) * 0.035) / 365;
      grossDaily = tier1Gross + tier2Gross;
      effectiveRate = ((grossDaily * 365) / bal) * 100;
    }

    const isTaxed = bal > TAX_THRESHOLD;
    const taxDaily = isTaxed ? grossDaily * 0.20 : 0;
    const netDaily = grossDaily - taxDaily;
    const netMonthly = netDaily * 30;
    const netYearly = netDaily * 365;

    const tierText = bal >= TIER_LIMIT 
      ? '≥ Rp 150.000.000 (3,5% p.a.)'
      : '< Rp 150.000.000 (2,5% p.a.)';

    return {
      effectiveRate: effectiveRate.toFixed(2),
      grossDaily,
      taxDaily,
      netDaily,
      netMonthly,
      netYearly,
      isTaxed,
      tierText
    };
  }, [currentBalance]);

  // Claim Daily Interest Action
  const handleClaimInterest = async () => {
    if (calculation.netDaily <= 0) return;
    if (!onAddTransaction) return;

    const targetWId = selectedWalletId !== 'custom' ? selectedWalletId : (seaBankWallet ? seaBankWallet.id : (wallets[0]?.id || 'wallet_cash'));
    const amountToClaim = Math.round(calculation.netDaily);

    const newTx = {
      id: Date.now().toString(),
      type: 'income',
      title: 'Bunga Harian SeaBank',
      amount: amountToClaim,
      category: 'Lainnya',
      date: new Date().toISOString().split('T')[0],
      payment_method: targetWId
    };

    await onAddTransaction(newTx);
    if (showToast) showToast(`Bunga harian SeaBank sebesar ${formatIDR(amountToClaim)} berhasil dicatat sebagai Pemasukan!`, 'success');
  };

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)', border: '1px solid rgba(6, 182, 212, 0.2)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Decorative Glow */}
      <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }}></div>

      {/* Header Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #00a3e0 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' }}>
            <Percent size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Kalkulator Bunga SeaBank
              <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '0.15rem 0.5rem', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)', fontWeight: 600 }}>
                Cair Tiap Hari
              </span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Estimasi imbal hasil tabungan SeaBank secara real-time
            </span>
          </div>
        </div>
      </div>

      {/* Official SeaBank Rate Table Card */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', padding: '0.6rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <span>Tipe Rekening</span>
          <span>Jumlah Saldo</span>
          <span style={{ textAlign: 'right' }}>Suku Bunga (p.a.)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.03)', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tabungan</span>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
            Rp 0 - Rp 149.999.999
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', textAlign: 'right' }}>
            2,50%
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', padding: '0.75rem 1rem', alignItems: 'center', background: 'rgba(16, 185, 129, 0.02)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tabungan</span>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
            ≥ Rp 150.000.000
          </span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#06b6d4', textAlign: 'right' }}>
            3,50%
          </span>
        </div>
      </div>

      {/* Balance Input & Wallet Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
            Pilih Dompet / Rekening
          </label>
          <select 
            value={selectedWalletId} 
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="currency-select"
            style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem' }}
          >
            {wallets.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({formatIDR(w.balance)})
              </option>
            ))}
            <option value="custom">Nominal Kustom (Simulasi)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', display: 'block' }}>
            Saldo Simulasi
          </label>
          <input
            type="text"
            value={displayValue || formatIDR(currentBalance)}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={selectedWalletId !== 'custom'}
            placeholder="Masukkan nominal saldo"
            style={{ width: '100%', padding: '0.55rem 0.75rem', fontSize: '0.85rem', background: selectedWalletId !== 'custom' ? 'rgba(255,255,255,0.03)' : undefined }}
          />
        </div>
      </div>

      {/* Realtime Yield Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        
        {/* Daily Yield */}
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.85rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', fontWeight: 500 }}>
            Bunga Harian (Net)
          </span>
          <strong style={{ fontSize: '1.1rem', color: '#10b981', display: 'block', fontWeight: 800 }}>
            {formatIDR(Math.round(calculation.netDaily))}
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
            Cair setiap hari
          </span>
        </div>

        {/* Monthly Yield */}
        <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '0.85rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', fontWeight: 500 }}>
            Estimasi Bulanan (30 Hari)
          </span>
          <strong style={{ fontSize: '1.1rem', color: '#06b6d4', display: 'block', fontWeight: 800 }}>
            {formatIDR(Math.round(calculation.netMonthly))}
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
            Tier: {calculation.tierText}
          </span>
        </div>

        {/* Yearly Yield */}
        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '0.85rem', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem', fontWeight: 500 }}>
            Estimasi Tahunan (365 Hari)
          </span>
          <strong style={{ fontSize: '1.1rem', color: '#a78bfa', display: 'block', fontWeight: 800 }}>
            {formatIDR(Math.round(calculation.netYearly))}
          </strong>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'block' }}>
            Rate efektif ~{calculation.effectiveRate}% p.a.
          </span>
        </div>
      </div>

      {/* Tax & Info Footnote */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Info size={14} color="#06b6d4" />
          <span>
            {calculation.isTaxed 
              ? 'Saldo > Rp 7.5jt dikenakan pajak PPh bunga 20% (bunga cair otomatis tiap hari baru saat login).' 
              : 'Saldo ≤ Rp 7.5jt bebas pajak PPh bunga (bunga cair otomatis tiap hari baru saat login).'}
          </span>
        </div>
      </div>
    </div>
  );
}
