# 🔥 Firebase Integration Guide - BAKOELAPTOP

## 📋 Prerequisites
- Google Account
- Website project ready

---

## 🚀 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Add project" or "Create a project"

2. **Project Setup**
   - Project name: `bakoelaptop` (or your choice)
   - Enable Google Analytics (optional)
   - Click "Create project"

---

## 🔧 Step 2: Add Web App to Firebase

1. **Register App**
   - In Firebase Console, click the **Web icon** (</>) 
   - App nickname: `BAKOELAPTOP Web`
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Firebase Config**
   - You'll see a `firebaseConfig` object
   - **IMPORTANT**: Copy this entire object
   - It should look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXxXxXxXxXxXxXxXxXxXxXxXxXxXxX",
     authDomain: "bakoelaptop.firebaseapp.com",
     projectId: "bakoelaptop",
     storageBucket: "bakoelaptop.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:xxxxxxxxxxx",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

3. **Update `firebase-config.js`**
   - Open file: `firebase-config.js`
   - Replace the placeholder config with your actual config
   - Save the file

---

## 🔐 Step 3: Enable Authentication

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in sidebar
   - Click "Get started"

2. **Enable Sign-in Methods**
   - Click "Sign-in method" tab
   - Enable **Email/Password**:
     - Click "Email/Password"
     - Toggle "Enable"
     - Click "Save"

3. **Create Admin User** (Do this manually first)
   - Go to "Users" tab
   - Click "Add user"
   - Email: `admin@bakoelaptop.com`
   - Password: (create a strong password)
   - Click "Add user"

4. **Set Admin Role in Firestore**
   - After creating user, note the UID
   - We'll use this in Step 4

---

## 💾 Step 4: Enable Firestore Database

1. **Create Database**
   - In Firebase Console, click "Firestore Database"
   - Click "Create database"

2. **Security Rules** (Start in test mode for development)
   - Select "Start in test mode"
   - Click "Next"
   - Choose location: `asia-southeast1` (Singapore) or closest
   - Click "Enable"

3. **Set Admin Role**
   - Go to Firestore Database
   - Click "Start collection"
   - Collection ID: `users`
   - Click "Next"
   - Document ID: (paste the admin UID from Step 3)
   - Add fields:
     ```
     uid: (admin UID)
     email: admin@bakoelaptop.com
     fullname: Admin
     username: admin
     role: admin
     createdAt: (current timestamp)
     ```
   - Click "Save"

4. **Update Security Rules** (For production)
   - Go to "Rules" tab
   - Replace with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users collection
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // Products collection
       match /products/{productId} {
         allow read: if true; // Anyone can read products
         allow write: if request.auth != null && 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // Orders collection
       match /orders/{orderId} {
         allow read: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || 
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
   - Click "Publish"

---

## 📦 Step 5: Enable Storage

1. **Create Storage Bucket**
   - Click "Storage" in sidebar
   - Click "Get started"
   - Start in test mode
   - Click "Next"
   - Choose same location as Firestore
   - Click "Done"

2. **Update Storage Rules**
   - Go to "Rules" tab
   - Replace with:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Product images
       match /products/{imageName} {
         allow read: if true; // Anyone can read
         allow write: if request.auth != null && 
                        request.resource.size < 5 * 1024 * 1024 && // 5MB limit
                        request.resource.contentType.matches('image/.*');
       }
       
       // User uploads
       match /uploads/{userId}/{imageName} {
         allow read: if true;
         allow write: if request.auth != null && 
                        request.auth.uid == userId &&
                        request.resource.size < 5 * 1024 * 1024 &&
                        request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```
   - Click "Publish"

---

## 🌐 Step 6: Update HTML Files

Add these scripts BEFORE your custom scripts in ALL HTML files:

```html
<!-- Firebase App (required) -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>

<!-- Firebase Auth -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>

<!-- Firebase Firestore -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<!-- Firebase Storage -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>

<!-- Your Firebase Config & Services -->
<script src="firebase-config.js"></script>
<script src="firebase-auth.js"></script>
<script src="firebase-db.js"></script>
```

---

## 🧪 Step 7: Test Firebase Connection

1. **Open Browser Console**
   - Open any page (e.g., index.html)
   - Press F12 to open DevTools
   - Go to Console tab

2. **Check for Success Message**
   - You should see: `✅ Firebase initialized successfully`
   - If error, check your firebaseConfig

3. **Test Registration**
   - Go to register page
   - Create a new account
   - Check Firebase Console > Authentication > Users
   - Your new user should appear

4. **Test Login**
   - Login with the account you just created
   - Should redirect to index.html

---

## 📊 Step 8: Migrate Existing Data (Optional)

If you have data in localStorage, migrate to Firestore:

1. **Export Products**
   ```javascript
   // Run in browser console
   const products = JSON.parse(localStorage.getItem('products'));
   console.log(JSON.stringify(products, null, 2));
   ```

2. **Import to Firestore**
   - Use Firebase Console
   - Or use the migration script (create separate file)

---

## 🔒 Security Checklist

- [ ] Updated firebaseConfig with your actual credentials
- [ ] Created admin user in Authentication
- [ ] Set admin role in Firestore users collection
- [ ] Updated Firestore security rules
- [ ] Updated Storage security rules
- [ ] Tested registration and login
- [ ] Admin panel only accessible by admin user
- [ ] Products visible to all users
- [ ] Users can only edit their own data

---

## 🐛 Troubleshooting

### Error: "Firebase not defined"
- Make sure Firebase scripts are loaded BEFORE your custom scripts
- Check script order in HTML

### Error: "Permission denied"
- Check Firestore security rules
- Make sure user is authenticated
- Check admin role is set correctly

### Error: "API key not valid"
- Double-check your firebaseConfig
- Make sure you copied the correct config from Firebase Console

### Images not uploading
- Check Storage security rules
- Verify file size is under 5MB
- Ensure file is an image type

---

## 📝 Next Steps

1. ✅ Setup Firebase project
2. ✅ Configure authentication
3. ✅ Setup Firestore database
4. ✅ Setup Storage
5. ✅ Update HTML files
6. 🔄 Test all functionality
7. 🔄 Deploy to Firebase Hosting (optional)

---

## 🆘 Need Help?

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/

---

## 💡 Tips

- **Keep your API key secure** - Don't commit to public GitHub repos
- **Use environment variables** for production
- **Enable Firebase Analytics** for insights
- **Set up Firebase Hosting** for easy deployment
- **Use Firebase Functions** for backend logic (future enhancement)

---

**Good luck! 🚀**
