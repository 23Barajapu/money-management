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
  TrendingUp,
  User
} from 'lucide-react';
import { supabase } from './supabaseClient';
import TransactionForm from './components/TransactionForm';
import DashboardCharts from './components/DashboardCharts';
import InstallmentTracker from './components/InstallmentTracker';
import BudgetAndSavings from './components/BudgetAndSavings';
import Reminders from './components/Reminders';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import ExportData from './components/ExportData';
import WalletManager from './components/WalletManager';
import ProfileModal from './components/ProfileModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [wallets, setWallets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'savings', 'installments', 'reminders', 'analytics'
  const [rates, setRates] = useState({ USD: 0.000062, EUR: 0.000057, SGD: 0.000083 });
  const [currency, setCurrency] = useState('IDR');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState({ payday_date: 1, email_notif: true, push_notif: true });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev.message === message ? { message: '', type: 'info' } : prev));
    }, 4000);
  };

  const showConfirm = (title, message, onConfirm, isDanger = false) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) await onConfirm();
      },
      isDanger
    });
  };

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
      if (session) {
        setLogoutMessage('');
      }
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

      // 4. Fetch wallets
      const { data: wlData, error: wlErr } = await supabase
        .from('wallets')
        .select('*');
      if (!wlErr && wlData && wlData.length > 0) {
        setWallets(wlData);
      } else {
        const defaultWallets = [
          { id: 'wallet_cash', user_id: userId, name: 'Dompet Cash', balance: 0, type: 'cash' },
          { id: 'wallet_cashless', user_id: userId, name: 'Rekening Bank', balance: 0, type: 'cashless' }
        ];
        await supabase.from('wallets').upsert(defaultWallets);
        setWallets(defaultWallets);
      }

      // 5. Fetch profile
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!profErr && profData) {
        setProfile(profData);
      } else {
        const defaultProfile = { user_id: userId, payday_date: 1, email_notif: true, push_notif: true };
        await supabase.from('profiles').upsert(defaultProfile);
        setProfile(defaultProfile);
      }

    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a date is within current payday cycle
  const isDateInCurrentPaydayCycle = (dateStr, pDate = 1) => {
    const txDate = new Date(dateStr);
    const now = new Date();
    
    let cycleStart, cycleEnd;
    const pd = parseInt(pDate);
    
    if (now.getDate() >= pd) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), pd);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, pd - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, pd);
      cycleEnd = new Date(now.getFullYear(), now.getMonth(), pd - 1, 23, 59, 59);
    }
    
    return txDate >= cycleStart && txDate <= cycleEnd;
  };

  // Calculations (Adjusted to Payday Cycle for Dashboard)
  const paydayIncome = useMemo(() => {
    const pDate = profile?.payday_date || 1;
    return transactions
      .filter(t => t.type === 'income' && isDateInCurrentPaydayCycle(t.date, pDate))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, profile]);

  const paydayExpense = useMemo(() => {
    const pDate = profile?.payday_date || 1;
    return transactions
      .filter(t => t.type === 'expense' && isDateInCurrentPaydayCycle(t.date, pDate))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, profile]);

  const totalDeposits = useMemo(() => transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  const totalWithdrawals = useMemo(() => transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);

  // Dynamic Wallet Calculations
  const walletsWithUpdatedBalances = useMemo(() => {
    return wallets.map(wallet => {
      const walletTx = transactions.filter(t => t.payment_method === wallet.id || t.payment_method === wallet.name);
      
      const income = walletTx
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = walletTx
        .filter(t => t.type === 'expense' || t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

      const withdrawals = walletTx
        .filter(t => t.type === 'withdraw')
        .reduce((sum, t) => sum + t.amount, 0);

      const transferIn = transactions
        .filter(t => t.type === 'transfer' && t.category === wallet.id)
        .reduce((sum, t) => sum + t.amount, 0);

      const transferOut = transactions
        .filter(t => t.type === 'transfer' && t.payment_method === wallet.id)
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...wallet,
        balance: parseFloat(wallet.balance || 0) + income - expense + withdrawals + transferIn - transferOut
      };
    });
  }, [wallets, transactions]);

  const cashBalance = useMemo(() => {
    return walletsWithUpdatedBalances
      .filter(w => w.type === 'cash')
      .reduce((sum, w) => sum + w.balance, 0);
  }, [walletsWithUpdatedBalances]);

  const cashlessBalance = useMemo(() => {
    return walletsWithUpdatedBalances
      .filter(w => w.type === 'cashless')
      .reduce((sum, w) => sum + w.balance, 0);
  }, [walletsWithUpdatedBalances]);

  // Total Balance
  const balance = useMemo(() => cashBalance + cashlessBalance, [cashBalance, cashlessBalance]);

  const currentSaved = useMemo(() => totalDeposits - totalWithdrawals, 
    [totalDeposits, totalWithdrawals]);

  // Sync savings currentSaved dynamically in DB if mismatched

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
      showToast('Transaksi berhasil dicatat!', 'success');
    } catch (err) {
      showToast('Gagal menyimpan transaksi: ' + err.message, 'error');
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
      showToast('Transaksi berhasil dihapus', 'info');
    } catch (err) {
      showToast('Gagal menghapus transaksi: ' + err.message, 'error');
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
      showToast('Cicilan berhasil ditambahkan!', 'success');
    } catch (err) {
      showToast('Gagal menambahkan cicilan: ' + err.message, 'error');
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
      showToast('Cicilan berhasil dihapus', 'info');
    } catch (err) {
      showToast('Gagal menghapus cicilan: ' + err.message, 'error');
    }
  };

  const handlePayInstallment = async (id, amount, paymentMethod = 'wallet_cash') => {
    const targetInst = installments.find(i => i.id === id);
    if (!targetInst) return;
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
        payment_method: paymentMethod || 'wallet_cash'
      };
      await handleAddTransaction(newTx);

      // 3. Update local state
      setInstallments(prev => prev.map(inst => {
        if (inst.id === id) {
          return { ...inst, paidAmount: updatedPaid };
        }
        return inst;
      }));
      showToast(`Pembayaran cicilan ${targetInst.name} berhasil!`, 'success');
    } catch (err) {
      showToast('Gagal membayar cicilan: ' + err.message, 'error');
    }
  };

  const resetData = async () => {
    showConfirm(
      'Reset Data Cloud',
      'Apakah Anda yakin ingin menghapus semua data transaksi, tabungan, dan cicilan di cloud?',
      async () => {
        try {
          const userId = session.user.id;
          await supabase.from('transactions').delete().eq('user_id', userId);
          await supabase.from('savings_goals').delete().eq('user_id', userId);
          await supabase.from('installments').delete().eq('user_id', userId);
          setTransactions([]);
          setInstallments([]);
          showToast('Seluruh data berhasil di-reset!', 'info');
        } catch (err) {
          showToast('Gagal me-reset data: ' + err.message, 'error');
        }
      },
      true
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Inactivity Auto-Logout (1 Minute)
  useEffect(() => {
    if (!session) return;

    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setLogoutMessage('Sesi Anda telah berakhir karena tidak ada aktivitas selama 1 menit.');
        handleLogout();
      }, 60000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session]);

  const formatIDR = (num) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
    } else {
      const converted = (num || 0) * (rates[currency] || 1);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(converted);
    }
  };

  const getWalletName = (id) => {
    const w = wallets.find(x => x.id === id);
    return w ? w.name : id;
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
    return <Auth initialMessage={logoutMessage} />;
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
            <span>Tagihan & Cicilan</span>
          </button>

          <button 
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            <span>Analisis & Ekspor</span>
          </button>
        </nav>

        <div className="sidebar-footer" style={{ position: 'relative' }}>
          <button 
            className={`sidebar-item ${showProfileMenu ? 'active' : ''}`}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              background: 'var(--accent-color)', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '0.75rem',
              flexShrink: 0
            }}>
              {session?.user?.email ? session.user.email[0].toUpperCase() : 'U'}
            </div>
            <span className="hide-on-mobile" style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {session?.user?.email || 'Akun Saya'}
            </span>
          </button>

          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Akun Anda</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session?.user?.email}
                </span>
              </div>
              <div className="profile-divider"></div>
              
              <div style={{ padding: '0.25rem 0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Valuta Utama</span>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)} 
                  className="currency-select"
                  style={{ width: '100%' }}
                >
                  <option value="IDR">IDR (Rp)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SGD">SGD ($)</option>
                </select>
              </div>

              <div className="profile-divider"></div>

              <button 
                onClick={() => { setShowProfileMenu(false); setIsProfileOpen(true); }} 
                className="profile-action-btn"
                style={{ color: 'var(--accent-color)' }}
              >
                <User size={14} />
                <span>Pengaturan Profil</span>
              </button>

              <div className="profile-divider"></div>

              <button 
                onClick={() => { setShowProfileMenu(false); resetData(); }} 
                className="profile-action-btn reset"
              >
                <RefreshCw size={14} />
                <span>Reset Data</span>
              </button>

              <button 
                onClick={() => { setShowProfileMenu(false); handleLogout(); }} 
                className="profile-action-btn logout"
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            </div>
          )}
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
                  Masuk (Siklus Tgl {profile?.payday_date || 1})
                </span>
                <span className="summary-value income">{formatIDR(paydayIncome)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <ArrowDownCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--expense-color)' }} />
                  Keluar (Siklus Tgl {profile?.payday_date || 1})
                </span>
                <span className="summary-value expense">{formatIDR(paydayExpense)}</span>
              </div>
              <div className="card summary-card">
                <span className="summary-label">
                  <PiggyBank size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--saving-color)' }} />
                  Tabungan
                </span>
                <span className="summary-value saving">{formatIDR(currentSaved)}</span>
              </div>
            </div>

            <DashboardCharts transactions={transactions} paydayDate={profile?.payday_date || 1} />
            <div style={{ marginTop: '1.5rem' }}>
              <WalletManager 
                wallets={walletsWithUpdatedBalances} 
                fetchUserData={fetchUserData} 
                formatIDR={formatIDR} 
                showToast={showToast}
                showConfirm={showConfirm}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
            <TransactionForm onAddTransaction={handleAddTransaction} wallets={walletsWithUpdatedBalances} />
            
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
                          {tx.type === 'transfer' ? (
                            `Transfer: ${getWalletName(tx.payment_method)} → ${getWalletName(tx.category)}`
                          ) : (
                            `${tx.category} • ${getWalletName(tx.payment_method)}`
                          )} • {tx.date}
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
              paydayDate={profile?.payday_date || 1}
              showToast={showToast}
              showConfirm={showConfirm}
            />
          </div>
        )}

        {/* Tab 4: Tagihan & Cicilan */}
        {activeTab === 'reminders' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Reminders 
              onAddTransaction={handleAddTransaction} 
              formatIDR={formatIDR} 
              wallets={walletsWithUpdatedBalances}
              installments={installments}
              onPayInstallment={handlePayInstallment}
              showToast={showToast}
              showConfirm={showConfirm}
            />
            <InstallmentTracker 
              installments={installments}
              onAddInstallment={handleAddInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              onPayInstallment={handlePayInstallment}
              balance={balance}
              wallets={walletsWithUpdatedBalances}
              showToast={showToast}
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

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={profile} 
        setProfile={setProfile} 
        currency={currency} 
        setCurrency={setCurrency} 
        showToast={showToast}
        showConfirm={showConfirm}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        isDanger={confirmState.isDanger}
      />
    </div>
  );
}
