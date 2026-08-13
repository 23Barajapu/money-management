import React from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Filler,
  LineController,
  BarController
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChevronDown, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Filler,
  LineController,
  BarController
);

export default function DashboardCharts({ transactions = [], paydayDate = 1, formatIDR, budgets = [], t = (k) => k }) {
  const currentYear = new Date().getFullYear();
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Calculate monthly income and expense for the current year
  const monthlyIncome = monthLabels.map((_, idx) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === idx && t.type === 'income';
      })
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const monthlyExpense = monthLabels.map((_, idx) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === idx && (t.type === 'expense' || t.type === 'deposit');
      })
      .reduce((sum, t) => sum + t.amount, 0);
  });

  const comboChartData = {
    labels: monthLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Pemasukan',
        data: monthlyIncome,
        backgroundColor: '#10b981', // Emerald Teal
        borderRadius: 5,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        type: 'bar',
        label: 'Pengeluaran',
        data: monthlyExpense,
        backgroundColor: '#f97316', // Coral Orange
        borderRadius: 5,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        type: 'line',
        label: 'Tren Pemasukan',
        data: monthlyIncome,
        borderColor: '#14b8a6', // Bright Teal line
        borderWidth: 2.5,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: '#14b8a6',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const comboChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11, weight: '500' },
          usePointStyle: true,
          boxWidth: 8,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { 
          color: '#64748b', 
          font: { family: 'Inter', size: 11 },
          callback: (value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
            return value;
          }
        }
      }
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t('incomeVsExpenses')}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('interactiveIncomes')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <span>{t('thisYear')}, {currentYear}</span>
          <ChevronDown size={14} />
        </div>
      </div>

      <div style={{ height: '300px', width: '100%', position: 'relative' }}>
        <Chart type="bar" data={comboChartData} options={comboChartOptions} />
      </div>
    </div>
  );
}
