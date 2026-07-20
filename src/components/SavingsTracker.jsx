import React, { useState } from 'react';
import { Target, TrendingUp, PiggyBank, Plus, Minus } from 'lucide-react';

export default function SavingsTracker({ savings, onUpdateSavings, balance }) {
  const [goalName, setGoalName] = useState(savings.goalName || '');
  const [goalAmount, setGoalAmount] = useState(savings.goalAmount || '');
  const [amountInput, setAmountInput] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(!savings.goalAmount);

  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!goalName || !goalAmount) return;
    onUpdateSavings({
      ...savings,
      goalName,
      goalAmount: parseFloat(goalAmount)
    });
    setIsEditingGoal(false);
  };

  const handleTransaction = (action) => {
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    if (action === 'deposit') {
      if (val > balance) {
        alert('Saldo tidak mencukupi untuk ditabung!');
        return;
      }
      onUpdateSavings({
        ...savings,
        currentSaved: savings.currentSaved + val
      }, val, 'deposit');
    } else if (action === 'withdraw') {
      if (val > savings.currentSaved) {
        alert('Jumlah penarikan melebihi tabungan saat ini!');
        return;
      }
      onUpdateSavings({
        ...savings,
        currentSaved: savings.currentSaved - val
      }, val, 'withdraw');
    }
    setAmountInput('');
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const progressPercent = savings.goalAmount > 0 
    ? Math.min(Math.round((savings.currentSaved / savings.goalAmount) * 100), 100) 
    : 0;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PiggyBank size={20} className="saving" style={{ color: 'var(--saving-color)' }} />
          Target Tabungan
        </h2>
        {savings.goalAmount > 0 && !isEditingGoal && (
          <button 
            onClick={() => setIsEditingGoal(true)}
            className="btn-filter"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            Ubah Target
          </button>
        )}
      </div>

      {isEditingGoal ? (
        <form onSubmit={handleSaveGoal}>
          <div className="form-group">
            <label>Nama Impian / Target</label>
            <input
              type="text"
              placeholder="e.g. Beli Laptop, Liburan"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Target Nominal (Rp)</label>
            <input
              type="number"
              placeholder="e.g. 5000000"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              required
              min="1"
            />
          </div>
          <button type="submit" className="btn-submit" style={{ background: 'var(--saving-color)' }}>
            <Target size={18} style={{ marginRight: '0.25rem' }} />
            Simpan Target
          </button>
        </form>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{savings.goalName}</span>
            <span style={{ color: 'var(--saving-color)', fontWeight: 700 }}>{progressPercent}%</span>
          </div>

          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>

          <div className="savings-stats" style={{ marginBottom: '1.5rem' }}>
            <span>Terkumpul: <strong>{formatIDR(savings.currentSaved)}</strong></span>
            <span>Target: {formatIDR(savings.goalAmount)}</span>
          </div>

          {/* Quick Add/Remove Balance in Savings */}
          <div className="form-group" style={{ marginBottom: '0.5rem' }}>
            <label>Jumlah Setoran / Penarikan (Rp)</label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              min="1"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn-submit" 
              style={{ background: 'var(--saving-color)' }}
              onClick={() => handleTransaction('deposit')}
            >
              <Plus size={16} /> Setor
            </button>
            <button 
              type="button" 
              className="btn-submit" 
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              onClick={() => handleTransaction('withdraw')}
            >
              <Minus size={16} /> Tarik
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
