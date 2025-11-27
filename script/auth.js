// Simple hash function for password (better than plain text)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

// Initialize admin user (only run once on first load)
function initializeAdmin() {
  if (!localStorage.getItem('adminInitialized')) {
    const adminCredentials = {
      email: "admin@bakoelaptop.com",
      passwordHash: simpleHash("admin123"), // You should change this password
      role: 'admin',
      username: 'Admin'
    };
    localStorage.setItem('adminCredentials', JSON.stringify(adminCredentials));
    localStorage.setItem('adminInitialized', 'true');
  }
}

// Initialize admin on page load
initializeAdmin();

function login(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("error-msg");

  // CHECK FOR ADMIN LOGIN FIRST
  const adminCreds = JSON.parse(localStorage.getItem('adminCredentials'));
  if (adminCreds && email === adminCreds.email && simpleHash(password) === adminCreds.passwordHash) {
    // Admin login
    const adminUser = {
      username: adminCreds.username,
      email: email,
      role: 'admin',
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('adminUser', JSON.stringify(adminUser));
    localStorage.setItem('isLoggedIn', 'true');
    
    // Redirect to admin dashboard
    window.location.href = "admin.html";
    return;
  }

  // Regular user login
  const users = JSON.parse(localStorage.getItem('users')) || [];
  
  // Dummy user default
  const dummyUser = {
    email: "user@example.com",
    password: "123456"  
  };

  // Cek apakah user ada di database atau dummy user
  const foundUser = users.find(u => u.email === email && u.password === password) || 
                    (email === dummyUser.email && password === dummyUser.password ? dummyUser : null);

  if(foundUser) {
    // Set login status ke localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify({
      email: foundUser.email,
      fullname: foundUser.fullname || 'User',
      username: foundUser.username || 'user'
    }));
    
    // Login berhasil -> redirect ke home page
    window.location.href = "index.html";
  } else {
    errorMsg.textContent = "Email or password is incorrect!";
  }
}

function register(event) {
  event.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const terms = document.getElementById("terms").checked;
  
  const errorMsg = document.getElementById("error-msg");
  const successMsg = document.getElementById("success-msg");

  // Reset messages
  errorMsg.textContent = "";
  successMsg.textContent = "";

  // Validasi password match
  if(password !== confirmPassword) {
    errorMsg.textContent = "Passwords do not match!";
    return;
  }

  // Validasi terms
  if(!terms) {
    errorMsg.textContent = "Please agree to the Terms & Conditions";
    return;
  }

  // Ambil users dari localStorage atau buat array baru
  let users = JSON.parse(localStorage.getItem('users')) || [];

  // Cek apakah email sudah terdaftar
  const existingUser = users.find(u => u.email === email);
  if(existingUser) {
    errorMsg.textContent = "Email already registered!";
    return;
  }

  // Cek apakah username sudah digunakan
  const existingUsername = users.find(u => u.username === username);
  if(existingUsername) {
    errorMsg.textContent = "Username already taken!";
    return;
  }

  // Buat user baru
  const newUser = {
    fullname: fullname,
    username: username,
    email: email,
    phone: phone,
    password: password,
    createdAt: new Date().toISOString()
  };

  // Tambahkan ke array users
  users.push(newUser);

  // Simpan ke localStorage
  localStorage.setItem('users', JSON.stringify(users));

  // Tampilkan success message
  successMsg.textContent = "Registration successful! Redirecting to login...";

  // Redirect ke login setelah 2 detik
  setTimeout(() => {
    window.location.href = "login.html";
  }, 2000);
}
