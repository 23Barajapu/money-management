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
  FileText,
  Printer
} from 'lucide-react';
import { supabase } from './supabaseClient';
import TransactionForm from './components/TransactionForm';
import SavingsTracker from './components/SavingsTracker';
import DashboardCharts from './components/DashboardCharts';
import InstallmentTracker from './components/InstallmentTracker';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [savings, setSavings] = useState({ goalName: '', goalAmount: 0, currentSaved: 0 });
  const [installments, setInstallments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'savings', 'installments', 'reports'
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

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

  // Filtered transactions for the selected month/year in reports tab
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date);
      return (tDate.getMonth() + 1) === Number(reportMonth) && tDate.getFullYear() === Number(reportYear);
    });
  }, [transactions, reportMonth, reportYear]);

  const monthlySummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let savingsDeposit = 0;
    let savingsWithdraw = 0;
    const categoryTotals = {};

    monthlyTransactions.forEach(t => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expense += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      } else if (t.type === 'deposit') {
        savingsDeposit += t.amount;
      } else if (t.type === 'withdraw') {
        savingsWithdraw += t.amount;
      }
    });

    return {
      income,
      expense,
      savingsChange: savingsDeposit - savingsWithdraw,
      balance: income - expense - (savingsDeposit - savingsWithdraw),
      categoryTotals
    };
  }, [monthlyTransactions]);

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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
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
            <span>Tabungan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'installments' ? 'active' : ''}`}
            onClick={() => setActiveTab('installments')}
          >
            <CreditCard size={18} />
            <span>Cicilan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText size={18} />
            <span>Laporan</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={resetData}
            className="sidebar-item"
            style={{ color: 'var(--expense-color)', marginBottom: '0.5rem' }}
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

        {/* Tab 3: Savings */}
        {activeTab === 'savings' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SavingsTracker 
              savings={savings} 
              onUpdateSavings={handleUpdateSavings} 
              balance={balance} 
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

        {/* Tab 5: Reports */}
        {activeTab === 'reports' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="form-group" style={{ marginBottom: 0, minWidth: '140px' }}>
                  <label>Bulan</label>
                  <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                    <option value="1">Januari</option>
                    <option value="2">Februari</option>
                    <option value="3">Maret</option>
                    <option value="4">April</option>
                    <option value="5">Mei</option>
                    <option value="6">Juni</option>
                    <option value="7">Juli</option>
                    <option value="8">Agustus</option>
                    <option value="9">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0, minWidth: '100px' }}>
                  <label>Tahun</label>
                  <select value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={() => window.print()} 
                className="btn-submit" 
                style={{ width: 'auto', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
              >
                <Printer size={18} />
                Cetak Laporan
              </button>
            </div>

            {/* Printed Report Area */}
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Laporan Keuangan Bulanan</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                  Periode: {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][Number(reportMonth) - 1]} {reportYear}
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="dashboard-summary" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2rem' }}>
                <div className="card summary-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <span className="summary-label">Total Pemasukan</span>
                  <span className="summary-value income" style={{ fontSize: '1.25rem' }}>{formatIDR(monthlySummary.income)}</span>
                </div>
                <div className="card summary-card" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="summary-label">Total Pengeluaran</span>
                  <span className="summary-value expense" style={{ fontSize: '1.25rem' }}>{formatIDR(monthlySummary.expense)}</span>
                </div>
                <div className="card summary-card" style={{ background: 'rgba(6, 182, 212, 0.05)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                  <span className="summary-label">Mutasi Tabungan</span>
                  <span className="summary-value saving" style={{ fontSize: '1.25rem', color: 'var(--saving-color)' }}>{formatIDR(monthlySummary.savingsChange)}</span>
                </div>
                <div className="card summary-card" style={{ background: monthlySummary.balance >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderColor: monthlySummary.balance >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                  <span className="summary-label">Alur Kas Bersih</span>
                  <span className={`summary-value ${monthlySummary.balance >= 0 ? 'income' : 'expense'}`} style={{ fontSize: '1.25rem' }}>
                    {formatIDR(monthlySummary.balance)}
                  </span>
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Rincian Pengeluaran per Kategori
                </h3>
                {Object.keys(monthlySummary.categoryTotals).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tidak ada pengeluaran di bulan ini.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Object.entries(monthlySummary.categoryTotals).map(([cat, total]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.25rem', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 600 }}>{formatIDR(total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions List */}
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Daftar Transaksi Bulanan
                </h3>
                {monthlyTransactions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Belum ada catatan keuangan di bulan ini.</p>
                ) : (
                  <div className="list-items" style={{ background: 'transparent' }}>
                    {monthlyTransactions.map(tx => (
                      <div key={tx.id} className="list-item" style={{ borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', borderRadius: 0 }}>
                        <div className="item-info">
                          <span className="item-title" style={{ fontSize: '0.9rem' }}>{tx.title}</span>
                          <span className="item-meta" style={{ fontSize: '0.75rem' }}>
                            {tx.category} • {tx.payment_method === 'cashless' ? (tx.type === 'transfer' ? 'Cashless → Cash' : 'Cashless') : (tx.type === 'transfer' ? 'Cash → Cashless' : 'Cash')} • {tx.date}
                          </span>
                        </div>
                        <div className="item-amount-action">
                          <span className={`item-amount ${
                            tx.type === 'income' ? 'income' : 
                            tx.type === 'expense' ? 'expense' : 
                            tx.type === 'deposit' ? 'expense' : 
                            tx.type === 'transfer' ? 'saving' : 'income'
                          }`} style={{ fontSize: '0.9rem' }}>
                            {tx.type === 'income' || tx.type === 'withdraw' ? '+' : tx.type === 'transfer' ? '⇄' : '-'} {formatIDR(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
