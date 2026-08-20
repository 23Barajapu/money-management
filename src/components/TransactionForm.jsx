import React, { useState, useEffect } from 'react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';
import { usePaydayCycle } from '../hooks/usePaydayCycle';
import { AlertTriangle } from 'lucide-react';

export default function TransactionForm({ onAddTransaction, wallets = [], currency = 'IDR', initialType = 'income', transactions = [], monthlyIncome = 0, paydayDate = 1, t = (k) => k }) {
  const [type, setType] = useState(initialType); // 'income', 'expense', or 'transfer'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [destinationWalletId, setDestinationWalletId] = useState('');

  useEffect(() => {
    if (initialType) {
      setType(initialType);
      if (initialType === 'income') setCategory('Gaji Utama');
      else if (initialType === 'expense') setCategory('Makanan Dasar');
      else if (initialType === 'transfer') setCategory('Transfer');
    }
  }, [initialType]);

  const { displayValue, rawValue, handleChange: handleAmountChange, handleBlur: handleAmountBlur, reset: resetAmount } = useCurrencyInput(currency);

  const formatBalance = (num) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(num || 0);
  };

  // Fallback if wallets are not fetched yet
  const activeWallets = wallets.length > 0 ? wallets : [
    { id: 'wallet_cash', name: 'Dompet Cash', type: 'cash', balance: 0 },
    { id: 'wallet_cashless', name: 'Rekening Bank', type: 'cashless', balance: 0 }
  ];

  const getBestFundedWalletId = (walletList, currentId = '') => {
    if (!walletList || walletList.length === 0) return '';
    if (currentId) {
      const curr = walletList.find(w => w.id === currentId);
      if (curr && (curr.balance || 0) > 0) return curr.id;
    }
    const funded = walletList.filter(w => (w.balance || 0) > 0);
    if (funded.length > 0) {
      return funded.reduce((max, w) => ((w.balance || 0) > (max.balance || 0) ? w : max), funded[0]).id;
    }
    return walletList[0].id;
  };

  useEffect(() => {
    if (activeWallets.length > 0) {
      const bestWallet = getBestFundedWalletId(activeWallets, paymentMethod);
      if (!paymentMethod || (type !== 'income' && (!activeWallets.find(w => w.id === paymentMethod) || (activeWallets.find(w => w.id === paymentMethod)?.balance || 0) <= 0))) {
        setPaymentMethod(bestWallet);
      }
      if (!destinationWalletId || destinationWalletId === (paymentMethod || bestWallet)) {
        const dest = activeWallets.find(w => w.id !== (paymentMethod || bestWallet));
        if (dest) setDestinationWalletId(dest.id);
      }
    }
  }, [wallets, type]);

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
    income: ['Gaji Utama', 'Bonus & Tunjangan', 'Hasil Investasi', 'Bisnis / Sampingan', 'Lain-lain'],
    expensePokok: ['Makanan Dasar', 'Sewa & Cicilan Rumah', 'Utilitas & Tagihan', 'Transportasi', 'Kesehatan & Asuransi'],
    expenseBebas: ['Hiburan & Streaming', 'Dining Out & Jajan', 'Hobi & Fashion', 'Belanja Gaya Hidup'],
    expenseInvestasi: ['ETF & Saham', 'Obligasi & REIT', 'Emas & Crypto', 'Edukasi & Kursus'],
    expenseDarurat: ['Tabungan Darurat'],
    expenseLain: ['Lain-lain']
  };

  const getAllocationInfo = (cat, tType) => {
    if (tType === 'income') {
      return { text: 'Pemasukan — Basis Alokasi 50-5-30-15', color: 'var(--income-color)' };
    }
    if (tType === 'transfer') {
      return { text: 'Transfer Saldo — Tidak Mengubah Alokasi', color: 'var(--saving-color)' };
    }
    if (!cat) return null;
    const c = cat.toLowerCase();
    if (c.includes('hiburan') || c.includes('belanja') || c.includes('dining') || c.includes('hobi') || c.includes('jajan') || c.includes('gaya')) {
      return { text: 'Pos Alokasi: Kebutuhan Bebas (5%)', color: '#ec4899' };
    }
    if (c.includes('investasi') || c.includes('saham') || c.includes('etf') || c.includes('obligasi') || c.includes('reit') || c.includes('crypto') || c.includes('emas') || c.includes('edukasi') || c.includes('kursus')) {
      return { text: 'Pos Alokasi: Investasi (30%)', color: '#10b981' };
    }
    if (c.includes('tabungan') || c.includes('darurat')) {
      return { text: 'Pos Alokasi: Dana Darurat (15%)', color: '#06b6d4' };
    }
    return { text: 'Pos Alokasi: Kebutuhan Pokok (50%)', color: '#8b5cf6' };
  };

  const { totalCycleIncome, spentPokok, spentBebas, spentInvestasi, savedDarurat } = usePaydayCycle(transactions, paydayDate);

  const getWarningMessage = () => {
    const amount = parseFloat(rawValue || '0');
    if (isNaN(amount) || amount <= 0) return null;

    // Check Wallet Limit
    if (type === 'expense' || type === 'transfer') {
      const selectedWallet = activeWallets.find(w => w.id === paymentMethod);
      if (selectedWallet && selectedWallet.type !== 'cash') {
        if (amount > selectedWallet.balance) {
          return { text: t('walletInsufficient').replace('{wallet}', selectedWallet.name), type: 'error' };
        } else if (amount >= selectedWallet.balance * 0.9) {
          return { text: t('walletAlmostEmpty').replace('{wallet}', selectedWallet.name), type: 'warning' };
        }
      }
    }

    // Check Category Allocation Limit
    if (type === 'expense') {
      const baseIncome = monthlyIncome > 0 ? monthlyIncome : totalCycleIncome;
      if (baseIncome <= 0) return null;

      const catInfo = getAllocationInfo(category, type);
      if (catInfo && category) {
        let limit = 0;
        let currentSpent = 0;
        let bucketName = '';
        
        if (catInfo.text.includes('Kebutuhan Pokok')) { limit = baseIncome * 0.5; currentSpent = spentPokok; bucketName = 'Kebutuhan Pokok (50%)'; }
        else if (catInfo.text.includes('Kebutuhan Bebas')) { limit = baseIncome * 0.05; currentSpent = spentBebas; bucketName = 'Kebutuhan Bebas (5%)'; }
        else if (catInfo.text.includes('Investasi')) { limit = baseIncome * 0.3; currentSpent = spentInvestasi; bucketName = 'Investasi (30%)'; }
        else if (catInfo.text.includes('Dana Darurat')) { limit = baseIncome * 0.15; currentSpent = savedDarurat; bucketName = 'Dana Darurat (15%)'; }

        if (limit > 0) {
          if (currentSpent + amount > limit) {
            return { text: t('allocationExceeded').replace('{bucket}', bucketName), type: 'error' };
          } else if (currentSpent + amount >= limit * 0.9) {
            return { text: t('allocationAlmostEmpty').replace('{bucket}', bucketName), type: 'warning' };
          }
        }
      }
    }
    
    return null;
  };

  const warningMsg = getWarningMessage();
  const allocInfo = getAllocationInfo(category, type);

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 600 }}>Tambah Transaksi</h2>
      <form onSubmit={handleSubmit}>
        <div className="btn-group">
          <button
            type="button"
            className={`btn-toggle income ${type === 'income' ? 'active' : ''}`}
            onClick={() => { setType('income'); setCategory('Gaji Utama'); }}
          >
            Pemasukan
          </button>
          <button
            type="button"
            className={`btn-toggle expense ${type === 'expense' ? 'active' : ''}`}
            onClick={() => { setType('expense'); setCategory('Makanan Dasar'); }}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            className={`btn-toggle transfer ${type === 'transfer' ? 'active' : ''}`}
            onClick={() => { setType('transfer'); setCategory('Transfer'); }}
          >
            Transfer
          </button>
        </div>

        <div className="form-group">
          <label>Judul Transaksi</label>
          <input
            type="text"
            placeholder={type === 'transfer' ? "e.g. Kirim Uang" : "e.g. Gaji Bulanan, Makan Siang"}
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

        {type === 'expense' && (
          <div className="form-group">
            <label>Kategori Pengeluaran (Alokasi 50-5-30-15)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              <optgroup label="Kebutuhan Pokok (50%)">
                {categories.expensePokok.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Kebutuhan Bebas (5%)">
                {categories.expenseBebas.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Investasi (30%)">
                {categories.expenseInvestasi.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Dana Darurat (15%)">
                {categories.expenseDarurat.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Lainnya">
                {categories.expenseLain.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>
        )}

        {type === 'income' && (
          <div className="form-group">
            <label>Kategori Pemasukan</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories.income.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {allocInfo && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '0.45rem 0.75rem', 
            borderRadius: '0.5rem', 
            fontSize: '0.775rem', 
            fontWeight: 600, 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: `1px solid ${allocInfo.color}`, 
            color: allocInfo.color,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            {allocInfo.text}
          </div>
        )}

        {type === 'transfer' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label>Dari Dompet (Sumber)</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => {
                  const newSource = e.target.value;
                  setPaymentMethod(newSource);
                  if (destinationWalletId === newSource) {
                    const other = activeWallets.find(w => w.id !== newSource);
                    if (other) setDestinationWalletId(other.id);
                  }
                }} 
                required
              >
                {activeWallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatBalance(w.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ke Dompet (Tujuan)</label>
              <select value={destinationWalletId} onChange={(e) => setDestinationWalletId(e.target.value)} required>
                {activeWallets.filter(w => w.id !== paymentMethod).map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatBalance(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="form-group">
            <label>{type === 'income' ? 'Masuk ke Dompet' : 'Sumber Dompet / Rekening'}</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              {activeWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatBalance(w.balance)})
                </option>
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

        {warningMsg && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: warningMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: warningMsg.type === 'error' ? 'var(--expense-color)' : '#f59e0b',
            border: `1px solid ${warningMsg.type === 'error' ? 'var(--expense-color)' : '#f59e0b'}`
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{warningMsg.text}</span>
          </div>
        )}

        <button type="submit" className="btn-submit">
          Simpan Transaksi
        </button>
      </form>
    </div>
  );
}
