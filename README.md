# Money Management 💰

Aplikasi web manajemen keuangan premium berbasis **React + Vite** yang terintegrasi dengan **Supabase Cloud Database & Auth** untuk sinkronisasi multi-device real-time. Didesain dengan estetika modern menggunakan konsep *Glassmorphism* dan navigasi responsif yang ramah pengguna mobile.

---

## 🚀 Fitur Utama

- **📊 Dashboard Keuangan Lengkap**: 
  - Grafik visual dinamis (Doughnut & Bar Chart) menggunakan Chart.js untuk menganalisis alur kas dan kategori pengeluaran.
  - Pemisahan 3 jenis saldo di dashboard: **Total Saldo** (Seluruh uang), **Saldo Cash** (Uang tunai), dan **Saldo Cashless** (Uang digital/transfer).
- **💸 Pencatatan Multi-Metode**: Input transaksi pemasukan & pengeluaran dengan penentuan metode pembayaran (Cash atau Cashless).
- **🔄 Mutasi & Transfer Saldo**: Fitur pemindahan uang dari **Cash ke Cashless** atau **Cashless ke Cash** secara real-time yang memutasi saldo secara presisi tanpa memengaruhi Total Saldo utama.
- **🐷 Target Tabungan**: Menentukan tujuan keuangan, melacak persentase pencapaian target, dan melakukan simulasi setor/tarik saldo tabungan.
- **💳 Manajemen Cicilan**: Melacak sisa cicilan/utang, menginput jangka waktu tenor (bulan), dan menghitung otomatis total kewajiban serta opsi pembayaran kustom/bulanan.
- **🔐 Cloud Sync & Auth**: Sistem masuk akun aman menggunakan email/password maupun **Google Sign-In (OAuth)** dengan kebijakan keamanan Row Level Security (RLS) di Supabase.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite
- **Database & Auth**: Supabase (PostgreSQL)
- **Visualisasi**: Chart.js, react-chartjs-2
- **Styling**: Pure CSS (Glassmorphism & Fully Responsive Mobile Navigation)
- **Ikon**: Lucide React

---

## ⚙️ Cara Setup Proyek Lokal

### 1. Klon Repositori
```bash
git clone https://github.com/23Barajapu/money-management.git
cd money-management
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Database Supabase
Buat tabel-tabel berikut di **SQL Editor** pada Supabase Dashboard Anda:

```sql
-- Tabel Transaksi
create table transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null, -- 'income', 'expense', 'deposit', 'withdraw', 'transfer'
  title text not null,
  amount numeric not null,
  category text not null,
  date date not null,
  payment_method text default 'cash', -- 'cash', 'cashless'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabel Tabungan
create table savings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal_name text not null,
  goal_amount numeric not null,
  current_saved numeric not null default 0
);

-- Tabel Cicilan
create table installments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  total_amount numeric not null,
  paid_amount numeric not null default 0,
  monthly_payment numeric not null
);

-- Aktifkan Row Level Security (RLS)
alter table transactions enable row level security;
alter table savings enable row level security;
alter table installments enable row level security;

-- Buat Kebijakan RLS (Policy)
create policy "User can view/manage own transactions" on transactions for all using (auth.uid() = user_id);
create policy "User can view/manage own savings" on savings for all using (auth.uid() = user_id);
create policy "User can view/manage own installments" on installments for all using (auth.uid() = user_id);
```

### 4. Konfigurasi Environment Variables (`.env`)
Buat file bernama `.env` di root direktori proyek, lalu isi dengan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=URL_SUPABASE_ANDA
VITE_SUPABASE_ANON_KEY=KEY_ANON_SUPABASE_ANDA
```

### 5. Jalankan Server Lokal
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.
