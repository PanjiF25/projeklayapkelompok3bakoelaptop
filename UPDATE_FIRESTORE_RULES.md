# 🔥 UPDATE FIRESTORE SECURITY RULES - URGENT!

## ⚠️ MASALAH SAAT INI
User tidak bisa melihat produk mereka sendiri di halaman "My Products" karena Firestore rules belum diupdate.

Error: `FirebaseError: Missing or insufficient permissions`

---

## 📝 LANGKAH-LANGKAH UPDATE (5 Menit)

### 1️⃣ Buka Firebase Console
- Pergi ke: https://console.firebase.google.com
- Login dengan akun Google Anda
- Pilih project **BAKOELAPTOP**

### 2️⃣ Buka Firestore Rules
- Di sidebar kiri, klik **Firestore Database**
- Klik tab **Rules** (di bagian atas)

### 3️⃣ Copy Rules Baru
Copy **SEMUA** kode di bawah ini:

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

    // Trade Requests Collection
    match /tradeRequests/{requestId} {
      // Users can read their own trade requests, admin can read all
      allow read: if isOwner(resource.data.userId) || isAdmin();
      
      // Users can create their own trade requests
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      
      // Only admin can update trade requests
      allow update: if isAdmin();
      
      // Only admin can delete trade requests
      allow delete: if isAdmin();
    }
  }
}
```

### 4️⃣ Replace & Publish
1. **SELECT ALL** (Ctrl+A) di editor rules
2. **DELETE** semua rules lama
3. **PASTE** rules baru yang sudah di-copy
4. Klik tombol **Publish** (warna biru)
5. Tunggu beberapa detik sampai muncul notifikasi sukses

### 5️⃣ Test
1. Refresh halaman website (F5)
2. Login sebagai user yang sudah submit produk
3. Klik menu "My Products"
4. Produk seharusnya muncul! ✅

---

## 🔍 APA YANG BERUBAH?

### SEBELUM (❌ Error)
```javascript
allow read: if resource.data.status == 'approved' || isAdmin();
```
- User biasa HANYA bisa read produk yang approved
- User TIDAK bisa read produk pending/rejected mereka sendiri

### SESUDAH (✅ Fixed)
```javascript
allow read: if resource.data.status == 'approved' || 
               isOwner(resource.data.sellerId) ||
               isAdmin();
```
- User biasa bisa read produk approved (untuk browse)
- User bisa read **PRODUK MEREKA SENDIRI** (semua status)
- Admin bisa read semua produk

---

## 📱 TROUBLESHOOTING

### Masih Error Setelah Update?
1. **Hard Refresh**: Ctrl+Shift+R atau Ctrl+F5
2. **Clear Cache**: Buka DevTools → Application → Clear Storage → Clear site data
3. **Logout & Login** lagi
4. **Tunggu 30 detik** (propagation time untuk rules baru)

### Cek Rules Sudah Benar?
Di Firebase Console → Firestore → Rules, pastikan ada baris:
```
isOwner(resource.data.sellerId) ||
```

---

## ✅ CHECKLIST

- [ ] Buka Firebase Console
- [ ] Pilih project BAKOELAPTOP
- [ ] Buka Firestore Database → Rules
- [ ] Copy rules baru dari file ini
- [ ] Paste & Replace semua rules
- [ ] Klik Publish
- [ ] Tunggu sukses
- [ ] Refresh website
- [ ] Test My Products page
- [ ] Produk muncul! 🎉

---

## 💡 CATATAN KEAMANAN

Rules baru ini AMAN karena:
1. ✅ Public hanya bisa lihat produk approved (untuk shopping)
2. ✅ Seller hanya bisa lihat produk MEREKA SENDIRI (bukan punya orang lain)
3. ✅ Seller TIDAK bisa ubah status produk (hanya admin)
4. ✅ Admin tetap bisa lihat & manage semua produk

**UPDATE SEKARANG AGAR FITUR MY PRODUCTS BEKERJA!** 🚀
