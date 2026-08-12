import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PiggyBank, Target, Plus, Trash2, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';
import FinanceAllocation from './FinanceAllocation';

export default function BudgetAndSavings({ transactions, formatIDR, paydayDate = 1, monthlyIncome = 0, onOpenProfile, showToast, showConfirm, currency = 'IDR' }) {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [budgetCategory, setBudgetCategory] = useState('Makanan Dasar');
  const [goalName, setGoalName] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');

  // Auto-format hooks for nominal inputs
  const { displayValue: budgetLimitDisplay, rawValue: budgetLimitRaw, handleChange: handleBudgetLimitChange, handleBlur: handleBudgetLimitBlur, reset: resetBudgetLimit } = useCurrencyInput(currency);
  const { displayValue: goalAmountDisplay, rawValue: goalAmountRaw, handleChange: handleGoalAmountChange, handleBlur: handleGoalAmountBlur, reset: resetGoalAmount } = useCurrencyInput(currency);
  const { displayValue: goalSavedDisplay, rawValue: goalSavedRaw, handleChange: handleGoalSavedChange, handleBlur: handleGoalSavedBlur, reset: resetGoalSaved, setValue: setGoalSavedValue } = useCurrencyInput(currency);

  // Custom Modal Action
  const [customAction, setCustomAction] = useState({ isOpen: false, goal: null, isDeposit: true });
  const { displayValue: customAmountDisplay, rawValue: customAmountRaw, handleChange: handleCustomAmountChange, handleBlur: handleCustomAmountBlur, reset: resetCustomAmount } = useCurrencyInput(currency);

  // Transaction Category Options (matching TransactionForm 50-5-30-15)
  const categories = [
    'Makanan Dasar',
    'Sewa & Cicilan Rumah',
    'Utilitas & Tagihan',
    'Transportasi',
    'Kesehatan & Asuransi',
    'Hiburan & Streaming',
    'Dining Out & Jajan',
    'Hobi & Fashion',
    'Belanja Gaya Hidup',
    'ETF & Saham',
    'Obligasi & REIT',
    'Emas & Crypto',
    'Edukasi & Kursus',
    'Tabungan Darurat',
    'Lain-lain'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const [budgetsRes, goalsRes] = await Promise.all([
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('savings_goals').select('*').eq('user_id', user.id)
      ]);

      if (budgetsRes.error) throw budgetsRes.error;
      if (goalsRes.error) throw goalsRes.error;

      setGoals(goalsRes.data || []);
      setBudgets(budgetsRes.data || []);
    } catch (error) {
      console.error('Error fetching budget/savings:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Budget Limiter Logic
  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimitRaw) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newBudget = {
        id: Date.now().toString(),
        user_id: user.id,
        category: budgetCategory,
        limit_amount: parseFloat(budgetLimitRaw)
      };

      const { error } = await supabase.from('budgets').upsert(newBudget, { onConflict: 'user_id,category' });
      if (error) throw error;

      resetBudgetLimit();
      if (showToast) showToast('Limit anggaran disimpan!', 'success');
      fetchData();
    } catch (error) {
      if (showToast) showToast(error.message, 'error');
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      if (showToast) showToast('Anggaran dihapus', 'info');
      fetchData();
    } catch (error) {
      if (showToast) showToast(error.message, 'error');
    }
  };

  // Calculate current month's expenses per category (adjusted to Payday Cycle)
  const currentMonthExpenses = React.useMemo(() => {
    const now = new Date();
    
    let cycleStart, cycleEnd;
    const pDate = parseInt(paydayDate);
    
    if (now.getDate() >= pDate) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, pDate - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth(), pDate - 1, 23, 59, 59);
    }

    return transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d >= cycleStart && d <= cycleEnd;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
  }, [transactions, paydayDate]);

  // 2. Saving Goals Logic
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalAmountRaw) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newGoal = {
        id: Date.now().toString(),
        user_id: user.id,
        goal_name: goalName,
        goal_amount: parseFloat(goalAmountRaw),
        current_saved: parseFloat(goalSavedRaw || '0'),
        target_date: goalTargetDate || null
      };

      let { error } = await supabase.from('savings_goals').insert(newGoal);

      // Kolom target_date belum ada di DB — fallback insert tanpa kolom itu
      if (error && error.message && error.message.includes('target_date')) {
        const goalWithoutDate = { ...newGoal };
        delete goalWithoutDate.target_date;
        const result = await supabase.from('savings_goals').insert(goalWithoutDate);
        error = result.error;
        if (!error && showToast) {
          showToast(
            'Target dibuat! Untuk mengaktifkan fitur Deadline, jalankan SQL ini di Supabase:\n' +
            'ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS target_date date;',
            'info'
          );
        }
      }

      if (error) throw error;

      setGoalName('');
      setGoalTargetDate('');
      resetGoalAmount();
      resetGoalSaved();
      setGoalSavedValue(0);
      if (showToast) showToast('Target tabungan berhasil dibuat!', 'success');
      fetchData();
    } catch (error) {
      if (showToast) showToast(error.message, 'error');
    }
  };

  const handleUpdateSaved = async (goal, amountChange) => {
    try {
      const updatedSaved = Math.max(0, goal.current_saved + amountChange);
      const { error } = await supabase.from('savings_goals').update({ current_saved: updatedSaved }).eq('id', goal.id);
      if (error) throw error;
      if (showToast) showToast('Saldo tabungan diperbarui!', 'success');
      fetchData();
    } catch (error) {
      if (showToast) showToast(error.message, 'error');
    }
  };

  const handleDeleteGoal = async (goal) => {
    const doDelete = async () => {
      try {
        const { error } = await supabase.from('savings_goals').delete().eq('id', goal.id);
        if (error) throw error;
        if (showToast) showToast('Target tabungan dihapus', 'info');
        fetchData();
      } catch (error) {
        if (showToast) showToast(error.message, 'error');
      }
    };

    if (showConfirm) {
      showConfirm(
        'Hapus Target Tabungan',
        `Apakah Anda yakin ingin menghapus target tabungan "${goal.goal_name}"?`,
        doDelete,
        true
      );
    } else {
      doDelete();
    }
  };

  const currencyLabel = currency === 'IDR' ? 'Rp' : currency;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      {/* SECTION 0: PERSONAL FINANCE ALLOCATION (50-5-30-15) */}
      <FinanceAllocation 
        monthlyIncome={monthlyIncome} 
        transactions={transactions} 
        formatIDR={formatIDR} 
        paydayDate={paydayDate} 
        currency={currency} 
        onOpenProfile={onOpenProfile} 
      />

      {/* SECTION 2: SAVING GOALS TRACKER */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <PiggyBank size={20} color="var(--income-color)" />
          Target Tabungan Khusus
        </h2>

        <form onSubmit={handleAddGoal} className="saving-grid-form">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Nama Target</label>
            <input 
              type="text" 
              placeholder="e.g. Beli Laptop" 
              value={goalName} 
              onChange={(e) => setGoalName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Target Nominal ({currencyLabel})</label>
            <input 
              type="text" 
              inputMode="numeric"
              placeholder={currency === 'IDR' ? '0' : '0.00'} 
              value={goalAmountDisplay} 
              onChange={handleGoalAmountChange} 
              onBlur={handleGoalAmountBlur}
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tabungan Awal ({currencyLabel})</label>
            <input 
              type="text" 
              inputMode="numeric"
              placeholder="0" 
              value={goalSavedDisplay} 
              onChange={handleGoalSavedChange} 
              onBlur={handleGoalSavedBlur}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Target Deadline (Opsional)</label>
            <input 
              type="date" 
              value={goalTargetDate} 
              onChange={(e) => setGoalTargetDate(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-submit" style={{ padding: '0.75rem 1rem', width: 'auto', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Buat Target
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {goals.length === 0 ? (
            <div className="empty-state">Belum ada target tabungan yang dibuat.</div>
          ) : (
            goals.map(g => {
              const percent = Math.min(100, (g.current_saved / g.goal_amount) * 100);
              
              let deadlineInfo = null;
              if (g.target_date) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const target = new Date(g.target_date);
                const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
                const diffMonths = Math.max(1, Math.ceil(diffDays / 30.44));
                const remainingAmount = Math.max(0, g.goal_amount - g.current_saved);

                if (diffDays <= 0) {
                  deadlineInfo = <span style={{ color: 'var(--expense-color)', fontSize: '0.75rem' }}>⚠️ Deadline Terlewat</span>;
                } else if (remainingAmount <= 0) {
                  deadlineInfo = <span style={{ color: 'var(--income-color)', fontSize: '0.75rem' }}>🎉 Target Terpenuhi!</span>;
                } else {
                  const monthlyEstimate = remainingAmount / diffMonths;
                  deadlineInfo = (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>
                      📅 Deadline: {g.target_date} ({diffDays} hari) • Estimasi: {formatIDR(monthlyEstimate)}/bln
                    </span>
                  );
                }
              }

              const handleCustomUpdatePrompt = (isDeposit) => {
                setCustomAction({ isOpen: true, goal: g, isDeposit });
                resetCustomAmount();
              };

              return (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{g.goal_name}</h4>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Progres: {percent.toFixed(1)}%
                        </span>
                        {deadlineInfo}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteGoal(g)} className="btn-delete" style={{ padding: '0.25rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--income-color) 0%, var(--saving-color) 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {formatIDR(g.current_saved)} / {formatIDR(g.goal_amount)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button 
                        onClick={() => handleUpdateSaved(g, -50000)}
                        className="btn-delete" 
                        title="Tarik 50k"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.35rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--expense-color)', border: 'none' }}
                      >
                        <ArrowDownLeft size={12} /> -50k
                      </button>
                      <button 
                        onClick={() => handleUpdateSaved(g, 50000)}
                        className="btn-submit" 
                        title="Setor 50k"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.35rem 0.5rem', width: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--income-color)', border: 'none' }}
                      >
                        <ArrowUpRight size={12} /> +50k
                      </button>
                      <button 
                        onClick={() => handleCustomUpdatePrompt(true)}
                        className="btn-submit" 
                        title="Setor nominal custom"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', padding: '0.35rem 0.5rem', width: 'auto', background: 'var(--border-color)', color: 'var(--text-primary)', border: 'none' }}
                      >
                        + Custom
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Custom Amount Modal */}
      {customAction.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <PiggyBank size={20} color={customAction.isDeposit ? 'var(--income-color)' : 'var(--expense-color)'} />
              {customAction.isDeposit ? 'Setor ke' : 'Tarik dari'} {customAction.goal?.goal_name}
            </h3>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Nominal ({currency})</label>
              <input 
                type="text" 
                inputMode="numeric"
                value={customAmountDisplay}
                onChange={handleCustomAmountChange}
                onBlur={handleCustomAmountBlur}
                placeholder="0"
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn-delete"
                onClick={() => setCustomAction({ isOpen: false, goal: null, isDeposit: true })}
                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', background: 'transparent' }}
              >
                Batal
              </button>
              <button 
                className="btn-submit"
                onClick={() => {
                  const num = parseFloat(customAmountRaw || '0');
                  if (!isNaN(num) && num > 0) {
                    handleUpdateSaved(customAction.goal, customAction.isDeposit ? num : -num);
                    setCustomAction({ isOpen: false, goal: null, isDeposit: true });
                  } else {
                    if (showToast) showToast('Masukkan nominal yang valid', 'error');
                  }
                }}
                style={{ flex: 1, padding: '0.75rem', background: customAction.isDeposit ? 'var(--income-color)' : 'var(--expense-color)' }}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
