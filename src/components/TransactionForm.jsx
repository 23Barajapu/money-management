import React, { useState, useEffect } from 'react';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

export default function TransactionForm({ onAddTransaction, wallets = [], currency = 'IDR' }) {
  const [type, setType] = useState('income'); // 'income', 'expense', or 'transfer'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');

  const { displayValue, rawValue, handleChange: handleAmountChange, handleBlur: handleAmountBlur, reset: resetAmount } = useCurrencyInput(currency);

  // Fallback if wallets are not fetched yet
  const activeWallets = wallets.length > 0 ? wallets : [
    { id: 'wallet_cash', name: 'Dompet Cash', type: 'cash' },
    { id: 'wallet_cashless', name: 'Rekening Bank', type: 'cashless' }
  ];

  useEffect(() => {
    if (activeWallets.length > 0) {
      if (!paymentMethod) {
        setPaymentMethod(activeWallets[0].id);
      }
      if (!destinationWalletId && activeWallets.length > 1) {
        setDestinationWalletId(activeWallets[1].id);
      }
    }
  }, [wallets]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !rawValue || (type !== 'transfer' && !category)) return;

    onAddTransaction({
      id: Date.now().toString(),
      type,
      title: type === 'transfer' ? (title || 'Transfer Saldo') : title,
      amount: parseFloat(rawValue),
      category: type === 'transfer' ? destinationWalletId : category,
      date,
      payment_method: paymentMethod,
    });

    setTitle('');
    resetAmount();
    setCategory('');
  };

  const currencyLabel = currency === 'IDR' ? 'Rp' : currency;

  const categories = {
    income: ['Gaji', 'Bonus', 'Investasi', 'Lain-lain'],
    expense: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Cicilan', 'Hiburan', 'Lain-lain'],
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Tambah Transaksi</h2>
      <form onSubmit={handleSubmit}>
        <div className="btn-group">
          <button
            type="button"
            className={`btn-toggle income ${type === 'income' ? 'active' : ''}`}
            onClick={() => { setType('income'); setCategory(''); }}
          >
            <ArrowUpCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Pemasukan
          </button>
          <button
            type="button"
            className={`btn-toggle expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => { setType('expense'); setCategory(''); }}
          >
            <ArrowDownCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Pengeluaran
          </button>
          <button
            type="button"
            className={`btn-toggle transfer ${type === 'transfer' ? 'active' : ''}`}
            onClick={() => { setType('transfer'); setCategory('Transfer'); }}
          >
            <RefreshCw size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Transfer
          </button>
        </div>

        <div className="form-group">
          <label>Judul Transaksi</label>
          <input
            type="text"
            placeholder={type === 'transfer' ? "e.g. Kirim Uang" : "e.g. Gaji Bulanan, Beli Kopi"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Nominal ({currencyLabel})</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              {currencyLabel}
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder={currency === 'IDR' ? '0' : '0.00'}
              value={displayValue}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              required
              style={{ paddingLeft: currency.length <= 3 ? '2.5rem' : '3.5rem' }}
            />
          </div>
        </div>

        {type !== 'transfer' && (
          <div className="form-group">
            <label>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories[type].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {type === 'transfer' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Dari Dompet</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                {activeWallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Ke Dompet</label>
              <select value={destinationWalletId} onChange={(e) => setDestinationWalletId(e.target.value)} required>
                {activeWallets.filter(w => w.id !== paymentMethod).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>Sumber Dompet / Rekening</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              {activeWallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.type === 'cash' ? 'Cash' : 'Cashless'})</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-submit">
          <PlusCircle size={18} />
          Simpan Transaksi
        </button>
      </form>
    </div>
  );
}
