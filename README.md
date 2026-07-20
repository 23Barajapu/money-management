# Money Management

Aplikasi pencatatan keuangan pribadi menggunakan React, Vite, dan Supabase.

## Fitur
* **Dashboard**: Menampilkan total saldo, saldo tunai (cash), dan saldo digital (cashless). Ada juga visualisasi chart pengeluaran.
* **Pencatatan Transaksi**: Catat pemasukan dan pengeluaran dengan pilihan metode pembayaran (cash / cashless).
* **Transfer Saldo**: Fitur untuk memindahkan uang dari cash ke cashless atau sebaliknya.
* **Tabungan**: Buat target tabungan dan catat setoran/penarikan tabungan.
* **Cicilan**: Catat tenor cicilan bulanan dan bayar cicilan langsung memotong saldo utama.
* **Autentikasi**: Login menggunakan Email atau Google OAuth via Supabase.

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

3. Setup tabel di Supabase SQL Editor:
   ```sql
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

   create table savings (
     user_id uuid primary key references auth.users(id) on delete cascade,
     goal_name text not null,
     goal_amount numeric not null,
     current_saved numeric not null default 0
   );

   create table installments (
     id text primary key,
     user_id uuid references auth.users(id) on delete cascade,
     name text not null,
     total_amount numeric not null,
     paid_amount numeric not null default 0,
     monthly_payment numeric not null
   );

   alter table transactions enable row level security;
   alter table savings enable row level security;
   alter table installments enable row level security;

   create policy "User can view/manage own transactions" on transactions for all using (auth.uid() = user_id);
   create policy "User can view/manage own savings" on savings for all using (auth.uid() = user_id);
   create policy "User can view/manage own installments" on installments for all using (auth.uid() = user_id);
   ```

4. Buat file `.env` di root folder:
   ```env
   VITE_SUPABASE_URL=URL_SUPABASE_ANDA
   VITE_SUPABASE_ANON_KEY=KEY_ANON_SUPABASE_ANDA
   ```

5. Jalankan lokal development server:
   ```bash
   npm run dev
   ```
