import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { TrendingUp, Award, AlertCircle, Compass } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdvancedAnalytics({ transactions, balance, formatIDR }) {
  // 1. Calculate Monthly Cash Flow (last 6 months)
  const monthlyFlow = React.useMemo(() => {
    const months = [];
    const incomeData = [];
    const expenseData = [];

    // Get last 6 months list
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = d.toLocaleString('id-ID', { month: 'short' });
      months.push(mName);

      // Filter transactions for this month
      const mTx = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getFullYear() === d.getFullYear() && txDate.getMonth() === d.getMonth();
      });

      const inc = mTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = mTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(inc);
      expenseData.push(exp);
    }

    return { labels: months, income: incomeData, expense: expenseData };
  }, [transactions]);

  // 2. Daily/Weekly Expense Trend (last 14 days)
  const dailyTrend = React.useMemo(() => {
    const labels = [];
    const data = [];

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dLabel = d.toLocaleString('id-ID', { day: 'numeric', month: 'short' });
      labels.push(dLabel);

      const dayExp = transactions
        .filter(t => t.type === 'expense' && t.date === dStr)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push(dayExp);
    }

    return { labels, data };
  }, [transactions]);

  // 3. AI/Trend Predictions
  const predictions = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
      return {
        dailyAvg: 0,
        daysRemaining: 'Infinity',
        nextMonthEst: 0,
        advice: 'Belum ada catatan pengeluaran untuk dianalisis. Silakan masukkan transaksi pengeluaran.'
      };
    }

    // Get unique expense days in the last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentExpenses = expenses.filter(t => new Date(t.date) >= thirtyDaysAgo);
    const totalRecent = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    // Average daily expense based on 30 days interval
    const dailyAvg = totalRecent / 30;

    // Remaining days prediction
    const daysRemaining = dailyAvg > 0 ? Math.floor(balance / dailyAvg) : 'Tak Terbatas';

    // Projected next month expense
    const nextMonthEst = dailyAvg * 30;

    // Financial advice logic
    let advice = 'Pengeluaran Anda dalam batas wajar. Pertahankan kebiasaan menabung Anda!';
    if (dailyAvg > 0) {
      const recentIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= thirtyDaysAgo)
        .reduce((sum, t) => sum + t.amount, 0);

      const savingsRate = recentIncome > 0 ? ((recentIncome - totalRecent) / recentIncome) * 100 : 0;

      if (savingsRate < 10) {
        advice = 'Peringatan: Rasio tabungan bulanan Anda di bawah 10%. Kurangi pengeluaran kategori Hiburan / Belanja agar sisa saldo Anda lebih aman.';
      } else if (savingsRate >= 30) {
        advice = 'Hebat! Anda menabung lebih dari 30% pendapatan Anda. Pertimbangkan mengalokasikan dana ke Target Tabungan Khusus.';
      }

      if (daysRemaining < 10 && balance > 0) {
        advice = 'Kritis: Dengan pengeluaran harian rata-rata Anda saat ini, saldo Anda diprediksi akan habis dalam waktu kurang dari 10 hari!';
      }
    }

    return { dailyAvg, daysRemaining, nextMonthEst, advice };
  }, [transactions, balance]);

  // Chart configuration
  const barData = {
    labels: monthlyFlow.labels,
    datasets: [
      {
        label: 'Pemasukan',
        data: monthlyFlow.income,
        backgroundColor: '#10b981',
        borderRadius: 4,
      },
      {
        label: 'Pengeluaran',
        data: monthlyFlow.expense,
        backgroundColor: '#ef4444',
        borderRadius: 4,
      }
    ]
  };

  const lineData = {
    labels: dailyTrend.labels,
    datasets: [
      {
        label: 'Pengeluaran Harian (Rp)',
        data: dailyTrend.data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#8b5cf6',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      
      {/* AI SUGGESTION & STATS CARD */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(15, 23, 42, 0.4) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          <Compass size={20} color="var(--accent-color)" />
          Prediksi Asisten AI
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rata-rata Pengeluaran Harian</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{formatIDR(predictions.dailyAvg)}</h3>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sisa Hari Saldo Aman</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700, color: predictions.daysRemaining < 10 ? 'var(--expense-color)' : 'var(--income-color)' }}>
              {predictions.daysRemaining} Hari
            </h3>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimasi Pengeluaran Bulan Depan</span>
            <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.2rem', fontWeight: 700 }}>{formatIDR(predictions.nextMonthEst)}</h3>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid var(--accent-color)' }}>
          <Award size={20} color="var(--accent-color)" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>
            {predictions.advice}
          </p>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid">
        {/* CHART 1: MONTHLY CASH FLOW */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--income-color)" />
            Arus Kas 6 Bulan Terakhir
          </h3>
          <div style={{ height: '260px' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* CHART 2: DAILY EXPENSE TREND */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent-color)" />
            Tren Pengeluaran 14 Hari Terakhir
          </h3>
          <div style={{ height: '260px' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>
      </div>

    </div>
  );
}
