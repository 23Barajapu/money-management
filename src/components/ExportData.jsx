import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';

export default function ExportData({ transactions, balance, cashBalance, cashlessBalance, formatIDR }) {
  
  // 1. Export to CSV
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Judul', 'Jenis', 'Kategori', 'Metode Pembayaran', 'Nominal'];
    const rows = transactions.map(t => [
      t.date,
      t.title,
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : t.type === 'deposit' ? 'Setoran Tabungan' : t.type === 'withdraw' ? 'Penarikan Tabungan' : 'Transfer',
      t.category,
      t.payment_method || 'cash',
      t.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export to JSON
  const exportToJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Backup_Data_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
  };

  // 3. Export to PDF (Optimized for Mobile/Print)
  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    // Title & Header Info
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(139, 92, 246); // Brand primary color (purple)
    doc.text('LAPORAN KEUANGAN PERSONAL', 14, 20);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Tanggal Cetak: ${today}`, 14, 26);
    doc.text('Aplikasi: Money Management', 14, 31);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);

    // Balance Summary Box
    doc.setFillColor(15, 23, 42); // slate 900
    doc.rect(14, 40, 182, 32, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // secondary
    doc.text('RINGKASAN SALDO SAAT INI', 20, 48);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Total: ${formatIDR(balance)}`, 20, 58);
    
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11); // orange
    doc.text(`Cash: ${formatIDR(cashBalance)}`, 20, 66);
    
    doc.setTextColor(16, 185, 129); // green
    doc.text(`Cashless: ${formatIDR(cashlessBalance)}`, 90, 66);

    // Transaction History Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('RIWAYAT TRANSAKSI TERAKHIR', 14, 82);

    // Prepare table columns and rows
    const tableColumn = ['Tanggal', 'Deskripsi', 'Kategori', 'Metode', 'Jenis', 'Nominal'];
    const tableRows = transactions.map(t => [
      t.date,
      t.title,
      t.category,
      t.payment_method === 'cashless' ? 'Cashless' : 'Cash',
      t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : t.type === 'deposit' ? 'Simpan' : t.type === 'withdraw' ? 'Tarik' : 'Transfer',
      formatIDR(t.amount)
    ]);

    // Render Table using jsPDF-AutoTable
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 87,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }, // Purple primary header
      styles: { fontSize: 8, font: 'Helvetica' },
      columnStyles: {
        5: { fontStyle: 'bold', halign: 'right' }
      }
    });

    // Save/Download PDF (safely works on iOS and Android browsers)
    doc.save(`Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Download size={20} color="var(--accent-color)" />
        Ekspor & Cadangkan Data
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        Unduh seluruh catatan keuangan Anda ke perangkat lokal untuk analisis spreadsheet, cadangan cadangan, atau cetak laporan PDF resmi.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <button onClick={exportToCSV} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'var(--income-color)', color: 'var(--income-color)' }}>
          <FileSpreadsheet size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Ekspor CSV</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Buka di Excel / Spreadsheet</span>
        </button>

        <button onClick={exportToPDF} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--expense-color)', color: 'var(--expense-color)' }}>
          <FileText size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Ekspor PDF</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Format Laporan Cetak Resmi</span>
        </button>

        <button onClick={exportToJSON} className="btn-toggle active" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.05)', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}>
          <FileJson size={24} />
          <strong style={{ fontSize: '0.9rem' }}>Cadangkan JSON</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>File Backup Restore Supabase</span>
        </button>
      </div>
    </div>
  );
}
