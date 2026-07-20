import React, { useState } from 'react';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';

export default function TransactionForm({ onAddTransaction }) {
  const [type, setType] = useState('income'); // 'income' or 'expense'
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'cashless'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount || (type !== 'transfer' && !category)) return;

    onAddTransaction({
      id: Date.now().toString(),
      type,
      title: type === 'transfer' ? (title || 'Transfer Saldo') : title,
      amount: parseFloat(amount),
      category: type === 'transfer' ? 'Transfer' : category,
      date,
      payment_method: paymentMethod,
    });

    setTitle('');
    setAmount('');
    setCategory('');
  };

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
            placeholder="e.g. Gaji Bulanan, Beli Kopi"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Nominal (Rp)</label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
          />
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

        <div className="form-group">
          <label>{type === 'transfer' ? 'Arah Transfer' : 'Metode Pembayaran'}</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            {type === 'transfer' ? (
              <>
                <option value="cash">Cash ke Cashless</option>
                <option value="cashless">Cashless ke Cash</option>
              </>
            ) : (
              <>
                <option value="cash">Cash (Tunai)</option>
                <option value="cashless">Cashless (Digital/Transfer)</option>
              </>
            )}
          </select>
        </div>

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
