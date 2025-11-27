// Utility functions for loading states and notifications

// ==================== LOADING SPINNER ====================

function showLoading(message = 'Loading...') {
  // Remove existing overlay if any
  const existing = document.querySelector('.loading-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Trigger animation
  setTimeout(() => overlay.classList.add('active'), 10);
}

function hideLoading() {
  const overlay = document.querySelector('.loading-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  }
}

// ==================== TOAST NOTIFICATIONS ====================

let toastTimeout;

function showToast(message, type = 'info', title = '', duration = 3000) {
  // Clear existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
    clearTimeout(toastTimeout);
  }

  // Icon based on type
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  // Default titles
  const defaultTitles = {
    success: 'Success!',
    error: 'Error!',
    warning: 'Warning!',
    info: 'Info'
  };

  const toastTitle = title || defaultTitles[type];
  const icon = icons[type] || icons.info;

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${icon} toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${toastTitle}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
    <div class="toast-progress"></div>
  `;

  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add('show'), 10);

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    closeToast(toast);
  });

  // Auto close
  toastTimeout = setTimeout(() => {
    closeToast(toast);
  }, duration);
}

function closeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => toast.remove(), 400);
  clearTimeout(toastTimeout);
}

// Shorthand functions
function showSuccess(message, title = 'Success!') {
  showToast(message, 'success', title);
}

function showError(message, title = 'Error!') {
  showToast(message, 'error', title);
}

function showWarning(message, title = 'Warning!') {
  showToast(message, 'warning', title);
}

function showInfo(message, title = 'Info') {
  showToast(message, 'info', title);
}

// ==================== BUTTON LOADING STATE ====================

function setButtonLoading(button, loading = true) {
  if (loading) {
    button.classList.add('btn-loading');
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
  } else {
    button.classList.remove('btn-loading');
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

// ==================== FORM VALIDATION ====================

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^[0-9]{10,13}$/;
  return re.test(phone.replace(/[\s\-]/g, ''));
}

function validatePassword(password) {
  // At least 6 characters
  return password.length >= 6;
}

function sanitizeInput(input) {
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

// ==================== FILE VALIDATION ====================

function validateImageFile(file, maxSizeMB = 5) {
  const errors = [];

  // Check if file exists
  if (!file) {
    errors.push('No file selected');
    return { valid: false, errors };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be an image (JPEG, PNG, GIF, or WebP)');
  }

  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ==================== DEBOUNCE FUNCTION ====================

function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== FORMAT FUNCTIONS ====================

function formatCurrency(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

// ==================== LOCAL STORAGE HELPERS ====================

function getFromStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    showError('Failed to save data. Storage might be full.');
    return false;
  }
}

// Export functions to window for global access
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.setButtonLoading = setButtonLoading;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
window.sanitizeInput = sanitizeInput;
window.validateImageFile = validateImageFile;
window.debounce = debounce;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.getFromStorage = getFromStorage;
window.saveToStorage = saveToStorage;
