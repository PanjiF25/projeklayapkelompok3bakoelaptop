# 🖥️ BAKOELAPTOP - Laptop & Gadget Marketplace

<div align="center">
  
![BAKOELAPTOP](https://img.shields.io/badge/BAKOELAPTOP-Online%20Store-00d4aa?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

Platform jual-beli laptop dan gadget bekas dengan sistem **buyback**, **trade-in**, dan marketplace terintegrasi.

</div>

---

## 📋 Tentang Project

**BAKOELAPTOP** adalah platform marketplace yang dirancang khusus untuk jual-beli laptop dan gadget bekas dengan model bisnis **buyback/trade-in**. 

### 🎯 Model Bisnis:
1. **Sell to Us** - User menjual gadget ke BAKOELAPTOP
2. **Admin Review** - Tim menilai dan memberikan penawaran harga  
3. **Buy from Us** - Admin menjual kembali produk yang sudah dibeli
4. **Trade-In** - User bisa tukar tambah laptop lama dengan yang baru

---

## ✨ Fitur Utama

### 🛒 Untuk Pembeli
- ✅ Browse produk laptop & handphone dengan filter
- ✅ Shopping cart dengan multi-items
- ✅ Order history & status tracking
- ✅ User profile management lengkap
- ✅ Responsive design (mobile/tablet/desktop)

### 💰 Untuk Penjual (Sell to Us)
- ✅ **Submit sell request** dengan form lengkap
- ✅ **Multiple image upload** (1-5 foto per produk)
- ✅ **Track status approval** di dashboard
  - Under Review - Admin sedang meninjau
  - Accepted - Admin setuju membeli
  - Declined - Ditolak dengan alasan
- ✅ **Real-time notifications**
- ✅ **Contact admin** untuk negosiasi harga

### 🔄 Trade-In System
- ✅ **Multi-step form** yang user-friendly
- ✅ **Step 1:** Detail laptop lama (kondisi, spek)
- ✅ **Step 2:** Pilih laptop baru yang diinginkan
- ✅ **Step 3:** Review & submit request
- ✅ **Custom RAM input** untuk fleksibilitas
- ✅ **Detailed condition selector** dengan penjelasan

### 👨‍💼 Admin Panel
- ✅ **Product approval workflow**
  - Review sell requests
  - Approve/Reject dengan alasan
- ✅ **Manage all products** (CRUD operations)
- ✅ **User management**
- ✅ **Order & trade request tracking**
- ✅ **Dashboard statistics** (coming soon)

### 🔐 Authentication & Security
- ✅ Firebase Authentication (Email/Password)
- ✅ Role-based access control (Admin/User)
- ✅ Firestore Security Rules
- ✅ Input sanitization & XSS protection
- ✅ Secure session management

---

## 🚀 Instalasi & Setup

### Prerequisites
- Web browser modern (Chrome, Firefox, Edge)
- Text editor (VS Code recommended)
- Firebase account (free tier)
- Git

### Langkah-Langkah

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/bakoelaptop.git
   cd bakoelaptop
   ```

2. **Setup Firebase**
   - Buat project di [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Copy Firebase config

3. **Configure Firebase**
   - Buat file `firebase-config.js` (sudah di gitignore)
   - Paste credentials Anda:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     // ... other configs
   };
   ```

4. **Update Firestore Rules**
   - Buka Firebase Console → Firestore → Rules
   - Copy dari `docs/FIRESTORE_SECURITY_RULES.md`
   - Publish rules

5. **Setup Admin**
   - Register akun baru
   - Buka Firestore → users → [user-id]
   - Add field: `role: "admin"`

6. **Run**
   ```bash
   # Using Live Server (VS Code Extension)
   # atau
   python -m http.server 8000
   ```

7. **Access**
   - Open: `http://localhost:8000`
   - Register/Login
   - Explore! 🎉

---

## 📁 Struktur Project

```
BAKOELAPTOP/
├── index.html              # Landing page
├── buy.html                # Catalog produk
├── sell.html               # Form jual gadget
├── trade.html              # Form trade-in
├── cart.html               # Shopping cart
├── profile.html            # User dashboard
├── admin/
│   └── admin.html          # Admin panel
├── script/
│   ├── auth.js             # Authentication
│   ├── cart.js             # Cart logic
│   ├── trade.js            # Trade-in logic
│   ├── profile.js          # Profile + My Products
│   ├── admin.js            # Admin panel
│   └── utils.js            # Helper functions
├── style/
│   ├── global.css          # Global styles
│   ├── home.css            # Landing page
│   ├── buy.css             # Catalog
│   ├── sell.css            # Sell form
│   ├── trade.css           # Trade-in
│   └── admin.css           # Admin panel
├── docs/
│   ├── FIREBASE_SETUP_GUIDE.md
│   ├── FIRESTORE_SECURITY_RULES.md
│   └── APPROVAL_WORKFLOW_GUIDE.md
├── firebase-config.js      # Config (GITIGNORED)
└── README.md
```

---

## 💻 Penggunaan

### Sebagai User

**1. Jual Gadget (Sell to Us)**
- Klik menu "Sell"
- Isi detail produk (nama, spek, harga, kondisi)
- Upload 1-5 foto
- Submit → tunggu review admin

**2. Track Status Penjualan**
- Login → Profile → My Products
- Lihat status:
  - 🕐 Under Review - Sedang ditinjau
  - ✅ Accepted - Admin setuju beli
  - ❌ Declined - Ditolak (lihat alasan)

**3. Browse & Buy**
- Klik menu "Buy"
- Filter by kategori/harga
- Add to cart → Checkout

**4. Trade-In**
- Klik menu "Trade"
- Isi info laptop lama
- Pilih laptop baru
- Submit request

### Sebagai Admin

**1. Access Panel**
- URL: `/admin/admin.html`
- Login dengan akun admin

**2. Review Sell Requests**
- Tab "Pending Products"
- Review detail produk & foto
- Approve atau Reject

**3. Manage Products**
- Edit/Delete produk
- Update harga & stok

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3
- JavaScript (ES6+) - Vanilla JS
- Font Awesome - Icons

**Backend:**
- Firebase Authentication
- Cloud Firestore
- Firestore Security Rules

**Features:**
- Responsive Design
- Real-time Updates
- Image Upload (Base64)
- Role-based Access Control

---

## 📚 Documentation

Untuk dokumentasi lengkap:
- [Firebase Setup Guide](docs/FIREBASE_SETUP_GUIDE.md)
- [Firestore Security Rules](docs/FIRESTORE_SECURITY_RULES.md)
- [Approval Workflow](docs/APPROVAL_WORKFLOW_GUIDE.md)
- [Update Rules Guide](UPDATE_FIRESTORE_RULES.md)

---

## 🤝 Kontribusi

Contributions welcome! Steps:
1. Fork the project
2. Create feature branch (`git checkout -b feature/Amazing`)
3. Commit changes (`git commit -m 'Add Amazing'`)
4. Push (`git push origin feature/Amazing`)
5. Open Pull Request

---

## 📞 Kontak

**BAKOELAPTOP Team**

- 📱 WhatsApp: [+62 857-4940-6558](https://wa.me/6285749406558)
- 📸 Instagram: [@bakoelaptop](https://www.instagram.com/bakoelaptop/)
- 📧 Email: bakoelaptop@gmail.com

---

## 🗺️ Roadmap

- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Rating & review system
- [ ] Wishlist feature

---


