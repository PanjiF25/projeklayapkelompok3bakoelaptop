// Firebase Authentication Service
// Handles user registration, login, logout, and auth state

class AuthService {
  constructor() {
    this.auth = window.firebaseAuth;
    this.db = window.firebaseDB;
    this.currentUser = null;
    
    // Listen to auth state changes
    this.auth.onAuthStateChanged(user => {
      this.currentUser = user;
      this.updateUIForAuthState(user);
    });
  }

  // Register new user with email and password
  async register(email, password, userData) {
    try {
      console.log('🔐 AuthService.register() called with:', { email, userData });
      
      showLoading('Creating your account...');
      
      console.log('📝 Creating user in Firebase Auth...');
      // Create user in Firebase Auth
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('✅ User created in Auth:', user.uid);

      console.log('👤 Updating profile...');
      // Update profile
      await user.updateProfile({
        displayName: userData.fullname
      });
      console.log('✅ Profile updated');

      console.log('💾 Saving to Firestore...');
      // Save additional user data to Firestore
      await this.db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: email,
        fullname: userData.fullname,
        username: userData.username,
        phone: userData.phone || '',
        role: 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ User data saved to Firestore');

      hideLoading();
      
      // Wait a bit for auth state to propagate, then redirect
      console.log('⏳ Waiting for auth state to propagate...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      showSuccess('Account created successfully!', 'Welcome!');
      
      // Redirect to home page
      setTimeout(() => {
        console.log('🔄 Redirecting to index.html...');
        window.location.href = 'index.html';
      }, 1500);
      
      return { success: true, user };
    } catch (error) {
      hideLoading();
      console.error('❌ Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Pendaftaran gagal. Silakan coba lagi.';
      
      // Detailed error messages in Indonesian
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = '❌ Email sudah terdaftar. Silakan gunakan email lain atau login.';
          break;
        case 'auth/invalid-email':
          errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
          break;
        case 'auth/weak-password':
          errorMessage = '❌ Password terlalu lemah. Minimal 6 karakter.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '❌ Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '❌ Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = '❌ Registrasi email/password tidak diaktifkan. Hubungi admin.';
          break;
        case 'permission-denied':
          errorMessage = '❌ Akses ditolak. Periksa pengaturan keamanan Firebase.';
          break;
        default:
          errorMessage = `❌ Error: ${error.message || 'Terjadi kesalahan tidak dikenal'}`;
      }
      
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Login user with email and password
  async login(email, password) {
    try {
      showLoading('Signing in...');
      
      const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await this.db.collection('users').doc(user.uid).get();
      const userData = userDoc.data();

      // Check if admin
      if (userData.role === 'admin') {
        hideLoading();
        window.location.href = 'admin.html';
      } else {
        hideLoading();
        window.location.href = 'index.html';
      }

      return { success: true, user, userData };
    } catch (error) {
      hideLoading();
      console.error('❌ Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Login gagal. Periksa email dan password Anda.';
      
      // Detailed error messages in Indonesian
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = '❌ Akun tidak ditemukan. Silakan daftar terlebih dahulu.';
          break;
        case 'auth/wrong-password':
          errorMessage = '❌ Password salah. Silakan coba lagi atau reset password.';
          break;
        case 'auth/invalid-email':
          errorMessage = '❌ Format email tidak valid. Contoh: nama@email.com';
          break;
        case 'auth/user-disabled':
          errorMessage = '❌ Akun Anda telah dinonaktifkan. Hubungi admin.';
          break;
        case 'auth/network-request-failed':
          errorMessage = '❌ Koneksi internet bermasalah. Periksa koneksi Anda dan coba lagi.';
          break;
        case 'auth/too-many-requests':
          errorMessage = '❌ Terlalu banyak percobaan login. Tunggu beberapa saat atau reset password.';
          break;
        case 'auth/invalid-credential':
          errorMessage = '❌ Email atau password salah. Periksa kembali data Anda.';
          break;
        default:
          errorMessage = `❌ Error: ${error.message || 'Terjadi kesalahan tidak dikenal'}`;
      }
      
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Logout user
  async logout() {
    try {
      await this.auth.signOut();
      showSuccess('Logged out successfully');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
      showError('Failed to logout. Please try again.');
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.auth.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid || this.auth.currentUser.uid).get();
      if (userDoc.exists) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      showLoading('Updating profile...');
      
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update Firestore
      await this.db.collection('users').doc(user.uid).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Update display name if provided
      if (updates.fullname) {
        await user.updateProfile({
          displayName: updates.fullname
        });
      }

      hideLoading();
      showSuccess('Profile updated successfully!');
      
      return { success: true };
    } catch (error) {
      hideLoading();
      console.error('Profile update error:', error);
      showError('Failed to update profile. Please try again.');
      return { success: false, error };
    }
  }

  // Send password reset email
  async resetPassword(email) {
    try {
      showLoading('Sending reset email...');
      await this.auth.sendPasswordResetEmail(email);
      hideLoading();
      showSuccess('Password reset email sent! Check your inbox.', 'Email Sent');
      return { success: true };
    } catch (error) {
      hideLoading();
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      }
      
      showError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Update UI based on auth state
  updateUIForAuthState(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (user) {
      // User is logged in
      if (authButtons) authButtons.style.display = 'none';
      if (userMenu) userMenu.style.display = 'flex';
    } else {
      // User is not logged in
      if (authButtons) authButtons.style.display = 'flex';
      if (userMenu) userMenu.style.display = 'none';
    }
  }

  // Require authentication (redirect to login if not logged in)
  requireAuth(redirectTo = 'login.html') {
    if (!this.isLoggedIn()) {
      showWarning('Please login to continue');
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 1500);
      return false;
    }
    return true;
  }

  // Require admin role
  async requireAdmin(redirectTo = 'index.html') {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }

    const userData = await this.getUserData();
    if (userData && userData.role === 'admin') {
      return true;
    }

    showError('Access denied. Admin only.');
    setTimeout(() => {
      window.location.href = redirectTo;
    }, 1500);
    return false;
  }
}

// Create global instance
window.authService = new AuthService();
