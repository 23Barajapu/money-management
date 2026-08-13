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
  User,
  UserX,
  Search,
  Bell,
  ChevronRight,
  ArrowUpRight,
  Send,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { supabase } from './supabaseClient';
import TransactionForm from './components/TransactionForm';
import DashboardCharts from './components/DashboardCharts';
import BudgetOverview from './components/BudgetOverview';
import InstallmentTracker from './components/InstallmentTracker';
import BudgetAndSavings from './components/BudgetAndSavings';
import Reminders from './components/Reminders';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import ExportData from './components/ExportData';
import WalletManager from './components/WalletManager';
import TransactionList from './components/TransactionList';
import ProfileModal from './components/ProfileModal';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Auth from './components/Auth';
import { getTranslation, getDeviceLanguage } from './utils/i18n';
import SeaBankInterestCalculator from './components/SeaBankInterestCalculator';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'transactions', 'savings', 'installments', 'reminders', 'analytics'
  const [rates, setRates] = useState({ USD: 0.000062, EUR: 0.000057, SGD: 0.000083 });
  const [currency, setCurrency] = useState('IDR');
  const [langOption, setLangOption] = useState('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [bills, setBills] = useState([]);
  const [selectedFormType, setSelectedFormType] = useState('income');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState({ payday_date: 1, email_notif: true, push_notif: true });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });

  const t = (key) => getTranslation(langOption, key);

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
    fetchUserData(true);
  }, [session]);

  const fetchUserData = async (showLoadingScreen = false) => {
    if (showLoadingScreen) setLoading(true);
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

      // 4. Fetch bills for notifications (H-5)
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      setBills(billsData || []);

      // 5. Fetch wallets
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

      // 6. Fetch profile & user_metadata for cross-device cloud sync
      const authUser = (await supabase.auth.getUser()).data.user;
      const metaIncome = authUser?.user_metadata?.monthly_income;
      const metaPayday = authUser?.user_metadata?.payday_date;
      const savedIncome = localStorage.getItem(`user_monthly_income_${userId}`);
      const localIncome = savedIncome !== null ? parseFloat(savedIncome) : 0;

      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const dbIncome = profData?.monthly_income;
      const effectiveIncome = (dbIncome !== undefined && dbIncome !== null && Number(dbIncome) > 0)
        ? Number(dbIncome)
        : (metaIncome !== undefined && metaIncome !== null ? Number(metaIncome) : localIncome);

      const effectivePayday = profData?.payday_date || metaPayday || 1;

      if (effectiveIncome > 0) {
        localStorage.setItem(`user_monthly_income_${userId}`, effectiveIncome.toString());
      }

      if (!profErr && profData) {
        setProfile({ 
          ...profData, 
          payday_date: effectivePayday,
          monthly_income: effectiveIncome 
        });
      } else {
        const defaultProfile = { 
          user_id: userId, 
          payday_date: effectivePayday, 
          email_notif: true, 
          push_notif: true, 
          monthly_income: effectiveIncome 
        };
        await supabase.from('profiles').upsert(defaultProfile);
        setProfile(defaultProfile);
      }

    } catch (err) {
      console.error('Error fetching data:', err.message);
    } finally {
      if (showLoadingScreen) setLoading(false);
    }
  };

  // Auto-credit daily SeaBank interest on new day login
  useEffect(() => {
    if (!session || wallets.length === 0) return;

    const checkSeaBankAutoInterest = async () => {
      const seaBankW = wallets.find(w => w.name.toLowerCase().includes('seabank'));
      if (!seaBankW || seaBankW.balance <= 0) return;

      const todayStr = new Date().toISOString().split('T')[0];
      const lastInterestKey = `seabank_last_interest_${session.user.id}_${seaBankW.id}`;
      const lastLoggedDate = localStorage.getItem(lastInterestKey);

      if (lastLoggedDate !== todayStr) {
        const bal = parseFloat(seaBankW.balance);
        const gross = bal <= 150000000 
          ? (bal * 0.025) / 365 
          : ((150000000 * 0.025) + (bal - 150000000) * 0.035) / 365;
        const netDaily = Math.round(gross * (bal > 7500000 ? 0.8 : 1));

        let daysDiff = 1;
        if (lastLoggedDate) {
          const lastD = new Date(lastLoggedDate);
          const todayD = new Date(todayStr);
          const diffMs = todayD - lastD;
          daysDiff = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }

        const totalNet = netDaily * daysDiff;

        if (totalNet > 0) {
          try {
            const txsToInsert = [];
            for (let i = 0; i < daysDiff; i++) {
              const txDate = new Date(todayStr);
              txDate.setDate(txDate.getDate() - (daysDiff - 1 - i));
              const dateStr = txDate.toISOString().split('T')[0];

              txsToInsert.push({
                id: (Date.now() + i).toString(),
                user_id: session.user.id,
                type: 'income',
                title: 'Bunga Harian SeaBank (Otomatis)',
                amount: netDaily,
                category: 'Lainnya',
                date: dateStr,
                payment_method: seaBankW.id
              });
            }

            await supabase.from('transactions').insert(txsToInsert);
            localStorage.setItem(lastInterestKey, todayStr);
            showToast(`Bunga SeaBank ${daysDiff > 1 ? `(${daysDiff} hari x ${formatIDR(netDaily)})` : formatIDR(netDaily)} otomatis cair ke saldo!`, 'success');
            fetchUserData();
          } catch (e) {
            console.error('Error auto adding SeaBank interest:', e);
          }
        }
      }
    };

    checkSeaBankAutoInterest();
  }, [session, wallets]);

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

  // Calculate bills due within 5 days (H-5)
  const dueSoonBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return bills.filter(b => {
      if (b.is_paid) return false;
      if (!b.due_date) return false;
      const dueDate = new Date(b.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 5;
    });
  }, [bills]);

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
    const total = Number(newInst.totalAmount) || 0;
    const paid = Number(newInst.paidAmount) || 0;
    const monthly = Number(newInst.monthlyPayment) || 0;

    const sanitizedInst = {
      ...newInst,
      totalAmount: total,
      paidAmount: paid,
      monthlyPayment: monthly
    };

    try {
      const { error } = await supabase
        .from('installments')
        .insert({
          id: sanitizedInst.id,
          user_id: userId,
          name: sanitizedInst.name,
          total_amount: total,
          paid_amount: paid,
          monthly_payment: monthly
        });
      if (error) throw error;
      setInstallments(prev => [...prev, sanitizedInst]);
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

  const deleteAccount = async () => {
    showConfirm(
      'Hapus Akun Permanen',
      'Apakah Anda yakin ingin menghapus akun dan SELURUH data Anda secara permanen? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        try {
          const userId = session?.user?.id;
          if (userId) {
            // Delete user data from public tables first
            await supabase.from('transactions').delete().eq('user_id', userId);
            await supabase.from('savings_goals').delete().eq('user_id', userId);
            await supabase.from('installments').delete().eq('user_id', userId);
            await supabase.from('wallets').delete().eq('user_id', userId);
            await supabase.from('budgets').delete().eq('user_id', userId);
            await supabase.from('bills').delete().eq('user_id', userId);
            await supabase.from('recurring_transactions').delete().eq('user_id', userId);
            await supabase.from('profiles').delete().eq('id', userId);
            
            // Delete user credentials from auth.users via RPC
            const { error: rpcError } = await supabase.rpc('delete_user_account');
            if (rpcError) {
              await supabase.rpc('delete_user');
            }
          }
          await supabase.auth.signOut();
          showToast('Akun dan seluruh data Anda telah berhasil dihapus.', 'info');
        } catch (err) {
          showToast('Gagal menghapus akun: ' + err.message, 'error');
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

  const userAvatarUrl = useMemo(() => {
    const oauthAvatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
    const customAvatar = profile?.avatar_url || session?.user?.user_metadata?.custom_avatar_url;
    return customAvatar || oauthAvatar || null;
  }, [session, profile]);

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
      {/* Top Header Bar */}
      <header className="top-header-bar">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <Wallet size={20} />
          </div>
          <div className="brand-title-box">
            <h2>Money Management</h2>
            <span>Financial Hub</span>
          </div>
        </div>

        {/* Header Nav Pills */}
        <div className="header-nav-pills">
          <button className={`nav-pill-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            {t('dashboard')}
          </button>
          <button className={`nav-pill-item ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
            {t('transactions')}
          </button>
          <button className={`nav-pill-item ${activeTab === 'savings' ? 'active' : ''}`} onClick={() => setActiveTab('savings')}>
            {t('budgets')}
          </button>
          <button className={`nav-pill-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            {t('analytics')}
          </button>
          <button className={`nav-pill-item ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>
            {t('reminders')}
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="header-right-actions">
          {/* Notification Bell Dropdown (H-5 Reminders) */}
          <div style={{ position: 'relative' }}>
            <button 
              className="icon-button-badge" 
              onClick={() => { setShowNotifMenu(!showNotifMenu); setShowProfileMenu(false); }}
              title="Pengingat Tagihan"
              style={{ border: dueSoonBills.length > 0 ? '1px solid var(--expense-color)' : '1px solid var(--border-color)' }}
            >
              <Bell size={17} color={dueSoonBills.length > 0 ? '#ef4444' : 'var(--text-secondary)'} />
              {dueSoonBills.length > 0 && (
                <span className="notification-badge-count">
                  {dueSoonBills.length}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="notif-dropdown" style={{ position: 'absolute', right: 0, top: '125%', width: '320px', background: '#121824', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Bell size={14} color="var(--expense-color)" /> {t('billReminders')}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                    {dueSoonBills.length} {t('billsUnit')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                  {dueSoonBills.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {t('noUpcomingBills')}
                    </div>
                  ) : (
                    dueSoonBills.map(b => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const dDate = new Date(b.due_date);
                      dDate.setHours(0,0,0,0);
                      const diffDays = Math.ceil((dDate - today) / (1000 * 60 * 60 * 24));

                      const statusText = diffDays < 0 ? 'Terlewat!' : diffDays === 0 ? 'Jatuh Tempo Hari Ini!' : `${diffDays} Hari Lagi (H-${diffDays})`;
                      const isDanger = diffDays <= 1;

                      return (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: isDanger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{b.name}</span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: isDanger ? '#ef4444' : '#f59e0b', fontWeight: 500 }}>
                              {statusText} • {b.due_date}
                            </span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#fff' }}>{formatIDR(b.amount)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {dueSoonBills.length > 0 && (
                  <button 
                    onClick={() => { setShowNotifMenu(false); setActiveTab('reminders'); }}
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.5rem', background: 'var(--expense-color)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t('payNow')}
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '0.35rem 0.6rem', borderRadius: '20px', cursor: 'pointer' }}
            >
              {userAvatarUrl ? (
                <img 
                  src={userAvatarUrl} 
                  alt="Avatar" 
                  style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#10b981', color: '#0b0f19', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.75rem' }}>
                  {session?.user?.email ? session.user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="hide-on-mobile" style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session?.user?.email ? session.user.email.split('@')[0] : 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown" style={{ right: 0, left: 'auto', top: '120%' }}>
                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {userAvatarUrl && (
                    <img src={userAvatarUrl} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>{t('yourAccount')}</strong>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', display: 'block' }}>{session?.user?.email}</span>
                  </div>
                </div>
                <div className="profile-divider"></div>
                <div style={{ padding: '0.25rem 0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>{t('mainCurrency')}</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="currency-select" style={{ width: '100%' }}>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SGD">SGD ($)</option>
                  </select>
                </div>
                <div style={{ padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>{t('language')}</span>
                  <select value={langOption} onChange={(e) => setLangOption(e.target.value)} className="currency-select" style={{ width: '100%' }}>
                    <option value="auto">{t('autoDevice')} ({getDeviceLanguage() === 'en' ? 'English' : 'Indonesia'})</option>
                    <option value="id">{t('indonesian')}</option>
                    <option value="en">{t('english')}</option>
                  </select>
                </div>
                <div className="profile-divider"></div>
                <button onClick={() => { setShowProfileMenu(false); setIsProfileOpen(true); }} className="profile-action-btn" style={{ color: 'var(--accent-color)' }}>
                  <User size={14} /> <span>{t('profileSettings')}</span>
                </button>
                <div className="profile-divider"></div>
                <button onClick={() => { setShowProfileMenu(false); resetData(); }} className="profile-action-btn reset">
                  <RefreshCw size={14} /> <span>{t('resetData')}</span>
                </button>
                <button onClick={() => { setShowProfileMenu(false); deleteAccount(); }} className="profile-action-btn delete">
                  <UserX size={14} /> <span>{t('deleteAccount')}</span>
                </button>
                <button onClick={() => { setShowProfileMenu(false); handleLogout(); }} className="profile-action-btn logout">
                  <LogOut size={14} /> <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>



      {/* Main Content Area */}
      <main className="main-content">
        {/* Tab 1: Dashboard (3-Row Layout Matching Mockup) */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-v2-container">
            {/* ROW 1: 3 Summary Cards */}
            <div className="dashboard-row-1">
              {/* Card 1: Total Balance */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('totalBalance')}</span>
                <div style={{ margin: '0.5rem 0' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                    {formatIDR(balance)}
                  </h2>
                </div>
                <div>
                  <span className="badge-green-trend">
                    <TrendingUp size={12} /> +2.4% {t('vsLastMonth')}
                  </span>
                </div>
              </div>

              {/* Card 2: Current Month Summary */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('currentMonth')}</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.15rem', fontWeight: 500 }}>{t('income')}</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--income-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatIDR(paydayIncome)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.15rem', fontWeight: 500 }}>{t('expenses')}</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--expense-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatIDR(paydayExpense)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.15rem', fontWeight: 500 }}>{t('saved')}</span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--saving-color)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatIDR(currentSaved)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Quick Actions */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('quickActions')}</span>
                  <MoreHorizontal size={16} color="var(--text-secondary)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <button onClick={() => { setSelectedFormType('income'); setActiveTab('transactions'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.6rem 0.25rem', borderRadius: '8px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}>
                    <Plus size={16} color="#10b981" />
                    <span>Pemasukan</span>
                  </button>
                  <button onClick={() => { setSelectedFormType('expense'); setActiveTab('transactions'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.6rem 0.25rem', borderRadius: '8px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}>
                    <ArrowDownCircle size={16} color="#ef4444" />
                    <span>Pengeluaran</span>
                  </button>
                  <button onClick={() => { setSelectedFormType('transfer'); setActiveTab('transactions'); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '0.6rem 0.25rem', borderRadius: '8px', color: '#fff', fontSize: '0.7rem', cursor: 'pointer' }}>
                    <Send size={16} color="#06b6d4" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 2: Interactive Combo Chart & Recent Transactions */}
            <div className="dashboard-row-2">
              <DashboardCharts 
                transactions={transactions} 
                paydayDate={profile?.payday_date || 1} 
                formatIDR={formatIDR} 
                t={t}
              />

              {/* Recent Transactions Box */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('recentActivity')}</h3>
                  <MoreHorizontal size={16} color="var(--text-secondary)" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto' }}>
                  {transactions.slice(0, 5).length === 0 ? (
                    <div className="empty-state">{t('noTransactions')}</div>
                  ) : (
                    transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: tx.type === 'income' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {tx.type === 'income' ? <ArrowUpCircle size={16} color="#10b981" /> : <ArrowDownCircle size={16} color="#ef4444" />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.title}</span>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.category} • {tx.date}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: tx.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                          {tx.type === 'income' ? '+' : '-'} {formatIDR(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ROW 3: Budget Overview (Alokasi Keuangan 50-5-30-15) */}
            <div style={{ marginBottom: '1.5rem' }}>
              <BudgetOverview 
                transactions={transactions} 
                formatIDR={formatIDR} 
                monthlyIncome={profile?.monthly_income}
                paydayDate={profile?.payday_date || 1}
                currency={currency}
              />
            </div>

            {/* Wallet Manager */}
            <div style={{ marginTop: '0.5rem' }}>
              <WalletManager 
                wallets={walletsWithUpdatedBalances} 
                fetchUserData={fetchUserData} 
                formatIDR={formatIDR} 
                showToast={showToast}
                showConfirm={showConfirm}
                currency={currency}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
            <TransactionForm 
              onAddTransaction={handleAddTransaction} 
              wallets={walletsWithUpdatedBalances} 
              currency={currency} 
              initialType={selectedFormType} 
              transactions={transactions}
              monthlyIncome={profile?.monthly_income || 0}
              paydayDate={profile?.payday_date || 1}
              t={t}
            />
            
            <TransactionList 
              transactions={transactions}
              formatIDR={formatIDR}
              getWalletName={getWalletName}
              onDeleteTransaction={handleDeleteTransaction}
              t={t}
            />
          </div>
        )}

        {/* Tab 3: Savings & Budgets */}
        {activeTab === 'savings' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <BudgetAndSavings 
              transactions={transactions} 
              formatIDR={formatIDR} 
              paydayDate={profile?.payday_date || 1}
              monthlyIncome={profile?.monthly_income || 0}
              onOpenProfile={() => setIsProfileOpen(true)}
              showToast={showToast}
              showConfirm={showConfirm}
              currency={currency}
              wallets={walletsWithUpdatedBalances}
              onAddTransaction={handleAddTransaction}
              t={t}
            />
            <SeaBankInterestCalculator 
              formatIDR={formatIDR} 
              wallets={walletsWithUpdatedBalances} 
              onAddTransaction={handleAddTransaction} 
              showToast={showToast} 
              currency={currency} 
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
              onAddInstallment={handleAddInstallment}
              showToast={showToast}
              showConfirm={showConfirm}
              currency={currency}
              fetchUserData={fetchUserData}
            />
            <InstallmentTracker 
              installments={installments}
              onAddInstallment={handleAddInstallment}
              onDeleteInstallment={handleDeleteInstallment}
              onPayInstallment={handlePayInstallment}
              balance={balance}
              wallets={walletsWithUpdatedBalances}
              showToast={showToast}
              currency={currency}
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
              showToast={showToast}
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
        rates={rates}
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
