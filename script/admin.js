// Admin Dashboard JavaScript
console.log('🚀 admin.js loaded');

// Helper: Format currency
function formatCurrency(amount) {
  const num = parseInt(amount);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + num.toLocaleString('id-ID');
}

// Wait for Firebase to be ready
let firebaseReady = false;
let waitAttempts = 0;
const maxAttempts = 50; // 5 seconds max

const waitForFirebase = setInterval(() => {
  waitAttempts++;
  
  const fbReady = window.firebaseInitialized && window.firebaseAuth && window.firebaseDB;
  
  if (waitAttempts <= 3 || waitAttempts % 10 === 0) {
    console.log(`⏳ Waiting for Firebase (attempt ${waitAttempts})...`, {
      firebaseInitialized: window.firebaseInitialized,
      firebaseAuth: !!window.firebaseAuth,
      firebaseDB: !!window.firebaseDB
    });
  }
  
  if (fbReady) {
    console.log('✅ Firebase ready in admin.js');
    firebaseReady = true;
    clearInterval(waitForFirebase);
    initAdmin();
  } else if (waitAttempts >= maxAttempts) {
    console.error('❌ Timeout waiting for Firebase after 5 seconds');
    clearInterval(waitForFirebase);
    alert('Error: Firebase tidak ready. Silakan refresh halaman.');
  }
}, 100);

// Initialize Admin Dashboard
function initAdmin() {
  // Check auth state
  window.firebaseAuth.onAuthStateChanged(async (user) => {
    if (!user) {
      console.log('❌ No user logged in, redirecting...');
      window.location.href = 'login.html';
      return;
    }

    console.log('✅ User logged in:', user.email);

    // Check if user is admin
    try {
      console.log('🔍 Checking user document for:', user.uid);
      const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        console.log('❌ User document does not exist');
        alert('User document tidak ditemukan di Firestore. Silakan register ulang atau buat admin user.');
        window.location.href = 'index.html';
        return;
      }
      
      const userData = userDoc.data();
      console.log('📄 User data:', userData);
      console.log('🔑 User role:', userData.role);

      if (!userData || userData.role !== 'admin') {
        console.log('❌ User is not admin. Role:', userData?.role || 'undefined');
        alert('Akses Ditolak: Anda tidak memiliki akses ke dashboard admin. Role: ' + (userData?.role || 'none'));
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
        return;
      }

      console.log('✅ Admin access granted');
      document.getElementById('admin-name').textContent = userData.name || user.email;
      
      // Load data
      console.log('🔄 Starting to load admin data...');
      await loadDashboardStats();
      await loadPendingProducts();
      await loadProducts();
      console.log('✅ All admin data loaded');
    } catch (error) {
      console.error('Error checking admin status:', error);
      showCustomAlert('Error', 'Terjadi kesalahan saat memeriksa akses admin.');
    }
  });
}

// Load Pending Products
async function loadPendingProducts() {
  const container = document.getElementById('pending-products-container');
  const pendingCount = document.getElementById('pending-count');
  
  try {
    console.log('🔄 Loading pending products...');
    
    const snapshot = await window.firebaseDB.collection('products')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Found ${products.length} pending products`);
    pendingCount.textContent = products.length;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <h3>Tidak Ada Produk Pending</h3>
          <p>Semua produk sudah disetujui atau ditolak</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(product => `
      <div class="pending-product-card" data-product-id="${product.id}">
        <img src="${product.imageURL}" alt="${product.name}" class="pending-product-image" onerror="this.src='https://via.placeholder.com/320x220?text=No+Image'">
        <div class="pending-product-info">
          <div class="pending-product-header">
            <h3 class="pending-product-name">${product.name}</h3>
            <span class="pending-status-badge">PENDING</span>
          </div>
          
          <span class="pending-product-category">${product.category}</span>
          
          <div class="pending-product-price">${formatCurrency(product.price)}</div>
          
          <p class="pending-product-specs">${product.specs}</p>
          
          <div class="pending-product-seller">
            <p><strong>Penjual:</strong> ${product.sellerName}</p>
            <p><strong>Email:</strong> ${product.sellerEmail}</p>
            <p><strong>Kondisi:</strong> ${product.condition}</p>
            <p><strong>Tanggal:</strong> ${formatDate(product.createdAt)}</p>
          </div>
          
          <div class="pending-product-actions">
            <button class="btn-approve" onclick="approveProduct('${product.id}', '${product.name}')">
              <i class="fas fa-check"></i> Setujui
            </button>
            <button class="btn-reject" onclick="rejectProduct('${product.id}', '${product.name}')">
              <i class="fas fa-times"></i> Tolak
            </button>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading pending products:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error Loading Products</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Approve Product
async function approveProduct(productId, productName) {
  showCustomConfirm(
    `Setujui produk "${productName}"? Produk akan muncul di halaman Buy.`,
    async () => {
      try {
        await window.firebaseDB.collection('products').doc(productId).update({
          status: 'approved',
          approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Product ${productId} approved`);
        showCustomAlert('Berhasil!', `Produk "${productName}" telah disetujui.`);
        loadPendingProducts(); // Reload
        loadDashboardStats(); // Update stats
      } catch (error) {
        console.error('Error approving product:', error);
        showCustomAlert('Error', 'Gagal menyetujui produk: ' + error.message);
      }
    },
    'Setujui Produk'
  );
}

// Reject Product
async function rejectProduct(productId, productName) {
  showCustomConfirm(
    `Tolak produk "${productName}"? Produk tidak akan ditampilkan di halaman Buy.`,
    async () => {
      try {
        await window.firebaseDB.collection('products').doc(productId).update({
          status: 'rejected',
          rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Product ${productId} rejected`);
        showCustomAlert('Berhasil!', `Produk "${productName}" telah ditolak.`);
        loadPendingProducts(); // Reload
        loadDashboardStats(); // Update stats
      } catch (error) {
        console.error('Error rejecting product:', error);
        showCustomAlert('Error', 'Gagal menolak produk: ' + error.message);
      }
    },
    'Tolak Produk'
  );
}

// Refresh Pending Button
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-pending-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadPendingProducts();
    });
  }
});

