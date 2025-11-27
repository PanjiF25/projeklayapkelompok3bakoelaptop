# 🔄 Product Approval Workflow - BAKOELAPTOP

## 📋 Overview

Sistem approval workflow untuk memastikan produk yang dijual di BAKOELAPTOP sudah melalui verifikasi admin sebelum ditampilkan di halaman Buy.

---

## 🎯 Flow Lengkap

```
┌─────────────┐
│   Seller    │
│ Submit Form │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Product Created │
│ status: pending │
│  sold: false    │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Success Message  │
│ "Menunggu Admin" │
│  WA: 0857-xxx    │
└──────┬───────────┘
       │
       ▼
┌───────────────────┐
│  Admin Dashboard  │
│ "Pending Approval"│
└──────┬────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
   ┌────────┐   ┌────────┐
   │ APPROVE│   │ REJECT │
   └────┬───┘   └───┬────┘
        │           │
        ▼           ▼
  ┌──────────┐  ┌──────────┐
  │ status:  │  │ status:  │
  │ approved │  │ rejected │
  └────┬─────┘  └──────────┘
       │
       ▼
  ┌──────────┐
  │ Show in  │
  │ Buy Page │
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ Customer │
  │   Buys   │
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │  Admin   │
  │Mark Sold │
  └────┬─────┘
       │
       ▼
  ┌──────────┐
  │ sold:    │
  │  true    │
  │ (Hidden) │
  └──────────┘
```

---

## 🔧 Technical Implementation

### 1. Product Data Model

```javascript
{
  // Basic Info
  name: "MacBook Pro M2",
  specs: "16GB RAM, 512GB SSD",
  price: 25000000,
  category: "Laptop", // or "Handphone"
  condition: "Bekas - Mulus",
  stock: 1,
  imageURL: "data:image/jpeg;base64,...", // Base64 encoded
  
  // Seller Info
  sellerId: "user_uid_123",
  sellerEmail: "seller@example.com",
  sellerName: "John Doe",
  
  // Workflow Status
  status: "pending", // pending | approved | rejected
  sold: false,       // true | false
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  approvedAt: Timestamp (optional),
  rejectedAt: Timestamp (optional)
}
```

### 2. Product Status States

| Status     | Visible in Buy | Editable by Seller | Editable by Admin | Description                     |
|------------|----------------|--------------------|--------------------|----------------------------------|
| `pending`  | ❌ No          | ✅ Yes (not status)| ✅ Yes            | Waiting for admin approval       |
| `approved` | ✅ Yes         | ✅ Yes (not status)| ✅ Yes            | Approved, visible to customers   |
| `rejected` | ❌ No          | ❌ No              | ✅ Yes            | Rejected by admin                |

### 3. Sold Flag

- `sold: false` → Product available
- `sold: true` → Product sold, hidden from Buy page
- Only admin can change this field

---

## 📁 Files Modified

### 1. **sell.html** (Line ~195-227)
```javascript
// Added status and sold fields
const productData = {
  // ... other fields
  status: 'pending',  // Start as pending
  sold: false,
  // ...
};

// Updated success message
alert('Produk berhasil dikirim! Menunggu persetujuan admin. Hubungi admin untuk negosiasi: WA +62 857-4940-6558');
```

### 2. **buy.html** (Line ~174)
```javascript
// Filter: only show approved & not sold products
const productsSnapshot = await window.firebaseDB.collection('products')
  .where('status', '==', 'approved')
  .where('sold', '==', false)
  .orderBy('createdAt', 'desc')
  .get();
```

### 3. **admin.html**
- Added "Pending Approval" sidebar menu with badge counter
- Added new section for pending products grid
- Updated dashboard labels: "Produk Pending" & "Produk Disetujui"

### 4. **admin.css**
- Added styles for pending product cards
- Added approve/reject button styles
- Added badge styles for pending count

### 5. **admin.js**
- Added Firebase integration with auth state check
- Added `loadPendingProducts()` function
- Added `approveProduct()` function
- Added `rejectProduct()` function
- Updated `loadDashboardStats()` to use Firebase
- Added role-based access control (only admin can access)

---

## 🚀 Setup Steps

### Step 1: Create Admin User

1. Open `firebase-admin-setup.html` in browser
2. Click **"Buat Akun Admin"**
3. Wait for success message
4. Login dengan:
   - Email: `admin@bakoelaptop.com`
   - Password: `admin123`

### Step 2: Update Firestore Security Rules

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Firestore Database → Rules
3. Copy rules dari `FIRESTORE_SECURITY_RULES.md`
4. Paste dan **Publish**

### Step 3: Test Workflow

1. **As Regular User:**
   - Register/Login
   - Go to Sell page
   - Submit a product
   - Check success message
   - Go to Buy page → product NOT visible yet ✅

