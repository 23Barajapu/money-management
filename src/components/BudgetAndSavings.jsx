import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PiggyBank, Target, Plus, Trash2, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';

export default function BudgetAndSavings({ transactions, formatIDR, paydayDate = 1, showToast, showConfirm }) {
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [budgetCategory, setBudgetCategory] = useState('Makanan');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalSaved, setGoalSaved] = useState('0');

  // Transaction Category Options (matching TransactionForm)
  const categories = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Kesehatan', 'Edukasi', 'Lainnya'];

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
    if (!budgetLimit) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newBudget = {
        id: Date.now().toString(),
        user_id: user.id,
        category: budgetCategory,
        limit_amount: parseFloat(budgetLimit)
      };

      const { error } = await supabase.from('budgets').upsert(newBudget, { onConflict: 'user_id,category' });
      if (error) throw error;

      setBudgetLimit('');
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
    if (!goalName || !goalAmount) return;
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const newGoal = {
        id: Date.now().toString(),
        user_id: user.id,
        goal_name: goalName,
        goal_amount: parseFloat(goalAmount),
        current_saved: parseFloat(goalSaved || '0')
      };

      const { error } = await supabase.from('savings_goals').insert(newGoal);
      if (error) throw error;

      setGoalName('');
      setGoalAmount('');
      setGoalSaved('0');
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      {/* SECTION 1: BUDGET LIMITER */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <Target size={20} color="var(--accent-color)" />
          Limit Anggaran Bulanan
        </h2>

        <form onSubmit={handleAddBudget} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Kategori</label>
            <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Batas Limit (Rp)</label>
            <input 
              type="number" 
              placeholder="e.g. 1000000" 
              value={budgetLimit} 
              onChange={(e) => setBudgetLimit(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-submit" style={{ padding: '0.75rem 1rem', width: 'auto', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> Set Limit
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {budgets.length === 0 ? (
            <div className="empty-state">Belum ada batas anggaran yang diatur.</div>
          ) : (
            budgets.map(b => {
              const spent = currentMonthExpenses[b.category] || 0;
              const percent = Math.min(100, (spent / b.limit_amount) * 100);
              const isOver = spent > b.limit_amount;

              return (
                <div key={b.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{b.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isOver && <AlertTriangle size={16} color="var(--expense-color)" title="Over Budget!" />}
                      <span style={{ fontSize: '0.85rem', color: isOver ? 'var(--expense-color)' : 'var(--text-secondary)' }}>
                        {formatIDR(spent)} / {formatIDR(b.limit_amount)}
                      </span>
                      <button onClick={() => handleDeleteBudget(b.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: isOver ? 'var(--expense-color)' : 'var(--accent-color)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: SAVING GOALS TRACKER */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <PiggyBank size={20} color="var(--income-color)" />
          Target Tabungan Khusus
        </h2>

        <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'end' }}>
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
            <label>Target Nominal</label>
            <input 
              type="number" 
              placeholder="e.g. 5000000" 
              value={goalAmount} 
              onChange={(e) => setGoalAmount(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Tabungan Awal</label>
            <input 
              type="number" 
              placeholder="e.g. 0" 
              value={goalSaved} 
              onChange={(e) => setGoalSaved(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-submit" style={{ padding: '0.75rem 1rem', width: 'auto' }}>
            <Plus size={16} /> Buat Target
          </button>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
          {goals.length === 0 ? (
            <div className="empty-state">Belum ada target tabungan yang dibuat.</div>
          ) : (
            goals.map(g => {
              const percent = Math.min(100, (g.current_saved / g.goal_amount) * 100);
              return (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0 }}>{g.goal_name}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Progres: {percent.toFixed(1)}%
                      </span>
                    </div>
                    <button onClick={() => handleDeleteGoal(g)} className="btn-delete">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: `${percent}%`, 
                      height: '100%', 
                      background: percent >= 100 ? 'var(--income-color)' : 'var(--accent-color)',
                      borderRadius: '5px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {formatIDR(g.current_saved)} / {formatIDR(g.goal_amount)}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          const val = prompt('Masukkan nominal setoran:');
                          if (val && !isNaN(val)) handleUpdateSaved(g, parseFloat(val));
                        }} 
                        className="btn-toggle active income" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <ArrowUpRight size={14} /> Setor
                      </button>
                      <button 
                        onClick={() => {
                          const val = prompt('Masukkan nominal penarikan:');
                          if (val && !isNaN(val)) handleUpdateSaved(g, -parseFloat(val));
                        }} 
                        className="btn-toggle active expense" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <ArrowDownLeft size={14} /> Tarik
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
