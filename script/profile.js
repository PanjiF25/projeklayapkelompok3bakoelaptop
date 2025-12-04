// Profile Page Functionality

// Section Navigation
function initSectionNavigation() {
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.content-section');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetSection = item.getAttribute('data-section');

      // Update active menu item
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      // Show target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${targetSection}-section`) {
          section.classList.add('active');
        }
      });
    });
  });
}

// Load user profile data
async function loadProfileData(user) {
  if (!user) {
    console.log('❌ No user logged in, redirecting...');
    window.location.href = 'login.html';
    return;
  }

  console.log('👤 Loading profile for:', user.email);

  try {
    const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Populate form fields
      document.getElementById('username').value = userData.username || '';
      document.getElementById('fullname').value = userData.fullname || '';
      document.getElementById('email').value = userData.email || '';
      document.getElementById('phone').value = userData.phone || '';
      document.getElementById('gender').value = userData.gender || '';
      document.getElementById('address').value = userData.address || '';
      
      // Format date for input
      if (userData.dob) {
        document.getElementById('dob').value = userData.dob;
      }

      // Update profile photos with loading transition
      const sidebarAvatar = document.getElementById('sidebar-avatar');
      const profilePhoto = document.getElementById('profile-photo');
      const avatarSkeleton = document.getElementById('avatar-skeleton');
      const photoSkeleton = document.getElementById('photo-skeleton');
      
      if (userData.photoURL) {
        // Preload images
        const img1 = new Image();
        const img2 = new Image();
        
        img1.onload = () => {
          sidebarAvatar.src = userData.photoURL;
          sidebarAvatar.style.display = 'block';
          if (avatarSkeleton) avatarSkeleton.style.display = 'none';
        };
        
        img2.onload = () => {
          profilePhoto.src = userData.photoURL;
          profilePhoto.style.display = 'block';
          if (photoSkeleton) photoSkeleton.style.display = 'none';
        };
        
        img1.src = userData.photoURL;
        img2.src = userData.photoURL;
      } else {
        // No photo, use default avatar
        const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.fullname || userData.username || 'User') + '&background=00d4aa&color=fff&size=150';
        
        sidebarAvatar.src = defaultAvatar;
        profilePhoto.src = defaultAvatar;
        sidebarAvatar.style.display = 'block';
        profilePhoto.style.display = 'block';
        if (avatarSkeleton) avatarSkeleton.style.display = 'none';
        if (photoSkeleton) photoSkeleton.style.display = 'none';
      }

      // Update sidebar profile
      const usernameElement = document.getElementById('sidebar-username');
      usernameElement.textContent = userData.fullname || userData.username || 'User';
      usernameElement.classList.remove('skeleton-text');
      document.getElementById('sidebar-email').textContent = userData.email || '';
      
      console.log('✅ Profile loaded:', userData.username);
    } else {
      // Use basic Firebase Auth data
      const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=00d4aa&color=fff&size=150';
      
      document.getElementById('email').value = user.email || '';
      document.getElementById('sidebar-avatar').src = defaultAvatar;
      document.getElementById('profile-photo').src = defaultAvatar;
      document.getElementById('sidebar-avatar').style.display = 'block';
      document.getElementById('profile-photo').style.display = 'block';
      
      const usernameElement = document.getElementById('sidebar-username');
      usernameElement.textContent = user.displayName || 'User';
      usernameElement.classList.remove('skeleton-text');
      document.getElementById('sidebar-email').textContent = user.email || '';
      
      // Hide skeletons
      const avatarSkeleton = document.getElementById('avatar-skeleton');
      const photoSkeleton = document.getElementById('photo-skeleton');
      if (avatarSkeleton) avatarSkeleton.style.display = 'none';
      if (photoSkeleton) photoSkeleton.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showError('Failed to load profile data');
    
    // Hide skeletons on error
    const avatarSkeleton = document.getElementById('avatar-skeleton');
    const photoSkeleton = document.getElementById('photo-skeleton');
    if (avatarSkeleton) avatarSkeleton.style.display = 'none';
    if (photoSkeleton) photoSkeleton.style.display = 'none';
  }
}

