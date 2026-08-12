import React, { useState, useMemo } from 'react';

export default function FinanceAllocation({ monthlyIncome = 0, transactions = [], formatIDR, paydayDate = 1, currency = 'IDR', onOpenProfile }) {
  const [showDetails, setShowDetails] = useState(false);
  const [checklist, setChecklist] = useState({
    task1: false,
    task2: false,
    task3: false,
    task4: false,
    task5: false,
    task6: false
  });

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Compute current cycle transactions (Income & Expense Allocation)
  const { totalCycleIncome, spentPokok, spentBebas, spentInvestasi, savedDarurat } = useMemo(() => {
    const now = new Date();
    let cycleStart, cycleEnd;
    const pDate = parseInt(paydayDate);

    if (now.getDate() >= pDate) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, pDate - 1, 23, 59, 59);
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, pDate);
      cycleEnd = new Date(now.getFullYear(), now.getMonth(), pDate - 1, 23, 59, 59);
    }

    let cycleInc = 0;
    let pokok = 0;
    let bebas = 0;
    let investasi = 0;
    let darurat = 0;

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d >= cycleStart && d <= cycleEnd) {
        if (t.type === 'income') {
          cycleInc += t.amount;
        } else if (t.type === 'expense' || t.type === 'deposit') {
          const cat = (t.category || '').toLowerCase();
          if (cat.includes('investasi') || cat.includes('saham') || cat.includes('crypto') || cat.includes('reksa') || cat.includes('emas')) {
            investasi += t.amount;
          } else if (cat.includes('hiburan') || cat.includes('belanja') || cat.includes('gaya')) {
            bebas += t.amount;
          } else if (t.type === 'deposit' || cat.includes('tabungan') || cat.includes('darurat')) {
            darurat += t.amount;
          } else {
            pokok += t.amount;
          }
        }
      }
    });

    return { 
      totalCycleIncome: cycleInc, 
      spentPokok: pokok, 
      spentBebas: bebas, 
      spentInvestasi: investasi, 
      savedDarurat: darurat 
    };
  }, [transactions, paydayDate]);

  // Effective income used for calculations (Profile target or recorded cycle income)
  const income = Math.max(0, monthlyIncome > 0 ? monthlyIncome : totalCycleIncome);
  const pokokLimit = income * 0.50; // 50%
  const bebasLimit = income * 0.05; // 5%
  const investasiLimit = income * 0.30; // 30%
  const daruratLimit = income * 0.15; // 15%

  const currencyLabel = currency === 'IDR' ? 'Rp' : currency;

  return (
    <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* Title & Income Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            Alokasi Keuangan Personal (50 - 5 - 30 - 15)
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Formula Alokasi: 50% Pokok • 5% Bebas • 30% Investasi • 15% Dana Darurat
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.5rem 0.85rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Penghasilan Bulanan</span>
            <strong style={{ fontSize: '1.05rem', color: income > 0 ? 'var(--income-color)' : 'var(--expense-color)' }}>
              {income > 0 ? formatIDR(income) : `0 ${currencyLabel}`}
            </strong>
          </div>
          {onOpenProfile && (
            <button 
              onClick={onOpenProfile}
              className="btn-submit"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', width: 'auto' }}
              title="Atur Penghasilan di Profil"
            >
              {income > 0 ? 'Ubah' : 'Atur Income'}
            </button>
          )}
        </div>
      </div>

      {income === 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--expense-color)', padding: '0.85rem 1rem', borderRadius: '0.75rem', marginBottom: '1.25rem', color: '#f8fafc', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>Penghasilan bulanan belum diatur. Atur di profil untuk mengaktifkan alokasi otomatis.</span>
          {onOpenProfile && (
            <button onClick={onOpenProfile} className="btn-submit" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}>
              Atur Sekarang
            </button>
          )}
        </div>
      )}

      {/* 4 CARDS GRID: 50% POKOK, 5% BEBAS, 30% INVESTASI, 15% DARURAT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* CARD 1: KEBUTUHAN POKOK (50%) */}
        <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#a78bfa' }}>
              Kebutuhan Pokok (50%)
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {formatIDR(pokokLimit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Realisasi: {formatIDR(spentPokok)} / {formatIDR(pokokLimit)}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${income > 0 ? Math.min(100, (spentPokok / (pokokLimit || 1)) * 100) : 0}%`, 
              height: '100%', 
              background: spentPokok > pokokLimit && income > 0 ? 'var(--expense-color)' : '#8b5cf6',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Sewa, listrik, air, transport, makanan dasar, asuransi.
          </span>
        </div>

        {/* CARD 2: KEBUTUHAN BEBAS (5%) */}
        <div style={{ background: 'rgba(236, 72, 153, 0.05)', border: '1px solid rgba(236, 72, 153, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f472b6' }}>
              Kebutuhan Bebas (5%)
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {formatIDR(bebasLimit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Realisasi: {formatIDR(spentBebas)} / {formatIDR(bebasLimit)}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${income > 0 ? Math.min(100, (spentBebas / (bebasLimit || 1)) * 100) : 0}%`, 
              height: '100%', 
              background: spentBebas > bebasLimit && income > 0 ? 'var(--expense-color)' : '#ec4899',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Streaming, dining out, hobi, fashion, jalan-jalan.
          </span>
        </div>

        {/* CARD 3: INVESTASI (30%) */}
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#34d399' }}>
              Investasi (30%)
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {formatIDR(investasiLimit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Realisasi: {formatIDR(spentInvestasi)} / {formatIDR(investasiLimit)}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${income > 0 ? Math.min(100, (spentInvestasi / (investasiLimit || 1)) * 100) : 0}%`, 
              height: '100%', 
              background: '#10b981',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            ETF Global (40%), REIT (30%), Alt/Emas (20%), Edukasi (10%).
          </span>
        </div>

        {/* CARD 4: DANA DARURAT (15%) */}
        <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#22d3ee' }}>
              Dana Darurat (15%)
            </span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            {formatIDR(daruratLimit)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Terkumpul bulan ini: {formatIDR(savedDarurat)}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${income > 0 ? Math.min(100, (savedDarurat / (daruratLimit || 1)) * 100) : 0}%`, 
              height: '100%', 
              background: '#06b6d4',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
            Rekening tabungan likuiditas tinggi (3-6 bulan pengeluaran).
          </span>
        </div>

      </div>

      {/* TOGGLE DETAILS & CHECKLIST */}
      <button 
        onClick={() => setShowDetails(!showDetails)}
        style={{ 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid var(--border-color)', 
          color: 'var(--text-primary)', 
          width: '100%', 
          padding: '0.65rem 1rem', 
          borderRadius: '0.5rem', 
          fontSize: '0.85rem', 
          fontWeight: 600, 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem' 
        }}
      >
        {showDetails ? '▲ Sembunyikan Detail Checklist & Panduan' : '▼ Lihat Checklist Bulanan & Panduan Detail Alokasi'}
      </button>

      {showDetails && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          
          {/* CHECKLIST BULANAN */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-color)' }}>
              Checklist Disiplin Bulanan
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem' }}>
              {[
                { id: 'task1', num: 1, text: 'Catat semua pengeluaran, pastikan persentase masih sesuai target.' },
                { id: 'task2', num: 2, text: 'Transfer alokasi ke rekening masing-masing saat gajian (Pokok, Bebas, Investasi, Darurat).' },
                { id: 'task3', num: 3, text: 'Evaluasi performa investasi; lakukan re-balance jika ada pergeseran > 5%.' },
                { id: 'task4', num: 4, text: 'Isi ulang dana darurat jika saldo di bawah 3 bulan pengeluaran.' },
                { id: 'task5', num: 5, text: 'Review kebutuhan bebas; sesuaikan jika ada perubahan gaya hidup.' },
                { id: 'task6', num: 6, text: 'Setiap 6 bulan, review target return & alokasi aset portofolio.' }
              ].map(item => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={checklist[item.id]} 
                    onChange={() => toggleCheck(item.id)} 
                    style={{ 
                      width: '18px', 
                      height: '18px', 
                      minWidth: '18px', 
                      maxWidth: '18px', 
                      flexShrink: 0, 
                      marginTop: '0.15rem', 
                      cursor: 'pointer', 
                      accentColor: 'var(--accent-color)' 
                    }} 
                  />
                  <span style={{ 
                    background: 'rgba(139, 92, 246, 0.15)', 
                    color: '#a78bfa', 
                    padding: '0.1rem 0.45rem', 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    flexShrink: 0,
                    lineHeight: '1.2'
                  }}>
                    {item.num}
                  </span>
                  <span style={{ 
                    lineHeight: 1.4, 
                    color: checklist[item.id] ? 'var(--text-secondary)' : 'var(--text-primary)', 
                    textDecoration: checklist[item.id] ? 'line-through' : 'none' 
                  }}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* SIMULASI ALOKASI (RUMUS DETAIL) */}
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
            <h4 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--income-color)' }}>
              Pembagian Alokasi Ideal
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>• Kebutuhan Pokok (50%):</strong> {formatIDR(pokokLimit)}
                <div style={{ fontSize: '0.75rem', paddingLeft: '0.75rem' }}>
                  Sewa/Cicilan (30% alokasi = {formatIDR(pokokLimit * 0.3)}), Utilitas/Internet ({formatIDR(pokokLimit * 0.05)}), Makanan Basic ({formatIDR(pokokLimit * 0.05)}), Asuransi ({formatIDR(pokokLimit * 0.05)}).
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>• Kebutuhan Bebas (5%):</strong> {formatIDR(bebasLimit)}
                <div style={{ fontSize: '0.75rem', paddingLeft: '0.75rem' }}>
                  Streaming, dining out, hobi, shopping. Maksimal 5% agar tidak mengganggu investasi.
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>• Investasi (30%):</strong> {formatIDR(investasiLimit)}
                <div style={{ fontSize: '0.75rem', paddingLeft: '0.75rem' }}>
                  ETF Global (40% = {formatIDR(investasiLimit * 0.4)}), Obligasi/REIT (30% = {formatIDR(investasiLimit * 0.3)}), Gold/Crypto (20% = {formatIDR(investasiLimit * 0.2)}), Edukasi (10% = {formatIDR(investasiLimit * 0.1)}).
                </div>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>• Dana Darurat (15%):</strong> {formatIDR(daruratLimit)}
                <div style={{ fontSize: '0.75rem', paddingLeft: '0.75rem' }}>
                  Tabungan likuid dengan bunga minimal 3-4%/thn untuk kondisi tak terduga.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

