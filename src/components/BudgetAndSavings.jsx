import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PiggyBank, Plus, Trash2, ArrowUpRight, AlertTriangle } from 'lucide-react';

export default function BudgetAndSavings({ userId, transactions = [], formatIDR }) {
  // Budget States
  const [budgets, setBudgets] = useState([]);
  const [budgetCategory, setBudgetCategory] = useState('Makanan');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Multi-Goals Savings States
  const [goals, setGoals] = useState([]);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalLoading, setGoalLoading] = useState(false);
  const [savingsAction, setSavingsAction] = useState({ goalId: '', type: 'deposit', amount: '' });

  // Categories list matching TransactionForm
  const expenseCategories = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan', 'Investasi', 'Lainnya'];

  useEffect(() => {
    fetchBudgets();
    fetchSavingsGoals();
  }, []);

  // Fetch Budgets
  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase.from('budgets').select('*');
      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      console.error('Error fetching budgets:', err.message);
    }
  };

  // Fetch Savings Goals
  const fetchSavingsGoals = async () => {
    try {
      const { data, error } = await supabase.from('savings_goals').select('*');
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Error fetching savings goals:', err.message);
    }
  };

  // Handle Add Budget
  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!budgetLimit) return;
    setBudgetLoading(true);
    const limitNum = parseFloat(budgetLimit);

    try {
      const { error } = await supabase
        .from('budgets')
        .upsert({
          id: `${userId}_${budgetCategory}`,
          user_id: userId,
          category: budgetCategory,
          limit_amount: limitNum
        });
      if (error) throw error;
      setBudgetLimit('');
      fetchBudgets();
    } catch (err) {
      alert('Gagal menyimpan anggaran: ' + err.message);
    } finally {
      setBudgetLoading(false);
    }
  };

  // Handle Delete Budget
  const handleDeleteBudget = async (id) => {
    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      fetchBudgets();
    } catch (err) {
      alert('Gagal menghapus anggaran: ' + err.message);
    }
  };

  // Handle Add Goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !goalAmount) return;
    setGoalLoading(true);

    const newGoal = {
      id: Date.now().toString(),
      user_id: userId,
      goal_name: goalName,
      goal_amount: parseFloat(goalAmount),
      current_saved: 0
    };

    try {
      const { error } = await supabase.from('savings_goals').insert(newGoal);
      if (error) throw error;
      setGoalName('');
      setGoalAmount('');
      fetchSavingsGoals();
    } catch (err) {
      alert('Gagal menyimpan target tabungan: ' + err.message);
    } finally {
      setGoalLoading(false);
    }
  };

  // Handle Delete Goal
  const handleDeleteGoal = async (id) => {
    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', id);
      if (error) throw error;
      fetchSavingsGoals();
    } catch (err) {
      alert('Gagal menghapus target tabungan: ' + err.message);
    }
  };

  // Handle Deposit/Withdraw Savings Goal
  const handleSavingsActionSubmit = async (e) => {
    e.preventDefault();
    const { goalId, type, amount } = savingsAction;
    if (!goalId || !amount) return;

    const amountNum = parseFloat(amount);
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    let newSaved = targetGoal.current_saved;
    if (type === 'deposit') {
      newSaved += amountNum;
    } else {
      if (newSaved < amountNum) {
        alert('Saldo tabungan tidak cukup!');
        return;
      }
      newSaved -= amountNum;
    }

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({ current_saved: newSaved })
        .eq('id', goalId);
      if (error) throw error;

      // Log transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        id: Date.now().toString(),
        user_id: userId,
        type: type === 'deposit' ? 'deposit' : 'withdraw',
        title: type === 'deposit' ? `Setoran: ${targetGoal.goal_name}` : `Penarikan: ${targetGoal.goal_name}`,
        amount: amountNum,
        category: 'Tabungan',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cashless'
      });
      if (txErr) throw txErr;

      setSavingsAction({ goalId: '', type: 'deposit', amount: '' });
      fetchSavingsGoals();
      // Reload page/transactions in parent
      window.location.reload();
    } catch (err) {
      alert('Gagal memproses setoran/penarikan: ' + err.message);
    }
  };

  // Calculate expenses per category in current month
  const categoryExpenses = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const expenses = {};
    transactions
      .filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth))
      .forEach(t => {
        expenses[t.category] = (expenses[t.category] || 0) + t.amount;
      });
    return expenses;
  }, [transactions]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      
      {/* SECTION 1: BUDGET LIMITER */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Anggaran Bulanan per Kategori</h2>
        
        <form onSubmit={handleAddBudget} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} required>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="number"
              placeholder="Limit Anggaran (Rp)"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              required
              min="1000"
            />
          </div>
          <button type="submit" className="btn-submit" disabled={budgetLoading} style={{ margin: 0, padding: '0 1rem' }}>
            <Plus size={18} /> Simpan
          </button>
        </form>

        {/* Budgets List with Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {budgets.length === 0 ? (
            <div className="empty-state">Belum ada anggaran bulanan yang diatur.</div>
          ) : (
            budgets.map(b => {
              const spent = categoryExpenses[b.category] || 0;
              const percent = Math.min((spent / b.limit_amount) * 100, 100);
              const isOver = spent > b.limit_amount;

              return (
                <div key={b.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{b.category}</span>
                    <button onClick={() => handleDeleteBudget(b.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Terpakai: {formatIDR(parseFloat(spent) || 0)}</span>
                    <span>Limit: {formatIDR(parseFloat(b.limit_amount) || 0)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: isOver ? 'var(--expense-color)' : 'var(--accent-color)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  {isOver && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--expense-color)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 500 }}>
                      <AlertTriangle size={12} /> Anggaran melebihi batas limit bulanan!
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 2: MULTI-GOALS SAVINGS TRACKER */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>Target Tabungan Khusus (Multi-Goals)</h2>
        
        <form onSubmit={handleAddGoal} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Nama Target (e.g. Beli Laptop)"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="number"
              placeholder="Jumlah Target (Rp)"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              required
              min="1000"
            />
          </div>
          <button type="submit" className="btn-submit" disabled={goalLoading} style={{ margin: 0, padding: '0 1rem' }}>
            <Plus size={18} /> Buat Target
          </button>
        </form>

        {/* Goals List with Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {goals.length === 0 ? (
            <div className="empty-state">Belum ada target tabungan khusus.</div>
          ) : (
            goals.map(g => {
              const percent = Math.min((g.current_saved / g.goal_amount) * 100, 100);
              return (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{g.goal_name}</span>
                    <button onClick={() => handleDeleteGoal(g.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    <span>Terkumpul: {formatIDR(parseFloat(g.current_saved) || 0)}</span>
                    <span>Target: {formatIDR(parseFloat(g.goal_amount) || 0)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: 'var(--income-color)',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>

                  {/* Setor/Tarik Form */}
                  <form onSubmit={handleSavingsActionSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select
                      value={savingsAction.goalId === g.id ? savingsAction.type : 'deposit'}
                      onChange={(e) => setSavingsAction({ goalId: g.id, type: e.target.value, amount: savingsAction.amount })}
                      style={{ padding: '0.35rem', borderRadius: '0.25rem', width: 'auto', fontSize: '0.8rem', background: '#0b0f19' }}
                    >
                      <option value="deposit">Setor</option>
                      <option value="withdraw">Tarik</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={savingsAction.goalId === g.id ? savingsAction.amount : ''}
                      onChange={(e) => setSavingsAction({ goalId: g.id, type: savingsAction.type || 'deposit', amount: e.target.value })}
                      required={savingsAction.goalId === g.id}
                      min="1000"
                      style={{ padding: '0.35rem', borderRadius: '0.25rem', fontSize: '0.8rem', flex: 1 }}
                    />
                    <button
                      type="submit"
                      onClick={() => setSavingsAction(prev => ({ ...prev, goalId: g.id }))}
                      style={{ padding: '0.35rem 0.75rem', borderRadius: '0.25rem', background: 'var(--accent-color)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Kirim
                    </button>
                  </form>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
