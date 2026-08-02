import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Plus, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

export default function WalletManager({ wallets, fetchUserData, formatIDR, showToast, showConfirm, currency = 'IDR' }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [loading, setLoading] = useState(false);

  const { displayValue: balanceDisplay, rawValue: balanceRaw, handleChange: handleBalanceChange, handleBlur: handleBalanceBlur, reset: resetBalance } = useCurrencyInput(currency);

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!name || !balanceRaw) return;

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

    const newWallet = {
        id: Date.now().toString(),
        user_id: user.id,
        name,
        type,
        balance: parseFloat(balanceRaw)
      };

      const { error } = await supabase.from('wallets').insert(newWallet);
      if (error) throw error;

      setName('');
      resetBalance();
      if (showToast) showToast('Dompet baru berhasil ditambahkan!', 'success');
      await fetchUserData(); // Refresh wallets in parent state
    } catch (error) {
      if (showToast) showToast('Gagal menambahkan dompet: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (id, walletName) => {
    if (walletName === 'Dompet Cash' || walletName === 'Rekening Bank') {
      if (showToast) showToast('Dompet default tidak boleh dihapus.', 'warning');
      return;
    }

    const doDelete = async () => {
      try {
        const { error } = await supabase.from('wallets').delete().eq('id', id);
        if (error) throw error;
        if (showToast) showToast('Dompet berhasil dihapus', 'info');
        await fetchUserData();
      } catch (error) {
        if (showToast) showToast('Gagal menghapus dompet: ' + error.message, 'error');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Hapus Dompet',
        `Hapus dompet "${walletName}"? Semua riwayat saldo terkait mungkin terpengaruh.`,
        doDelete,
        true
      );
    } else {
      doDelete();
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Wallet size={20} color="var(--accent-color)" />
        Kelola Dompet / Rekening
      </h2>

      {/* Form Tambah Dompet */}
      <form onSubmit={handleAddWallet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Nama Dompet</label>
          <input 
            type="text" 
            placeholder="e.g. Gopay, Bank Mandiri" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Kategori</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="cash">Cash (Tunai)</option>
            <option value="cashless">Cashless (Digital/Bank)</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Saldo Awal</label>
          <input 
            type="text"
            inputMode="numeric"
            placeholder="0" 
            value={balanceDisplay} 
            onChange={handleBalanceChange}
            onBlur={handleBalanceBlur}
            required 
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading} style={{ padding: '0.75rem 1rem', width: 'auto' }}>
          <Plus size={16} /> Dompet
        </button>
      </form>

      {/* Daftar Dompet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {wallets.map(w => {
          const isSeaBank = w.name.toLowerCase().includes('seabank');
          const rateText = w.balance >= 150000000 ? '3,5% p.a.' : '2,5% p.a.';
          
          let dailyNet = 0;
          if (isSeaBank && w.balance > 0) {
            const gross = w.balance <= 150000000 
              ? (w.balance * 0.025) / 365 
              : ((150000000 * 0.025) + (w.balance - 150000000) * 0.035) / 365;
            dailyNet = Math.round(gross * (w.balance > 7500000 ? 0.8 : 1));
          }

          return (
            <div key={w.id} style={{ background: isSeaBank ? 'rgba(6, 182, 212, 0.04)' : 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: `1px solid ${isSeaBank ? 'rgba(6, 182, 212, 0.25)' : 'var(--border-color)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 600 }}>{w.name}</h4>
                  {isSeaBank && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                      SeaBank {rateText}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: w.type === 'cash' ? '#f59e0b' : '#10b981', textTransform: 'capitalize' }}>
                  {w.type === 'cash' ? 'Cash' : 'Cashless'}
                </span>
                <div style={{ fontWeight: 700, marginTop: '0.25rem', fontSize: '0.95rem' }}>{formatIDR(w.balance)}</div>
                
                {isSeaBank && dailyNet > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'block', marginTop: '0.2rem', fontWeight: 600 }}>
                    +{formatIDR(dailyNet)} / hari (Bunga Cair)
                  </span>
                )}
              </div>
              {(w.name !== 'Dompet Cash' && w.name !== 'Rekening Bank') && (
                <button onClick={() => handleDeleteWallet(w.id, w.name)} className="btn-delete">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
