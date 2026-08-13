import { useMemo } from 'react';

export function usePaydayCycle(transactions = [], paydayDate = 1) {
  return useMemo(() => {
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

    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        const d = new Date(t.date);
        if (d >= cycleStart && d <= cycleEnd) {
          if (t.type === 'income') {
            cycleInc += t.amount;
          } else if (t.type === 'expense' || t.type === 'deposit') {
            const cat = (t.category || '').toLowerCase();
            if (cat.includes('investasi') || cat.includes('saham') || cat.includes('crypto') || cat.includes('reksa') || cat.includes('emas') || cat.includes('edukasi') || cat.includes('kursus')) {
              investasi += t.amount;
            } else if (cat.includes('hiburan') || cat.includes('belanja') || cat.includes('gaya') || cat.includes('dining') || cat.includes('hobi') || cat.includes('jajan')) {
              bebas += t.amount;
            } else if (t.type === 'deposit' || cat.includes('tabungan') || cat.includes('darurat')) {
              darurat += t.amount;
            } else {
              pokok += t.amount;
            }
          }
        }
      });
    }

    return { 
      totalCycleIncome: cycleInc, 
      spentPokok: pokok, 
      spentBebas: bebas, 
      spentInvestasi: investasi, 
      savedDarurat: darurat,
      cycleStart,
      cycleEnd
    };
  }, [transactions, paydayDate]);
}
