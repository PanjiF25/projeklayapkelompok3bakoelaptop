// Check if user is logged in
function checkAuthStatus() {
  console.log('🔍 checkAuthStatus() called');
  console.log('🔍 firebaseAuth exists:', !!window.firebaseAuth);
  
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  
  // If elements don't exist, skip
  if (!authButtons || !userMenu) {
    console.log('⚠️ Auth UI elements not found on this page');
    return;
  }
  
  // Check Firebase Auth state
  if (window.firebaseAuth && window.firebaseAuth.currentUser) {
    const user = window.firebaseAuth.currentUser;
    console.log('✅ User logged in:', user.email);
    
    // User is logged in - show profile menu and cart
    authButtons.style.display = 'none';
    userMenu.style.display = 'flex';
    
    // Check if user is admin and add admin dashboard button
    checkAndAddAdminButton(user);
    
  } else {
    console.log('❌ No Firebase user detected');
    
    // User is not logged in - show Sign In/Sign Up buttons
    userMenu.style.display = 'none';
    authButtons.style.display = 'flex';
  }
}

// Check if user is admin and add dashboard button
async function checkAndAddAdminButton(user) {
  try {
    // Check if admin button already exists
    if (document.getElementById('admin-dashboard-btn')) {
      console.log('✅ Admin button already exists');
      return;
    }
    
    // Wait for Firestore to be ready
    if (!window.firebaseDB) {
      console.log('⏳ Waiting for Firestore to be ready...');
      setTimeout(() => checkAndAddAdminButton(user), 200);
      return;
    }
    
    console.log('🔍 Checking if user is admin:', user.uid);
    const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
    
    if (userDoc.exists && userDoc.data().role === 'admin') {
      console.log('🔑 User is admin, adding dashboard button');
      
      // Add admin dashboard button to navbar (try both .nav-links and .main-nav)
      const navLinks = document.querySelector('.nav-links') || document.querySelector('.main-nav');
      if (navLinks) {
        const adminBtn = document.createElement('a');
        adminBtn.href = 'admin.html';
        adminBtn.id = 'admin-dashboard-btn';
        adminBtn.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;
        adminBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Admin Dashboard';
        
        // Add hover effect
        adminBtn.addEventListener('mouseenter', () => {
          adminBtn.style.transform = 'translateY(-2px)';
          adminBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });
        adminBtn.addEventListener('mouseleave', () => {
          adminBtn.style.transform = 'translateY(0)';
          adminBtn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        // Insert before auth buttons or user menu
        const authButtons = document.getElementById('auth-buttons');
        if (authButtons) {
          navLinks.insertBefore(adminBtn, authButtons);
        } else {
          navLinks.appendChild(adminBtn);
        }
        
        console.log('✅ Admin dashboard button added to navbar');
      } else {
        console.warn('⚠️ Navbar navigation element not found');
      }
    } else {
      console.log('ℹ️ User is not admin, role:', userDoc.exists ? userDoc.data().role : 'no document');
    }
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  }
}

// Logout function
async function logout() {
  try {
    console.log('🔓 Logging out...');
    
    // Firebase logout
    if (window.firebaseAuth) {
      await window.firebaseAuth.signOut();
      console.log('✅ Firebase logout successful');
    }
    
    // Clear localStorage
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    
    // Redirect to login
    window.location.href = 'login.html';
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    alert('Error saat logout: ' + error.message);
  }
}

// Navbar scroll effect
function handleNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.2)';
    navbar.style.padding = '10px 50px';
  } else {
    navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    navbar.style.padding = '15px 50px';
  }
}

// Active page highlighting
function setActivePage() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.main-nav a[href]');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Add ripple effect to buttons
function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');

  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Add smooth scroll to anchor links
function smoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Don't call checkAuthStatus here - let Firebase auth listener handle it
  setActivePage();
  smoothScroll();
  
  // Add scroll listener
  window.addEventListener('scroll', handleNavbarScroll);
  
  // Add logout event listener
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  }

  // Add ripple effect to buttons
  const buttons = document.querySelectorAll('.btn-signin, .btn-signup, .cta-button');
  buttons.forEach(button => {
    button.addEventListener('click', createRipple);
  });

  // Add hover effect to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });
});

// CSS for ripple effect (inject dynamically)
const style = document.createElement('style');
style.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }

  .btn-signin, .btn-signup, .cta-button {
    position: relative;
    overflow: hidden;
  }
`;
document.head.appendChild(style);

// ==================== HAMBURGER MENU ====================

function initHamburgerMenu() {
  // Create hamburger button if not exists
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Check if hamburger already exists
  if (document.querySelector('.hamburger')) return;

  // Create hamburger button
  const hamburger = document.createElement('div');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;

  // Insert hamburger after logo
  const logo = navbar.querySelector('.logo');
  if (logo) {
    logo.after(hamburger);
  }

  // Toggle menu
  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    this.classList.toggle('active');
    const mainNav = document.querySelector('.main-nav');
    if (mainNav) {
      mainNav.classList.toggle('active');
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    const mainNav = document.querySelector('.main-nav');
    const hamburger = document.querySelector('.hamburger');
    
    if (mainNav && mainNav.classList.contains('active')) {
      if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
        mainNav.classList.remove('active');
        hamburger.classList.remove('active');
      }
    }
  });

  // Close menu when clicking a link
  const navLinks = document.querySelectorAll('.main-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      const mainNav = document.querySelector('.main-nav');
      const hamburger = document.querySelector('.hamburger');
      if (mainNav) mainNav.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
    });
  });

  // Close menu on window resize if larger than 768px
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      const mainNav = document.querySelector('.main-nav');
      const hamburger = document.querySelector('.hamburger');
      if (mainNav) mainNav.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
    }
  });
}

// Initialize hamburger menu
initHamburgerMenu();

// Wait for Firebase Auth to be ready, then listen to auth state changes
let authListenerInitialized = false;

const initAuthListener = () => {
  if (window.firebaseAuth && !authListenerInitialized) {
    console.log('🔥 Navbar: Setting up Firebase Auth listener...');
    authListenerInitialized = true;
    
    // Set up auth state listener
    window.firebaseAuth.onAuthStateChanged((user) => {
      console.log('🔄 Navbar: Auth state changed:', user ? user.email : 'No user');
      checkAuthStatus();
    });
    
    return true;
  }
  return false;
};

// Try to initialize immediately
if (!initAuthListener()) {
  console.log('⏳ Navbar: Firebase Auth not ready yet, waiting...');
  
  // If Firebase not loaded yet, wait for it with interval
  const authCheckInterval = setInterval(() => {
    if (initAuthListener()) {
      console.log('✅ Navbar: Auth listener initialized');
      clearInterval(authCheckInterval);
    }
  }, 100);
}
