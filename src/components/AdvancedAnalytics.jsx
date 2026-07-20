import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  TrendingUp, 
  Download, 
  Wallet, 
  Globe, 
  Plus, 
  Trash2, 
  RefreshCw, 
  BarChart2, 
  FileText 
} from 'lucide-react';

export default function AdvancedAnalytics({ userId, transactions, cashBalance, cashlessBalance, balance, formatIDR }) {
  // Wallet States
  const [wallets, setWallets] = useState([]);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('cash'); // cash, cashless
  const [walletBalance, setWalletBalance] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  // Currency Converter States
  const [exchangeRates, setExchangeRates] = useState({});
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [currencyLoading, setCurrencyLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
    fetchExchangeRates();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase.from('wallets').select('*');
      if (error) throw error;
      setWallets(data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err.message);
    }
  };

  const fetchExchangeRates = async () => {
    setCurrencyLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/IDR');
      const data = await res.json();
      if (data && data.rates) {
        setExchangeRates(data.rates);
      }
    } catch (err) {
      console.error('Error fetching rates:', err.message);
    } finally {
      setCurrencyLoading(false);
    }
  };

  // Add Wallet
  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!walletName || !walletBalance) return;
    setWalletLoading(true);

    const newWallet = {
      id: Date.now().toString(),
      user_id: userId,
      name: walletName,
      type: walletType,
      balance: parseFloat(walletBalance)
    };

    try {
      const { error } = await supabase.from('wallets').insert(newWallet);
      if (error) throw error;
      setWalletName('');
      setWalletBalance('');
      fetchWallets();
      // Reload page to reflect wallet balance in parent if needed
      window.location.reload();
    } catch (err) {
      alert('Gagal menambah dompet: ' + err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  // Delete Wallet
  const handleDeleteWallet = async (id) => {
    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
      fetchWallets();
      window.location.reload();
    } catch (err) {
      alert('Gagal menghapus dompet: ' + err.message);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Tipe', 'Judul', 'Nominal', 'Kategori', 'Tanggal', 'Metode Pembayaran'];
    const rows = transactions.map(t => [
      t.id,
      t.type,
      t.title,
      t.amount,
      t.category,
      t.date,
      t.payment_method || 'cash'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `laporan_keuangan_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF (optimized for mobile/iOS & Android)
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Laporan Transaksi Keuangan", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 26);
    doc.text(`Total Saldo: Rp ${balance.toLocaleString('id-ID')}`, 14, 32);

    // Table Columns & Rows
    const tableColumn = ["Tanggal", "Judul", "Kategori", "Tipe", "Metode", "Nominal (Rp)"];
    const tableRows = [];

    transactions.forEach(t => {
      const rowData = [
        t.date,
        t.title,
        t.category,
        t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : t.type === 'deposit' ? 'Setor Tabungan' : t.type === 'withdraw' ? 'Tarik Tabungan' : 'Transfer',
        t.payment_method === 'cashless' ? 'Cashless' : 'Cash',
        t.amount.toLocaleString('id-ID')
      ];
      tableRows.push(rowData);
    });

    // Auto Table Plugin
    doc.autoTable({
      startY: 38,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        5: { halign: 'right' }
      }
    });

    doc.save(`laporan_keuangan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // AI Trend Spending Analysis
  const aiTrend = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const recentExpenses = transactions.filter(t => t.type === 'expense' && t.date >= thirtyDaysAgoStr);
    const totalRecent = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const dailyAverage = totalRecent / 30;

    let daysRemaining = 'N/A';
    if (dailyAverage > 0) {
      daysRemaining = Math.max(Math.round(balance / dailyAverage), 0);
    }

    return {
      dailyAverage,
      daysRemaining,
      totalRecent
    };
  }, [transactions, balance]);

  // Convert Balances
  const convertedValues = useMemo(() => {
    const rate = exchangeRates[targetCurrency] || 0;
    return {
      total: balance * rate,
      cash: cashBalance * rate,
      cashless: cashlessBalance * rate
    };
  }, [exchangeRates, targetCurrency, balance, cashBalance, cashlessBalance]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      
      {/* AI TREND PREDICTION & SPENDING REPORT */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-color)' }} /> Prediksi & Analisis Tren Keuangan (AI)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rata-rata Pengeluaran / Hari (30 Hari Terakhir)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatIDR(aiTrend.dailyAverage)}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prediksi Saldo Habis Dalam</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.25rem', color: aiTrend.daysRemaining < 10 ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {aiTrend.daysRemaining === 'N/A' ? 'N/A' : `${aiTrend.daysRemaining} Hari`}
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          *Analisis berbasis pengeluaran riil Anda. Menjaga pola pengeluaran di bawah rata-rata akan meningkatkan ketahanan saldo Anda.
        </p>
      </div>

      {/* CURRENCY CONVERTER */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Globe size={20} style={{ color: 'var(--saving-color)' }} /> Konversi Mata Uang Asing
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem' }}>Pilih Mata Uang:</span>
          <select 
            value={targetCurrency} 
            onChange={(e) => setTargetCurrency(e.target.value)}
            style={{ width: 'auto', padding: '0.5rem', background: '#0b0f19', borderRadius: '0.5rem' }}
          >
            <option value="USD">USD (Dolar AS)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="SGD">SGD (Dolar Singapura)</option>
            <option value="JPY">JPY (Yen Jepang)</option>
          </select>
          {currencyLoading && <RefreshCw size={14} className="animate-spin" />}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Saldo ({targetCurrency})</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {targetCurrency} {convertedValues.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saldo Cash ({targetCurrency})</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {targetCurrency} {convertedValues.cash.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cashless ({targetCurrency})</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {targetCurrency} {convertedValues.cashless.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM WALLET MANAGEMENT */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={20} style={{ color: 'var(--income-color)' }} /> Kelola Dompet Kustom (Multi-Wallet)
        </h2>
        
        <form onSubmit={handleAddWallet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              placeholder="Nama Dompet (e.g. Gopay, Bank Mandiri)"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="number"
              placeholder="Saldo Awal (Rp)"
              value={walletBalance}
              onChange={(e) => setWalletBalance(e.target.value)}
              required
              min="0"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select value={walletType} onChange={(e) => setWalletType(e.target.value)} required>
              <option value="cash">Cash (Tunai)</option>
              <option value="cashless">Cashless (Digital)</option>
            </select>
          </div>
          <button type="submit" className="btn-submit" disabled={walletLoading} style={{ margin: 0, padding: '0 1rem' }}>
            <Plus size={18} />
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {wallets.length === 0 ? (
            <div className="empty-state">Belum ada dompet kustom tambahan.</div>
          ) : (
            wallets.map(w => (
              <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Wallet size={16} style={{ color: w.type === 'cashless' ? 'var(--saving-color)' : 'var(--income-color)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{w.name} ({w.type === 'cashless' ? 'Digital' : 'Tunai'})</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saldo: {formatIDR(w.balance)}</div>
                  </div>
                </div>
                <button onClick={() => handleDeleteWallet(w.id)} className="btn-delete" style={{ padding: '0.25rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EXPORT DATA ACTIONS */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={20} style={{ color: 'var(--accent-color)' }} /> Ekspor Laporan Keuangan & Backup
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
          <button onClick={exportToCSV} className="btn-submit" style={{ margin: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'white' }}>
            <FileText size={18} style={{ marginRight: '0.5rem' }} /> Ekspor CSV
          </button>
          <button onClick={exportToJSON} className="btn-submit" style={{ margin: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'white' }}>
            <FileText size={18} style={{ marginRight: '0.5rem' }} /> Ekspor JSON
          </button>
          <button onClick={exportToPDF} className="btn-submit" style={{ margin: 0, background: 'var(--accent-color)', color: 'white' }}>
            <Download size={18} style={{ marginRight: '0.5rem' }} /> Ekspor PDF
          </button>
        </div>
      </div>

    </div>
  );
}
