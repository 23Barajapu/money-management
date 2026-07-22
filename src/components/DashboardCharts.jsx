import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Filler);

export default function DashboardCharts({ transactions, paydayDate = 1 }) {
  const isDateInCurrentPaydayCycle = (dateStr, pDate = 1) => {
    const txDate = new Date(dateStr);
    const now = new Date();
    
    let cycleStart, cycleEnd;
    const pd = parseInt(pDate);
    
    if (now.getDate() >= pd) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), pd);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, pd - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, pd);
      cycleEnd = new Date(now.getFullYear(), now.getMonth(), pd - 1, 23, 59, 59);
    }
    
    return txDate >= cycleStart && txDate <= cycleEnd;
  };

  // Filter transactions for current payday cycle
  const currentCycleTx = transactions.filter(t => isDateInCurrentPaydayCycle(t.date, paydayDate));

  // Expense by Category (Doughnut)
  const expenses = currentCycleTx.filter(t => t.type === 'expense');
  const expenseCategories = [...new Set(expenses.map(t => t.category))];
  const expenseDataByCategory = expenseCategories.map(cat => 
    expenses.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  );

  // Income vs Expense (Bar)
  const totalIncome = currentCycleTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const doughnutData = {
    labels: expenseCategories.length > 0 ? expenseCategories : ['Belum Ada Pengeluaran'],
    datasets: [
      {
        data: expenseDataByCategory.length > 0 ? expenseDataByCategory : [1],
        backgroundColor: expenseCategories.length > 0 ? [
          '#ef4444', // Merah
          '#f59e0b', // Oranye
          '#3b82f6', // Biru
          '#ec4899', // Pink
          '#8b5cf6', // Ungu
          '#10b981', // Hijau
        ] : ['rgba(255,255,255,0.05)'],
        borderColor: 'rgba(30, 41, 59, 0.8)',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 }
        }
      }
    },
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false
  };

  const barData = {
    labels: ['Pemasukan', 'Pengeluaran'],
    datasets: [
      {
        label: 'Total (Rp)',
        data: [totalIncome, totalExpense],
        backgroundColor: ['#10b981', '#ef4444'],
        borderRadius: 6,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    }
  };

  return (
    <div className="charts-grid">
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Kategori Pengeluaran</h2>
        <div style={{ height: '220px', position: 'relative' }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Arus Keuangan</h2>
        <div style={{ height: '220px', position: 'relative' }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