// Delete Product from Firebase
async function deleteProductFirebase(productId, productName) {
  showCustomConfirm(
    `Hapus produk "${productName}"? Data tidak bisa dikembalikan!`,
    async () => {
      try {
        await window.firebaseDB.collection('products').doc(productId).delete();
        console.log(`✅ Product ${productId} deleted`);
        showCustomAlert('Berhasil!', `Produk "${productName}" telah dihapus.`);
        loadProducts(); // Reload
        loadDashboardStats(); // Update stats
        loadPendingProducts(); // Update pending if needed
      } catch (error) {
        console.error('Error deleting product:', error);
        showCustomAlert('Error', 'Gagal menghapus produk: ' + error.message);
      }
    },
    'Hapus Produk'
  );
}

// Mark Product as Sold
async function markAsSold(productId, productName) {
  showCustomConfirm(
    `Tandai produk "${productName}" sebagai TERJUAL? Produk akan hilang dari halaman Buy.`,
    async () => {
      try {
        await window.firebaseDB.collection('products').doc(productId).update({
          sold: true,
          soldAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Product ${productId} marked as sold`);
        showCustomAlert('Berhasil!', `Produk "${productName}" ditandai sebagai TERJUAL.`);
        loadProducts(); // Reload
      } catch (error) {
        console.error('Error marking as sold:', error);
        showCustomAlert('Error', 'Gagal menandai produk: ' + error.message);
      }
    },
    'Tandai Terjual'
  );
}

// Edit Product (placeholder for future)
async function editProductFirebase(productId) {
  try {
    const productDoc = await window.firebaseDB.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      showCustomAlert('Error', 'Produk tidak ditemukan!');
      return;
    }
    
    const product = productDoc.data();
    
    // Populate modal
    document.getElementById('modal-title').textContent = 'Edit Produk';
    document.getElementById('product-id').value = productId;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-category').value = product.category || 'laptop';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-specs').value = product.specs || '';
    
    // Determine if image is URL or base64
    const imageURL = product.imageURL || product.image || '';
    const isBase64 = imageURL.startsWith('data:');
    
    if (isBase64) {
      // Select upload radio and show preview
      document.querySelector('input[name="image-type"][value="upload"]').checked = true;
      document.getElementById('url-input-container').classList.remove('active');
      document.getElementById('file-input-container').classList.add('active');
      document.getElementById('image-preview').src = imageURL;
      document.getElementById('image-preview-container').style.display = 'block';
      document.getElementById('file-name').textContent = 'Gambar saat ini';
    } else {
      // Select URL radio and populate URL input
      document.querySelector('input[name="image-type"][value="url"]').checked = true;
      document.getElementById('url-input-container').classList.add('active');
      document.getElementById('file-input-container').classList.remove('active');
      document.getElementById('product-image-url').value = imageURL;
    }
    
    document.getElementById('product-modal').classList.add('active');
  } catch (error) {
    console.error('Error loading product for edit:', error);
    showCustomAlert('Error', 'Gagal memuat data produk: ' + error.message);
  }
}

// Format Date Helper
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// OLD CODE - DISABLED (Now using Firebase auth)
// Check if admin is logged in
function checkAdminAuth() {
  const adminUser = localStorage.getItem('adminUser');
  if (!adminUser) {
    window.location.href = 'index.html';
    return false;
  }
  
  const admin = JSON.parse(adminUser);
  document.getElementById('admin-name').textContent = admin.username;
  return true;
}

// Initialize - DISABLED (Now using initAdmin() with Firebase)
// if (checkAdminAuth()) {
//   loadDashboardStats();
//   loadProducts();
//   loadOrders();
//   loadPayments();
//   loadUsers();
// }

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Remove active class from all items
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked item
    item.classList.add('active');
    const sectionId = item.dataset.section + '-section';
    document.getElementById(sectionId).classList.add('active');
    
    // Load data when section is opened
    const section = item.dataset.section;
    if (section === 'orders') {
      loadOrders();
    } else if (section === 'users') {
      loadUsers();
    }
  });
});

// Logout
document.getElementById('admin-logout').addEventListener('click', () => {
  showCustomConfirm(
    'Anda yakin ingin keluar dari dashboard admin?',
    async () => {
      try {
        showLoading('Logging out...');
        
        // Sign out from Firebase Auth
        await window.firebaseAuth.signOut();
        
        // Clear local storage
        localStorage.removeItem('adminUser');
        
        hideLoading();
        console.log('✅ Admin logged out successfully');
        
        // Redirect to home
        window.location.href = 'index.html';
      } catch (error) {
        hideLoading();
        console.error('Error logging out:', error);
        showCustomAlert('Error logging out: ' + error.message, 'Error');
      }
    },
    'Konfirmasi Logout'
  );
});

// Load Dashboard Stats
async function loadDashboardStats() {
  try {
    // Get all products
    const productsSnapshot = await window.firebaseDB.collection('products').get();
    const totalProducts = productsSnapshot.size;
    
    // Get pending products
    const pendingSnapshot = await window.firebaseDB.collection('products')
      .where('status', '==', 'pending')
      .get();
    const pendingProducts = pendingSnapshot.size;
    
    // Get approved products
    const approvedSnapshot = await window.firebaseDB.collection('products')
      .where('status', '==', 'approved')
      .get();
    const approvedProducts = approvedSnapshot.size;
    
    // Get all orders from Firestore
    const ordersSnapshot = await window.firebaseDB.collection('orders').get();
    const totalOrders = ordersSnapshot.size;
    
    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingProducts; // Using as pending products count
    document.getElementById('completed-orders').textContent = approvedProducts; // Using as approved products count
    
    // Load recent orders
    await loadRecentOrders();
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

async function loadRecentOrders() {
  const container = document.getElementById('recent-orders');
  
  try {
    // Get latest 5 orders from Firestore
    const snapshot = await window.firebaseDB.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    if (snapshot.empty) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><h3>Belum Ada Pesanan</h3></div>';
      return;
    }
    
    let html = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa; text-align: left;">
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Order ID</th>
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Customer</th>
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Items</th>
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Total</th>
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Payment</th>
            <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Tanggal</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    snapshot.forEach(doc => {
      const order = doc.data();
      const orderId = doc.id;
      const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }) : 'N/A';
      
      const paymentStatusInfo = {
        pending: { text: 'Pending', color: '#ffc107' },
        approved: { text: 'Approved', color: '#00d4aa' },
        rejected: { text: 'Rejected', color: '#dc3545' }
      }[order.paymentStatus || 'pending'];
      
      html += `
        <tr style="cursor: pointer; transition: background 0.2s;" onclick="showSection('orders'); setTimeout(() => viewOrderDetail('${orderId}'), 100);" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;"><strong>#${orderId.substring(0, 8)}</strong></td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${order.customerName || 'Guest'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${order.items ? order.items.length : 0} item(s)</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">Rp ${order.total ? parseInt(order.total).toLocaleString('id-ID') : '0'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
            <span style="background: ${paymentStatusInfo.color}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">
              ${paymentStatusInfo.text}
            </span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #666;">${date}</td>
        </tr>
      `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading recent orders:', error);
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle" style="color: #dc3545;"></i><h3>Error loading orders</h3></div>';
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Menunggu Pembayaran',
    'paid': 'Sudah Bayar',
    'confirmed': 'Dikonfirmasi',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusMap[status] || status;
}

// ==================== PRODUCTS MANAGEMENT ====================

async function loadProducts() {
  const tbody = document.getElementById('products-tbody');
  
  if (!tbody) {
    console.error('❌ Element products-tbody not found!');
    return;
  }
  
  console.log('📦 loadProducts() called');
  
  try {
    console.log('🔄 Loading all products from Firestore...');
    
    // Get all products (approved, pending, rejected)
    const productsSnapshot = await window.firebaseDB.collection('products')
      .orderBy('createdAt', 'desc')
      .get();
    
    if (productsSnapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-box-open"></i><h3>Belum Ada Produk</h3></div></td></tr>';
      return;
    }
    
    console.log(`✅ Found ${productsSnapshot.size} products`);
    
    const products = [];
    productsSnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    tbody.innerHTML = products.map(product => {
      // Status badge color - Check if sold first (priority)
      let statusColor = '#ffa500'; // orange for pending
      let statusText = 'Pending';
      
      if (product.status === 'sold') {
        statusColor = '#dc3545'; // red for sold
        statusText = 'Sold';
      } else if (product.status === 'approved') {
        statusColor = '#00d4aa';
        statusText = 'Approved';
      } else if (product.status === 'rejected') {
        statusColor = '#ff6b6b';
        statusText = 'Rejected';
      }
      
      // Sold badge (backup if status not updated)
      const soldBadge = product.sold && product.status !== 'sold' ? '<span class="badge" style="background: #dc3545; margin-left: 5px;">SOLD</span>' : '';
      
      return `
        <tr>
          <td><img src="${product.imageURL || 'https://via.placeholder.com/80'}" alt="${product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"></td>
          <td><strong>${product.name}</strong></td>
          <td><span class="badge">${product.category}</span></td>
          <td>${formatCurrency(product.price)}</td>
          <td>${product.specs?.substring(0, 50) || 'N/A'}...</td>
          <td>
            <span class="badge" style="background: ${statusColor};">${statusText}</span>
            ${soldBadge}
          </td>
          <td>
            <div class="action-buttons" style="display: flex; gap: 8px; justify-content: center;">
              <button class="btn-edit" onclick="editProductFirebase('${product.id}')" title="Edit" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
                font-size: 14px;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn-delete" onclick="deleteProductFirebase('${product.id}', '${product.name}')" title="Hapus" style="
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: transform 0.2s;
                font-size: 14px;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-trash"></i>
              </button>
              ${product.status === 'approved' && !product.sold ? 
                `<button onclick="markAsSold('${product.id}', '${product.name}')" title="Mark as Sold" style="
                  background: linear-gradient(135deg, #00d4aa 0%, #00a896 100%);
                  color: white;
                  border: none;
                  padding: 8px 12px;
                  border-radius: 8px;
                  cursor: pointer;
                  transition: transform 0.2s;
                  font-size: 14px;
                " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                  <i class="fas fa-check-circle"></i>
                </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
  } catch (error) {
    console.error('❌ Error loading products:', error);
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="color: #ff6b6b;"><i class="fas fa-exclamation-circle"></i><h3>Error: ${error.message}</h3></div></td></tr>`;
  }
}

function getDefaultProducts() {
  return [
    {
      id: 1,
      name: "ASUS TUF Gaming F15",
      price: "12000000",
      specs: "Intel Core i5-11400H, RTX 3050, 8GB RAM, 512GB SSD",
      image: "https://images.tokopedia.net/img/cache/700/VqbcmM/2023/9/26/ee1a44f7-9c8f-4b0c-80c3-f2f5db9f9b4e.jpg",
      category: "laptop"
    },
    {
      id: 2,
      name: "Lenovo IdeaPad Slim 3",
      price: "6500000",
      specs: "AMD Ryzen 5 5500U, Vega 7, 8GB RAM, 512GB SSD",
      image: "https://p-id.ipricegroup.com/uploaded_3f5f3f5f3f5f3f5f3f5f3f5f3f5f3f5f.jpg",
      category: "laptop"
    },
    {
      id: 3,
      name: "HP Pavilion 14",
      price: "8500000",
      specs: "Intel Core i5-1135G7, Iris Xe, 8GB RAM, 512GB SSD",
      image: "https://ssl-product-images.www8-hp.com/digmedialib/prodimg/lowres/c07755415.png",
      category: "laptop"
    },
    {
      id: 4,
      name: "iPhone 13 Pro Max",
      price: "18000000",
      specs: "A15 Bionic, 6.7 inch, 128GB, 12MP Triple Camera",
      image: "https://cdn.eraspace.com/media/catalog/product/a/p/apple_iphone_13_pro_max_alpine_green_1_3.jpg",
      category: "handphone"
    },
    {
      id: 5,
      name: "Samsung Galaxy S23 Ultra",
      price: "17000000",
      specs: "Snapdragon 8 Gen 2, 6.8 inch, 256GB, 200MP Camera",
      image: "https://images.samsung.com/id/smartphones/galaxy-s23-ultra/images/galaxy-s23-ultra-highlights-color-green.jpg",
      category: "handphone"
    },
    {
      id: 6,
      name: "Xiaomi 13 Pro",
      price: "12000000",
      specs: "Snapdragon 8 Gen 2, 6.73 inch, 256GB, Leica Camera",
      image: "https://cdn.eraspace.com/media/catalog/product/x/i/xiaomi_13_pro_black_1_1.jpg",
      category: "handphone"
    },
    {
      id: 7,
      name: "OPPO Find X5 Pro",
      price: "14000000",
      specs: "Snapdragon 8 Gen 1, 6.7 inch, 256GB, Hasselblad Camera",
      image: "https://image.oppo.com/content/dam/oppo/product-asset-library/find/find-x5-pro/v1/assets/find-x5-pro-black-back.png",
      category: "handphone"
    }
  ];
}

// Add Product Button
document.getElementById('add-product-btn').addEventListener('click', () => {
  document.getElementById('modal-title').textContent = 'Tambah Produk';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  
  // Reset image input to URL by default
  document.querySelector('input[name="image-type"][value="url"]').checked = true;
  document.getElementById('url-input-container').classList.add('active');
  document.getElementById('file-input-container').classList.remove('active');
  document.getElementById('image-preview-container').style.display = 'none';
  document.getElementById('file-name').textContent = 'Klik untuk pilih gambar';
  
  document.getElementById('product-modal').classList.add('active');
});

// Product Form Submit
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const productId = document.getElementById('product-id').value;
  
  // Get image source based on selected type
  const imageType = document.querySelector('input[name="image-type"]:checked').value;
  let imageSource = '';
  
  if (imageType === 'url') {
    imageSource = document.getElementById('product-image-url').value;
    if (!imageSource) {
      showCustomAlert('Error', 'Silakan masukkan URL gambar!');
      return;
    }
  } else {
    // Use base64 from preview if available
    const previewImg = document.getElementById('image-preview');
    if (previewImg.src && previewImg.src.startsWith('data:')) {
      imageSource = previewImg.src;
    } else {
      showCustomAlert('Error', 'Silakan pilih gambar terlebih dahulu!');
      return;
    }
  }
  
  try {
    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    
    const currentUser = window.firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error('USER_NOT_LOGGED_IN');
    }
    
    // Validate form data
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const specs = document.getElementById('product-specs').value.trim();
    
    if (!name) throw new Error('VALIDATION_NAME_EMPTY');
    if (!category) throw new Error('VALIDATION_CATEGORY_EMPTY');
    if (!price || parseInt(price) <= 0) throw new Error('VALIDATION_PRICE_INVALID');
    if (!specs) throw new Error('VALIDATION_SPECS_EMPTY');
    if (!imageSource) throw new Error('VALIDATION_IMAGE_EMPTY');
    
    // Get user data for seller info
    const userDoc = await window.firebaseDB.collection('users').doc(currentUser.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Prepare product data
    const productData = {
      name: name,
      category: category,
      price: price,
      specs: specs,
      imageURL: imageSource,
      status: 'approved', // Admin can approve their own products directly
      sold: false,
      sellerId: currentUser.uid,
      sellerName: userData.name || currentUser.displayName || currentUser.email,
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore
    if (productId) {
      await window.firebaseDB.collection('products').doc(productId).update(productData);
      showCustomAlert('Sukses!', 'Produk berhasil diupdate!');
    } else {
      productData.createdAt = new Date().toISOString();
      const docRef = await window.firebaseDB.collection('products').add(productData);
      console.log('✅ Product added:', docRef.id);
      showCustomAlert('Sukses!', 'Produk berhasil ditambahkan!');
    }
    
    // Reload data
    await loadProducts();
    await loadDashboardStats();
    closeModal('product-modal');
    
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  } catch (error) {
    console.error('Error:', error);
    
    let title = 'Gagal Menyimpan Produk';
    let message = '';
    
    // Handle different error types
    if (error.code === 'permission-denied') {
      title = '🔒 Akses Ditolak';
      message = `
        Firestore Security Rules belum di-update.<br><br>
        <strong>Solusi:</strong><br>
        1. Buka file <strong>update-firestore-rules.html</strong><br>
        2. Klik tombol "Copy Rules & Buka Firebase Console"<br>
        3. Paste di Firebase Console → Firestore → Rules<br>
        4. Klik "Publish"
      `;
    } else if (error.message === 'USER_NOT_LOGGED_IN') {
      title = '⚠️ Sesi Berakhir';
      message = 'Silakan logout dan login kembali.';
    } else if (error.message.startsWith('VALIDATION_')) {
      title = '⚠️ Form Tidak Lengkap';
      const validationErrors = {
        'VALIDATION_NAME_EMPTY': 'Nama produk tidak boleh kosong',
        'VALIDATION_CATEGORY_EMPTY': 'Kategori harus dipilih',
        'VALIDATION_PRICE_INVALID': 'Harga harus lebih dari 0',
        'VALIDATION_SPECS_EMPTY': 'Spesifikasi tidak boleh kosong',
        'VALIDATION_IMAGE_EMPTY': 'Gambar harus diisi'
      };
      message = validationErrors[error.message] || error.message;
    } else {
      message = error.message;
    }
    
    showCustomAlert(title, message);
    
    // Reset button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Simpan';
    }
  }
});

// ==================== OLD LOCALSTORAGE FUNCTIONS (DEPRECATED - DO NOT USE) ====================
// These functions are kept for reference only. Use editProductFirebase and deleteProductFirebase instead.

// function editProduct(id) {
//   const products = JSON.parse(localStorage.getItem('products')) || getDefaultProducts();
//   const product = products.find(p => p.id === id);
//   
//   if (product) {
//     document.getElementById('modal-title').textContent = 'Edit Produk';
//     document.getElementById('product-id').value = product.id;
//     document.getElementById('product-name').value = product.name;
//     document.getElementById('product-category').value = product.category;
//     document.getElementById('product-price').value = product.price;
//     document.getElementById('product-specs').value = product.specs;
//     
//     // Determine if image is URL or base64
//     const isBase64 = product.image && product.image.startsWith('data:');
//     
//     if (isBase64) {
//       // Select upload radio and show preview
//       document.querySelector('input[name="image-type"][value="upload"]').checked = true;
//       document.getElementById('url-input-container').classList.remove('active');
//       document.getElementById('file-input-container').classList.add('active');
//       document.getElementById('image-preview').src = product.image;
//       document.getElementById('image-preview-container').style.display = 'block';
//       document.getElementById('file-name').textContent = 'Gambar saat ini';
//     } else {
//       // Select URL radio and populate URL input
//       document.querySelector('input[name="image-type"][value="url"]').checked = true;
//       document.getElementById('url-input-container').classList.add('active');
//       document.getElementById('file-input-container').classList.remove('active');
//       document.getElementById('product-image-url').value = product.image;
//     }
//     
//     document.getElementById('product-modal').classList.add('active');
//   }
// }

// function deleteProduct(id) {
//   showCustomConfirm('Yakin ingin menghapus produk ini?', () => {
//     let products = JSON.parse(localStorage.getItem('products')) || getDefaultProducts();
//     products = products.filter(p => p.id !== id);
//     localStorage.setItem('products', JSON.stringify(products));
//     loadProducts();
//     loadDashboardStats();
//     showCustomAlert('Produk berhasil dihapus!');
//   }, 'Hapus Produk');
// }

// ==================== ORDERS MANAGEMENT ====================

async function loadOrders() {
  const container = document.getElementById('orders-list');
  const filter = document.getElementById('order-filter')?.value || 'all';
  
  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>Loading Orders...</h3>
    </div>
  `;

  try {
    // Get all orders from Firestore
    const snapshot = await window.firebaseDB.collection('orders')
      .get();
    
    let orders = [];
    snapshot.forEach(doc => {
      orders.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt (newest first)
    orders.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return b.createdAt.toDate() - a.createdAt.toDate();
    });

    // Filter by payment status
    if (filter !== 'all') {
      orders = orders.filter(o => o.paymentStatus === filter);
    }

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>Belum Ada Pesanan</h3>
          <p>Pesanan dari customer akan muncul di sini</p>
        </div>
      `;
      return;
    }

    // Display orders
    container.innerHTML = orders.map(order => {
      const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A';

      const paymentStatusInfo = {
        pending: { text: 'Pending Verification', color: '#ffc107', icon: 'fa-clock' },
        approved: { text: 'Payment Approved', color: '#00d4aa', icon: 'fa-check-circle' },
        rejected: { text: 'Payment Rejected', color: '#dc3545', icon: 'fa-times-circle' }
      }[order.paymentStatus || 'pending'];
      
      const paymentStatusClass = `status-${order.paymentStatus || 'pending'}`;
      const paymentStatusText = paymentStatusInfo.text;

      return `
        <div class="order-card" onclick="viewOrderDetail('${order.id}')">
          <div class="order-header">
            <div>
              <span class="order-id">Order #${order.id.substring(0, 8)}</span>
              <div style="font-size: 13px; color: #888; margin-top: 5px;">
                <i class="far fa-calendar"></i> ${date}
              </div>
            </div>
            <span class="order-status" style="background: ${paymentStatusInfo.color}; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              <i class="fas ${paymentStatusInfo.icon}"></i> ${paymentStatusText}
            </span>
          </div>
          <div class="order-details">
            <div class="order-detail-item">
              <strong>Customer:</strong>
              <span>${order.customerName || 'Guest'}</span>
            </div>
            <div class="order-detail-item">
              <strong>Email:</strong>
              <span>${order.userEmail || '-'}</span>
            </div>
            <div class="order-detail-item">
              <strong>Total:</strong>
              <span>Rp ${order.total ? parseInt(order.total).toLocaleString('id-ID') : '0'}</span>
            </div>
            <div class="order-detail-item">
              <strong>Payment Method:</strong>
              <span>${order.paymentMethod || '-'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading orders:', error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle" style="color: #dc3545;"></i>
        <h3>Error Loading Orders</h3>
        <p>${error.message}</p>
        <button class="btn-primary" onclick="loadOrders()">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `;
  }
}

function loadOrdersOld() {
  // OLD CODE - kept for reference
  const filter = document.getElementById('order-filter').value;
  let orders = JSON.parse(localStorage.getItem('allOrders')) || [];
  
  if (filter !== 'all') {
    orders = orders.filter(order => order.status === filter);
  }
  
  const container = document.getElementById('orders-list');
  
  container.innerHTML = orders.map(order => `
    <div class="order-card" onclick="viewOrderDetail('${order.orderId}')">
      <div class="order-header">
        <span class="order-id">Order #${order.orderId}</span>
        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
      </div>
      <div class="order-details">
        <div class="order-detail-item">
          <strong>Customer:</strong>
          <span>${order.customerName}</span>
        </div>
        <div class="order-detail-item">
          <strong>Tanggal:</strong>
          <span>${new Date(order.date).toLocaleDateString('id-ID')}</span>
        </div>
        <div class="order-detail-item">
          <strong>Total:</strong>
          <span>Rp ${order.total ? order.total.toLocaleString('id-ID') : '0'}</span>
        </div>
        <div class="order-detail-item">
          <strong>Metode Pembayaran:</strong>
          <span>${order.paymentMethod || '-'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

document.getElementById('order-filter').addEventListener('change', loadOrders);

async function viewOrderDetail(orderId) {
  try {
    const orderDoc = await window.firebaseDB.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      showCustomAlert('Order tidak ditemukan!', 'Error');
      return;
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };
    
    const date = order.createdAt ? new Date(order.createdAt.toDate()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';

    const paymentStatusClass = `status-${order.paymentStatus || 'pending'}`;
    const paymentStatusText = {
      pending: 'Pending Verification',
      approved: 'Payment Approved',
      rejected: 'Payment Rejected'
    }[order.paymentStatus || 'pending'];
    
    const content = document.getElementById('order-detail-content');
    content.innerHTML = `
      <div style="padding: 25px;">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 style="margin: 0 0 8px 0;">Order #${order.id.substring(0, 8)}</h3>
            <p style="margin: 0; color: #888; font-size: 14px;">
              <i class="far fa-calendar"></i> ${date}
            </p>
          </div>
          <span class="order-status ${paymentStatusClass}">${paymentStatusText}</span>
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
          <h4 style="margin: 0 0 12px 0;">Informasi Customer</h4>
          <p style="margin: 5px 0;"><strong>Nama:</strong> ${order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.userEmail || '-'}</p>
          <p style="margin: 5px 0;"><strong>No. HP:</strong> ${order.customerPhone || '-'}</p>
          <p style="margin: 5px 0;"><strong>Alamat:</strong> ${order.shippingAddress || '-'}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin-bottom: 12px;">Detail Produk</h4>
          ${order.items && order.items.length > 0 ? order.items.map(item => `
            <div style="display: flex; gap: 15px; margin-bottom: 12px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
              <img src="${item.imageURL || 'https://via.placeholder.com/80'}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 2px solid #e0e0e0;">
              <div style="flex: 1;">
                <p style="margin: 0 0 5px 0;"><strong>${item.name}</strong></p>
                <p style="margin: 5px 0; color: #00a896; font-weight: 600;">Rp ${parseInt(item.price).toLocaleString('id-ID')}</p>
              </div>
            </div>
          `).join('') : '<p>Data produk tidak tersedia</p>'}
        </div>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #e8f5f3; border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 14px; color: #666;">Metode Pembayaran</p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: #333;">
                <i class="fas fa-wallet"></i> ${order.paymentMethod || '-'}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 14px; color: #666;">Total Pembayaran</p>
              <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: 700; color: #00a896;">
                Rp ${order.total ? parseInt(order.total).toLocaleString('id-ID') : '0'}
              </p>
            </div>
          </div>
        </div>
        
        ${order.paymentProof ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px;">Bukti Pembayaran</h4>
            <img src="${order.paymentProof}" style="max-width: 100%; border-radius: 10px; cursor: pointer; border: 2px solid #e0e0e0;" onclick="window.open('${order.paymentProof}', '_blank')">
          </div>
        ` : ''}

        ${order.paymentStatus === 'rejected' && order.rejectionReason ? `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8d7da; border-left: 4px solid #dc3545; border-radius: 8px;">
            <strong style="color: #721c24;">Rejection Reason:</strong>
            <p style="color: #721c24; margin: 8px 0 0 0;">${order.rejectionReason}</p>
          </div>
        ` : ''}
        
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          ${order.paymentStatus === 'pending' ? `
            <button class="btn-primary" onclick="approvePayment('${order.id}')" style="flex: 1;">
              <i class="fas fa-check"></i> Approve Payment
            </button>
            <button class="btn-delete" onclick="rejectPayment('${order.id}')" style="flex: 1;">
              <i class="fas fa-times"></i> Reject Payment
            </button>
          ` : ''}
          ${order.paymentStatus === 'approved' ? `
            <div style="padding: 15px; background: #d4edda; border-left: 4px solid #28a745; border-radius: 8px; width: 100%;">
              <p style="margin: 0; color: #155724; font-weight: 600;">
                <i class="fas fa-check-circle"></i> Payment has been approved
              </p>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    document.getElementById('order-modal').classList.add('active');
    
  } catch (error) {
    console.error('Error loading order detail:', error);
    showCustomAlert('Error loading order: ' + error.message, 'Error');
  }
}

async function approvePayment(orderId) {
  showCustomConfirm('Approve pembayaran ini? Produk akan ditandai sebagai terjual.', async () => {
    try {
      showLoading('Approving payment...');
      
      const result = await window.dbService.updatePaymentStatus(orderId, 'approved');
      
      if (result.success) {
        hideLoading();
        closeModal('order-modal');
        showCustomAlert('Payment approved! Products marked as sold.', 'Success');
        
        // Refresh both orders and products with delay to ensure Firestore updates
        setTimeout(async () => {
          await loadOrders();
          await loadProducts();
          await loadDashboardStats();
          console.log('✅ All data refreshed');
        }, 500);
      }
    } catch (error) {
      hideLoading();
      console.error('Error approving payment:', error);
      showCustomAlert('Error: ' + error.message, 'Error');
    }
  }, 'Approve Payment');
}

async function rejectPayment(orderId) {
  // Show input modal for rejection reason
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
    ">
      <h3 style="margin: 0 0 20px 0;">Reject Payment</h3>
      <p style="margin: 0 0 15px 0; color: #666;">
        Mohon berikan alasan penolakan untuk customer:
      </p>
      <textarea id="rejection-reason" style="
        width: 100%;
        min-height: 100px;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
      " placeholder="Contoh: Bukti pembayaran tidak valid, nominal tidak sesuai, dll."></textarea>
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="cancel-reject" style="
          flex: 1;
          padding: 12px;
          border: 2px solid #ddd;
          background: white;
          color: #666;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        ">Cancel</button>
        <button id="confirm-reject" style="
          flex: 1;
          padding: 12px;
          border: none;
          background: #dc3545;
          color: white;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
        ">Reject Payment</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const reasonInput = modal.querySelector('#rejection-reason');
  const cancelBtn = modal.querySelector('#cancel-reject');
  const confirmBtn = modal.querySelector('#confirm-reject');
  
  cancelBtn.onclick = () => modal.remove();
  
  confirmBtn.onclick = async () => {
    const reason = reasonInput.value.trim();
    
    if (!reason) {
      showCustomAlert('Mohon berikan alasan penolakan!', 'Perhatian');
      return;
    }
    
    modal.remove();
    
    try {
      showLoading('Rejecting payment...');
      
      const result = await window.dbService.updatePaymentStatus(orderId, 'rejected', reason);
      
      if (result.success) {
        hideLoading();
        closeModal('order-modal');
        showCustomAlert('Payment rejected. Customer will be notified.', 'Success');
        
        // Refresh both orders and products with delay
        setTimeout(async () => {
          await loadOrders();
          await loadProducts();
          await loadDashboardStats();
          console.log('✅ All data refreshed');
        }, 500);
      }
    } catch (error) {
      hideLoading();
      console.error('Error rejecting payment:', error);
      showCustomAlert('Error: ' + error.message, 'Error');
    }
  };
}

function confirmOrder(orderId) {
  updateOrderStatus(orderId, 'confirmed');
  closeModal('order-modal');
  showCustomAlert('Pesanan berhasil dikonfirmasi!');
}

function completeOrder(orderId) {
  updateOrderStatus(orderId, 'completed');
  closeModal('order-modal');
  showCustomAlert('Pesanan selesai!');
}

function cancelOrder(orderId) {
  showCustomConfirm('Yakin ingin membatalkan pesanan ini?', () => {
    updateOrderStatus(orderId, 'cancelled');
    closeModal('order-modal');
    showCustomAlert('Pesanan dibatalkan!');
  }, 'Batalkan Pesanan');
}

function updateOrderStatus(orderId, newStatus) {
  let orders = JSON.parse(localStorage.getItem('allOrders')) || [];
  const orderIndex = orders.findIndex(o => o.orderId === orderId);
  
  if (orderIndex !== -1) {
    orders[orderIndex].status = newStatus;
    localStorage.setItem('allOrders', JSON.stringify(orders));
    loadOrders();
    loadDashboardStats();
  }
}

// ==================== PAYMENTS MANAGEMENT ====================

// Payment functions removed - now handled in Orders section
// All payment verification is done through viewOrderDetail()

function rejectPaymentOld(orderId) {
  showCustomConfirm('Tolak pembayaran ini? Pesanan akan dibatalkan.', () => {
    updateOrderStatus(orderId, 'cancelled');
    loadPayments();
    showCustomAlert('Pembayaran ditolak dan pesanan dibatalkan.');
  }, 'Tolak Pembayaran');
}

// ==================== USERS MANAGEMENT ====================

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  
  try {
    // Load users from Firestore
    const usersSnapshot = await window.firebaseDB.collection('users').get();
    
    if (usersSnapshot.empty) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="empty-state">
            <i class="fas fa-users"></i>
            <h3>Belum Ada Pengguna Terdaftar</h3>
            <p>Data pengguna yang terdaftar akan muncul di sini</p>
          </div>
        </td></tr>
      `;
      return;
    }
    
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    tbody.innerHTML = users.map(user => {
      // Format date properly - handle Firestore timestamp or ISO string
      let formattedDate = '-';
      if (user.createdAt) {
        try {
          // If it's a Firestore timestamp object
          if (user.createdAt.toDate && typeof user.createdAt.toDate === 'function') {
            formattedDate = user.createdAt.toDate().toLocaleDateString('id-ID');
          } 
          // If it's an ISO string or regular date
          else {
            const date = new Date(user.createdAt);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString('id-ID');
            }
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }
      
      return `
        <tr>
          <td><strong>${user.name || user.email}</strong></td>
          <td>${user.email}</td>
          <td>${user.phone || '-'}</td>
          <td>${user.address || '-'}</td>
          <td>${formattedDate}</td>
          <td>
            <span class="badge" style="background: ${user.role === 'admin' ? '#00d4aa' : '#6c757d'};">
              ${user.role || 'user'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Gagal Memuat Data Pengguna</h3>
          <p style="color: #ff6b6b;">${error.message}</p>
        </div>
      </td></tr>
    `;
  }
}

function viewUserDetail(username) {
  // User detail view not implemented yet
  showCustomAlert('Detail Pengguna', 'Fitur detail pengguna akan segera hadir!');
  const user = users.find(u => u.username === username);
  
  if (user) {
    showCustomAlert(
      `Username: ${user.username}\nEmail: ${user.email}\nNo. HP: ${user.phone || '-'}\nAlamat: ${user.address || '-'}`,
      'Detail Pengguna'
    );
  }
}

// ==================== MODAL HANDLERS ====================

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
  btn.addEventListener('click', function() {
    this.closest('.modal').classList.remove('active');
  });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
    }
  });
});

// Initialize default products if not exists
if (!localStorage.getItem('products')) {
  localStorage.setItem('products', JSON.stringify(getDefaultProducts()));
}

// ==================== CUSTOM MODAL FUNCTIONS ====================

function showCustomConfirm(message, onConfirm, title = 'Konfirmasi') {
  const modal = document.getElementById('custom-confirm-modal');
  const titleEl = document.getElementById('confirm-title');
  const messageEl = document.getElementById('confirm-message');
  const cancelBtn = document.getElementById('confirm-cancel');
  const okBtn = document.getElementById('confirm-ok');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  modal.classList.add('active');
  
  // Remove previous listeners
  const newCancelBtn = cancelBtn.cloneNode(true);
  const newOkBtn = okBtn.cloneNode(true);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  
  // Add new listeners
  newCancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  newOkBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    if (onConfirm) onConfirm();
  });
  
  // Close on overlay click
  modal.querySelector('.custom-modal-overlay').onclick = () => {
    modal.classList.remove('active');
  };
}

function showCustomAlert(message, title = 'Berhasil!') {
  const modal = document.getElementById('custom-alert-modal');
  const titleEl = document.getElementById('alert-title');
  const messageEl = document.getElementById('alert-message');
  const okBtn = document.getElementById('alert-ok');
  
  titleEl.textContent = title;
  messageEl.textContent = message;
  modal.classList.add('active');
  
  // Remove previous listener
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);
  
  // Add new listener
  newOkBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });
  
  // Close on overlay click
  modal.querySelector('.custom-modal-overlay').onclick = () => {
    modal.classList.remove('active');
  };
}

// ==================== IMAGE INPUT HANDLING ====================

// Toggle between URL and File Upload
document.querySelectorAll('input[name="image-type"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const urlContainer = document.getElementById('url-input-container');
    const fileContainer = document.getElementById('file-input-container');
    
    if (e.target.value === 'url') {
      urlContainer.classList.add('active');
      fileContainer.classList.remove('active');
    } else {
      urlContainer.classList.remove('active');
      fileContainer.classList.add('active');
    }
  });
});

// File Upload Preview
document.getElementById('product-image-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showCustomAlert('Ukuran file terlalu besar! Maksimal 5MB', 'Error');
      e.target.value = '';
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      showCustomAlert('File harus berupa gambar!', 'Error');
      e.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('image-preview').src = event.target.result;
      document.getElementById('image-preview-container').style.display = 'block';
      document.getElementById('file-name').textContent = file.name;
    };
    reader.readAsDataURL(file);
  }
});

// Remove Image Preview
window.removeImagePreview = function() {
  document.getElementById('product-image-file').value = '';
  document.getElementById('image-preview-container').style.display = 'none';
  document.getElementById('file-name').textContent = 'Klik untuk pilih gambar';
};
