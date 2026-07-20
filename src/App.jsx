import React, { useState, useEffect } from 'react';
import { PiggyBank, ArrowUpCircle, ArrowDownCircle, Trash2, Wallet, RefreshCw } from 'lucide-react';
import TransactionForm from './components/TransactionForm';
import SavingsTracker from './components/SavingsTracker';
import DashboardCharts from './components/DashboardCharts';
import InstallmentTracker from './components/InstallmentTracker';

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('momanage_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [savings, setSavings] = useState(() => {
    const saved = localStorage.getItem('momanage_savings');
    return saved ? JSON.parse(saved) : { goalName: '', goalAmount: 0, currentSaved: 0 };
  });

  const [installments, setInstallments] = useState(() => {
    const saved = localStorage.getItem('momanage_installments');
    return saved ? JSON.parse(saved) : [];
  });

  const [filter, setFilter] = useState('all'); // 'all', 'income', 'expense', 'saving'

  useEffect(() => {
    localStorage.setItem('momanage_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('momanage_savings', JSON.stringify(savings));
  }, [savings]);

  useEffect(() => {
    localStorage.setItem('momanage_installments', JSON.stringify(installments));
  }, [installments]);

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdraw')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense - totalDeposits + totalWithdrawals;
  const currentSaved = totalDeposits - totalWithdrawals;

  // Sync savings.currentSaved with transactions ledger
  useEffect(() => {
    if (savings.currentSaved !== currentSaved) {
      setSavings(prev => ({ ...prev, currentSaved }));
    }
  }, [currentSaved]);

  const handleAddTransaction = (newTx) => {
    setTransactions(prev => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateSavings = (updatedSavings, transactionAmount, type) => {
    // If a deposit or withdrawal occurred, add to transactions ledger
    if (transactionAmount && type) {
      const newTx = {
        id: Date.now().toString(),
        type, // 'deposit' or 'withdraw'
        title: type === 'deposit' ? `Setoran: ${updatedSavings.goalName}` : `Penarikan: ${updatedSavings.goalName}`,
        amount: transactionAmount,
        category: 'Tabungan',
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions(prev => [newTx, ...prev]);
    }
    setSavings(updatedSavings);
  };

  const handleAddInstallment = (newInst) => {
    setInstallments(prev => [...prev, newInst]);
  };

  const handleDeleteInstallment = (id) => {
    setInstallments(prev => prev.filter(i => i.id !== id));
  };

  const handlePayInstallment = (id, amount) => {
    setInstallments(prev => prev.map(inst => {
      if (inst.id === id) {
        return { ...inst, paidAmount: inst.paidAmount + amount };
      }
      return inst;
    }));
    const targetInst = installments.find(i => i.id === id);
    const newTx = {
      id: Date.now().toString(),
      type: 'expense',
      title: `Bayar Cicilan: ${targetInst.name}`,
      amount: amount,
      category: 'Cicilan',
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const resetData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data?')) {
      setTransactions([]);
      setSavings({ goalName: '', goalAmount: 0, currentSaved: 0 });
      setInstallments([]);
    }
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'income') return t.type === 'income';
    if (filter === 'expense') return t.type === 'expense';
    if (filter === 'saving') return t.type === 'deposit' || t.type === 'withdraw';
    return true;
  });

  return (
    <div className="app-container">
      <header>
        <h1>Money <span>Management</span></h1>
        <button 
          onClick={resetData}
          className="btn-filter"
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--expense-color)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <RefreshCw size={14} /> Reset Data
        </button>
      </header>

      {/* Summary Cards */}
      <div className="dashboard-summary">
        <div className="card summary-card">
          <span className="summary-label">
            <Wallet size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
            Saldo Utama
          </span>
          <span className="summary-value">{formatIDR(balance)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">
            <ArrowUpCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--income-color)' }} />
            Total Pemasukan
          </span>
          <span className="summary-value income">{formatIDR(totalIncome)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">
            <ArrowDownCircle size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--expense-color)' }} />
            Total Pengeluaran
          </span>
          <span className="summary-value expense">{formatIDR(totalExpense)}</span>
        </div>
        <div className="card summary-card">
          <span className="summary-label">
            <PiggyBank size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle', color: 'var(--saving-color)' }} />
            Tabungan
          </span>
          <span className="summary-value saving">{formatIDR(currentSaved)}</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="main-grid">
        {/* Left Column */}
        <div className="grid-column">
          <TransactionForm onAddTransaction={handleAddTransaction} />
          
          {/* History List */}
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
                      <span className="item-meta">{tx.category} • {tx.date}</span>
                    </div>
                    <div className="item-amount-action">
                      <span className={`item-amount ${
                        tx.type === 'income' ? 'income' : 
                        tx.type === 'expense' ? 'expense' : 
                        tx.type === 'deposit' ? 'expense' : 'income'
                      }`}>
                        {tx.type === 'income' || tx.type === 'withdraw' ? '+' : '-'} {formatIDR(tx.amount)}
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

        {/* Right Column */}
        <div className="grid-column">
          <SavingsTracker 
            savings={savings} 
            onUpdateSavings={handleUpdateSavings} 
            balance={balance} 
          />
          <InstallmentTracker 
            installments={installments}
            onAddInstallment={handleAddInstallment}
            onDeleteInstallment={handleDeleteInstallment}
            onPayInstallment={handlePayInstallment}
            balance={balance}
          />
          <DashboardCharts transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
