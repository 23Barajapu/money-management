import React, { useState, useMemo } from 'react';
import { Trash2, Edit2 } from 'lucide-react';

export default function TransactionList({ transactions = [], formatIDR, getWalletName, onDeleteTransaction, onEditTransaction, t = (k) => k }) {
  const [filter, setFilter] = useState('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filter === 'income') return t.type === 'income';
      if (filter === 'expense') return t.type === 'expense';
      if (filter === 'saving') return t.type === 'deposit' || t.type === 'withdraw';
      return true;
    });
  }, [transactions, filter]);

  return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {onEditTransaction && (
                    <button 
                      onClick={() => onEditTransaction(tx)}
                      className="btn-delete"
                      style={{ color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.3)' }}
                      title="Edit Transaksi"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                  <button 
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="btn-delete"
                    title="Hapus"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
