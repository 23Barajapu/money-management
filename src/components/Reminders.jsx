import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Bell, Plus, Trash2, CheckCircle2, Clock, Play, Wallet, CreditCard } from 'lucide-react';

export default function Reminders({ onAddTransaction, formatIDR, wallets = [], installments = [], onPayInstallment }) {
  const [recurrings, setRecurrings] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states - Recurring
  const [recType, setRecType] = useState('expense');
  const [recTitle, setRecTitle] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState('Lainnya');
  const [recMethod, setRecMethod] = useState('wallet_cash');
  const [recInterval, setRecInterval] = useState('monthly');

  // Form states - Bills
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  
  // Selected wallet state for paying bills & paying installments from reminder
  const [selectedBillWallet, setSelectedBillWallet] = useState({});
  const [selectedInstWallet, setSelectedInstWallet] = useState({});

  const categories = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Kesehatan', 'Edukasi', 'Lainnya'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [recRes, billsRes] = await Promise.all([
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id),
        supabase.from('bills').select('*').eq('user_id', user.id).order('due_date', { ascending: true })
      ]);

      if (recRes.error) throw recRes.error;
      if (billsRes.error) throw billsRes.error;

      setRecurrings(recRes.data || []);
      setBills(billsRes.data || []);

      // Trigger automatic recurring checking on load
      checkAndTriggerRecurring(recRes.data || [], user.id);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automated Scheduler logic
  const checkAndTriggerRecurring = async (recurringList, userId) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (const item of recurringList) {
      const lastDate = new Date(item.last_triggered);
      let diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      let shouldTrigger = false;

      if (item.interval === 'daily' && diffDays >= 1) {
        shouldTrigger = true;
      } else if (item.interval === 'weekly' && diffDays >= 7) {
        shouldTrigger = true;
      } else if (item.interval === 'monthly' && diffDays >= 30) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        try {
          // 1. Insert into transactions
          const newTx = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            user_id: userId,
            type: item.type,
            title: `${item.title} (Otomatis)`,
            amount: parseFloat(item.amount),
            category: item.category,
            date: todayStr,
            payment_method: item.payment_method || (wallets[0]?.id || 'wallet_cash')
          };

          // Call onAddTransaction parent function to trigger UI sync/insert
          await onAddTransaction(newTx);

          // 2. Update last_triggered in recurring_transactions
          await supabase
            .from('recurring_transactions')
            .update({ last_triggered: todayStr })
            .eq('id', item.id);

        } catch (err) {
          console.error('Error triggering recurring item:', item.title, err);
        }
      }
    }
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    if (!recTitle || !recAmount) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newRec = {
        id: Date.now().toString(),
        user_id: user.id,
        type: recType,
        title: recTitle,
        amount: parseFloat(recAmount),
        category: recCategory,
        payment_method: recMethod || (wallets[0]?.id || 'wallet_cash'),
        interval: recInterval,
        last_triggered: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase.from('recurring_transactions').insert(newRec);
      if (error) throw error;

      setRecTitle('');
      setRecAmount('');
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteRecurring = async (id) => {
    try {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    if (!billName || !billAmount || !billDueDate) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newBill = {
        id: Date.now().toString(),
        user_id: user.id,
        name: billName,
        amount: parseFloat(billAmount),
        due_date: billDueDate,
        is_paid: false
      };

      const { error } = await supabase.from('bills').insert(newBill);
      if (error) throw error;

      setBillName('');
      setBillAmount('');
      setBillDueDate('');
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePayBill = async (bill) => {
    if (bill.is_paid) return;
    const walletId = selectedBillWallet[bill.id] || (wallets[0]?.id || 'wallet_cash');
    const chosenWallet = wallets.find(w => w.id === walletId);
    
    if (chosenWallet && bill.amount > chosenWallet.balance) {
      alert(`Saldo ${chosenWallet.name} (${formatIDR(chosenWallet.balance)}) tidak mencukupi untuk bayar tagihan ${formatIDR(bill.amount)}!`);
      return;
    }

    const confirmPay = confirm(`Bayar tagihan "${bill.name}" sebesar ${formatIDR(bill.amount)} dari ${chosenWallet ? chosenWallet.name : 'dompet'}? Transaksi pengeluaran otomatis akan dicatat.`);
    if (!confirmPay) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // 1. Mark as paid
      const { error } = await supabase.from('bills').update({ is_paid: true }).eq('id', bill.id);
      if (error) throw error;

      // 2. Add automatic expense transaction with selected wallet
      const newTx = {
        id: Date.now().toString(),
        user_id: user.id,
        type: 'expense',
        title: `Bayar Tagihan: ${bill.name}`,
        amount: parseFloat(bill.amount),
        category: 'Lainnya',
        date: new Date().toISOString().split('T')[0],
        payment_method: walletId
      };
      await onAddTransaction(newTx);

      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteBill = async (id) => {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePayInstallmentFromReminder = (inst) => {
    if (!onPayInstallment) return;
    const walletId = selectedInstWallet[inst.id] || (wallets[0]?.id || 'wallet_cash');
    const chosenWallet = wallets.find(w => w.id === walletId);

    if (chosenWallet && inst.monthlyPayment > chosenWallet.balance) {
      alert(`Saldo ${chosenWallet.name} (${formatIDR(chosenWallet.balance)}) tidak mencukupi untuk pembayaran cicilan ${formatIDR(inst.monthlyPayment)}!`);
      return;
    }

    onPayInstallment(inst.id, inst.monthlyPayment, walletId);
  };

  const activeInstallments = installments.filter(inst => (inst.totalAmount - inst.paidAmount) > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      {/* SECTION 1: RECURRING TRANSACTIONS */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <Calendar size={20} color="var(--accent-color)" />
          Transaksi Berulang Otomatis
        </h2>

        <form onSubmit={handleAddRecurring} className="reminder-grid-form">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Judul</label>
            <input type="text" placeholder="e.g. Kosan, Netflix" value={recTitle} onChange={(e) => setRecTitle(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nominal</label>
            <input type="number" placeholder="Nominal" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Frekuensi</label>
            <select value={recInterval} onChange={(e) => setRecInterval(e.target.value)}>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Sumber Uang / Dompet</label>
            <select value={recMethod} onChange={(e) => setRecMethod(e.target.value)}>
              {wallets.length === 0 ? (
                <>
                  <option value="wallet_cash">Dompet Cash</option>
                  <option value="wallet_cashless">Rekening Bank</option>
                </>
              ) : (
                wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name} ({formatIDR(w.balance)})</option>
                ))
              )}
            </select>
          </div>
          <button type="submit" className="btn-submit" style={{ padding: '0.75rem 1rem', width: 'auto' }}>
            <Plus size={16} /> Tambah
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {recurrings.length === 0 ? (
            <div className="empty-state">Belum ada pencatatan transaksi berulang otomatis.</div>
          ) : (
            recurrings.map(r => {
              const matchedWallet = wallets.find(w => w.id === r.payment_method);
              return (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 600 }}>{r.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {formatIDR(r.amount)} • {r.interval === 'daily' ? 'Harian' : r.interval === 'weekly' ? 'Mingguan' : 'Bulanan'} ({matchedWallet ? matchedWallet.name : r.payment_method})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', background: 'rgba(139, 92, 246, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      <Play size={10} style={{ display: 'inline', marginRight: '0.25rem' }} /> Terakhir: {r.last_triggered}
                    </span>
                    <button onClick={() => handleDeleteRecurring(r.id)} className="btn-delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: BILL REMINDERS & INTEGRATED INSTALLMENT PAYMENTS */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <Bell size={20} color="var(--expense-color)" />
          Pengingat Tagihan & Cicilan Aktif
        </h2>

        <form onSubmit={handleAddBill} className="bill-grid-form" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nama Tagihan</label>
            <input type="text" placeholder="e.g. Listrik, Wifi" value={billName} onChange={(e) => setBillName(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Jumlah Tagihan</label>
            <input type="number" placeholder="Nominal" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Jatuh Tempo</label>
            <input type="date" value={billDueDate} onChange={(e) => setBillDueDate(e.target.value)} required />
          </div>
          <button type="submit" className="btn-submit" style={{ padding: '0.75rem 1rem', width: 'auto' }}>
            <Plus size={16} /> Tagihan
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Bills List */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Daftar Tagihan Rutin
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
              {bills.length === 0 ? (
                <div className="empty-state">Belum ada pengingat tagihan.</div>
              ) : (
                bills.map(b => {
                  const isOverdue = new Date(b.due_date) < new Date() && !b.is_paid;
                  const currentWId = selectedBillWallet[b.id] || (wallets[0]?.id || 'wallet_cash');
                  return (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: b.is_paid ? 'rgba(16, 185, 129, 0.03)' : isOverdue ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: `1px solid ${b.is_paid ? 'var(--income-color)' : isOverdue ? 'var(--expense-color)' : 'var(--border-color)'}` }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 600, textDecoration: b.is_paid ? 'line-through' : 'none', color: b.is_paid ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{b.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--expense-color)' : 'var(--text-secondary)' }}>
                          Tempo: {b.due_date} {isOverdue && '(Terlewat)'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatIDR(b.amount)}</span>
                        {!b.is_paid ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                              value={currentWId}
                              onChange={(e) => setSelectedBillWallet(prev => ({ ...prev, [b.id]: e.target.value }))}
                              className="currency-select"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              {wallets.map(w => (
                                <option key={w.id} value={w.id}>
                                  {w.name} ({formatIDR(w.balance)})
                                </option>
                              ))}
                            </select>
                            <button onClick={() => handlePayBill(b)} className="btn-toggle active income" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} /> Bayar
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--income-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={14} /> Lunas
                          </span>
                        )}
                        <button onClick={() => handleDeleteBill(b.id)} className="btn-delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Integrated Active Installments List */}
          {activeInstallments.length > 0 && (
            <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--expense-color)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CreditCard size={14} /> Tagihan Cicilan Bulanan Berjalan
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {activeInstallments.map(inst => {
                  const remaining = inst.totalAmount - inst.paidAmount;
                  const currentInstWId = selectedInstWallet[inst.id] || (wallets[0]?.id || 'wallet_cash');
                  return (
                    <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.02)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 600 }}>{inst.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Tagihan Bulan Ini: <strong>{formatIDR(inst.monthlyPayment)}</strong> (Sisa Total: {formatIDR(remaining)})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={currentInstWId}
                          onChange={(e) => setSelectedInstWallet(prev => ({ ...prev, [inst.id]: e.target.value }))}
                          className="currency-select"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatIDR(w.balance)})
                            </option>
                          ))}
                        </select>
                        <button 
                          onClick={() => handlePayInstallmentFromReminder(inst)}
                          className="btn-submit" 
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto', background: 'var(--expense-color)' }}
                        >
                          Bayar Cicilan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
