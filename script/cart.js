// Cart Management with Firebase
console.log('🛒 cart.js loaded');

// Helper function to format currency
function formatCurrency(amount) {
  const numAmount = parseInt(amount);
  if (isNaN(numAmount)) {
    console.error('⚠️ Invalid price:', amount);
    return 'Rp 0';
  }
  return 'Rp ' + numAmount.toLocaleString('id-ID');
}

// Wait for Firebase to be ready
let firebaseReady = false;

const waitForFirebase = setInterval(() => {
  if (window.firebaseInitialized && window.firebaseAuth && window.firebaseDB) {
    console.log('✅ Firebase ready in cart.js');
    firebaseReady = true;
    clearInterval(waitForFirebase);
    
    // Wait for DOM to be fully ready before checking for cart page
    if (document.readyState === 'loading') {
      console.log('⏳ DOM still loading, waiting...');
      document.addEventListener('DOMContentLoaded', initCartIfNeeded);
    } else {
      console.log('✅ DOM already loaded');
      initCartIfNeeded();
    }
  }
}, 100);

// Initialize cart if on cart page
function initCartIfNeeded() {
  const cartItemsElement = document.getElementById('cart-items');
  console.log('📍 Checking for cart-items element:', !!cartItemsElement);
  
  if (cartItemsElement) {
    console.log('✅ On cart page, setting up auth listener...');
    setupCartAuthListener();
  } else {
    console.log('⚠️ Not on cart page (cart-items not found)');
  }
}

// Setup auth listener for cart page
function setupCartAuthListener() {
  console.log('🔧 setupCartAuthListener called');
  window.firebaseAuth.onAuthStateChanged(async (user) => {
    console.log('🔐 Cart: Auth state changed, user:', user ? user.email : 'null');
    
    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await initializeCart(user);
  });
  
  // Also refresh cart when window gets focus (user comes back to tab)
  window.addEventListener('focus', async () => {
    console.log('👁️ Window focused, refreshing cart...');
    const user = window.firebaseAuth.currentUser;
    if (user && document.getElementById('cart-items')) {
      await renderCart();
    }
  });
  
  // Refresh cart when page becomes visible
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      console.log('👁️ Page visible, refreshing cart...');
      const user = window.firebaseAuth.currentUser;
      if (user && document.getElementById('cart-items')) {
        await renderCart();
      }
    }
  });
}