// Handle profile photo upload
async function uploadProfilePhoto(file) {
  const user = window.firebaseAuth.currentUser;
  
  if (!user) {
    showError('No user logged in');
    return;
  }

  // Validate file
  if (!file.type.startsWith('image/')) {
    showError('Please select an image file');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showError('Image size must be less than 2MB');
    return;
  }

  try {
    showLoading('Uploading photo...');

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoURL = e.target.result;

      try {
        // Update Firestore
        await window.firebaseDB.collection('users').doc(user.uid).update({
          photoURL: photoURL,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update UI with smooth transition
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        const profilePhoto = document.getElementById('profile-photo');
        
        sidebarAvatar.src = photoURL;
        profilePhoto.src = photoURL;
        sidebarAvatar.style.display = 'block';
        profilePhoto.style.display = 'block';

        hideLoading();
        showSuccess('Profile photo updated successfully!');
      } catch (error) {
        hideLoading();
        console.error('Error updating photo:', error);
        showError('Failed to update photo: ' + error.message);
      }
    };

    reader.onerror = () => {
      hideLoading();
      showError('Failed to read image file');
    };

    reader.readAsDataURL(file);
  } catch (error) {
    hideLoading();
    console.error('Error uploading photo:', error);
    showError('Failed to upload photo');
  }
}

// Save profile data
async function saveProfileData(event) {
  event.preventDefault();

  const user = window.firebaseAuth.currentUser;
  
  if (!user) {
    showError('No user logged in');
    return;
  }

  // Get form data
  const updatedData = {
    username: document.getElementById('username').value.trim(),
    fullname: document.getElementById('fullname').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    gender: document.getElementById('gender').value,
    dob: document.getElementById('dob').value,
    address: document.getElementById('address').value.trim()
  };

  // Validation
  if (!updatedData.username) {
    showError('Username is required');
    return;
  }

  try {
    showLoading('Saving profile...');
    
    // Update Firestore
    await window.firebaseDB.collection('users').doc(user.uid).update({
      username: updatedData.username,
      fullname: updatedData.fullname,
      phone: updatedData.phone,
      gender: updatedData.gender,
      dob: updatedData.dob,
      address: updatedData.address,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update sidebar
    document.getElementById('sidebar-username').textContent = updatedData.fullname || updatedData.username;

    hideLoading();
    showSuccess('Profile updated successfully!');
    
  } catch (error) {
    hideLoading();
    console.error('Error saving profile:', error);
    showError('Failed to save profile: ' + error.message);
  }
}

// Change password
async function changePassword(event) {
  event.preventDefault();

  const user = window.firebaseAuth.currentUser;
  
  if (!user) {
    showError('No user logged in');
    return;
  }

  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    showError('All fields are required');
    return;
  }

  if (newPassword !== confirmPassword) {
    showError('New passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  try {
    showLoading('Updating password...');
    
    // Re-authenticate user
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    
    await user.reauthenticateWithCredential(credential);
    
    // Update password
    await user.updatePassword(newPassword);

    // Clear form
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';

    hideLoading();
    showSuccess('Password updated successfully!');
    
  } catch (error) {
    hideLoading();
    console.error('Error changing password:', error);
    
    if (error.code === 'auth/wrong-password') {
      showError('Current password is incorrect');
    } else {
      showError('Failed to update password: ' + error.message);
    }
  }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Profile page initializing...');
  
  // Initialize section navigation
  initSectionNavigation();
  
  // Wait for Firebase Auth to be ready
  const waitForAuth = setInterval(() => {
    if (window.firebaseAuth) {
      clearInterval(waitForAuth);
      console.log('✅ Firebase Auth ready, setting up listener...');
      
      // Use auth state listener instead of direct call
      window.firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          console.log('✅ Auth state: User logged in:', user.email);
          loadProfileData(user);
        } else {
          console.log('❌ Auth state: No user, redirecting...');
          window.location.href = 'login.html';
        }
      });
    }
  }, 50);

  // Handle profile form submission
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', saveProfileData);
  }

  // Handle password form submission
  const passwordForm = document.querySelector('.password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', changePassword);
  }

  // Handle avatar upload (sidebar)
  const avatarContainer = document.querySelector('.avatar-container');
  const avatarUpload = document.getElementById('avatar-upload');
  
  if (avatarContainer && avatarUpload) {
    avatarContainer.addEventListener('click', () => {
      avatarUpload.click();
    });

    avatarUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadProfilePhoto(file);
      }
    });
  }

  // Handle change photo button (profile form)
  const changePhotoBtn = document.getElementById('change-photo-btn');
  
  if (changePhotoBtn) {
    changePhotoBtn.addEventListener('click', () => {
      avatarUpload.click();
    });
  }

  // Handle logout button
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      try {
        showLoading('Logging out...');
        await window.firebaseAuth.signOut();
        hideLoading();
        window.location.href = 'login.html';
      } catch (error) {
        hideLoading();
        console.error('Error logging out:', error);
        showError('Failed to logout');
      }
    });
  }

  // Initialize My Products section
  initMyProducts();

  // Initialize My Orders section
  initMyOrders();
});

