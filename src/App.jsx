import React, { useState, useEffect, useMemo } from 'react';
import { 
  PiggyBank, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2, 
  Wallet, 
  RefreshCw, 
  LogOut, 
  LayoutDashboard, 
  History, 
  CreditCard,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { supabase } from './supabaseClient';
import TransactionForm from './components/TransactionForm';
import DashboardCharts from './components/DashboardCharts';
import InstallmentTracker from './components/InstallmentTracker';
import BudgetAndSavings from './components/BudgetAndSavings';
import Reminders from './components/Reminders';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import ExportData from './components/ExportData';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState({ goalName: '', goalAmount: 0, currentSaved: 0 });
  const [installments, setInstallments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'savings', 'installments', 'reminders', 'analytics'
  const [rates, setRates] = useState({ USD: 0.000062, EUR: 0.000057, SGD: 0.000083 });
  const [currency, setCurrency] = useState('IDR');

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/IDR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error('Error fetching currency rates:', err));
  }, []);

  // Monitor Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when session is active
  useEffect(() => {
    if (!session) return;
    fetchUserData();
  }, [session]);

  const fetchUserData = async () => {
    setLoading(true);
    const userId = session.user.id;

    try {
      // 1. Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (txErr) throw txErr;
      setTransactions(txData || []);

      // 2. Fetch savings
      const { data: svData, error: svErr } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (svErr) throw svErr;
      if (svData) {
        setSavings({
          goalName: svData.goal_name,
          goalAmount: parseFloat(svData.goal_amount),
          currentSaved: parseFloat(svData.current_saved)
        });
      } else {
        setSavings({ goalName: '', goalAmount: 0, currentSaved: 0 });
      }

      // 3. Fetch installments
      const { data: instData, error: instErr } = await supabase
        .from('installments')
        .select('*');
      if (instErr) throw instErr;
      setInstallments((instData || []).map(inst => ({
        id: inst.id,
        name: inst.name,
        totalAmount: parseFloat(inst.total_amount),
        paidAmount: parseFloat(inst.paid_amount),
        monthlyPayment: parseFloat(inst.monthly_payment)
      })));

    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculations (Memoized for efficiency)
  const totalIncome = useMemo(() => transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const totalExpense = useMemo(() => transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const totalDeposits = useMemo(() => transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const totalWithdrawals = useMemo(() => transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  // Cash Calculations
  const cashIncome = useMemo(() => transactions
    .filter(t => t.type === 'income' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashExpense = useMemo(() => transactions
    .filter(t => t.type === 'expense' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashDeposits = useMemo(() => transactions
    .filter(t => t.type === 'deposit' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashWithdrawals = useMemo(() => transactions
    .filter(t => t.type === 'withdraw' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashTransferIn = useMemo(() => transactions
    .filter(t => t.type === 'transfer' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashTransferOut = useMemo(() => transactions
    .filter(t => t.type === 'transfer' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashBalance = useMemo(() => cashIncome - cashExpense - cashDeposits + cashWithdrawals + cashTransferIn - cashTransferOut,
    [cashIncome, cashExpense, cashDeposits, cashWithdrawals, cashTransferIn, cashTransferOut]);

  // Cashless Calculations
  const cashlessIncome = useMemo(() => transactions
    .filter(t => t.type === 'income' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessExpense = useMemo(() => transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessDeposits = useMemo(() => transactions
    .filter(t => t.type === 'deposit' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessWithdrawals = useMemo(() => transactions
    .filter(t => t.type === 'withdraw' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessTransferIn = useMemo(() => transactions
    .filter(t => t.type === 'transfer' && (t.payment_method || 'cash') === 'cash')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessTransferOut = useMemo(() => transactions
    .filter(t => t.type === 'transfer' && t.payment_method === 'cashless')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const cashlessBalance = useMemo(() => cashlessIncome - cashlessExpense - cashlessDeposits + cashlessWithdrawals + cashlessTransferIn - cashlessTransferOut,
    [cashlessIncome, cashlessExpense, cashlessDeposits, cashlessWithdrawals, cashlessTransferIn, cashlessTransferOut]);

  // Total Balance
  const balance = useMemo(() => cashBalance + cashlessBalance, [cashBalance, cashlessBalance]);

  const currentSaved = useMemo(() => totalDeposits - totalWithdrawals, 
    [totalDeposits, totalWithdrawals]);

  // Sync savings currentSaved dynamically in DB if mismatched
  useEffect(() => {
    if (!session || loading) return;
    if (savings.goalAmount > 0 && savings.currentSaved !== currentSaved) {
      updateSavingsInDB({ ...savings, currentSaved });
    }
  }, [currentSaved, session]);

  const updateSavingsInDB = async (updated) => {
    const userId = session.user.id;
    try {
      const { error } = await supabase
        .from('savings')
        .upsert({
          user_id: userId,
          goal_name: updated.goalName,
          goal_amount: updated.goalAmount,
          current_saved: updated.currentSaved
        });
      if (error) throw error;
      setSavings(updated);
    } catch (err) {
      alert('Gagal memperbarui tabungan: ' + err.message);
    }
  };

  const handleAddTransaction = async (newTx) => {
    const userId = session.user.id;
    try {
      const { error } = await supabase
          .from('transactions')
          .insert({
            id: newTx.id,
            user_id: userId,
            type: newTx.type,
            title: newTx.title,
            amount: newTx.amount,
            category: newTx.category,
            date: newTx.date,
            payment_method: newTx.payment_method || 'cash'
          });
      if (error) throw error;
      setTransactions(prev => [newTx, ...prev]);
    } catch (err) {
      alert('Gagal menyimpan transaksi: ' + err.message);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Gagal menghapus transaksi: ' + err.message);
    }
  };

  const handleUpdateSavings = async (updatedSavings, transactionAmount, type) => {
    if (transactionAmount && type) {
      const newTx = {
        id: Date.now().toString(),
        type,
        title: type === 'deposit' ? `Setoran: ${updatedSavings.goalName}` : `Penarikan: ${updatedSavings.goalName}`,
        amount: transactionAmount,
        category: 'Tabungan',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cashless'
      };
      await handleAddTransaction(newTx);
    } else {
      await updateSavingsInDB(updatedSavings);
    }
  };

  const handleAddInstallment = async (newInst) => {
    const userId = session.user.id;
    try {
      const { error } = await supabase
        .from('installments')
        .insert({
          id: newInst.id,
          user_id: userId,
          name: newInst.name,
          total_amount: newInst.totalAmount,
          paid_amount: newInst.paidAmount,
          monthly_payment: newInst.monthlyPayment
        });
      if (error) throw error;
      setInstallments(prev => [...prev, newInst]);
    } catch (err) {
      alert('Gagal menambahkan cicilan: ' + err.message);
    }
  };

  const handleDeleteInstallment = async (id) => {
    try {
      const { error } = await supabase
        .from('installments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setInstallments(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert('Gagal menghapus cicilan: ' + err.message);
    }
  };

  const handlePayInstallment = async (id, amount) => {
    const targetInst = installments.find(i => i.id === id);
    const updatedPaid = targetInst.paidAmount + amount;

    try {
      // 1. Update installment paid amount in Supabase
      const { error: instErr } = await supabase
        .from('installments')
        .update({ paid_amount: updatedPaid })
        .eq('id', id);
      if (instErr) throw instErr;

      // 2. Add expense transaction in Supabase
      const newTx = {
        id: Date.now().toString(),
        type: 'expense',
        title: `Bayar Cicilan: ${targetInst.name}`,
        amount: amount,
        category: 'Cicilan',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cashless'
      };
      await handleAddTransaction(newTx);

      // 3. Update local state
      setInstallments(prev => prev.map(inst => {
        if (inst.id === id) {
          return { ...inst, paidAmount: updatedPaid };
        }
        return inst;
      }));
    } catch (err) {
      alert('Gagal membayar cicilan: ' + err.message);
    }
  };

  const resetData = async () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data di cloud?')) {
      try {
        const userId = session.user.id;
        await supabase.from('transactions').delete().eq('user_id', userId);
        await supabase.from('savings').delete().eq('user_id', userId);
        await supabase.from('installments').delete().eq('user_id', userId);
        setTransactions([]);
        setSavings({ goalName: '', goalAmount: 0, currentSaved: 0 });
        setInstallments([]);
      } catch (err) {
        alert('Gagal me-reset data: ' + err.message);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const formatIDR = (num) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    } else {
      const converted = (num || 0) * (rates[currency] || 1);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(converted);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filter === 'income') return t.type === 'income';
      if (filter === 'expense') return t.type === 'expense';
      if (filter === 'saving') return t.type === 'deposit' || t.type === 'withdraw';
      return true;
    });
  }, [transactions, filter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="empty-state">Memuat data...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-wrapper">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>Money <span>Management</span></h1>
        </div>

        <nav className="sidebar-menu">
          <button 
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <History size={18} />
            <span>Transaksi</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'savings' ? 'active' : ''}`}
            onClick={() => setActiveTab('savings')}
          >
            <PiggyBank size={18} />
            <span>Anggaran & Tabungan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'reminders' ? 'active' : ''}`}
            onClick={() => setActiveTab('reminders')}
          >
            <Calendar size={18} />
            <span>Tagihan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'installments' ? 'active' : ''}`}
            onClick={() => setActiveTab('installments')}
          >
            <CreditCard size={18} />
            <span>Cicilan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            <span>Analisis & Ekspor</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} className="hide-on-mobile">Valuta:</span>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)} 
              className="currency-select"
            >
              <option value="IDR">IDR (Rp)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="SGD">SGD ($)</option>
            </select>
          </div>
          <button 
            onClick={resetData}
            className="sidebar-item"
            style={{ color: 'var(--expense-color)' }}
          >
            <RefreshCw size={18} />
            <span>Reset Data</span>
          </button>
          <button 
            onClick={handleLogout}
            className="sidebar-item"
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div>
             {/* Summary Cards */}
            <div className="dashboard-summary">
              <div className="card summary-card">
                <span className="summary-label">
                  <Wallet size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--accent-color)' }} />
                  Total Saldo
                </span>
                <span className="summary-value">{formatIDR(balance)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <Wallet size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: '#f59e0b' }} />
                  Saldo Cash
                </span>
                <span className="summary-value" style={{ color: '#f59e0b' }}>{formatIDR(cashBalance)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <CreditCard size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: '#10b981' }} />
                  Saldo Cashless
                </span>
                <span className="summary-value" style={{ color: '#10b981' }}>{formatIDR(cashlessBalance)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <ArrowUpCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--income-color)' }} />
                  Total Pemasukan
                </span>
                <span className="summary-value income">{formatIDR(totalIncome)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <ArrowDownCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--expense-color)' }} />
                  Total Pengeluaran
                </span>
                <span className="summary-value expense">{formatIDR(totalExpense)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <PiggyBank size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--saving-color)' }} />
                  Tabungan
                </span>
                <span className="summary-value saving">{formatIDR(currentSaved)}</span>
              </div>
            </div>

            <DashboardCharts transactions={transactions} />
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
            <TransactionForm onAddTransaction={handleAddTransaction} />
            
            <div className="card">
              <div className="list-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Riwayat Keuangan</h2>
                <div className="filter-tabs">
                  <button className={`btn-filter ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Semua</button>
                  <button className={`btn-filter ${filter === 'income' ? 'active' : ''}`} onClick={() => setFilter('income')}>Masuk</button>
                  <button className={`btn-filter ${filter === 'expense' ? 'active' : ''}`} onClick={() => setFilter('expense')}>Keluar</button>
                  <button className={`btn-filter ${filter === 'saving' ? 'active' : ''}`} onClick={() => setFilter('saving')}>Tabungan</button>
                </div>
              </div>

              <div className="list-items">
                {filteredTransactions.length === 0 ? (
                  <div className="empty-state">Belum ada catatan keuangan.</div>
                ) : (
                  filteredTransactions.map(tx => (
                    <div key={tx.id} className="list-item">
                      <div className="item-info">
                        <span className="item-title">{tx.title}</span>
                        <span className="item-meta">
                          {tx.category} • {tx.payment_method === 'cashless' ? (tx.type === 'transfer' ? 'Cashless → Cash' : 'Cashless') : (tx.type === 'transfer' ? 'Cash → Cashless' : 'Cash')} • {tx.date}
                        </span>
                      </div>
                      <div className="item-amount-action">
                        <span className={`item-amount ${
                          tx.type === 'income' ? 'income' : 
                          tx.type === 'expense' ? 'expense' : 
                          tx.type === 'deposit' ? 'expense' : 
                          tx.type === 'transfer' ? 'saving' : 'income'
                        }`}>
                          {tx.type === 'income' || tx.type === 'withdraw' ? '+' : tx.type === 'transfer' ? '⇄' : '-'} {formatIDR(tx.amount)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="btn-delete"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Savings & Budgets */}
        {activeTab === 'savings' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <BudgetAndSavings 
              transactions={transactions} 
              formatIDR={formatIDR} 
            />
          </div>
        )}

        {/* Tab 4: Installments */}
        {activeTab === 'installments' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <InstallmentTracker 
              installments={installments}
              onAddInstallment={handleAddInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              onPayInstallment={handlePayInstallment}
              balance={balance}
            />
          </div>
        )}

        {/* Tab 5: Tagihan & Otomatisasi */}
        {activeTab === 'reminders' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Reminders 
              onAddTransaction={handleAddTransaction} 
              formatIDR={formatIDR} 
            />
          </div>
        )}

        {/* Tab 6: Analisis & Ekspor */}
        {activeTab === 'analytics' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <AdvancedAnalytics 
              transactions={transactions} 
              balance={balance} 
              formatIDR={formatIDR} 
            />
            <ExportData 
              transactions={transactions} 
              balance={balance} 
              cashBalance={cashBalance} 
              cashlessBalance={cashlessBalance} 
              formatIDR={formatIDR} 
            />
          </div>
        )}
      </main>
    </div>
  );
}
