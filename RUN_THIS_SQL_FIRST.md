# ⚠️ WAJIB JALANKAN SQL INI DULU!

## 🚨 PENTING: Database Migration Required

Sebelum menjalankan `npm run dev`, kamu **WAJIB** menjalankan SQL migration ini dulu di Supabase.

Tanpa ini, fitur **Stock Management** tidak akan berfungsi karena kolom `stock` belum ada di database.

---

## 📍 Cara Menjalankan SQL

### Opsi 1: Supabase Dashboard (RECOMMENDED)

1. **Buka Supabase Dashboard:**  
   https://app.supabase.com/

2. **Pilih Project PIXMART**

3. **Klik "SQL Editor"** (di sidebar kiri)

4. **Klik "New Query"**

5. **Copy-paste SQL di bawah ini:**

```sql
-- Add stock column to marketplace_listings
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;

-- Set default stock = 1 for existing listings
UPDATE marketplace_listings 
SET stock = 1 
WHERE stock IS NULL;

-- Add comment to column
COMMENT ON COLUMN marketplace_listings.stock IS 'Jumlah stok barang tersedia. 0 = SOLD OUT';
```

6. **Klik "Run" (atau Ctrl+Enter)**

7. **Cek output:**
   - Kalau sukses: `Success. No rows returned`
   - Kalau error: Baca pesan error dan lapor ke dev

---

### Opsi 2: Supabase CLI

Jika kamu pakai Supabase CLI:

```bash
# Pastikan sudah login
supabase login

# Jalankan migration
supabase migration up

# Atau manual push
supabase db push
```

---

## ✅ Verifikasi Migration Berhasil

### 1. Check di Supabase Table Editor

1. Buka **Table Editor** → **marketplace_listings**
2. Scroll ke kolom paling kanan
3. Harus ada kolom baru: **`stock`** (type: `int4`, default: `1`)

### 2. Check dengan SQL Query

Jalankan query ini di SQL Editor:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'marketplace_listings'
  AND column_name = 'stock';
```

**Expected Output:**
```
column_name | data_type | column_default
------------|-----------|----------------
stock       | integer   | 1
```

### 3. Check Existing Data

```sql
SELECT id, title, stock, status
FROM marketplace_listings
LIMIT 10;
```

**Expected:**
- Semua listing yang sudah ada harus punya `stock = 1`
- Listing baru juga otomatis `stock = 1`

---

## 🐛 Troubleshooting

### Error: "column already exists"

**Penyebab:** Kolom `stock` sudah ada  
**Solusi:** Skip migration ini, lanjut ke testing

```sql
-- Check apakah column sudah ada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'marketplace_listings' 
  AND column_name = 'stock';

-- Jika ada, cukup update null values
UPDATE marketplace_listings 
SET stock = 1 
WHERE stock IS NULL;
```

### Error: "permission denied"

**Penyebab:** User database tidak punya permission ALTER TABLE  
**Solusi:** Login sebagai admin/owner Supabase project

### Error: "relation marketplace_listings does not exist"

**Penyebab:** Table belum dibuat atau salah database  
**Solusi:**
1. Verify kamu di project yang benar
2. Check apakah table `marketplace_listings` ada:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'marketplace_listings';
   ```

---

## 📦 What This Migration Does

### 1. Adds `stock` Column
```sql
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;
```

- **Type:** INTEGER (whole number)
- **Default:** 1 (1 unit available)
- **Nullable:** NO (always has value)

### 2. Updates Existing Records
```sql
UPDATE marketplace_listings 
SET stock = 1 
WHERE stock IS NULL;
```

- Sets stock = 1 for all existing listings
- Prevents null values

### 3. Adds Documentation
```sql
COMMENT ON COLUMN marketplace_listings.stock IS 'Jumlah stok barang tersedia. 0 = SOLD OUT';
```

- Adds helpful comment to schema
- Visible in Supabase Table Editor

---

## 🎯 After Running Migration

### Test the Stock Feature:

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Login as Seller**

3. **Go to `/seller` Dashboard**

4. **Click Edit Stock (+/-) buttons**
   - Should update immediately
   - No errors in console

5. **Set stock = 0**
   - Card should show "SOLD OUT" badge

6. **Go to `/marketplace`**
   - Product with stock = 0 should show red SOLD OUT overlay

7. **Refresh page**
   - Stock value should persist (not reset to 1)

---

## 🚀 Related Features

This migration enables:

✅ **Stock CRUD** - Add, edit, delete stock  
✅ **SOLD OUT Badge** - Red overlay in marketplace  
✅ **Low Stock Warning** - Yellow "Tersisa X" badge  
✅ **Auto-decrease Stock** - When buyer purchases (future)  
✅ **Stock History** - Track changes (future)  

---

## 📝 Migration File Location

```
supabase/migrations/20240116000000_add_stock_column.sql
```

Kalau pakai Supabase CLI, migration sudah ada di folder ini.

---

## ❓ FAQ

### Q: Apa yang terjadi kalau saya skip migration ini?

**A:** Error! Feature stock management akan crash:
- Edit stock button tidak berfungsi
- SOLD OUT badge tidak muncul
- Console error: `column "stock" does not exist`

### Q: Apakah data listing saya akan hilang?

**A:** TIDAK! Migration ini hanya **menambah kolom baru**, tidak menghapus data apapun.

### Q: Apa saya perlu rollback kalau ada masalah?

**A:** Bisa, tapi tidak perlu. Rollback command:
```sql
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS stock;
```

### Q: Berapa lama migration ini?

**A:** < 1 detik. Sangat cepat karena cuma add column.

### Q: Apakah migration ini affect production?

**A:** Tergantung database mana yang kamu run. Kalau di production Supabase, iya. Kalau di local dev, tidak.

---

## ✅ Checklist

Sebelum lanjut development:

- [ ] SQL migration sudah dijalankan
- [ ] Kolom `stock` muncul di Table Editor
- [ ] Existing listings punya `stock = 1`
- [ ] No SQL errors
- [ ] `npm run dev` jalan tanpa error
- [ ] Button stock CRUD berfungsi
- [ ] SOLD OUT badge muncul di marketplace

---

**Status:** 🔴 BELUM DIJALANKAN  
**Priority:** ⚠️ CRITICAL - WAJIB SEBELUM TESTING  
**Duration:** < 1 minute  
**Risk:** LOW (hanya add column, tidak delete data)

---

## 🆘 Need Help?

Kalau ada masalah:
1. Check console error message
2. Screenshot error + share
3. Verify Supabase project URL correct
4. Check database connection

---

**Happy Coding! 🚀**
