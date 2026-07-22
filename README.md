# Money Management

Aplikasi catatan keuangan pribadi berbasis React, Vite, dan Supabase. Bisa catat pemasukan/pengeluaran, kelola banyak dompet sekaligus, pantau cicilan & tagihan, set target tabungan, dan kirim laporan keuangan ke email.

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

- **Anggaran & Tabungan**
  - Pasang batas pengeluaran per kategori, ada peringatan kalau sudah mendekati/melewati batas.
  - Buat beberapa target tabungan sekaligus, bisa setor dan tarik kapan saja.
  - Kalkulasi anggaran mengikuti siklus gajian yang sudah diatur.

- **Analisis Keuangan**
  - Grafik arus kas 6 bulan terakhir dan tren pengeluaran 14 hari.
  - Estimasi rata-rata pengeluaran harian, sisa hari dana bertahan, dan proyeksi bulan depan berdasarkan pola transaksi sebelumnya.
  - Data grafik di dasbor di-reset otomatis sesuai siklus gajian.

- **Ekspor & Laporan**
  - Unduh riwayat transaksi ke CSV, JSON, atau PDF.
  - Kirim laporan keuangan ke email terdaftar — PDF terlampir langsung di inbox.

- **Pengaturan Akun**
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
|---|---|
| Frontend | React 18 + Vite |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Charts | Chart.js via react-chartjs-2 |
| PDF | jsPDF + jspdf-autotable |
| Email | FormSubmit (multipart/form-data) |
| Icons | Lucide React |

---

## Setup

1. Clone repo:
   ```bash
   git clone https://github.com/23Barajapu/money-management.git
   cd money-management
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Buat tabel di **Supabase SQL Editor**:
   ```sql
   -- 1. Transactions
   create table transactions (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     type text not null,
     title text not null,
     amount numeric not null,
     category text not null,
     date date not null,
     payment_method text default 'wallet_cash',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- 2. Installments
   create table installments (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     total_amount numeric not null,
     paid_amount numeric not null default 0,
     monthly_payment numeric not null
   );

   -- 3. Savings Goals
   create table savings_goals (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     goal_name text not null,
     goal_amount numeric not null,
     current_saved numeric not null default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- 4. Budgets
   create table budgets (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     category text not null,
     limit_amount numeric not null,
     unique(user_id, category)
   );

   -- 5. Recurring Transactions
   create table recurring_transactions (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     type text not null,
     title text not null,
     amount numeric not null,
     category text not null,
     payment_method text not null,
     interval text not null,
     last_triggered date not null
   );

   -- 6. Bills
   create table bills (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     amount numeric not null,
     due_date date not null,
     is_paid boolean default false
   );

   -- 7. Wallets
   create table wallets (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     balance numeric not null default 0,
     type text not null
   );

   -- 8. Profiles
   create table profiles (
     user_id uuid primary key references auth.users(id) on delete cascade,
     payday_date integer default 1 check (payday_date >= 1 and payday_date <= 31),
     email_notif boolean default true,
     push_notif boolean default true
   );

   -- Row Level Security
   alter table transactions enable row level security;
   alter table installments enable row level security;
   alter table savings_goals enable row level security;
   alter table budgets enable row level security;
   alter table recurring_transactions enable row level security;
   alter table bills enable row level security;
   alter table wallets enable row level security;
   alter table profiles enable row level security;

   -- Policies
   create policy "Own transactions" on transactions for all using (auth.uid() = user_id);
   create policy "Own installments" on installments for all using (auth.uid() = user_id);
   create policy "Own savings_goals" on savings_goals for all using (auth.uid() = user_id);
   create policy "Own budgets" on budgets for all using (auth.uid() = user_id);
   create policy "Own recurring" on recurring_transactions for all using (auth.uid() = user_id);
   create policy "Own bills" on bills for all using (auth.uid() = user_id);
   create policy "Own wallets" on wallets for all using (auth.uid() = user_id);
   create policy "Own profile" on profiles for all using (auth.uid() = user_id);
   ```

4. Buat file `.env`:
   ```env
   VITE_SUPABASE_URL=URL_SUPABASE_ANDA
   VITE_SUPABASE_ANON_KEY=KEY_ANON_SUPABASE_ANDA
   ```

5. Jalankan:
   ```bash
   npm run dev
   ```
