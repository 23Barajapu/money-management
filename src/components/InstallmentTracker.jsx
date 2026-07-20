import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react';

export default function InstallmentTracker({ installments, onAddInstallment, onDeleteInstallment, onPayInstallment, balance }) {
  const [name, setName] = useState('');
  const [months, setMonths] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [customPayAmount, setCustomPayAmount] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !months || !monthlyPayment) return;

    const calculatedTotal = parseFloat(monthlyPayment) * parseInt(months);

    onAddInstallment({
      id: Date.now().toString(),
      name,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      monthlyPayment: parseFloat(monthlyPayment),
    });

    setName('');
    setMonths('');
    setMonthlyPayment('');
    setShowAddForm(false);
  };

  const handlePay = (inst, amount) => {
    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) return;

    if (payVal > balance) {
      alert('Saldo utama tidak mencukupi!');
      return;
    }

    const remaining = inst.totalAmount - inst.paidAmount;
    if (payVal > remaining) {
      alert('Jumlah pembayaran melebihi sisa cicilan!');
      return;
    }

    onPayInstallment(inst.id, payVal);
    // clear input custom if exists
    setCustomPayAmount(prev => ({ ...prev, [inst.id]: '' }));
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} className="expense" style={{ color: 'var(--expense-color)' }} />
          Daftar Cicilan
        </h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-filter"
          style={{ padding: '0.25rem 0.5rem' }}
        >
          {showAddForm ? 'Batal' : 'Tambah'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="form-group">
            <label>Nama Cicilan</label>
            <input
              type="text"
              placeholder="e.g. Motor, HP, KPR"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Cicilan per Bulan (Rp)</label>
            <input
              type="number"
              placeholder="e.g. 500000"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              required
              min="1"
            />
          </div>
          <div className="form-group">
            <label>Lama Cicilan (Bulan)</label>
            <input
              type="number"
              placeholder="e.g. 12"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              required
              min="1"
            />
          </div>
          <button type="submit" className="btn-submit" style={{ background: 'var(--expense-color)' }}>
            <Plus size={18} />
            Simpan Cicilan
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {installments.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem 0' }}>Belum ada cicilan terdaftar.</div>
        ) : (
          installments.map(inst => {
            const remaining = inst.totalAmount - inst.paidAmount;
            const progress = Math.min(Math.round((inst.paidAmount / inst.totalAmount) * 100), 100);
            const isSettled = remaining <= 0;

            return (
              <div key={inst.id} style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{inst.name}</span>
                      {isSettled && <span style={{ color: 'var(--income-color)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.1rem' }}><CheckCircle size={12}/> Lunas</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Cicilan: {formatIDR(inst.monthlyPayment)} / bulan
                    </span>
                  </div>
                  <button 
                    onClick={() => onDeleteInstallment(inst.id)}
                    className="btn-delete"
                    style={{ padding: '0.25rem' }}
                    title="Hapus Cicilan"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="progress-bar-container" style={{ margin: '0.5rem 0 0.25rem 0', height: '0.5rem' }}>
                  <div 
                    className="progress-bar" 
                    style={{ 
                      width: `${progress}%`,
                      background: isSettled ? 'var(--income-color)' : 'linear-gradient(90deg, var(--expense-color) 0%, var(--accent-color) 100%)' 
                    }}
                  ></div>
                </div>

                <div className="savings-stats" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                  <span>Sisa: <strong>{formatIDR(remaining)}</strong></span>
                  <span>Total: {formatIDR(inst.totalAmount)}</span>
                </div>

                {!isSettled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        placeholder="Bayar kustom..."
                        value={customPayAmount[inst.id] || ''}
                        onChange={(e) => setCustomPayAmount(prev => ({ ...prev, [inst.id]: e.target.value }))}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                      />
                      <button
                        onClick={() => handlePay(inst, customPayAmount[inst.id])}
                        className="btn-filter active"
                        style={{ whiteSpace: 'nowrap', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        Bayar Kustom
                      </button>
                    </div>
                    {remaining >= inst.monthlyPayment && (
                      <button
                        onClick={() => handlePay(inst, inst.monthlyPayment)}
                        className="btn-submit"
                        style={{ fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--expense-color)', border: '1px solid rgba(239,68,68,0.2)' }}
                      >
                        Bayar Cicilan Bulanan ({formatIDR(inst.monthlyPayment)})
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
