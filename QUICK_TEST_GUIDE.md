# Quick Test Guide - New Features

## 🚀 Quick Start

1. **Run Database Migration First:**
   ```bash
   # Option 1: Using Supabase CLI
   supabase migration up
   
   # Option 2: Manual SQL in Supabase Studio
   # Go to SQL Editor and run:
   ALTER TABLE marketplace_listings 
   ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 1;
   
   UPDATE marketplace_listings 
   SET stock = 1 
   WHERE stock IS NULL;
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

3. **Open:** http://localhost:3000

---

## ✅ Feature 1: Active Navbar Highlighting

### Test as BUYER:
1. Login with buyer account
2. Navigate between pages:
   - `/marketplace` → "Katalog Lokal" should be **bright green + bold**
   - `/dashboard` → "Buyer Hub" should be **bright green + bold**
   - `/negotiations` → "Negosiasi" should be **bright green + bold**
   - `/escrow` → "Escrow" should be **bright green + bold**
3. Check: Inactive links should be gray, active link is green (#39FF14)

### Test as SELLER:
1. Login with seller account
2. Navigate between pages:
   - `/seller` → "Seller Hub" should be **bright green + bold**
   - `/negotiations` → "Negosiasi" should be **bright green + bold**
   - `/escrow` → "Escrow" should be **bright green + bold**
3. Check: Active link highlights correctly on each page

### Test as OWNER:
1. Login with owner/midman account
2. Navigate between pages:
   - `/owner` → "Midman Dashboard" should be **golden yellow + bold** (#FFB800)
   - `/marketplace` → "Katalog Lokal" should be **golden yellow + bold**
3. Check: Owner uses gold color, not green

**Expected Result:** ✅ Active page link is always highlighted with bold text and colored icon

---

## ✅ Feature 2: Stock Management in Seller Dashboard

### Setup:
1. Login as **SELLER**
2. Go to `/seller`
3. Make sure you have at least 1 listing (if not, click "Pasang Iklan Baru")

### Test Stock +/- Buttons:
1. Find any product card in "PRODUCTS" tab
2. Look for stock display (e.g., "Stok: 5")
3. Click **pencil icon** (Edit Stock) → Edit mode activates
4. Click **[+]** button → stock increases by 1
5. Click **[-]** button → stock decreases by 1
6. Click **[✓]** (Save) → Changes are saved, card exits edit mode
7. Click **[×]** (Cancel) → Changes are discarded

**Expected Result:** ✅ Stock updates immediately without page refresh

### Test Sold Out Status:
1. Click stock **[-]** until stock = 0
2. Card should show **"SOLD OUT"** badge (grayed out)
3. Try to increase stock again → badge disappears when stock > 0

**Expected Result:** ✅ SOLD OUT badge appears when stock = 0

### Test Delete Listing:
1. Click **trash icon** (Delete) on any listing
2. Confirmation dialog appears with warning:
   > "Produk ini akan dihapus permanen. Jika ada negosiasi aktif, pembeli akan menerima notifikasi..."
3. Click "Hapus" → Listing disappears from dashboard
4. Check: No error messages

**Expected Result:** ✅ Listing deleted with proper warning

### Test Pause/Resume:
1. Find an ACTIVE listing
2. Click "Jeda" button → Status changes to PAUSED
3. Click "Aktifkan" button → Status changes back to ACTIVE

**Expected Result:** ✅ Status toggles correctly

---

## ✅ Feature 3: SOLD OUT Badge in Marketplace

### Setup:
1. As seller, set one listing's stock to 0 (follow steps above)
2. Logout
3. Visit `/marketplace` (as guest or buyer)

### Test SOLD OUT Overlay:
1. Find the product with stock = 0
2. Product card should have:
   - **Dark overlay** covering entire image
   - **Large "SOLD OUT"** text in red
   - **Rotated -12 degrees** for dramatic effect
   - **"STOK HABIS"** subtitle
3. Try clicking the card → Still opens product detail page
4. On detail page, negotiate button should be disabled

**Expected Result:** ✅ SOLD OUT overlay is clearly visible and dramatic

### Test Low Stock Warning:
1. As seller, set a listing's stock to 2 or 3
2. Visit `/marketplace`
3. Product card should show:
   - **Yellow badge** in bottom-right corner
   - **"Tersisa X"** text
   - **Pulse animation** (badge should fade in/out)

**Expected Result:** ✅ Low stock warning is visible and animated

### Test Normal Stock:
1. Products with stock > 3 → No badges
2. Products with stock = null → Treated as stock = 1 (default)

**Expected Result:** ✅ No badge for products with sufficient stock

---

## ✅ Feature 4: Escrow Grouping (Already Fixed)

### Test:
1. Login as seller with multiple escrow sessions
2. Go to `/escrow`
3. Check: Each BUYER should appear only **once** (no duplicates)
4. If you have multiple items with same buyer → Shows count badge

**Expected Result:** ✅ No duplicate buyer cards

---

## ✅ Feature 5: Delete Listing Error Handling

### Test Active Negotiation Scenario:
1. **As Seller:**
   - Create a listing
   - Note the listing ID

2. **As Buyer (different account):**
   - Visit the listing
   - Click "Mulai Nego"
   - Send a bid

3. **Back to Seller:**
   - Go to `/seller`
   - Delete the listing
   - Confirmation shows warning about negotiators

4. **Back to Buyer:**
   - Try to access negotiation
   - Should see error or "Product not found" message

**Expected Result:** ✅ Buyer is notified that product was deleted

---

## 🎨 Visual Checklist

### Navbar Colors:
- Buyer/Seller: **#39FF14** (Neon green)
- Owner: **#FFB800** (Golden yellow)
- Inactive: **#888888** (Gray)

### Stock Badges:
- Sold Out: **#FF3B30** (Red) + large text
- Low Stock: **#FFB800** (Yellow/Orange) + pulse
- Normal: No badge

### Button States:
- Primary: **#39FF14** (Green)
- Danger: **#FF3B30** (Red)
- Ghost: **Transparent** with border

---

## 🐛 Common Issues & Solutions

### Issue: Stock buttons don't work
**Solution:** Make sure migration ran successfully
```bash
# Check if column exists
supabase db pull
# Should see 'stock' column in marketplace_listings
```

### Issue: SOLD OUT badge not showing
**Solution:** 
1. Check browser console for errors
2. Verify listing.stock = 0 in database
3. Clear browser cache and reload

### Issue: Navbar highlight not changing
**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Check if usePathname is working: `console.log(pathname)`
3. Verify Next.js router is initialized

### Issue: Delete confirmation not showing
**Solution:** Check if CustomAlert component is working:
```tsx
import { customConfirm } from "@/components/ui/CustomAlert";
```

---

## 📊 Success Indicators

### ✅ All Features Working:
- [x] Navbar highlights active page correctly
- [x] Navbar uses role-based colors
- [x] Stock can be edited inline in seller dashboard
- [x] SOLD OUT badge appears on marketplace
- [x] Low stock warning shows for stock ≤ 3
- [x] Delete shows confirmation with warning
- [x] Escrow groups by user (no duplicates)
- [x] Build completes without errors

### ⚠️ Partial Working:
- [ ] Some features work but not all
- [ ] Intermittent errors
- [ ] UI glitches

### ❌ Not Working:
- [ ] Build fails
- [ ] Critical runtime errors
- [ ] Database connection issues

---

## 🚨 Emergency Rollback

If something breaks:

```bash
# Rollback database migration
supabase migration down

# Or manually remove column
ALTER TABLE marketplace_listings DROP COLUMN IF EXISTS stock;

# Restore previous code (if in git)
git checkout HEAD~1 -- app/seller/SellerDashboardContentImproved.tsx
git checkout HEAD~1 -- components/seller/
git checkout HEAD~1 -- app/marketplace/MarketplaceExplorer.tsx
```

---

## 📞 Need Help?

1. Check `IMPLEMENTATION_SUMMARY.md` for technical details
2. Review error messages in browser console
3. Check Network tab for failed API calls
4. Verify database schema matches migration

---

**Happy Testing! 🚀**