// My Products Section
let currentFilter = 'all';
let userProducts = [];

function initMyProducts() {
  // Tab filter buttons
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      displayProducts();
    });
  });

  // Load products when section is opened
  const productsMenuItem = document.querySelector('.menu-item[data-section="products"]');
  if (productsMenuItem) {
    productsMenuItem.addEventListener('click', function() {
      loadUserProducts();
    });
  }
}

async function loadUserProducts() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  const container = document.getElementById('products-list');
  container.innerHTML = `
    <div class="loading-products">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading your products...</p>
    </div>
  `;

  try {
    const snapshot = await window.firebaseDB
      .collection('products')
      .where('sellerId', '==', user.uid)
      .get();

    userProducts = [];
    snapshot.forEach(doc => {
      userProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt manually (newest first)
    userProducts.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.toDate() - a.createdAt.toDate();
    });

    console.log(`📦 Loaded ${userProducts.length} products`);
    displayProducts();

  } catch (error) {
    console.error('Error loading products:', error);
    
    // Check if it's a permissions error
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
      container.innerHTML = `
        <div class="empty-products">
          <i class="fas fa-shield-alt" style="color: #ffc107;"></i>
          <h3>Firestore Rules Need Update</h3>
          <p style="color: #666; margin-bottom: 20px;">
            Please update your Firestore Security Rules to allow users to read their own products.
          </p>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 8px; text-align: left; margin-bottom: 20px;">
            <strong style="color: #856404; display: block; margin-bottom: 8px;">
              <i class="fas fa-info-circle"></i> Quick Fix:
            </strong>
            <ol style="color: #856404; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Open <a href="https://console.firebase.google.com" target="_blank" style="color: #00a896; font-weight: 600;">Firebase Console</a></li>
              <li>Go to <strong>Firestore Database → Rules</strong></li>
              <li>See <code>UPDATE_FIRESTORE_RULES.md</code> file for new rules</li>
              <li>Click <strong>Publish</strong> and refresh this page</li>
            </ol>
          </div>
          <button class="btn-primary" onclick="loadUserProducts()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    } else {
      // Other errors
      container.innerHTML = `
        <div class="empty-products">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Failed to Load Products</h3>
          <p>${error.message}</p>
          <button class="btn-primary" onclick="loadUserProducts()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      `;
    }
  }
}

