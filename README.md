# BAKOELAPTOP - Your Trusted Laptop Marketplace 💻

[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-orange)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://www.javascript.com/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://html.spec.whatwg.org/)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)

Platform marketplace web-based yang dirancang khusus untuk jual beli dan tukar tambah laptop bekas dengan sistem verifikasi pembayaran terintegrasi.

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Struktur Database](#-struktur-database)
- [Instalasi](#-instalasi)
- [Penggunaan](#-penggunaan)
- [Tim Pengembang](#-tim-pengembang)

---

## 🎯 Tentang Project

### Latar Belakang

**Permasalahan:**
- Kurangnya platform terpercaya untuk transaksi laptop bekas
- Risiko penipuan tinggi di marketplace umum
- Tidak ada verifikasi pembayaran yang aman
- Marketplace umum tidak spesifik untuk laptop

**Solusi:**
BAKOELAPTOP adalah platform marketplace khusus laptop dengan sistem verifikasi pembayaran terintegrasi. Fokus pada keamanan transaksi dengan approval system dan fitur lengkap: Buy, Sell, Trade.

### Value Proposition

- 🔒 **Keamanan Terjamin** - Sistem approval pembayaran oleh admin
- ✅ **Verifikasi Produk** - Setiap produk diverifikasi sebelum ditampilkan
- 💰 **Harga Transparan** - Tidak ada biaya tersembunyi
- 🔄 **Trade System** - Fitur tukar tambah yang mudah
- 📱 **User-Friendly** - Interface modern dan responsif

---

## ✨ Key Features

### 1. 🛒 Buy Feature
- Browse katalog laptop dengan filter kategori
- Detail spesifikasi lengkap
- Add to cart & checkout
- Upload bukti pembayaran
- Real-time order tracking

### 2. 💼 Sell Feature
- Upload produk dengan mudah
- Image upload (base64)
- Spesifikasi lengkap
- Admin approval system
- Status tracking (Pending → Approved → Sold)

### 3. 🔄 Trade Feature
- Trade/tukar tambah laptop
- Perhitungan selisih harga otomatis
- Request trade system

### 4. 👤 User Management
- Register & Login dengan Firebase Auth
- Profile management
- Order history
- My Orders dengan status tracking

### 5. 🔐 Admin Dashboard
- Product approval/rejection
- Payment verification dengan badge warna (🟡 Pending, 🟢 Approved, 🔴 Rejected)
- Order management
- User management
- Real-time statistics
- Recent orders monitoring

### 6. 💳 Payment System
- Multiple payment methods (Transfer Bank, QRIS, E-Wallet)
- Upload bukti pembayaran
- Admin verification
- Auto product status update (Sold) setelah approval

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling dengan gradients & animations
- **JavaScript (ES6+)** - Vanilla JS, async/await, modules
- **Font Awesome 6.5.0** - Icons

### Backend & Database
- **Firebase Authentication** - User management & security
- **Firestore Database** - NoSQL real-time database
- **Firebase SDK 9.22.0** - Modular SDK

### Architecture
- **MVC Pattern** - Separation of concerns
- **Modular JavaScript** - Component-based structure
- **RESTful principles** - Clean API design

---

## 🗄️ Struktur Database

### Firestore Collections

```
users/
├── uid (auto-generated)
├── email
├── fullname
├── phone
├── address
└── role (user/admin)

products/
├── id (auto-generated)
├── name
├── category (laptop/handphone)
├── price
├── specs
├── imageURL (base64)
├── status (pending/approved/rejected/sold)
├── sellerId
├── createdAt
└── updatedAt

orders/
├── id (auto-generated)
├── userId
├── userEmail
├── customerName
├── customerPhone
├── shippingAddress
├── items[] (array of products)
├── total
├── paymentMethod
├── paymentProof (base64)
├── paymentStatus (pending/approved/rejected)
├── orderStatus (processing/shipped/delivered/cancelled)
├── rejectionReason (optional)
├── createdAt
└── updatedAt

carts/
├── userId (document ID)
├── items[] (array of product references)
├── createdAt
└── updatedAt
```

---

## 🚀 Instalasi

### Prerequisites
- Web Browser (Chrome, Firefox, Edge)
- Text Editor (VS Code recommended)
- Live Server extension
- Firebase Account

### Setup Firebase

1. **Buat Firebase Project**
   - Buka [Firebase Console](https://console.firebase.google.com/)
   - Klik "Add Project"
   - Ikuti wizard setup

2. **Enable Services**
   - **Authentication**: Email/Password method
   - **Firestore Database**: Start in test mode

3. **Get Configuration**
   - Project Settings → General
   - Scroll ke "Your apps" → Web app
   - Copy Firebase configuration

4. **Configure Project**
   - Rename `firebase-config.template.js` menjadi `firebase-config.js`
   - Paste configuration Anda:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Setup Firestore Security Rules

Di Firebase Console → Firestore Database → Rules, paste rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         resource.data.sellerId == request.auth.uid);
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Carts collection
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Instalasi Local

1. **Clone Repository**
```bash
git clone https://github.com/PanjiF25/projeklayapkelompok3bakoelaptop.git
cd projeklayapkelompok3bakoelaptop
```

2. **Setup Firebase Config** (lihat langkah di atas)

3. **Run dengan Live Server**
   - Install "Live Server" extension di VS Code
   - Right click `index.html`
   - Select "Open with Live Server"

4. **Access**
```
http://127.0.0.1:5500/index.html
```

### Setup Admin User

1. Register akun baru
2. Buka Firebase Console → Firestore
3. Cari collection `users` → document dengan UID Anda
4. Edit document, tambah field:
   - Field: `role`
   - Value: `admin`
5. Save

---

## 📱 Penggunaan

### Untuk User

#### 1. Register & Login
- Klik "Sign Up" di navbar
- Isi form: Full Name, Email, Password, Phone, Address
- Login dengan email & password

#### 2. Browse & Buy Products
- Menu "Buy" → browse produk
- Filter berdasarkan kategori (laptop/handphone)
- Klik produk untuk detail lengkap
- "Add to Cart"
- Buka Cart → Checkout
- Pilih metode pembayaran
- Upload bukti pembayaran
- Konfirmasi → Loading → Success modal
- Track di "My Orders"

#### 3. Sell Product
- Menu "Sell"
- Upload gambar produk
- Isi detail: Nama, Kategori, Harga, Spesifikasi
- Submit
- Tunggu admin approval
- Check status di Profile

#### 4. Trade Product
- Menu "Trade"
- Request tukar tambah laptop

### Untuk Admin

#### 1. Access Dashboard
- Login sebagai admin
- Tombol "Admin Dashboard" muncul di navbar (gradient ungu)
- Klik untuk masuk dashboard

#### 2. Dashboard Overview
- **Total Products**: Jumlah semua produk
- **Total Orders**: Jumlah pesanan
- **Pending Products**: Produk menunggu approval
- **Approved Products**: Produk disetujui
- **Recent Orders**: 5 pesanan terbaru

#### 3. Approve Products
- Sidebar → "Pending Approval"
- Review produk baru dari seller
- Klik "Approve" atau "Reject"
- Jika reject: beri alasan penolakan

#### 4. Manage Products
- Sidebar → "Produk"
- View semua produk dengan status:
  - 🟠 Pending - Menunggu approval
  - 🟢 Approved - Disetujui, bisa dijual
  - 🔴 Rejected - Ditolak
  - 🔴 Sold - Sudah terjual
- Edit atau Delete produk
- Tombol dengan gradient warna-warni

#### 5. Verify Payments
- Sidebar → "Pesanan & Pembayaran"
- Filter by status:
  - 🟡 Pending Payment - Menunggu verifikasi
  - 🟢 Payment Approved - Disetujui
  - 🔴 Payment Rejected - Ditolak
- Klik order untuk detail
- View payment proof (foto)
- **Approve Payment**:
  - Konfirmasi
  - Loading muncul
  - Auto update: payment status → approved, product status → sold
  - Auto refresh data
- **Reject Payment**:
  - Input alasan penolakan
  - Konfirmasi
  - Customer bisa lihat alasan di My Orders

#### 6. Manage Users
- Sidebar → "Pengguna"
- View semua registered users
- Detail: Username, Email, Phone, Address, Role

#### 7. Navigation
- **"Halaman Utama"** (hijau) → kembali ke website user
- **"Logout"** → konfirmasi → sign out dari Firebase

---

## 🏗️ Struktur Project

```
BAKOELAPTOP/
├── index.html              # Landing page
├── buy.html                # Product catalog
├── sell.html               # Sell product form
├── trade.html              # Trade-in form
├── cart.html               # Shopping cart & checkout
├── login.html              # Login page
├── register.html           # Registration page
├── profile.html            # User profile & My Orders
├── admin.html              # Admin dashboard
│
├── firebase-auth.js        # Firebase initialization
├── firebase-config.js      # Firebase configuration (gitignored)
├── firebase-db.js          # Database service class
│
├── script/
│   ├── auth.js             # Authentication logic
│   ├── cart.js             # Cart management
│   ├── trade.js            # Trade system
│   ├── profile.js          # Profile & orders
│   ├── admin.js            # Admin dashboard
│   ├── navbar.js           # Navbar component
│   └── utils.js            # Utility functions
│
├── style/
│   ├── global.css          # Global styles
│   ├── home.css            # Landing page styles
│   ├── buy.css             # Product catalog styles
│   ├── sell.css            # Sell form styles
│   ├── trade.css           # Trade form styles
│   ├── cart.css            # Cart styles
│   ├── login.css           # Auth pages styles
│   ├── admin.css           # Admin dashboard styles
│   └── loading.css         # Loading animations
│
├── assets/
│   └── images/             # Image assets
│
├── .gitignore              # Git ignore rules
├── .env.example            # Environment template
└── README.md               # This file
```

---

## 🎨 Use Case Diagram

### Actors
- **User** (Buyer/Seller)
- **Admin**

### User Use Cases
```
User
├── Authentication
│   ├── Register Account
│   └── Login
├── Browse & Buy
│   ├── Browse Products
│   ├── Filter by Category
│   ├── View Product Details
│   ├── Add to Cart
│   ├── Checkout
│   └── Upload Payment Proof
├── Sell Product
│   ├── Upload Product
│   ├── Fill Product Details
│   └── Submit for Approval
├── Trade System
│   └── Request Trade/Tukar Tambah
├── Order Management
│   ├── View My Orders
│   ├── Check Order Status
│   └── View Payment Status
└── Profile
    ├── Update Profile
    └── View Order History
```

### Admin Use Cases
```
Admin
├── Dashboard
│   ├── View Statistics
│   └── View Recent Orders
├── Product Management
│   ├── View All Products
│   ├── Approve Product
│   ├── Reject Product (with reason)
│   ├── Edit Product
│   └── Delete Product
├── Order Management
│   ├── View All Orders
│   ├── Filter by Status
│   ├── View Order Details
│   ├── Verify Payment Proof
│   ├── Approve Payment → Auto mark product as Sold
│   └── Reject Payment (with reason)
└── User Management
    └── View All Users
```

---

## 📊 Ketercapaian MVP

### ✅ Core Features (100% Complete)
1. ✅ User Authentication (Register, Login, Logout)
2. ✅ Product Management (CRUD)
3. ✅ Shopping Cart System
4. ✅ Order & Payment System
5. ✅ Admin Dashboard
6. ✅ Payment Verification
7. ✅ Profile & Order Tracking

### ✅ Bonus Features
8. ✅ Trade/Tukar Tambah System
9. ✅ Real-time Auto Refresh
10. ✅ Beautiful UI/UX (Modal, Loading, Animations)
11. ✅ Responsive Design
12. ✅ Admin ↔ User Seamless Navigation
13. ✅ Color-coded Status Badges
14. ✅ Recent Orders Monitoring

### ✅ Quality Improvements
- ✅ Loading indicators untuk semua async operations
- ✅ Confirmation modals untuk critical actions
- ✅ Comprehensive error handling
- ✅ Secure authentication & authorization
- ✅ Cache control untuk data freshness
- ✅ Console logging untuk debugging

---

## ⏱️ Timeline Pengerjaan (5 Minggu)

### Minggu 1: Planning & Setup
- Requirements gathering
- Database design (ERD)
- Firebase setup & configuration
- Project structure initialization

### Minggu 2: Frontend Development
- Landing page, Authentication pages
- Buy, Sell, Trade pages
- Navbar & footer components

### Minggu 3: Backend Integration
- Firebase Authentication integration
- Firestore database setup
- CRUD operations
- Cart & Order system

### Minggu 4: Admin & Payment System
- Admin dashboard development
- Product approval workflow
- Payment verification system
- Order management

### Minggu 5: Testing & Optimization
- Bug fixing & debugging
- Performance optimization
- UI/UX improvements
- Auto-refresh system
- Final testing

---

## 👥 Tim Pengembang

**Kelompok 3 - Layanan Aplikasi Internet**

Dikembangkan dengan ❤️ menggunakan Firebase & Vanilla JavaScript

---

## 📄 License

This project is for educational purposes - Tugas Mata Kuliah Layanan Aplikasi Internet.

---

## 🙏 Acknowledgments

- Firebase untuk platform backend yang powerful
- Font Awesome untuk icon library
- VS Code & Live Server untuk development environment
- Semua yang telah mendukung project ini

---

## 📞 Kontak

Untuk pertanyaan atau feedback:
- Buat issue di repository ini
- Email: bakoelaptop@gmail.com

---

<div align="center">

**BAKOELAPTOP** - Making Laptop Trading Safe and Easy! 🚀

</div>


