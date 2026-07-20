import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Plus, Trash2, CheckCircle, Bell, RefreshCw } from 'lucide-react';

export default function Reminders({ userId, formatIDR, onAddTransaction }) {
  // Recurring States
  const [recurring, setRecurring] = useState([]);
  const [recType, setRecType] = useState('expense');
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('Lainnya');
  const [recMethod, setRecMethod] = useState('cash');
  const [recInterval, setRecInterval] = useState('monthly'); // daily, weekly, monthly
  const [recLoading, setRecLoading] = useState(false);

  // Bill States
  const [bills, setBills] = useState([]);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billLoading, setBillLoading] = useState(false);

  // Form categories
  const categories = {
    income: ['Gaji', 'Investasi', 'Hibah', 'Lainnya'],
    expense: ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan', 'Investasi', 'Lainnya']
  };

  useEffect(() => {
    fetchRecurring();
    fetchBills();
  }, []);

  const fetchRecurring = async () => {
    try {
      const { data, error } = await supabase.from('recurring_transactions').select('*');
      if (error) throw error;
      setRecurring(data || []);
      // Check and trigger scheduler once data is fetched
      if (data && data.length > 0) {
        checkAndTriggerRecurring(data);
      }
    } catch (err) {
      console.error('Error fetching recurring:', err.message);
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase.from('bills').select('*').order('due_date', { ascending: true });
      if (error) throw error;
      setBills(data || []);
    } catch (err) {
      console.error('Error fetching bills:', err.message);
    }
  };

  // Automated Scheduler logic
  const checkAndTriggerRecurring = async (recurringItems) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    for (const item of recurringItems) {
      const lastTriggered = new Date(item.last_triggered);
      let diffTime = Math.abs(today - lastTriggered);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let shouldTrigger = false;
      if (item.interval === 'daily' && diffDays >= 1) shouldTrigger = true;
      if (item.interval === 'weekly' && diffDays >= 7) shouldTrigger = true;
      if (item.interval === 'monthly' && diffDays >= 30) shouldTrigger = true; // standard 30 days check

      if (shouldTrigger && todayStr !== item.last_triggered) {
        try {
          // 1. Insert transaction
          const { error: txErr } = await supabase.from('transactions').insert({
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
            user_id: userId,
            type: item.type,
            title: `[Auto] ${item.title}`,
            amount: parseFloat(item.amount),
            category: item.category,
            date: todayStr,
            payment_method: item.payment_method
          });
          if (txErr) throw txErr;

          // 2. Update last_triggered in recurring_transactions
          await supabase
            .from('recurring_transactions')
            .update({ last_triggered: todayStr })
            .eq('id', item.id);
        } catch (err) {
          console.error('Auto scheduler failed for item:', item.title, err.message);
        }
      }
    }
  };

  // Add Recurring
  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!recTitle || !recAmount) return;
    setRecLoading(true);

    const newItem = {
      id: Date.now().toString(),
      user_id: userId,
      type: recType,
      title: recTitle,
      amount: parseFloat(recAmount),
      category: recCategory,
      payment_method: recMethod,
      interval: recInterval,
      last_triggered: new Date().toISOString().split('T')[0]
    };

    try {
      const { error } = await supabase.from('recurring_transactions').insert(newItem);
      if (error) throw error;
      setRecTitle('');
      setRecAmount('');
      fetchRecurring();
    } catch (err) {
      alert('Gagal membuat transaksi berulang: ' + err.message);
    } finally {
      setRecLoading(false);
    }
  };

  // Delete Recurring
  const handleDeleteRecurring = async (id) => {
    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
      fetchRecurring();
    } catch (err) {
      alert('Gagal menghapus transaksi berulang: ' + err.message);
    }
  };

  // Add Bill
  const handleAddBill = async (e) => {
    e.preventDefault();
    if (!billName || !billAmount || !billDueDate) return;
    setBillLoading(true);

    const newBill = {
      id: Date.now().toString(),
      user_id: userId,
      name: billName,
      amount: parseFloat(billAmount),
      due_date: billDueDate,
      is_paid: false
    };

    try {
      const { error } = await supabase.from('bills').insert(newBill);
      if (error) throw error;
      setBillName('');
      setBillAmount('');
      setBillDueDate('');
      fetchBills();
    } catch (err) {
      alert('Gagal menambah pengingat tagihan: ' + err.message);
    } finally {
      setBillLoading(false);
    }
  };

  // Pay Bill (mark as paid & create expense transaction)
  const handlePayBill = async (bill) => {
    try {
      // 1. Mark bill as paid in DB
      const { error } = await supabase.from('bills').update({ is_paid: true }).eq('id', bill.id);
      if (error) throw error;

      // 2. Add expense transaction
      const newTx = {
        id: Date.now().toString(),
        type: 'expense',
        title: `Bayar Tagihan: ${bill.name}`,
        amount: bill.amount,
        category: 'Tagihan',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cashless'
      };
      
      const { error: txErr } = await supabase.from('transactions').insert({
        id: newTx.id,
        user_id: userId,
        type: newTx.type,
        title: newTx.title,
        amount: newTx.amount,
        category: newTx.category,
        date: newTx.date,
        payment_method: newTx.payment_method
      });
      if (txErr) throw txErr;

      fetchBills();
      // Reload page to update balances in parent
      window.location.reload();
    } catch (err) {
      alert('Gagal membayar tagihan: ' + err.message);
    }
  };

  // Delete Bill
  const handleDeleteBill = async (id) => {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      fetchBills();
    } catch (err) {
      alert('Gagal menghapus tagihan: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      
      {/* SECTION 1: BILL REMINDERS */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Pengingat Tagihan Bulanan</h2>
        
        <form onSubmit={handleAddBill} className="reminder-form form-bills">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Nama Tagihan (e.g. Listrik, Wifi)"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="number"
              placeholder="Nominal (Rp)"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              required
              min="1000"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="date"
              value={billDueDate}
              onChange={(e) => setBillDueDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit" disabled={billLoading} style={{ margin: 0, padding: '0 1rem' }}>
            <Plus size={18} /> Tambah
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bills.length === 0 ? (
            <div className="empty-state">Belum ada pengingat tagihan.</div>
          ) : (
            bills.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Bell size={18} style={{ color: b.is_paid ? 'var(--text-secondary)' : 'var(--accent-color)' }} />
                  <div>
                    <div style={{ fontWeight: 600, textDecoration: b.is_paid ? 'line-through' : 'none', color: b.is_paid ? 'var(--text-secondary)' : 'white' }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jatuh Tempo: {b.due_date} • {formatIDR(b.amount)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {!b.is_paid ? (
                    <button onClick={() => handlePayBill(b)} style={{ background: 'var(--income-color)', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                      Bayar
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--income-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <CheckCircle size={14} /> Lunas
                    </span>
                  )}
                  <button onClick={() => handleDeleteBill(b.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: RECURRING TRANSACTIONS */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Otomatisasi Transaksi Berulang</h2>
        
        <form onSubmit={handleAddRecurring} className="reminder-form form-recurring">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Nama / Deskripsi"
              value={recTitle}
              onChange={(e) => setRecTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="number"
              placeholder="Nominal (Rp)"
              value={recAmount}
              onChange={(e) => setRecAmount(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={recInterval} onChange={(e) => setRecInterval(e.target.value)} required>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)} required>
              {categories[recType].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-submit" disabled={recLoading} style={{ margin: 0, padding: '0 1rem' }}>
            <Plus size={18} />
          </button>
        </form>

        {/* List of Recurring items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recurring.length === 0 ? (
            <div className="empty-state">Belum ada otomatisasi transaksi berulang.</div>
          ) : (
            recurring.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <RefreshCw size={16} style={{ color: 'var(--saving-color)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.title} ({item.interval === 'daily' ? 'Harian' : item.interval === 'weekly' ? 'Mingguan' : 'Bulanan'})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kategori: {item.category} • {formatIDR(item.amount)} • Terakhir: {item.last_triggered}</div>
                  </div>
                </div>
                <button onClick={() => handleDeleteRecurring(item.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
