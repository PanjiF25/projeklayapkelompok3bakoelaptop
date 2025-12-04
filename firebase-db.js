// Firebase Database Service
// Handles CRUD operations for products, orders, and other collections

class DatabaseService {
  constructor() {
    this.db = window.firebaseDB;
    // Storage disabled - using base64 for images instead
    // this.storage = window.firebaseStorage;
  }

  // ==================== PRODUCTS ====================

  // Get all products
  async getProducts(category = null) {
    try {
      let query = this.db.collection('products');
      
      if (category && category !== 'all') {
        query = query.where('category', '==', category);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const products = [];
      
      snapshot.forEach(doc => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  // Get single product
  async getProduct(productId) {
    try {
      const doc = await this.db.collection('products').doc(productId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  // Add new product
  async addProduct(productData) {
    try {
      showLoading('Adding product...');
      
      const docRef = await this.db.collection('products').add({
        ...productData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      hideLoading();
      showSuccess('Product added successfully!');
      
      return { success: true, id: docRef.id };
    } catch (error) {
      hideLoading();
      console.error('Error adding product:', error);
      showError('Failed to add product. Please try again.');
      return { success: false, error };
    }
  }

  // Update product
  async updateProduct(productId, updates) {
    try {
      showLoading('Updating product...');
      
      await this.db.collection('products').doc(productId).update({
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      hideLoading();
      showSuccess('Product updated successfully!');
      
      return { success: true };
    } catch (error) {
      hideLoading();
      console.error('Error updating product:', error);
      showError('Failed to update product. Please try again.');
      return { success: false, error };
    }
  }

  // Delete product
  async deleteProduct(productId) {
    try {
      showLoading('Deleting product...');
      
      await this.db.collection('products').doc(productId).delete();

      hideLoading();
      showSuccess('Product deleted successfully!');
      
      return { success: true };
    } catch (error) {
      hideLoading();
      console.error('Error deleting product:', error);
      showError('Failed to delete product. Please try again.');
      return { success: false, error };
    }
  }

  // ==================== ORDERS ====================

  // Get user orders
  async getUserOrders(userId) {
    try {
      const snapshot = await this.db.collection('orders')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      return orders;
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  }

  // Get all orders (admin)
  async getAllOrders() {
    try {
      const snapshot = await this.db.collection('orders')
        .orderBy('createdAt', 'desc')
        .get();
      
      const orders = [];
      snapshot.forEach(doc => {
        orders.push({ id: doc.id, ...doc.data() });
      });

      return orders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  }

  // Create order
  async createOrder(orderData) {
    try {
      showLoading('Creating order...');
      
      const docRef = await this.db.collection('orders').add({
        ...orderData,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      hideLoading();
      showSuccess('Order created successfully!');
      
      return { success: true, id: docRef.id };
    } catch (error) {
      hideLoading();
      console.error('Error creating order:', error);
      showError('Failed to create order. Please try again.');
      return { success: false, error };
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      await this.db.collection('orders').doc(orderId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showSuccess('Order status updated!');
      return { success: true };
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Failed to update order status.');
      return { success: false, error };
    }
  }

  // Update payment status (for admin approval)
  async updatePaymentStatus(orderId, paymentStatus, rejectionReason = null) {
    try {
      const updateData = {
        paymentStatus: paymentStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      // If payment approved, also mark products as sold
      if (paymentStatus === 'approved') {
        const orderDoc = await this.db.collection('orders').doc(orderId).get();
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          
          // Update each product's status to 'sold'
          if (orderData.items && orderData.items.length > 0) {
            const batch = this.db.batch();
            
            for (const item of orderData.items) {
              if (item.productId) {
                const productRef = this.db.collection('products').doc(item.productId);
                batch.update(productRef, {
                  status: 'sold',
                  soldAt: firebase.firestore.FieldValue.serverTimestamp()
                });
              }
            }
            
            await batch.commit();
            console.log('✅ Products marked as sold');
          }
        }
      }

      await this.db.collection('orders').doc(orderId).update(updateData);

      showSuccess('Payment status updated!');
      return { success: true };
    } catch (error) {
      console.error('Error updating payment status:', error);
      showError('Failed to update payment status.');
      return { success: false, error };
    }
  }

  // ==================== CART ====================

  // Get user cart
  async getCart(userId) {
    try {
      const doc = await this.db.collection('carts').doc(userId).get();
      if (doc.exists) {
        return doc.data().items || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting cart:', error);
      return [];
    }
  }

  // Add to cart
  async addToCart(userId, productId, quantity = 1) {
    try {
      const cartRef = this.db.collection('carts').doc(userId);
      const doc = await cartRef.get();

      if (doc.exists) {
        const currentItems = doc.data().items || [];
        const existingItemIndex = currentItems.findIndex(item => item.productId === productId);

        if (existingItemIndex > -1) {
          // Update quantity
          currentItems[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          currentItems.push({ productId, quantity, addedAt: new Date().toISOString() });
        }

        await cartRef.update({
          items: currentItems,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Create new cart
        await cartRef.set({
          items: [{ productId, quantity, addedAt: new Date().toISOString() }],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      showSuccess('Added to cart!');
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Failed to add to cart.');
      return { success: false, error };
    }
  }

  // Remove from cart
  async removeFromCart(userId, productId) {
    try {
      const cartRef = this.db.collection('carts').doc(userId);
      const doc = await cartRef.get();

      if (doc.exists) {
        const currentItems = doc.data().items || [];
        const updatedItems = currentItems.filter(item => item.productId !== productId);

        await cartRef.update({
          items: updatedItems,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showSuccess('Removed from cart');
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Error removing from cart:', error);
      showError('Failed to remove from cart.');
      return { success: false, error };
    }
  }

  // Clear cart
  async clearCart(userId) {
    try {
      await this.db.collection('carts').doc(userId).update({
        items: [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { success: false, error };
    }
  }

  // ==================== IMAGE HANDLING (Base64 - Free Alternative) ====================

  // Convert image file to base64 string
  async uploadImage(file, path) {
    try {
      showLoading('Processing image...');
      
      // Validate file
      const validation = validateImageFile(file, 5);
      if (!validation.valid) {
        hideLoading();
        showError(validation.errors.join(', '));
        return { success: false, error: validation.errors };
      }

      // Convert to base64
      const base64 = await this.fileToBase64(file);
      
      hideLoading();
      
      // Return base64 string instead of Storage URL
      return { success: true, url: base64 };
    } catch (error) {
      hideLoading();
      console.error('Error processing image:', error);
      showError('Failed to process image.');
      return { success: false, error };
    }
  }

  // Helper: Convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Delete image (for base64, just remove from document)
  async deleteImage(imageUrl) {
    // Base64 images are stored in Firestore, no separate deletion needed
    return { success: true };
  }

  // ==================== REAL-TIME LISTENERS ====================

  // Listen to products changes
  listenToProducts(callback, category = null) {
    let query = this.db.collection('products');
    
    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    return query.orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      const products = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    });
  }

  // Listen to cart changes
  listenToCart(userId, callback) {
    return this.db.collection('carts').doc(userId).onSnapshot(doc => {
      if (doc.exists) {
        callback(doc.data().items || []);
      } else {
        callback([]);
      }
    });
  }

  // Listen to orders changes
  listenToOrders(userId, callback) {
    return this.db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const orders = [];
        snapshot.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        callback(orders);
      });
  }
}

// Create global instance
window.dbService = new DatabaseService();
