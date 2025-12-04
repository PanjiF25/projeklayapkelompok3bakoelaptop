# 💳 Payment Workflow & Approval System

## 📋 Overview

Sistem payment confirmation dengan admin approval untuk BAKOELAPTOP. User upload bukti pembayaran, admin verifikasi, dan produk otomatis ditandai sebagai terjual setelah approval.

---

## 🔄 Workflow

### 1️⃣ User: Checkout & Upload Bukti Pembayaran

**Di halaman Cart (`cart.html`):**
1. User klik tombol **"Proceed to Checkout"**
2. Pilih metode pembayaran (Transfer BCA, BRI, Mandiri, Dana, dll)
3. Upload bukti pembayaran (screenshot/foto transfer)
4. Klik **"Konfirmasi Pembayaran"**

**Yang terjadi:**
- Order disimpan ke Firestore `orders` collection dengan:
  ```javascript
  {
    userId: "user-uid",
    userEmail: "user@email.com",
    customerName: "John Doe",
    customerPhone: "08123456789",
    shippingAddress: "Jl. Example No. 123",
    items: [
      {
        productId: "product-id",
        name: "Laptop ASUS ROG",
        price: 15000000,
        imageURL: "..."
      }
    ],
    total: 15000000,
    paymentMethod: "Transfer BCA",
    paymentProof: "base64-image-string",
    paymentStatus: "pending",      // 👈 Status awal
    orderStatus: "processing",
    createdAt: Timestamp,
    updatedAt: Timestamp
  }
  ```
- Cart dikosongkan
- User diarahkan untuk cek status di **My Orders**

### 2️⃣ User: Track Payment Status

**Di halaman Profile → My Orders (`profile.html`):**
- User bisa melihat semua order dengan status:
  - **🕒 Pending Verification** - Menunggu admin verifikasi
  - **✅ Payment Approved** - Payment disetujui, order diproses
  - **❌ Payment Rejected** - Payment ditolak dengan alasan

**Fitur:**
- Filter orders by status (tabs)
- View payment proof yang sudah diupload
- Lihat rejection reason jika ditolak
- Real-time update status

### 3️⃣ Admin: Review & Approve Payment

**Di Admin Dashboard → Orders (`admin.html`):**
1. Admin melihat list orders yang masuk
2. Filter by payment status (Pending/Approved/Rejected)
3. Klik order untuk melihat detail:
   - Customer info
   - Product items
   - Payment method
   - **Payment proof image**
   - Total amount

**Approve Payment:**
1. Admin verifikasi bukti pembayaran
2. Klik **"Approve Payment"**
3. Sistem otomatis:
   - Update `paymentStatus: "approved"`
   - Update semua produk di order: `status: "sold"`
   - Produk hilang dari halaman Buy
   - User menerima notifikasi approval

**Reject Payment:**
1. Admin klik **"Reject Payment"**
2. Masukkan alasan penolakan (wajib):
   - "Bukti pembayaran tidak valid"
   - "Nominal tidak sesuai"
   - "Transfer belum masuk"
3. Sistem update:
   - `paymentStatus: "rejected"`
   - `rejectionReason: "alasan dari admin"`
   - User melihat alasan di My Orders

---

## 🗂️ Database Structure

### `orders` Collection

```javascript
orders/{orderId}
  ├─ userId: string              // User ID pembeli
  ├─ userEmail: string           // Email user
  ├─ customerName: string        // Nama lengkap
  ├─ customerPhone: string       // No HP
  ├─ shippingAddress: string     // Alamat lengkap
  ├─ items: array                // Array produk
  │    ├─ productId: string
  │    ├─ name: string
  │    ├─ price: number
  │    └─ imageURL: string
  ├─ total: number               // Total harga
  ├─ paymentMethod: string       // BCA/BRI/Mandiri/Dana/etc
  ├─ paymentProof: string        // Base64 image
  ├─ paymentStatus: string       // pending/approved/rejected
  ├─ orderStatus: string         // processing/shipped/delivered
  ├─ rejectionReason?: string    // Optional, jika rejected
  ├─ createdAt: Timestamp
  └─ updatedAt: Timestamp
```

### `products` Collection (Updated)

```javascript
products/{productId}
  ├─ name: string
  ├─ price: number
  ├─ status: string              // approved/pending/rejected/sold 👈 NEW
  ├─ soldAt?: Timestamp          // 👈 NEW - Timestamp ketika approved
  └─ ...other fields
```

---

## 🔒 Firestore Security Rules