function displayProducts() {
  const container = document.getElementById('products-list');
  
  // Filter products
  let filteredProducts = userProducts;
  if (currentFilter !== 'all') {
    filteredProducts = userProducts.filter(p => p.status === currentFilter);
  }

  if (filteredProducts.length === 0) {
    const filterText = currentFilter === 'all' ? 'products' : `${currentFilter} products`;
    container.innerHTML = `
      <div class="empty-products">
        <i class="fas fa-box-open"></i>
        <h3>No ${filterText.charAt(0).toUpperCase() + filterText.slice(1)}</h3>
        <p>You don't have any ${filterText} yet.</p>
        <a href="sell.html" class="btn-primary">
          <i class="fas fa-plus"></i> Sell a Product
        </a>
      </div>
    `;
    return;
  }

  // Display products
  container.innerHTML = filteredProducts.map(product => {
    const date = product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'N/A';

    const statusClass = `status-${product.status || 'pending'}`;
    const statusIcon = {
      pending: 'fa-clock',
      approved: 'fa-check-circle',
      rejected: 'fa-times-circle'
    }[product.status || 'pending'];

    const statusText = {
      pending: 'Under Review',
      approved: 'Accepted',
      rejected: 'Declined'
    }[product.status || 'pending'];

    // Get first image or fallback to imageURL
    const productImage = (product.images && product.images[0]) || product.imageURL || 'https://via.placeholder.com/150?text=No+Image';

    return `
      <div class="product-card" data-status="${product.status || 'pending'}">
        <img src="${productImage}" alt="${product.name}" class="product-image">
        <div class="product-info">
          <div class="product-header">
            <div>
              <h3 class="product-name">${product.name}</h3>
              <span class="product-category">
                <i class="fas fa-${product.category === 'laptop' ? 'laptop' : 'mobile-alt'}"></i>
                ${product.category}
              </span>
            </div>
            <span class="product-status ${statusClass}">
              <i class="fas ${statusIcon}"></i>
              ${statusText}
            </span>
          </div>
          <p class="product-specs">${product.specs}</p>
          <div class="product-footer">
            <span class="product-price">${formatCurrency(product.price)}</span>
            <div class="product-meta">
              <span class="product-date">
                <i class="far fa-calendar"></i>
                ${date}
              </span>
            </div>
          </div>
          ${product.status === 'rejected' && product.rejectionReason ? `
            <div style="margin-top: 12px; padding: 10px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 8px;">
              <strong style="color: #721c24; font-size: 13px;">Rejection Reason:</strong>
              <p style="color: #721c24; font-size: 12px; margin: 5px 0 0 0;">${product.rejectionReason}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==================== MY ORDERS SECTION ====================

let currentOrderFilter = 'all';
let userOrders = [];

function initMyOrders() {
  // Tab filter buttons
  const ordersSection = document.getElementById('orders-section');
  if (!ordersSection) return;

  const tabBtns = ordersSection.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      tabBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentOrderFilter = this.getAttribute('data-filter');
      displayOrders();
    });
  });

  // Load orders when section is opened
  const ordersMenuItem = document.querySelector('.menu-item[data-section="orders"]');
  if (ordersMenuItem) {
    ordersMenuItem.addEventListener('click', function() {
      loadUserOrders();
    });
  }
}

