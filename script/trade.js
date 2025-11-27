// Trade Page Functionality

let currentStep = 1;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initConditionButtons();
  initLaptopSelection();
  initForm();
});

// Initialize condition buttons
function initConditionButtons() {
  const conditionBtns = document.querySelectorAll('.condition-btn');
  const hiddenInput = document.getElementById('oldCondition');

  conditionBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove selected from all
      conditionBtns.forEach(b => b.classList.remove('selected'));
      
      // Add selected to clicked
      this.classList.add('selected');
      
      // Update hidden input
      hiddenInput.value = this.getAttribute('data-value');
    });
  });
}

// Initialize laptop selection
function initLaptopSelection() {
  const laptopCards = document.querySelectorAll('.laptop-card');
  const hiddenInput = document.getElementById('newLaptop');

  laptopCards.forEach(card => {
    const selectBtn = card.querySelector('.btn-select');
    
    selectBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove selected from all
      laptopCards.forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.btn-select').textContent = 'Select';
      });
      
      // Add selected to clicked
      card.classList.add('selected');
      selectBtn.textContent = 'Selected ✓';
      
      // Update hidden input
      hiddenInput.value = card.getAttribute('data-laptop');
    });
  });
}

// Navigation functions
function nextStep(step) {
  // Validate current step
  if (!validateStep(currentStep)) {
    return;
  }

  // Hide current step
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  
  // Update progress
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add('completed');
  document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
  
  // Show next step
  document.getElementById(`step-${step}`).style.display = 'block';
  
  // Update current step
  currentStep = step;
  
  // Update summary if going to step 3
  if (step === 3) {
    updateSummary();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
  // Hide current step
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  
  // Update progress
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step[data-step="${step}"]`).classList.remove('completed');
  document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
  
  // Show previous step
  document.getElementById(`step-${step}`).style.display = 'block';
  
  // Update current step
  currentStep = step;
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate step
function validateStep(step) {
  if (step === 1) {
    const oldName = document.getElementById('oldName').value.trim();
    const oldCondition = document.getElementById('oldCondition').value;
    
    if (!oldName) {
      showError('Please enter your laptop model');
      return false;
    }
    
    if (!oldCondition) {
      showError('Please select your laptop condition');
      return false;
    }
    
    return true;
  }
  
  if (step === 2) {
    const newLaptop = document.getElementById('newLaptop').value;
    
    if (!newLaptop) {
      showError('Please select a new laptop');
      return false;
    }
    
    return true;
  }
  
  return true;
}

// Update summary
function updateSummary() {
  document.getElementById('summary-old-name').textContent = document.getElementById('oldName').value || '-';
  document.getElementById('summary-old-processor').textContent = document.getElementById('oldProcessor').value || 'Not specified';
  document.getElementById('summary-old-ram').textContent = document.getElementById('oldRam').value.trim() || 'Not specified';
  document.getElementById('summary-old-condition').textContent = document.getElementById('oldCondition').value || '-';
  document.getElementById('summary-new-laptop').textContent = document.getElementById('newLaptop').value || '-';
}

// Initialize form submission
function initForm() {
  const form = document.getElementById('tradeForm');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    // Check if user is logged in
    const user = window.firebaseAuth?.currentUser;
    
    if (!user) {
      showError('Please login first to submit a trade-in request');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
      return;
    }
    
    // Collect form data
    const tradeData = {
      oldLaptop: {
        name: document.getElementById('oldName').value.trim(),
        processor: document.getElementById('oldProcessor').value.trim() || 'Not specified',
        ram: document.getElementById('oldRam').value.trim() || 'Not specified',
        condition: document.getElementById('oldCondition').value,
        description: document.getElementById('oldDesc').value.trim() || 'No additional notes'
      },
      newLaptop: document.getElementById('newLaptop').value,
      notes: document.getElementById('note').value.trim() || 'No special requests',
      userId: user.uid,
      userEmail: user.email,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
      showLoading('Submitting your request...');
      
      // Save to Firestore
      await window.firebaseDB.collection('tradeRequests').add(tradeData);
      
      hideLoading();
      
      // Show success modal
      document.getElementById('tradeResult').style.display = 'flex';
      
      // Reset form
      form.reset();
      
    } catch (error) {
      hideLoading();
      console.error('Error submitting trade request:', error);
      showError('Failed to submit request. Please try again.');
    }
  });
}

// Make functions global for onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