```javascript
match /orders/{orderId} {
  // Users can read their own orders, admin can read all
  allow read: if isOwner(resource.data.userId) || isAdmin();
  
  // Users can create their own orders
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  
  // Only admin can update orders (approve/reject)
  allow update: if isAdmin();
  
  // Only admin can delete orders
  allow delete: if isAdmin();
}
```

---

## 📄 Files Modified

### 1. `cart.html`
- **Function `processPaymentWithProof()`** - Updated to save to Firestore
- Save order dengan `paymentStatus: "pending"`
- Clear cart setelah submit
- Show success message dengan link ke My Orders

### 2. `firebase-db.js`
- **New function:** `updatePaymentStatus(orderId, status, reason)`
  - Update payment status
  - Auto-mark products as sold when approved
  - Use Firestore batch update

### 3. `profile.html`
- **Merged** "Order History" & "Order Status" → **"My Orders"**
- Added tabs: All Orders / Pending / Approved / Rejected
- Single section untuk tracking orders

### 4. `profile.js`
- **New function:** `initMyOrders()` - Initialize orders section
- **New function:** `loadUserOrders()` - Load dari Firestore
- **New function:** `displayOrders()` - Render order cards with status
- **New function:** `viewPaymentProof(orderId)` - Show proof in modal
- Display rejection reason if status = rejected

### 5. `profile.css`
- **New styles:** `.order-card`, `.order-header`, `.order-items`
- **New styles:** `.order-item`, `.order-footer`
- **New styles:** `.view-proof-btn`, `.total-amount`
- Responsive design for mobile/tablet

### 6. `admin.html`
- Updated order filter options:
  - All Orders / Pending Payment / Payment Approved / Payment Rejected

### 7. `script/admin.js`
- **Updated:** `loadOrders()` - Load from Firestore with paymentStatus filter
- **Updated:** `viewOrderDetail()` - Show payment proof & approval buttons
- **New function:** `approvePayment(orderId)` - Approve dengan confirm
- **New function:** `rejectPayment(orderId)` - Reject dengan reason input modal

### 8. `buy.html`
- **Updated:** Product filter - Skip products with `status === "sold"`
- Products dengan payment approved otomatis hidden

### 9. `README.md`
- Added payment workflow documentation
- Updated feature list

---

## 🎯 User Journey

### Customer Journey:
```
1. Browse Products (buy.html)
   ↓
2. Add to Cart
   ↓
3. Checkout (cart.html)
   ↓
4. Upload Payment Proof
   ↓
5. Track Status (profile.html → My Orders)
   ↓
6. Wait for Admin Approval
   ↓
7a. ✅ APPROVED → Order Processed
7b. ❌ REJECTED → See Reason, Upload Again
```

### Admin Journey:
```
1. Login to Admin Dashboard
   ↓
2. Go to Orders Section
   ↓
3. Filter by "Pending Payment"
   ↓
4. Click Order to View Details
   ↓
5. View Payment Proof
   ↓
6a. ✅ APPROVE → Products marked as sold
6b. ❌ REJECT → Enter reason for customer
```

---

## 🧪 Testing Checklist

### As User:
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Select payment method
- [ ] Upload payment proof (image file)
- [ ] Confirm payment
- [ ] Check "My Orders" section
- [ ] See order with "Pending Verification" status
- [ ] Click "View Proof" to see uploaded image

### As Admin:
- [ ] Login to admin dashboard
- [ ] Go to Orders section
- [ ] See pending orders
- [ ] Click order to view detail
- [ ] See payment proof image
- [ ] Click "Approve Payment"
- [ ] Verify products marked as sold in Products section
- [ ] Verify products hidden from Buy page
- [ ] Test "Reject Payment" with reason
- [ ] Verify user sees rejection reason in My Orders

### Integration:
- [ ] After approval, product disappears from buy.html
- [ ] User sees "Payment Approved" in My Orders
- [ ] Rejection reason visible to user
- [ ] Multiple orders work correctly
- [ ] Firestore security rules prevent unauthorized access

---

## 🚀 Deployment Notes

1. **Update Firestore Rules** (pastikan `orders` collection included)
2. **Test payment flow** end-to-end
3. **Test admin approval** workflow
4. **Verify product visibility** after approval
5. **Test rejection** workflow dengan reason

---

## 📞 Support

Jika ada masalah:
1. Cek console browser (F12) untuk error
2. Cek Firestore rules sudah benar
3. Pastikan user sudah login
4. Verify Firebase config benar

---

**Update:** December 2024  
**Version:** 2.0 - Payment Approval System