async function loadUserOrders() {
  const user = window.firebaseAuth?.currentUser;
  if (!user) return;

  const container = document.getElementById('orders-list');
  container.innerHTML = `
    <div class="loading-products">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading your orders...</p>
    </div>
  `;

  try {
    const snapshot = await window.firebaseDB
      .collection('orders')
      .where('userId', '==', user.uid)
      .get();

    userOrders = [];
    snapshot.forEach(doc => {
      userOrders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by createdAt manually (newest first)
    userOrders.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.toDate() - a.createdAt.toDate();
    });

    console.log(`📦 Loaded ${userOrders.length} orders`);
    displayOrders();

  } catch (error) {
    console.error('Error loading orders:', error);
    container.innerHTML = `
      <div class="empty-products">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Failed to Load Orders</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="loadUserOrders()">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
  }
}

function displayOrders() {
  const container = document.getElementById('orders-list');
  
  // Filter orders by payment status
  let filteredOrders = userOrders;
  if (currentOrderFilter !== 'all') {
    filteredOrders = userOrders.filter(o => o.paymentStatus === currentOrderFilter);
  }

  if (filteredOrders.length === 0) {
    const filterText = currentOrderFilter === 'all' ? 'orders' : `${currentOrderFilter} payment orders`;
    container.innerHTML = `
      <div class="empty-products">
        <i class="fas fa-shopping-bag"></i>
        <h3>No ${filterText.charAt(0).toUpperCase() + filterText.slice(1)}</h3>
        <p>You don't have any ${filterText} yet.</p>
        <a href="buy.html" class="btn-primary">
          <i class="fas fa-shopping-cart"></i> Start Shopping
        </a>
      </div>
    `;
    return;
  }

  // Display orders
  container.innerHTML = filteredOrders.map(order => {
    const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';

    const paymentStatusClass = `status-${order.paymentStatus || 'pending'}`;
    const paymentStatusIcon = {
      pending: 'fa-clock',
      approved: 'fa-check-circle',
      rejected: 'fa-times-circle'
    }[order.paymentStatus || 'pending'];

    const paymentStatusText = {
      pending: 'Pending Verification',
      approved: 'Payment Approved',
      rejected: 'Payment Rejected'
    }[order.paymentStatus || 'pending'];

    return `
      <div class="order-card" data-status="${order.paymentStatus || 'pending'}">
        <div class="order-header">
          <div>
            <h3 class="order-id">Order #${order.id.substring(0, 8)}</h3>
            <span class="order-date">
              <i class="far fa-calendar"></i>
              ${date}
            </span>
          </div>
          <span class="product-status ${paymentStatusClass}">
            <i class="fas ${paymentStatusIcon}"></i>
            ${paymentStatusText}
          </span>
        </div>

        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <img src="${item.imageURL || 'https://via.placeholder.com/60'}" alt="${item.name}" class="order-item-image">
              <div class="order-item-details">
                <h4>${item.name}</h4>
                <p class="item-price">${formatCurrency(item.price)}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="order-footer">
          <div class="order-payment-info">
            <span><i class="fas fa-wallet"></i> ${order.paymentMethod}</span>
            ${order.paymentProof ? `
              <button class="view-proof-btn" onclick="viewPaymentProof('${order.id}')">
                <i class="fas fa-image"></i> View Proof
              </button>
            ` : ''}
          </div>
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-amount">${formatCurrency(order.total)}</span>
          </div>
        </div>

        ${order.paymentStatus === 'rejected' && order.rejectionReason ? `
          <div style="margin-top: 12px; padding: 12px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 8px;">
            <strong style="color: #721c24; font-size: 13px; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-exclamation-circle"></i> Rejection Reason:
            </strong>
            <p style="color: #721c24; font-size: 12px; margin: 8px 0 0 0;">${order.rejectionReason}</p>
          </div>
        ` : ''}

        ${order.paymentStatus === 'approved' ? `
          <div style="margin-top: 12px; padding: 12px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 8px;">
            <p style="color: #155724; font-size: 13px; margin: 0; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-check-circle"></i>
              <strong>Payment verified!</strong> Your order is being processed.
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// View payment proof in modal
function viewPaymentProof(orderId) {
  const order = userOrders.find(o => o.id === orderId);
  if (!order || !order.paymentProof) return;

  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 20px;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0;">Payment Proof</h3>
        <button onclick="this.closest('[style*=fixed]').remove()" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        ">&times;</button>
      </div>
      <img src="${order.paymentProof}" alt="Payment Proof" style="
        width: 100%;
        border-radius: 8px;
        border: 1px solid #ddd;
      ">
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}
