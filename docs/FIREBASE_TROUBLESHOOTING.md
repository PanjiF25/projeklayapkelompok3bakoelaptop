# 🔧 Firebase Troubleshooting Guide

## ✅ Current Status
- ✅ Firebase initialized successfully
- ❓ Register/Login not working
- ❌ Storage disabled (using base64 instead - FREE!)

---

## 🎯 Step-by-Step Debugging

### Step 1: Open Firebase Test Page
1. Open file: **`firebase-test.html`** in browser
2. Browser akan auto-check Firebase status
3. Lihat hasil di setiap section

### Step 2: Check Firebase Console Settings

#### A. Authentication Setup
1. Go to: https://console.firebase.google.com/
2. Select project: **bakoelaptop-2ea41**
3. Click **Authentication** in sidebar
4. Click **Sign-in method** tab
5. **PASTIKAN Email/Password = ENABLED** ✅

**Screenshot expected:**
```
Sign-in providers
✅ Email/Password    Enabled
❌ Google           Disabled
❌ Facebook         Disabled
```

**If not enabled:**
- Click "Email/Password"
- Toggle "Enable" ON
- Click "Save"

#### B. Firestore Setup
1. Click **Firestore Database** in sidebar
2. Should see database status: **Active**
3. Click **Rules** tab
4. **IMPORTANT:** Update rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all reads/writes for testing
    // ⚠️ Change this before production!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**

---

## 🧪 Testing Procedure

### Test 1: Check Services
1. Open `firebase-test.html`
2. Click "Check Services" button
3. All should show ✅:
   - ✅ Firebase App: Initialized
   - ✅ Firebase Auth: Ready
   - ✅ Firestore: Ready
   - ✅ AuthService: Loaded
   - ✅ DatabaseService: Loaded

**If any shows ❌:**
- Clear browser cache (Ctrl+Shift+Del)
- Hard refresh (Ctrl+F5)
- Check console for errors (F12)

### Test 2: Test Registration
1. In firebase-test.html, go to "Test 2: User Registration"
2. Fill in test data (or use defaults):
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "Test Register"
4. **Expected result:** ✅ Registration Successful with User UID

**If error appears:**

**Error: "auth/email-already-in-use"**
- Solution: Change email to something else (e.g., `test2@example.com`)

**Error: "auth/weak-password"**
- Solution: Use password at least 6 characters

**Error: "Missing or insufficient permissions"**
- Solution: Update Firestore rules (see Step 2B above)

**Error: "Network error"**
- Solution: Check internet connection
- Check Firebase project is active

### Test 3: Test Login
1. Use email from successful registration
2. Click "Test Login"
3. **Expected result:** ✅ Login Successful with role info

### Test 4: Check Firebase Console
1. Go to Firebase Console > **Authentication** > **Users** tab
2. Should see your test user listed:
   ```
   test@example.com
   User UID: abc123...
   Created: just now
   ```

3. Go to **Firestore Database** > **Data** tab
4. Should see collection: **users**
5. Click on it > Should see document with your user data

---

## 🐛 Common Errors & Solutions

### Error 1: "Firebase is not defined"
**Cause:** Firebase scripts not loaded

**Solution:**
```html
<!-- Add BEFORE your custom scripts -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
```

### Error 2: "authService is not defined"
**Cause:** firebase-auth.js not loaded or loaded before firebase-config.js

**Solution:** Check script order:
```html
<!-- CORRECT ORDER: -->
<script src="firebase-config.js"></script>
<script src="script/utils.js"></script>
<script src="firebase-auth.js"></script>
<script src="firebase-db.js"></script>
```

### Error 3: "Missing or insufficient permissions"
**Cause:** Firestore security rules too restrictive

**Solution:** 
1. Firebase Console > Firestore > Rules
2. For testing, use:
```javascript
allow read, write: if true;
```
3. ⚠️ **IMPORTANT:** Change before production!

### Error 4: "validateEmail is not defined"
**Cause:** utils.js not loaded

**Solution:** Add before firebase-auth.js:
```html
<script src="script/utils.js"></script>
```

### Error 5: "showSuccess is not defined"
**Cause:** utils.js not loaded or toast functions not available

**Solution:**
1. Check utils.js is loaded
2. Check loading.css is included:
```html
<link rel="stylesheet" href="style/loading.css">
```

### Error 6: Nothing happens when click register
**Cause:** JavaScript error preventing execution

**Solution:**
1. Open browser console (F12)
2. Look for red error messages
3. Fix errors from top to bottom

---

## 📋 Checklist Before Testing

- [ ] Firebase project created
- [ ] Firebase config copied to firebase-config.js
- [ ] Authentication enabled in Firebase Console
- [ ] Email/Password sign-in method enabled
- [ ] Firestore database created
- [ ] Firestore rules set to allow (for testing)
- [ ] All Firebase scripts loaded in HTML
- [ ] Scripts in correct order
- [ ] Browser console shows: "✅ Firebase initialized successfully"
- [ ] No errors in browser console

---

## 🔍 Debug Commands (Browser Console)

Run these in browser console (F12) to debug:

```javascript
// Check if Firebase is loaded
console.log('Firebase:', typeof firebase !== 'undefined' ? '✅' : '❌');

// Check if Auth is initialized
console.log('Auth:', window.firebaseAuth ? '✅' : '❌');

// Check if Firestore is initialized
console.log('Firestore:', window.firebaseDB ? '✅' : '❌');

// Check current user
console.log('Current User:', window.firebaseAuth.currentUser);

// Test Firestore connection
window.firebaseDB.collection('test').limit(1).get()
  .then(() => console.log('✅ Firestore connected'))
  .catch(err => console.error('❌ Firestore error:', err));

// Test auth service
console.log('AuthService:', typeof window.authService !== 'undefined' ? '✅' : '❌');

// Get all users (if rules allow)
window.firebaseDB.collection('users').get()
  .then(snapshot => {
    console.log('Users in database:', snapshot.size);
    snapshot.forEach(doc => console.log(doc.data()));
  });
```

---

## 🎯 Expected Console Output (Success)

When everything works, you should see:
```
✅ Firebase initialized successfully
📧 Auth: Ready
💾 Firestore: Ready
```

When registering:
```
Attempting registration with: {email: "test@example.com", userData: {...}}
✅ Account created successfully!
```

---

## 🚨 Important Notes

### About Storage (Berbayar)
- ❌ Firebase Storage requires **Blaze Plan** (pay-as-you-go)
- ✅ **Solution:** We use **base64** for images (stored in Firestore)
- ✅ **Free** and works perfectly for small/medium projects
- ⚠️ **Limitation:** Firestore document max size = 1MB
  - Solution: Compress images or limit size to 500KB

### About Firestore Rules
**For Testing (Development):**
```javascript
allow read, write: if true; // Allow everything
```

**For Production (Secure):**
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

---

## 📞 Still Having Issues?

If you followed all steps and still having problems:

1. **Check firebase-test.html** - Run all tests
2. **Screenshot the errors** - Console, Firebase Console, test results
3. **Check Firebase Console Logs** - Usage > Logs tab
4. **Try incognito mode** - Rule out cache/extension issues
5. **Try different browser** - Chrome recommended

---

## ✅ Success Criteria

You'll know it's working when:
- ✅ firebase-test.html shows all green checkmarks
- ✅ Can register new user
- ✅ User appears in Firebase Console > Authentication
- ✅ User document created in Firestore > users collection
- ✅ Can login with created user
- ✅ No errors in browser console

---

**Next:** Once registration/login works, we can migrate the rest of the website! 🚀
