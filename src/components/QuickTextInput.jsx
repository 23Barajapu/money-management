import React, { useState, useMemo } from 'react';
import { parseTransactionText } from '../utils/nlpTransactionParser';
import { Sparkles, ArrowRight, ArrowRightLeft, TrendingUp, TrendingDown, Wallet, Calendar, Tag, Check, AlertCircle } from 'lucide-react';

export default function QuickTextInput({
  onAddTransaction,
  onOpenDetailedForm,
  wallets = [],
  currency = 'IDR',
  t = (k) => k
}) {
  const [inputText, setInputText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const parsed = useMemo(() => {
    return parseTransactionText(inputText, wallets);
  }, [inputText, wallets]);

  const formatAmount = (num) => {
    if (currency === 'IDR') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num || 0);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(num || 0);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!parsed.isValid || !parsed.amount) return;

    onAddTransaction({
      id: Date.now().toString(),
      type: parsed.type,
      title: parsed.title,
      amount: parsed.amount,
      category: parsed.type === 'transfer' ? parsed.destinationWalletId : parsed.category,
      date: parsed.date,
      payment_method: parsed.walletId
    });

    setIsSuccess(true);
    setInputText('');
    setTimeout(() => {
      setIsSuccess(false);
    }, 2500);
  };

  const handleApplyToForm = () => {
    if (!onOpenDetailedForm) return;
    onOpenDetailedForm({
      type: parsed.type,
      title: parsed.title,
      amount: parsed.amount > 0 ? parsed.amount.toString() : '',
      category: parsed.category,
      paymentMethod: parsed.walletId,
      destinationWalletId: parsed.destinationWalletId,
      date: parsed.date
    });
  };

  return (
    <div className="card" style={{
      borderRadius: '16px',
      padding: '1.25rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Input Cepat Transaksi
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Deteksi otomatis nominal, kategori, dan dompet dari kalimat
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleQuickSubmit} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ketik catatan transaksi..."
            style={{
              flex: '1 1 200px',
              minHeight: '44px',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: parsed.isValid ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: parsed.isValid ? '0 0 0 2px rgba(99, 102, 241, 0.2)' : 'none'
            }}
          />

          <button
            type="submit"
            disabled={!parsed.isValid}
            style={{
              minHeight: '44px',
              minWidth: '88px',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: parsed.isValid
                ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                : 'rgba(148, 163, 184, 0.15)',
              color: parsed.isValid ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: parsed.isValid ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flex: '0 0 auto'
            }}
          >
            {isSuccess ? (
              <>
                <Check size={16} color="#10b981" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <span>Catat</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Live Detected Badges */}
        {inputText.trim().length > 0 && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
              {/* Tipe Badge */}
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: parsed.type === 'income'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : parsed.type === 'transfer'
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: parsed.type === 'income'
                  ? 'var(--income-color)'
                  : parsed.type === 'transfer'
                  ? 'var(--saving-color)'
                  : 'var(--expense-color)'
              }}>
                {parsed.type === 'income' ? <TrendingUp size={12} /> : parsed.type === 'transfer' ? <ArrowRightLeft size={12} /> : <TrendingDown size={12} />}
                {parsed.type === 'income' ? 'Pemasukan' : parsed.type === 'transfer' ? 'Transfer' : 'Pengeluaran'}
              </span>

              {/* Nominal Badge */}
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                background: parsed.amount > 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                color: parsed.amount > 0 ? 'var(--accent-color)' : 'var(--text-secondary)'
              }}>
                {parsed.amount > 0 ? formatAmount(parsed.amount) : 'Nominal belum terdeteksi'}
              </span>

              {/* Kategori Badge */}
              {parsed.type !== 'transfer' && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Tag size={11} />
                  {parsed.category}
                </span>
              )}

              {/* Dompet Sumber Badge */}
              <span style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(148, 163, 184, 0.1)',
                color: 'var(--text-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Wallet size={11} />
                {parsed.sourceWalletName || 'Dompet Utama'}
                {parsed.type === 'transfer' && parsed.targetWalletName && ` ➔ ${parsed.targetWalletName}`}
              </span>

              {/* Tanggal Badge */}
              <span style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '6px',
                background: 'rgba(148, 163, 184, 0.1)',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Calendar size={11} />
                {parsed.date}
              </span>
            </div>

            {/* Aksi Buka Form Detail */}
            {onOpenDetailedForm && parsed.isValid && (
              <button
                type="button"
                onClick={handleApplyToForm}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  padding: '6px 10px',
                  minHeight: '40px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent-color)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
              >
                Buka di Form Detail ↗
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