2. **As Admin:**
   - Login with admin credentials
   - Go to Admin Dashboard
   - Click "Pending Approval" menu
   - See submitted product
   - Click "Setujui" to approve

3. **Back as User:**
   - Refresh Buy page
   - Product now visible ✅

---

## 🧪 Testing Checklist

### ✅ Seller Flow
- [ ] Can submit product from Sell page
- [ ] Product saves with `status: 'pending'`
- [ ] Success message shows admin contact
- [ ] Product NOT visible in Buy page

### ✅ Admin Flow
- [ ] Can login to admin dashboard
- [ ] Regular users CANNOT access admin dashboard
- [ ] Pending count badge shows correct number
- [ ] Can see pending products with all details
- [ ] Can approve product → status changes to 'approved'
- [ ] Can reject product → status changes to 'rejected'
- [ ] Dashboard stats update after approve/reject

### ✅ Buy Page Flow
- [ ] Only shows products with `status: 'approved'`
- [ ] Only shows products with `sold: false`
- [ ] Pending products NOT visible
- [ ] Rejected products NOT visible

### ✅ Security
- [ ] Regular users cannot read pending products
- [ ] Regular users cannot update product status
- [ ] Only admin can approve/reject
- [ ] Seller can edit own product but NOT status field

---

## 📞 Admin Contact Info

Tampil di success message Sell page:
```
Produk berhasil dikirim! 
Menunggu persetujuan admin. 
Hubungi admin untuk negosiasi: 
WA +62 857-4940-6558
```

---

## 🔮 Future Enhancements

### Phase 2: Notifications
- [ ] Email notification to seller when approved/rejected
- [ ] WhatsApp API integration for instant notifications
- [ ] Push notifications (if PWA)

### Phase 3: Admin Features
- [ ] Bulk approve/reject
- [ ] Product edit from admin panel
- [ ] Reject with reason/comment
- [ ] Product analytics (views, clicks)

### Phase 4: Seller Dashboard
- [ ] Seller can see status of their products
- [ ] Seller can edit pending products
- [ ] Sales analytics for sellers

---

## 🐛 Troubleshooting

### Problem: Admin can't see pending products

**Solution:**
1. Check Firestore Console → users collection
2. Find admin user document
3. Ensure `role: 'admin'` field exists
4. If not, add manually

### Problem: Products still visible without approval

**Solution:**
1. Check Firestore rules are published
2. Check buy.html query has `.where('status', '==', 'approved')`
3. Clear browser cache
4. Check product documents have `status` field

### Problem: "Permission denied" when approving

**Solution:**
1. Check logged in user is admin
2. Check Firestore rules allow admin to update status
3. Check network tab for error details

### Problem: Pending count badge not updating

**Solution:**
1. Refresh the page
2. Check `loadPendingProducts()` is called after approve/reject
3. Check console for errors

---

## 📊 Firestore Collections Structure

```
bakoelaptop/
├── users/
│   ├── {userId}/
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── role: "admin" | "user"
│   │   ├── createdAt: Timestamp
│   │   └── updatedAt: Timestamp
│
├── products/
│   ├── {productId}/
│   │   ├── name: string
│   │   ├── specs: string
│   │   ├── price: number
│   │   ├── category: string
│   │   ├── condition: string
│   │   ├── stock: number
│   │   ├── imageURL: string (base64)
│   │   ├── sellerId: string
│   │   ├── sellerEmail: string
│   │   ├── sellerName: string
│   │   ├── status: "pending" | "approved" | "rejected"
│   │   ├── sold: boolean
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   ├── approvedAt: Timestamp (optional)
│   │   └── rejectedAt: Timestamp (optional)
│
├── carts/ (future)
│   └── {userId}/
│       └── items: array
│
└── orders/ (future)
    └── {orderId}/
        ├── userId: string
        ├── products: array
        ├── total: number
        └── status: string
```

---

## ✅ Completion Status

### Implemented ✅
- [x] Status field in product model
- [x] Sold field in product model
- [x] Pending products hidden from Buy page
- [x] Admin dashboard with pending approval section
- [x] Approve/Reject functionality
- [x] Badge counter for pending products
- [x] Dashboard stats with Firebase
- [x] Role-based access control
- [x] Admin user creation tool
- [x] Security rules documentation

### Not Yet Implemented ⏳
- [ ] Mark as Sold functionality (admin can add this)
- [ ] Edit product from admin panel
- [ ] Rejected products management page
- [ ] Notification system
- [ ] Seller dashboard

---

## 📝 Notes

1. **WhatsApp Number**: Update `+62 857-4940-6558` in `sell.html` line ~227 with actual admin WhatsApp
2. **Test Mode**: Currently Firestore may be in test mode, update rules before production!
3. **Image Storage**: Using base64 encoding (max ~1MB per image recommended)
4. **Indexing**: May need to create composite index in Firestore for `status` + `sold` + `createdAt`

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** 🟢 Production Ready (after security rules update)
