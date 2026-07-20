import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, Plus, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function WalletManager({ wallets, fetchUserData, formatIDR }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!name || !balance) return;

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newWallet = {
        id: Date.now().toString(),
        user_id: user.id,
        name,
        type,
        balance: parseFloat(balance)
      };

      const { error } = await supabase.from('wallets').insert(newWallet);
      if (error) throw error;

      setName('');
      setBalance('');
      await fetchUserData(); // Refresh wallets in parent state
    } catch (error) {
      alert('Gagal menambahkan dompet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWallet = async (id, walletName) => {
    if (walletName === 'Dompet Cash' || walletName === 'Rekening Bank') {
      alert('Dompet default tidak boleh dihapus.');
      return;
    }
    if (!confirm(`Hapus dompet "${walletName}"? Semua riwayat saldo terkait mungkin terpengaruh.`)) return;

    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
      await fetchUserData();
    } catch (error) {
      alert('Gagal menghapus dompet: ' + error.message);
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
            type="number" 
            placeholder="e.g. 500000" 
            value={balance} 
            onChange={(e) => setBalance(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading} style={{ padding: '0.75rem 1rem', width: 'auto' }}>
          <Plus size={16} /> Dompet
        </button>
      </form>

      {/* Daftar Dompet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {wallets.map(w => (
          <div key={w.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>{w.name}</h4>
              <span style={{ fontSize: '0.75rem', color: w.type === 'cash' ? '#f59e0b' : '#10b981', textTransform: 'capitalize' }}>
                {w.type === 'cash' ? 'Cash' : 'Cashless'}
              </span>
              <div style={{ fontWeight: 700, marginTop: '0.25rem', fontSize: '0.95rem' }}>{formatIDR(w.balance)}</div>
            </div>
            {(w.name !== 'Dompet Cash' && w.name !== 'Rekening Bank') && (
              <button onClick={() => handleDeleteWallet(w.id, w.name)} className="btn-delete">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
