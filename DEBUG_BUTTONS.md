# 🐛 DEBUG: Button Click Issues

## Masalah
Button Edit, Pause, dan Hapus **tidak berfungsi** di Seller Dashboard.

## Yang Sudah Dilakukan
✅ Menambahkan `type="button"` pada semua button  
✅ Menambahkan `e.preventDefault()` dan `e.stopPropagation()`  
✅ Menambahkan console.log untuk debugging  
✅ Menambahkan test button (purple "Test")  
✅ Menambahkan cursor-pointer class  
✅ Menambahkan try-catch error handling  

## Testing Steps

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Login sebagai Seller
- Buka: http://localhost:3000/login
- Login dengan akun seller
- Navigate ke: http://localhost:3000/seller

### 3. Test Button Purple "Test"
**Lokasi:** Di paling kanan action buttons
**Expected:** Muncul text "✓ CLICK WORKS!" selama 2 detik

**Jika BERHASIL:**
- ✅ onClick event berfungsi
- ✅ React state updates berfungsi
- ✅ Lanjut test button lainnya

**Jika GAGAL:**
- ❌ Ada masalah dengan event handling
- ❌ Kemungkinan ada overlay/z-index issue
- ❌ Atau parent element mencegah clicks

### 4. Open Browser Console
**Windows:** `F12` atau `Ctrl+Shift+I`  
**Mac:** `Cmd+Option+I`

**Tab:** Console

### 5. Test Pause/Aktif Button

**Click button "Pause" atau "Aktif"**

**Console Output yang Diharapkan:**
```
[DEBUG] Pause/Aktif button clicked!
[SellerListingCard] Toggle status clicked for: <listing-id>
[SellerListingCard] Toggle result: { success: true, ... }
```

**Jika Tidak Ada Output:**
- Button onClick tidak ter-trigger
- Ada element yang overlay button (z-index issue)
- Parent container mengblock events

**Jika Ada Output tapi Tidak Update:**
- Server action berhasil
- State update gagal
- Check `onUpdate` callback

### 6. Test Delete Button

**Click button "Hapus"**

**Console Output yang Diharapkan:**
```
[DEBUG] Delete button clicked!
[SellerListingCard] Delete clicked for: <listing-id>
```

**Expected UI:**
- Muncul confirmation dialog
- Text: "Yakin ingin menghapus listing ini? Buyer yang sedang nego..."
- Buttons: "Batal" dan "Konfirmasi"

**Jika Dialog Tidak Muncul:**
- customAlert.confirm() tidak berfungsi
- CustomAlertProvider tidak mounted
- Check `app/layout.tsx`

**Jika Klik "Konfirmasi":**
```
[SellerListingCard] Delete confirmed
[SellerListingCard] Delete result: { success: true }
```

### 7. Test Edit Link

**Click button "Edit"**

**Expected:**
- Navigate ke `/marketplace/<listing-id>/edit`
- Jika page tidak ada, akan 404

---

## Possible Issues & Solutions

### Issue 1: Buttons Tidak Clickable (No Console Output)

**Diagnosis:**
```tsx
// Add this to SellerListingCard component
<div style={{ position: 'relative', zIndex: 100 }}>
  {/* buttons here */}
</div>
```

**Kemungkinan Penyebab:**
- Ada overlay dari parent
- StockManager component menutupi buttons
- CSS positioning issue

**Solution:**
```bash
# Check if element is clickable
# In browser console:
document.elementFromPoint(x, y)  # x, y = button position
```

### Issue 2: Button Clicked tapi Tidak Ada Effect

**Symptoms:**
- Console log muncul
- Tapi UI tidak update
- Atau error di console

**Check:**
1. Server action result
2. `onUpdate()` dan `onDelete()` callbacks
3. Parent component state

**Debug Parent:**
```tsx
// In SellerDashboardContentImproved.tsx
function handleListingDelete(listingId: string) {
  console.log("[PARENT] Deleting listing:", listingId);
  setListingsList((prev) => {
    const filtered = prev.filter((item) => item.id !== listingId);
    console.log("[PARENT] New list length:", filtered.length);
    return filtered;
  });
}
```

### Issue 3: CustomAlert Tidak Muncul

**Check Layout:**
```bash
# Verify CustomAlertProvider is mounted
grep -r "CustomAlertProvider" app/layout.tsx
```

**Expected:**
```tsx
<body>
  <CustomAlertProvider>
    {children}
  </CustomAlertProvider>
</body>
```

**If Missing:**
```tsx
import { CustomAlertProvider } from "@/components/ui/CustomAlert";

// Wrap children
<CustomAlertProvider>{children}</CustomAlertProvider>
```

### Issue 4: Action Fails (Error Response)

**Console Shows:**
```
[SellerListingCard] Toggle result: { success: false, error: "..." }
```

**Possible Errors:**
- "Hanya seller yang dapat mengubah status"
- "Anda tidak memiliki akses ke listing ini"
- "Listing tidak ditemukan"

**Solutions:**
1. Verify session role = "SELLER"
2. Check listing ownership (seller_id matches userId)
3. Check database: listing exists and not deleted

---

## Quick Fixes

### Fix 1: Force Re-render
```tsx
// Add key prop to force remount
<SellerListingCard 
  key={`${listing.id}-${listing.status}-${listing.stock}`}
  listing={listing}
  onDelete={handleListingDelete}
  onUpdate={handleListingUpdate}
/>
```

### Fix 2: Remove Test Button (After Testing)
```tsx
// Remove this block:
{/* Test Button */}
<button
  type="button"
  onClick={handleTestClick}
  className="text-xs px-2 py-1 bg-purple-600 text-white"
>
  Test
</button>
```

### Fix 3: Simplify onClick (If Complex Events Fail)
```tsx
// Instead of:
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleDelete();
}}

// Try:
onClick={handleDelete}
```

---

## Expected Working Flow

### Delete Flow:
1. Click "Hapus" → `[DEBUG] Delete button clicked!`
2. Confirmation dialog appears
3. Click "Konfirmasi" → `[SellerListingCard] Delete confirmed`
4. Server action called → `[SellerListingCard] Delete result: { success: true }`
5. `onDelete(listingId)` called → `[PARENT] Deleting listing: ...`
6. State updates → Card disappears from UI
7. Success alert: "Listing berhasil dihapus"

### Pause/Aktif Flow:
1. Click "Pause" → `[DEBUG] Pause/Aktif button clicked!`
2. Server action called → `[SellerListingCard] Toggle result: { success: true }`
3. `onUpdate(listingId, { status: "PAUSED" })` called
4. State updates → Button text changes to "Aktif"
5. Status badge changes color
6. Success alert: "Listing dipause"

---

## Next Steps After Testing

### If ALL buttons work:
✅ Remove purple "Test" button  
✅ Remove debug console.logs (optional, bisa dibiarkan)  
✅ Remove `testClicked` state  
✅ Clean up code  

### If buttons STILL don't work:
1. Share console output dengan saya
2. Check browser DevTools Elements tab
3. Inspect button element properties
4. Check for CSS pointer-events: none
5. Verify no JavaScript errors before clicking

---

## Rollback (If Needed)

```bash
# If new code breaks something:
git checkout HEAD -- components/seller/SellerListingCard.tsx

# Then manually re-add fixes one by one
```

---

**Status:** 🟡 Waiting for test results  
**Last Updated:** January 2025  
**File:** `components/seller/SellerListingCard.tsx`
