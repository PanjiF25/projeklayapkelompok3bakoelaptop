# 🚀 Git Push Guide - BAKOELAPTOP

## 📝 Persiapan Sebelum Push

### ✅ Checklist File Penting
Pastikan file-file ini **TIDAK** ikut di-push (sudah di `.gitignore`):
- ❌ `firebase-config.js` (credentials sensitive!)
- ❌ `ADMIN_CREDENTIALS.txt` (password admin!)
- ❌ `node_modules/` (jika ada)
- ❌ `.env` files

### ✅ File yang HARUS di-push:
- ✅ Semua file `.html`
- ✅ Folder `script/` (semua .js kecuali firebase-config.js)
- ✅ Folder `style/` (semua .css)
- ✅ Folder `docs/`
- ✅ Folder `assets/` (images, etc)
- ✅ `firebase-config.template.js` (template)
- ✅ `README.md`
- ✅ `.gitignore`

---

## 🔧 Setup Git & Push ke GitHub

### 1️⃣ Initialize Git (Jika Belum)
```bash
# Masuk ke folder project
cd "d:\Dokumen\Layanan Aplikasi Internet\Project Website\Project Website"

# Initialize git (skip jika sudah ada .git folder)
git init
```

### 2️⃣ Cek Status File
```bash
# Lihat file apa saja yang akan di-commit
git status

# Pastikan firebase-config.js TIDAK muncul di list
# Jika muncul, cek .gitignore
```

### 3️⃣ Add Files
```bash
# Add semua file (kecuali yang di .gitignore)
git add .

# Atau add specific files
git add index.html
git add style/
git add script/
# dst...
```

### 4️⃣ Commit
```bash
# Commit dengan message yang jelas
git commit -m "Initial commit: BAKOELAPTOP marketplace with buyback system"

# Atau commit dengan detail
git commit -m "feat: Add sell request tracking and multiple image upload

- Add My Products section in profile
- Implement product status tracking (pending/approved/rejected)
- Support multiple image upload (max 5 images)
- Update Firestore security rules
- Add buyback model documentation"
```

### 5️⃣ Buat Repository di GitHub
1. Buka: https://github.com/new
2. Repository name: `bakoelaptop` (atau nama lain)
3. Description: "Laptop & Gadget Marketplace with Buyback System"
4. **Public** atau **Private** (pilih sesuai kebutuhan)
5. **JANGAN** centang "Add README" (sudah ada)
6. Klik **Create repository**

### 6️⃣ Connect ke GitHub
```bash
# Ganti URL dengan repository Anda
git remote add origin https://github.com/YOUR_USERNAME/bakoelaptop.git

# Cek remote
git remote -v
```

### 7️⃣ Push!
```bash
# Push ke GitHub
git push -u origin main

# Jika branch-nya "master":
git push -u origin master

# Atau rename branch dulu ke main:
git branch -M main
git push -u origin main
```

---

## 🔐 IMPORTANT: Jangan Push Credentials!

### Cek Sebelum Push:
```bash
# Pastikan file ini TIDAK muncul:
git status | grep firebase-config.js
git status | grep ADMIN_CREDENTIALS

# Jika muncul, hapus dari staging:
git rm --cached firebase-config.js
git rm --cached ADMIN_CREDENTIALS.txt
```

### Jika Sudah Terlanjur Push Credentials:
1. **Segera hapus repository** di GitHub
2. **Reset Firebase credentials** (regenerate keys)
3. **Buat repository baru**
4. **Pastikan .gitignore benar**
5. **Push ulang**

---

## 📝 Commit Message Best Practices

### Format:
```
<type>: <subject>

<body> (optional)
```

### Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Add tests
- `chore:` - Maintenance tasks

### Examples:
```bash
git commit -m "feat: Add multiple image upload for sell requests"
git commit -m "fix: Resolve Firestore permission error in My Products"
git commit -m "docs: Update README with buyback model explanation"
git commit -m "style: Improve sell form UI with info cards"
```

---

## 🔄 Update Code (Setelah Changes)

```bash
# 1. Check what changed
git status

# 2. Add changes
git add .

# 3. Commit
git commit -m "feat: Add new feature XYZ"

# 4. Push
git push
```

---

## 🌿 Working with Branches (Optional)

```bash
# Create new branch
git checkout -b feature/new-feature

# Make changes, commit
git add .
git commit -m "feat: Add new feature"

# Push branch
git push -u origin feature/new-feature

# Switch back to main
git checkout main

# Merge branch
git merge feature/new-feature
```

---

## 🆘 Troubleshooting

### Error: "remote: Permission denied"
- Pastikan sudah login GitHub
- Cek authentication: `gh auth login`

### Error: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin YOUR_GITHUB_URL
```

### Error: "Your branch is behind 'origin/main'"
```bash
git pull origin main
# Resolve conflicts if any
git push
```

### Ingin Undo Commit Terakhir:
```bash
# Undo commit, keep changes
git reset --soft HEAD~1

# Undo commit & changes (dangerous!)
git reset --hard HEAD~1
```

---

## ✅ Final Checklist

- [ ] `.gitignore` sudah benar
- [ ] `firebase-config.js` TIDAK ikut push
- [ ] `ADMIN_CREDENTIALS.txt` TIDAK ikut push
- [ ] `README.md` sudah lengkap & jelas
- [ ] `firebase-config.template.js` sudah dibuat
- [ ] Commit message jelas & descriptive
- [ ] Repository di GitHub sudah dibuat
- [ ] `git push` sukses
- [ ] Cek di GitHub: file sudah muncul
- [ ] Test clone di komputer lain (optional)

---

## 🎉 Selesai!

Repository Anda sekarang sudah di GitHub! 🚀

**Share link:** `https://github.com/YOUR_USERNAME/bakoelaptop`

**Next steps:**
- Add GitHub Pages untuk hosting (optional)
- Setup CI/CD (optional)
- Add collaborators
- Create Issues & Projects
- Add LICENSE file

---

**Happy Coding! 💻✨**
