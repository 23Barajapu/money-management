# Money Management

Aplikasi catatan keuangan pribadi berbasis React, Vite, dan Supabase. Bisa catat pemasukan/pengeluaran, kelola banyak dompet sekaligus, pantau cicilan & tagihan, set target tabungan, dan kirim laporan keuangan ke email.

---

## Overview Tampilan (UI Preview)

![Dashboard Overview](./docs/dashboard-preview.png)

---

## Fitur

- **Pencatatan Transaksi**
  - Catat pemasukan, pengeluaran, transfer antar dompet, setoran dan penarikan tabungan.
  - Filter riwayat per jenis transaksi.

- **Multi-Wallet**
  - Buat dompet sendiri — Gopay, OVO, rekening bank, atau apapun.
  - Transfer saldo antar dompet, saldo masing-masing dompet dihitung otomatis dari riwayat transaksi.

- **Tagihan & Cicilan**
  - Catat tagihan rutin dengan tanggal jatuh tempo, tandai sudah/belum bayar.
  - Lacak cicilan panjang — lihat progres pembayaran dan cicilan tersisa.
  - Transaksi berulang (harian/mingguan/bulanan) dicatat otomatis tiap login.
  - Pilih dompet mana yang dipakai saat bayar tagihan atau cicilan.
  - **Notifikasi Tagihan (H-5)**: Indikator lonceng interaktif di navbar yang otomatis mengingatkan tagihan yang mendekati jatuh tempo ($\le 5$ hari) beserta popover detail.

- **Multi-Language (Auto Device Language)**
  - Otomatis menyesuaikan bahasa antarmuka web dengan bahasa perangkat pengguna (*Bahasa Indonesia / English*).
  - Dilengkapi opsi *override* manual pada menu profil.

- **Anggaran & Tabungan**
  - **Alokasi Keuangan 50-5-30-15**: Kalkulasi otomatis alokasi keuangan ideal (50% Kebutuhan Pokok, 5% Kebutuhan Bebas, 30% Investasi, 15% Dana Darurat) berdasarkan penghasilan bulanan, lengkap dengan indikator realisasi transaksi & checklist disiplin bulanan.
  - Pasang batas pengeluaran per kategori, ada peringatan kalau sudah mendekati/melewati batas.
  - Buat beberapa target tabungan sekaligus dengan tanggal target deadline & opsi setor/tarik custom.
  - Kalkulasi anggaran mengikuti siklus gajian yang sudah diatur.

- **Analisis Keuangan**
  - Grafik arus kas 6 bulan terakhir dan tren pengeluaran 14 hari.
  - Estimasi rata-rata pengeluaran harian, sisa hari dana bertahan, dan proyeksi bulan depan berdasarkan pola transaksi sebelumnya.
  - Data grafik di dasbor di-reset otomatis sesuai siklus gajian.

- **Ekspor & Laporan**
  - Unduh riwayat transaksi ke CSV, JSON, atau PDF.
  - Kirim laporan keuangan ke email terdaftar — PDF terlampir langsung di inbox.

- **Pengaturan Akun**
  - Atur **Penghasilan Bersih Bulanan** pada profil sebagai acuan dasar alokasi keuangan 50-5-30-15.
  - Atur tanggal gajian (1–31) untuk menyesuaikan periode kalkulasi anggaran dan dasbor.
  - Reset sandi via link email dari Supabase.
  - Kelola preferensi notifikasi email dan push.

- **Keamanan**
  - Sesi otomatis logout setelah 1 menit tidak ada aktivitas.
  - Semua data terisolasi per akun dengan Row Level Security (RLS) Supabase.
  - Zero native browser popup — semua notifikasi pakai komponen UI sendiri.

---

## Tech Stack

| Layer | Library |
| --- | --- |
| Frontend | React 18 + Vite |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Charts | Chart.js via react-chartjs-2 |
| PDF | jsPDF + jspdf-autotable |
| Email | FormSubmit (multipart/form-data) |
| Icons | Lucide React |

---
