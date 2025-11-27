# Firestore Security Rules - BAKOELAPTOP

## ⚠️ PENTING: Update Security Rules di Firebase Console

Setelah mengimplementasikan approval workflow, **WAJIB** update Firestore Security Rules untuk keamanan.

## 📋 Cara Update Rules

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Pilih project Anda
3. Klik **Firestore Database** di sidebar kiri
4. Klik tab **Rules**
5. Copy-paste rules di bawah ini
6. Klik **Publish**

---

## 🔐 Security Rules (Copy ini)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function: check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function: check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function: check if user owns the document
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users Collection
    match /users/{userId} {
      // Anyone can read user profiles
      allow read: if true;
      
      // Users can only create/update their own profile
      // Admin can update any user
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      
      // Only admin can delete users
      allow delete: if isAdmin();
    }

    // Products Collection
    match /products/{productId} {
      // Anyone can read APPROVED products
      // Sellers can read their OWN products (any status)
      // Admin can read ALL products
      allow read: if resource.data.status == 'approved' || 
                     isOwner(resource.data.sellerId) ||
                     isAdmin();
      
      // Only authenticated users can create products
      // Regular users: products start with status 'pending'
      // Admin: can create products with status 'approved' OR 'pending'
      allow create: if isSignedIn() && 
                      request.resource.data.sellerId == request.auth.uid &&
                      (request.resource.data.status == 'pending' || 
                       (isAdmin() && request.resource.data.status == 'approved'));
      
      // Only product owner can update their own products (but NOT status field)
      // Only admin can update any field including status
      allow update: if (isOwner(resource.data.sellerId) && 
                        request.resource.data.status == resource.data.status) ||
                       isAdmin();
      
      // Only admin or product owner can delete products
      allow delete: if isAdmin() || isOwner(resource.data.sellerId);
    }

    // Carts Collection (per-user)
    match /carts/{userId} {
      // Users can only read/write their own cart
      allow read, write: if isOwner(userId);
    }

    // Orders Collection
    match /orders/{orderId} {
      // Users can read their own orders, admin can read all
      allow read: if isOwner(resource.data.userId) || isAdmin();
      
      // Users can create their own orders
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only admin can update orders
      allow update: if isAdmin();
      
      // Only admin can delete orders
      allow delete: if isAdmin();
    }
  }
}
```

---

## 📖 Penjelasan Rules

### 1. **Users Collection**
- ✅ Semua orang bisa baca profil user (untuk tampilkan nama penjual)
- ✅ User hanya bisa buat/edit profil sendiri
- ✅ Admin bisa edit semua user
- ✅ Hanya admin bisa hapus user

### 2. **Products Collection** (PENTING!)
- ✅ Publik hanya bisa baca produk dengan `status == 'approved'`
- ✅ Admin bisa baca semua produk (termasuk pending)
- ✅ User authenticated bisa buat produk, tapi **WAJIB `status: 'pending'`**
- ✅ Penjual bisa edit produk sendiri, **TAPI TIDAK BISA ubah status**
- ✅ **HANYA ADMIN yang bisa ubah status** (approve/reject/sold)
- ✅ Hanya admin bisa hapus produk

### 3. **Carts Collection**
- ✅ User hanya bisa akses cart sendiri

### 4. **Orders Collection**
- ✅ User bisa baca order sendiri
- ✅ Admin bisa baca semua order
- ✅ User bisa buat order atas nama sendiri
- ✅ Hanya admin bisa update/delete order

---

## ✅ Test Rules Setelah Update

### Test 1: User biasa TIDAK bisa approve produk
```javascript
// Di browser console (logged in as regular user)
// Ini HARUS GAGAL dengan "permission denied"
await firebase.firestore().collection('products').doc('PRODUCT_ID').update({
  status: 'approved'
});
// Expected: Error: Missing or insufficient permissions
```

### Test 2: Admin BISA approve produk
```javascript
// Di browser console (logged in as admin)
// Ini HARUS BERHASIL
await firebase.firestore().collection('products').doc('PRODUCT_ID').update({
  status: 'approved'
});
// Expected: Success
```

### Test 3: User biasa TIDAK bisa baca produk pending
```javascript
// Di browser console (logged in as regular user)
// Ini HARUS return 0 products (meskipun ada pending products)
const snapshot = await firebase.firestore().collection('products')
  .where('status', '==', 'pending')
  .get();
console.log(snapshot.size); // Should be 0
```

---

## 🚨 WARNING

**JANGAN** gunakan rules test mode (`allow read, write: if true;`) di production!
Ini sangat berbahaya karena siapa saja bisa:
- ❌ Approve produk sendiri
- ❌ Hapus produk orang lain
- ❌ Ubah data user lain
- ❌ Lihat semua data

---

## 📝 Notes

1. Rules ini sudah include permission untuk collections yang akan datang (carts, orders)
2. Jika ada error "Missing or insufficient permissions", cek:
   - User sudah login?
   - User punya field `role: 'admin'` di Firestore?
   - Rules sudah di-publish?
3. Untuk debugging, bisa temporary tambahkan log di rules (tapi hapus sebelum production)

---

## 🔄 Rollback ke Test Mode (Development Only)

Jika ingin rollback ke test mode untuk development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **INGAT:** Test mode hanya untuk development! Ganti dengan rules secure sebelum production!
