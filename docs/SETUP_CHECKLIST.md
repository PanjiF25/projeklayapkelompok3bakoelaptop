# ✅ Quick Setup Checklist - Product Approval Workflow

Ikuti langkah-langkah ini untuk mengaktifkan approval workflow:

---

## 🚀 Setup (5-10 menit)

### ☑️ Step 1: Create Admin User
- [ ] Buka `firebase-admin-setup.html` di browser
- [ ] Click "Buat Akun Admin"
- [ ] Screenshot konfirmasi sukses
- [ ] **Result:** Admin user dengan email `admin@bakoelaptop.com` terbuat

### ☑️ Step 2: Update Security Rules
- [ ] Buka [Firebase Console](https://console.firebase.google.com)
- [ ] Navigate: Firestore Database → Rules tab
- [ ] Buka file `FIRESTORE_SECURITY_RULES.md`
- [ ] Copy rules dari section "Security Rules (Copy ini)"
- [ ] Paste ke Firebase Console
- [ ] Click **Publish**
- [ ] Wait for "Rules published successfully"
- [ ] **Result:** Security rules aktif, melindungi data

### ☑️ Step 3: Test as Seller (Regular User)
- [ ] Logout jika sedang login sebagai admin
- [ ] Register user baru atau login user existing
- [ ] Go to **Sell page** (sell.html)
- [ ] Fill form dan submit produk:
  ```
  Nama: Test Laptop
  Kategori: Laptop
  Harga: 5000000
  Kondisi: Bekas - Mulus
  Spesifikasi: Test specs
  Stok: 1
  Upload gambar
  ```
- [ ] Tunggu success message: "Produk berhasil dikirim! Menunggu persetujuan admin..."
- [ ] Go to **Buy page** (buy.html)
- [ ] **✅ Verify:** Produk TIDAK muncul (masih pending)

### ☑️ Step 4: Test as Admin
- [ ] Logout
- [ ] Login dengan:
  ```
  Email: admin@bakoelaptop.com
  Password: admin123
  ```
- [ ] Go to **Admin Dashboard** (admin.html)
- [ ] **✅ Verify:** Dashboard terbuka (bukan redirect ke index)
- [ ] Click menu **"Pending Approval"** di sidebar
- [ ] **✅ Verify:** Produk test muncul dengan detail lengkap
- [ ] **✅ Verify:** Badge counter show "1"
- [ ] Click **"Setujui"** button
- [ ] Confirm approval
- [ ] **✅ Verify:** Success message muncul
- [ ] **✅ Verify:** Produk hilang dari pending list
- [ ] **✅ Verify:** Badge counter jadi "0"
- [ ] Check Dashboard stats:
  - Total Produk: 1+
  - Produk Pending: 0
  - Produk Disetujui: 1+

### ☑️ Step 5: Verify Buy Page
- [ ] Logout dari admin
- [ ] Login sebagai user regular (atau tanpa login)
- [ ] Go to **Buy page**
- [ ] **✅ Verify:** Produk test SEKARANG MUNCUL
- [ ] **✅ Verify:** Harga, gambar, specs tampil dengan benar

### ☑️ Step 6: Test Reject Flow
- [ ] Login sebagai regular user
- [ ] Submit produk baru dari Sell page
- [ ] Logout, login sebagai admin
- [ ] Go to Pending Approval
- [ ] Click **"Tolak"** pada produk baru
- [ ] Confirm rejection
- [ ] Go to Buy page
- [ ] **✅ Verify:** Produk yang ditolak TIDAK muncul

---

## 🔒 Security Verification

### Test 1: Non-admin Cannot Access Dashboard
- [ ] Login sebagai regular user (bukan admin)
- [ ] Coba akses `admin.html`
- [ ] **✅ Expected:** Redirect ke index.html atau error "Akses Ditolak"

### Test 2: Cannot Manually Approve Product
- [ ] Login sebagai regular user
- [ ] Open browser console (F12)
- [ ] Run command:
  ```javascript
  firebase.firestore().collection('products').doc('PRODUCT_ID').update({status: 'approved'})
  ```
  (Replace PRODUCT_ID with actual ID dari Firestore Console)
- [ ] **✅ Expected:** Error "Missing or insufficient permissions"

### Test 3: Cannot Read Pending Products
- [ ] Login sebagai regular user
- [ ] Open browser console
- [ ] Run command:
  ```javascript
  firebase.firestore().collection('products').where('status','==','pending').get().then(snap => console.log(snap.size))
  ```
- [ ] **✅ Expected:** Returns `0` (even if there are pending products)

---

## 🐛 Common Issues & Fixes

### Issue 1: "Permission denied" when approving
**Fix:**
1. Check user has `role: 'admin'` in Firestore:
   - Firebase Console → Firestore → users → [admin_uid]
   - Add field: `role` = `admin` (string)
2. Re-login as admin
3. Try again

### Issue 2: Products still visible without approval
**Fix:**
1. Check buy.html line ~174 has:
   ```javascript
   .where('status', '==', 'approved')
   .where('sold', '==', false)
   ```
2. Check existing products have `status` field
3. Manually add `status: 'approved'` to old products in Firestore Console

### Issue 3: Admin dashboard redirects to index
**Fix:**
1. Clear browser cache/cookies
2. Check console for errors
3. Verify Firebase initialized successfully
4. Check user document has `role: 'admin'`

### Issue 4: Pending count badge not showing
**Fix:**
1. Check admin.html has:
   ```html
   <span id="pending-count" class="badge">0</span>
   ```
2. Check admin.js calls `loadPendingProducts()` on init
3. Refresh page

### Issue 5: Composite index error
**Fix:**
1. Click the link in error message
2. Or create manually:
   - Firebase Console → Firestore → Indexes
   - Collection: `products`
   - Fields:
     - `status` Ascending
     - `sold` Ascending  
     - `createdAt` Descending
3. Wait for index to build (~1-2 minutes)

---

## 📋 Post-Setup Tasks

### Immediate (Do Now)
- [ ] Change admin password melalui profile page
- [ ] Update WhatsApp number di `sell.html` line 227 jika perlu
- [ ] Test dengan produk riil (bukan test data)
- [ ] Screenshot workflow untuk dokumentasi

### Before Production
- [ ] Remove/comment test products dari Firestore
- [ ] Verify all security rules aktif
- [ ] Test di multiple browsers (Chrome, Firefox, Safari)
- [ ] Test di mobile devices
- [ ] Prepare admin training materials

### Optional Enhancements
- [ ] Add "Mark as Sold" button di admin products list
- [ ] Add filter: Show All / Pending / Approved / Rejected
- [ ] Add search/filter di pending products
- [ ] Add email notifications for approval/rejection
- [ ] Create seller dashboard to track own products

---

## 📊 Success Metrics

After setup, you should have:
- ✅ Admin user with role='admin' in Firestore
- ✅ Security rules published and active
- ✅ Sellers can submit products (status=pending)
- ✅ Pending products NOT visible in Buy page
- ✅ Admin can see and approve/reject products
- ✅ Approved products visible in Buy page
- ✅ Rejected products hidden from Buy page
- ✅ Non-admin users cannot access admin dashboard
- ✅ Non-admin users cannot modify product status

---

## 🎯 Next Steps

After completing this checklist:

1. **Migrate Cart to Firebase**
   - Create cart collection (per-user)
   - Update cart.js to use Firestore
   - Test add/remove/checkout flow

2. **Migrate Orders**
   - Create orders collection
   - Track purchase history
   - Admin can manage orders

3. **Enhanced Admin Panel**
   - View all products with filters
   - Edit products inline
   - Mark products as sold
   - View order history

4. **Notifications**
   - Email to seller on approve/reject
   - WhatsApp integration
   - Admin alerts for new submissions

---

## 📞 Need Help?

If stuck, check:
1. Browser console for errors (F12)
2. Firebase Console → Firestore → Data (verify documents)
3. Firebase Console → Authentication (verify users)
4. Network tab (check failed requests)
5. `APPROVAL_WORKFLOW_GUIDE.md` for detailed troubleshooting

---

**Setup Time Estimate:** 5-10 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Easy-Medium)  
**Prerequisites:** Firebase project with Authentication & Firestore enabled

---

## ✅ Completion

When all checkboxes are ticked:
- **Status:** 🟢 Approval Workflow ACTIVE
- **Ready for:** Testing with real users
- **Next:** Add more admin features or migrate cart/orders

**Selamat! Approval workflow sudah aktif! 🎉**