// Initialize cart - check auth and load cart
async function initializeCart(user) {
  console.log('🔧 initializeCart called with user:', user ? user.email : 'null');
  
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) {
    console.log('⚠️ cart-items element not found, not on cart page');
    return;
  }
  
  if (!user) {
    console.log('❌ No user logged in');
    cartItems.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-user-lock" style="font-size: 48px; color: #ccc;"></i>
        <p style="margin-top: 20px;">Silakan <a href="login.html">login</a> untuk melihat keranjang</p>
      </div>
    `;
    return;
  }
  
  console.log('✅ User logged in:', user.email);
  console.log('🔍 Calling renderCart...');
  await renderCart();
}

// Add product to cart (call from buy.html)
async function addToCart(productId, name, price, imageURL) {
  if (!firebaseReady) {
    showError('Firebase belum siap, tunggu sebentar...');
    return;
  }
  
  const user = window.firebaseAuth.currentUser;
  
  if (!user) {
    showWarning('Silakan login terlebih dahulu!');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  // Show confirmation
  const confirmed = await showCustomConfirm(
    `Tambahkan <strong>${name}</strong> ke keranjang?`,
    `Harga: Rp ${parseInt(price).toLocaleString('id-ID')}`
  );
  
  if (!confirmed) {
    console.log('❌ User cancelled');
    return;
  }

  try {
    console.log('🛒 Adding to cart:', { productId, name, price, imageURL });
    
    // Show loading with minimum display time
    showLoading('Menambahkan ke keranjang...');
    const startTime = Date.now();
    
    // Reference to user's cart
    const cartRef = window.firebaseDB.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();
    
    let cartItems = [];
    if (cartDoc.exists) {
      cartItems = cartDoc.data().items || [];
    }
    
    // Check if item already in cart
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Increment quantity
      cartItems[existingItemIndex].quantity += 1;
      cartItems[existingItemIndex].updatedAt = new Date().toISOString();
      console.log('📦 Quantity incremented');
    } else {
      // Add new item
      cartItems.push({
        productId: productId,
        name: name,
        price: parseInt(price),
        imageURL: imageURL || 'https://via.placeholder.com/80',
        quantity: 1,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('✨ New item added');
    }
    
    // Save to Firestore
    const saveData = {
      userId: user.uid,
      userEmail: user.email,
      items: cartItems,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('💾 Saving to Firestore:', saveData);
    await cartRef.set(saveData);
    
    console.log('✅ Cart saved to Firestore successfully');
    console.log('📋 Final cart items:', cartItems);
    
    // Verify save by reading back
    const verifyDoc = await cartRef.get();
    console.log('🔍 Verification - Document exists:', verifyDoc.exists);
    if (verifyDoc.exists) {
      console.log('🔍 Verification - Document data:', verifyDoc.data());
    }
    
    // Ensure loading shows for at least 500ms for better UX
    const elapsedTime = Date.now() - startTime;
    const minDisplayTime = 500;
    if (elapsedTime < minDisplayTime) {
      await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
    }
    
    hideLoading();
    
    // Show custom success popup
    showSuccessPopup(name, price);
    
    // Update cart badge if exists
    updateCartBadge();
    
  } catch (error) {
    hideLoading();
    console.error('❌ Error adding to cart:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      productId,
      name,
      price,
      imageURL
    });
    showError('Gagal menambahkan ke keranjang: ' + error.message);
  }
}

// Custom success popup for add to cart
function showSuccessPopup(productName, price) {
  // Create modal
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
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 40px;
      border-radius: 16px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: slideUp 0.3s ease;
      text-align: center;
    ">
      <div style="margin-bottom: 20px;">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #00d4aa 0%, #00a896 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
          animation: scaleIn 0.5s ease;
        ">
          <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
        </div>
        <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Berhasil Ditambahkan!</h2>
        <p style="margin: 0 0 10px 0; color: #666; font-size: 16px;">
          <strong>${productName}</strong>
        </p>
        <p style="margin: 0 0 25px 0; color: #00d4aa; font-size: 18px; font-weight: bold;">
          ${formatCurrency(price)}
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="continue-shopping" style="
          flex: 1;
          padding: 14px;
          border: 2px solid #00d4aa;
          background: white;
          color: #00d4aa;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        ">Lanjut Belanja</button>
        <button id="view-cart" style="
          flex: 1;
          padding: 14px;
          border: none;
          background: linear-gradient(135deg, #00d4aa 0%, #00a896 100%);
          color: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        ">Lihat Keranjang</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes scaleIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    #continue-shopping:hover {
      background: #00d4aa;
      color: white;
    }
    #view-cart:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 212, 170, 0.4);
    }
  `;
  document.head.appendChild(style);
  
  // Handle buttons
  const continueBtn = modal.querySelector('#continue-shopping');
  const viewCartBtn = modal.querySelector('#view-cart');
  
  continueBtn.onclick = () => {
    modal.remove();
    style.remove();
  };
  
  viewCartBtn.onclick = () => {
    modal.remove();
    style.remove();
    window.location.href = 'cart.html';
  };
  
  // Auto close after 5 seconds
  setTimeout(() => {
    if (document.body.contains(modal)) {
      modal.remove();
      style.remove();
    }
  }, 5000);
}

// Custom confirm dialog for add to cart
function showCustomConfirm(title, subtitle) {
  return new Promise((resolve) => {
    // Create modal
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
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
      ">
        <div style="text-align: center; margin-bottom: 20px;">
          <i class="fas fa-shopping-cart" style="font-size: 48px; color: #00d4aa;"></i>
        </div>
        <h3 style="margin: 0 0 10px 0; text-align: center; color: #333;">${title}</h3>
        ${subtitle ? `<p style="margin: 0 0 25px 0; text-align: center; color: #666;">${subtitle}</p>` : ''}
        <div style="display: flex; gap: 10px;">
          <button id="confirm-cancel" style="
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            background: white;
            color: #666;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">Batal</button>
          <button id="confirm-ok" style="
            flex: 1;
            padding: 12px;
            border: none;
            background: linear-gradient(135deg, #00d4aa 0%, #00a896 100%);
            color: white;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">Tambahkan</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #confirm-cancel:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      #confirm-ok:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 212, 170, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    // Handle buttons
    const cancelBtn = modal.querySelector('#confirm-cancel');
    const okBtn = modal.querySelector('#confirm-ok');
    
    cancelBtn.onclick = () => {
      modal.remove();
      style.remove();
      resolve(false);
    };
    
    okBtn.onclick = () => {
      modal.remove();
      style.remove();
      resolve(true);
    };
    
    // Close on background click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
        style.remove();
        resolve(false);
      }
    };
  });
}

