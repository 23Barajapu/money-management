import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle, Wallet } from 'lucide-react';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

export default function InstallmentTracker({ 
  installments = [], 
  onDeleteInstallment, 
  onPayInstallment, 
  balance, 
  wallets = [], 
  showToast,
  currency = 'IDR'
}) {
  const [customPayAmount, setCustomPayAmount] = useState({});
  const [selectedWallet, setSelectedWallet] = useState({});

  const handlePay = (inst, amount) => {
    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) return;

    const walletId = selectedWallet[inst.id] || (wallets[0]?.id || 'wallet_cash');
    const chosenWallet = wallets.find(w => w.id === walletId);

    if (chosenWallet && payVal > chosenWallet.balance) {
      if (showToast) showToast(`Saldo ${chosenWallet.name} (${formatIDR(chosenWallet.balance)}) tidak mencukupi!`, 'error');
      return;
    }

    const total = Number(inst.totalAmount) || 0;
    const paid = Number(inst.paidAmount) || 0;
    const remaining = total - paid;

    if (payVal > remaining) {
      if (showToast) showToast('Jumlah pembayaran melebihi sisa cicilan!', 'error');
      return;
    }

    onPayInstallment(inst.id, payVal, walletId);
    setCustomPayAmount(prev => ({ ...prev, [inst.id]: '' }));
  };

  const formatIDR = (num) => {
    const n = Number(num) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={20} className="expense" style={{ color: 'var(--expense-color)' }} />
          Daftar Cicilan
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {installments.length === 0 ? (
          <div className="empty-state" style={{ padding: '1rem 0' }}>Belum ada cicilan terdaftar.</div>
        ) : (
          installments.map(inst => {
            const total = Number(inst.totalAmount) || 0;
            const paid = Number(inst.paidAmount) || 0;
            const monthly = Number(inst.monthlyPayment) || 0;
            const remaining = Math.max(0, total - paid);
            const progress = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
            const isSettled = remaining <= 0;
            const currentWalletId = selectedWallet[inst.id] || (wallets[0]?.id || 'wallet_cash');

            return (
              <div key={inst.id} style={{ background: 'rgba(15, 23, 42, 0.3)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{inst.name}</span>
                      {isSettled && <span style={{ color: 'var(--income-color)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.1rem' }}><CheckCircle size={12}/> Lunas</span>}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Cicilan: {formatIDR(monthly)} / bulan
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
                  <span>Total: {formatIDR(total)}</span>
                </div>

                {!isSettled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border-color)' }}>
                    <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Wallet size={12} /> Sumber Uang / Dompet Pembayaran:
                      </label>
                      <select
                        value={currentWalletId}
                        onChange={(e) => setSelectedWallet(prev => ({ ...prev, [inst.id]: e.target.value }))}
                        className="currency-select"
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      >
                        {wallets.length === 0 ? (
                          <>
                            <option value="wallet_cash">Dompet Cash</option>
                            <option value="wallet_cashless">Rekening Bank</option>
                          </>
                        ) : (
                          wallets.map(w => (
                            <option key={w.id} value={w.id}>
                              {w.name} ({formatIDR(w.balance)})
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        placeholder="Bayar kustom..."
                        value={customPayAmount[inst.id] || ''}
                        onChange={(e) => setCustomPayAmount(prev => ({ ...prev, [inst.id]: e.target.value }))}
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                      />
                      <button 
                        onClick={() => handlePay(inst, customPayAmount[inst.id])}
                        className="btn-filter active"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        Bayar Kustom
                      </button>
                    </div>

                    <button 
                      onClick={() => handlePay(inst, monthly)}
                      className="btn-submit"
                      style={{ padding: '0.5rem', fontSize: '0.85rem', width: '100%', background: 'var(--expense-color)' }}
                    >
                      Bayar Cicilan Bulanan ({formatIDR(monthly)})
                    </button>
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
