# Money Management

Aplikasi pencatatan keuangan pribadi premium dengan analitik AI, budgeting, multi-wallet, dan otomatisasi tagihan berbasis React, Vite, dan Supabase.

---

## Fitur Utama

- **Pusat Profil & Pengaturan (PRD 2)**:
  - **Siklus Gajian (Payday Cycle)**: Sesuaikan batas awal perhitungan budget bulanan Anda secara kustom (contoh: tanggal 25).
  - **Keamanan**: Integrasi email ubah sandi via Supabase OTP.
  - **Notifikasi**: Preferensi toggle notifikasi tagihan via Email dan Web Push.
  
- **Multi-Wallet Management**:
  - Buat dompet/rekening kustom sendiri (seperti Gopay, OVO, Bank Mandiri).
  - Pilihan dompet dinamis saat mencatat transaksi dan fitur transfer saldo antar dompet kustom.

- **Anggaran & Tabungan**:
  - **Limit Anggaran**: Batasi pengeluaran per kategori per bulan dengan notifikasi peringatan jika melebihi batas.
  - **Multi-Goals Savings**: Buat banyak target tabungan khusus sekaligus dengan kontrol mutasi setor/tarik.

- **Tagihan & Cicilan**:
  - **Transaksi Berulang**: Scheduler otomatis untuk mencatat pengeluaran berkala secara harian, mingguan, atau bulanan.
  - **Pengingat Tagihan**: Melacak jatuh tempo pembayaran dengan pintasan bayar cepat.
  - **Pelacak Cicilan**: Visualisasi progres pembayaran cicilan jangka panjang.

- **Analisis Lanjut & AI**:
  - Laporan komparatif arus kas bulanan & grafik tren pengeluaran 14 hari terakhir.
  - Prediksi saldo aman harian, sisa hari dana habis, dan proyeksi pengeluaran bulan depan.

- **Konversi Valuta Otomatis**:
  - Pilihan mata uang dinamis (IDR, USD, EUR, SGD) terintegrasi API nilai tukar terbaru.

- **Ekspor Data & Cadangan**:
  - Ekspor riwayat transaksi instan ke format **CSV**, **JSON**, dan **PDF resmi** (dioptimalkan untuk mobile browser iOS & Android).

---

## Cara Install & Menjalankan

1. Klon repositori:
   ```bash
   git clone https://github.com/23Barajapu/money-management.git
   cd money-management
   ```

2. Install dependensi:
   ```bash
   npm install
   ```

3. Setup skema database lengkap di **Supabase SQL Editor**:
   ```sql
   -- 1. Transactions Table
   create table transactions (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     type text not null, -- 'income', 'expense', 'deposit', 'withdraw', 'transfer'
     title text not null,
     amount numeric not null,
     category text not null,
     date date not null,
     payment_method text default 'wallet_cash',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- 2. Installments Table
   create table installments (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     total_amount numeric not null,
     paid_amount numeric not null default 0,
     monthly_payment numeric not null
   );

   -- 3. Savings Goals Table
   create table savings_goals (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     goal_name text not null,
     goal_amount numeric not null,
     current_saved numeric not null default 0,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- 4. Budgets Table
   create table budgets (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     category text not null,
     limit_amount numeric not null,
     unique(user_id, category)
   );

   -- 5. Recurring Transactions Table
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

   -- 6. Bills Table
   create table bills (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     amount numeric not null,
     due_date date not null,
     is_paid boolean default false
   );

   -- 7. Wallets Table
   create table wallets (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     balance numeric not null default 0,
     type text not null
   );

   -- 8. Profiles Table
   create table profiles (
     user_id uuid primary key references auth.users(id) on delete cascade,
     payday_date integer default 1 check (payday_date >= 1 and payday_date <= 31),
     email_notif boolean default true,
     push_notif boolean default true
   );

   -- RLS Configuration
   alter table transactions enable row level security;
   alter table installments enable row level security;
   alter table savings_goals enable row level security;
   alter table budgets enable row level security;
   alter table recurring_transactions enable row level security;
   alter table bills enable row level security;
   alter table wallets enable row level security;
   alter table profiles enable row level security;

   -- RLS Policies
   create policy "Own transactions" on transactions for all using (auth.uid() = user_id);
   create policy "Own installments" on installments for all using (auth.uid() = user_id);
   create policy "Own savings_goals" on savings_goals for all using (auth.uid() = user_id);
   create policy "Own budgets" on budgets for all using (auth.uid() = user_id);
   create policy "Own recurring" on recurring_transactions for all using (auth.uid() = user_id);
   create policy "Own bills" on bills for all using (auth.uid() = user_id);
   create policy "Own wallets" on wallets for all using (auth.uid() = user_id);
   create policy "Own profile" on profiles for all using (auth.uid() = user_id);
   ```

4. Buat file `.env` di root folder:
   ```env
   VITE_SUPABASE_URL=URL_SUPABASE_ANDA
   VITE_SUPABASE_ANON_KEY=KEY_ANON_SUPABASE_ANDA
   ```

5. Jalankan server lokal:
   ```bash
   npm run dev
   ```