// Render cart items
async function renderCart() {
  console.log('🎨 renderCart() called');
  const user = window.firebaseAuth.currentUser;
  
  if (!user) {
    console.log('❌ No user in renderCart');
    return;
  }
  
  const cartItemsContainer = document.getElementById("cart-items");
  const totalPriceEl = document.getElementById("cart-total");
  
  if (!cartItemsContainer) {
    console.error('❌ cart-items element not found!');
    return;
  }
  
  if (!totalPriceEl) {
    console.error('❌ cart-total element not found!');
    return;
  }
  
  try {
    console.log('🔄 Loading cart for user:', user.uid);
    
    // Show loading with minimum display time
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-spinner fa-spin" style="font-size: 48px; color: #00d4aa;"></i>
        <p style="margin-top: 20px; color: #666;">Memuat keranjang...</p>
      </div>
    `;
    const startTime = Date.now();
    
    const cartDoc = await window.firebaseDB.collection('carts').doc(user.uid).get();
    
    console.log('📦 Cart document exists:', cartDoc.exists);
    if (cartDoc.exists) {
      console.log('📋 Cart data:', cartDoc.data());
    }
    
    // Ensure loading shows for at least 400ms for better UX
    const elapsedTime = Date.now() - startTime;
    const minDisplayTime = 400;
    if (elapsedTime < minDisplayTime) {
      await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsedTime));
    }
    
    if (!cartDoc.exists || !cartDoc.data().items || cartDoc.data().items.length === 0) {
      console.log('⚠️ Cart is empty or does not exist');
      cartItemsContainer.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <i class="fas fa-shopping-cart" style="font-size: 48px; color: #ccc;"></i>
          <p style="margin-top: 20px;">Keranjang kosong</p>
          <a href="buy.html" style="color: #00d4aa; text-decoration: none;">Belanja sekarang</a>
        </div>
      `;
      totalPriceEl.textContent = 'Rp 0';
      return;
    }
    
    const cartItems = cartDoc.data().items;
    console.log(`✅ Found ${cartItems.length} items in cart:`, cartItems);
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    console.log('🔨 Building cart items...');
    cartItems.forEach((item, index) => {
      // Validate item data
      if (!item.name || !item.price || isNaN(item.price)) {
        console.error(`⚠️ Invalid item data at index ${index}:`, item);
        console.error(`  → name: "${item.name}", price: ${item.price}, productId: "${item.productId}"`);
        return; // Skip this item
      }
      
      console.log(`  → Item ${index + 1}:`, item.name, formatCurrency(item.price));
      
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";
      itemDiv.innerHTML = `
        <img src="${item.imageURL || 'https://via.placeholder.com/100'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100'">
        <div class="item-details">
          <h3>${item.name}</h3>
          <p class="item-price">${formatCurrency(item.price)}</p>
        </div>
        <div class="item-actions">
          <button class="remove-item" onclick="removeItem('${item.productId}')">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </div>
      `;
      cartItemsContainer.appendChild(itemDiv);
      total += item.price; // Remove quantity multiplication
    });
    
    console.log('💰 Total calculated:', formatCurrency(total));
    totalPriceEl.textContent = formatCurrency(total);
    console.log('✅ Cart rendered successfully!');
    updateCartBadge();
    
  } catch (error) {
    console.error('❌ Error loading cart:', error);
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ff6b6b;">
        <i class="fas fa-exclamation-circle" style="font-size: 48px;"></i>
        <p style="margin-top: 20px;">Error: ${error.message}</p>
      </div>
    `;
  }
}

// Update item quantity
async function updateQuantity(productId, newQuantity) {
  if (newQuantity < 1) return;
  
  const user = window.firebaseAuth.currentUser;
  if (!user) return;
  
  try {
    const cartRef = window.firebaseDB.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();
    
    if (!cartDoc.exists) return;
    
    let cartItems = cartDoc.data().items || [];
    const itemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (itemIndex >= 0) {
      cartItems[itemIndex].quantity = newQuantity;
      cartItems[itemIndex].updatedAt = new Date().toISOString();
      
      await cartRef.update({
        items: cartItems,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Quantity updated');
      await renderCart();
    }
  } catch (error) {
    console.error('❌ Error updating quantity:', error);
    alert('Gagal update quantity: ' + error.message);
  }
}

// Remove item from cart
// Remove item from cart
async function removeItem(productId) {
  const user = window.firebaseAuth.currentUser;
  if (!user) return;
  
  // Show custom confirm dialog
  const confirmed = await showDeleteConfirm();
  if (!confirmed) return;
  
  try {
    showLoading('Menghapus dari keranjang...');
    
    const cartRef = window.firebaseDB.collection('carts').doc(user.uid);
    const cartDoc = await cartRef.get();
    
    if (!cartDoc.exists) {
      hideLoading();
      return;
    }
    
    let cartItems = cartDoc.data().items || [];
    const removedItem = cartItems.find(item => item.productId === productId);
    cartItems = cartItems.filter(item => item.productId !== productId);
    
    await cartRef.update({
      items: cartItems,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    hideLoading();
    console.log('✅ Item removed');
    
    if (removedItem) {
      showSuccess(`${removedItem.name} dihapus dari keranjang`);
    }
    
    await renderCart();
    
  } catch (error) {
    hideLoading();
    console.error('❌ Error removing item:', error);
    showError('Gagal menghapus item: ' + error.message);
  }
}

// Custom delete confirmation dialog
function showDeleteConfirm() {
  return new Promise((resolve) => {
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
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;
    
    modal.innerHTML = `
      <div style="
        background: white;
        padding: 35px;
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
        text-align: center;
      ">
        <div style="
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
          animation: scaleIn 0.5s ease;
        ">
          <i class="fas fa-trash-alt" style="font-size: 32px; color: white;"></i>
        </div>
        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 22px;">Hapus dari Keranjang?</h3>
        <p style="margin: 0 0 25px 0; color: #666; font-size: 15px;">
          Item ini akan dihapus dari keranjang Anda
        </p>
        <div style="display: flex; gap: 10px;">
          <button id="delete-cancel" style="
            flex: 1;
            padding: 12px;
            border: 2px solid #ddd;
            background: white;
            color: #666;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">Batal</button>
          <button id="delete-confirm" style="
            flex: 1;
            padding: 12px;
            border: none;
            background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%);
            color: white;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
          ">Ya, Hapus</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes scaleIn {
        0% { transform: scale(0); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }
      #delete-cancel:hover {
        background: #f5f5f5;
        border-color: #999;
      }
      #delete-confirm:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
      }
    `;
    document.head.appendChild(style);
    
    const cancelBtn = modal.querySelector('#delete-cancel');
    const confirmBtn = modal.querySelector('#delete-confirm');
    
    cancelBtn.onclick = () => {
      modal.remove();
      style.remove();
      resolve(false);
    };
    
    confirmBtn.onclick = () => {
      modal.remove();
      style.remove();
      resolve(true);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.remove();
        style.remove();
        resolve(false);
      }
    };
  });
}

// Update cart badge count in navbar
async function updateCartBadge() {
  const user = window.firebaseAuth.currentUser;
  if (!user) return;
  
  try {
    const cartDoc = await window.firebaseDB.collection('carts').doc(user.uid).get();
    
    let count = 0;
    if (cartDoc.exists && cartDoc.data().items) {
      // Count number of items (not quantity, since we removed that feature)
      count = cartDoc.data().items.length;
    }
    
    // Update badge if exists
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
    
  } catch (error) {
    console.error('Error updating cart badge:', error);
  }
}

// Clear entire cart
async function clearCart() {
  const user = window.firebaseAuth.currentUser;
  if (!user) return;
  
  if (!confirm('Kosongkan seluruh keranjang?')) return;
  
  try {
    await window.firebaseDB.collection('carts').doc(user.uid).delete();
    console.log('✅ Cart cleared');
    await renderCart();
  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    alert('Gagal mengosongkan keranjang: ' + error.message);
  }
}
