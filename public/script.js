let allProducts = [];
let currentFilter = 'all';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Load products
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
    displayProducts();
    updateCartUI();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Display products
function displayProducts() {
  const container = document.getElementById('products');
  const filtered = currentFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category === currentFilter);

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 60px; color: #999; font-size: 1.2em;">No products available in this category</p>';
    return;
  }

  container.innerHTML = filtered.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='/images/placeholder.jpg'">
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">₹${product.price}</span>
          <span class="product-stock ${product.stock < 5 ? 'low' : ''} ${product.stock === 0 ? 'out' : ''}">
            ${product.stock === 0 ? 'Out of Stock' : product.stock < 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
          </span>
        </div>
        <button class="add-to-cart-btn" onclick="contactWhatsApp('${product.id}', '${product.name}', ${product.price})">
          ${product.stock === 0 ? 'Out of Stock' : 'Order on WhatsApp'}
        </button>
      </div>
    </div>
  `).join('');
}

// Add to cart
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || product.stock === 0) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity < product.stock) {
      existingItem.quantity++;
    } else {
      alert('Cannot add more items than available in stock');
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      maxStock: product.stock
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
  
  // Show feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = 'Added! ✓';
  btn.style.background = '#28a745';
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
  }, 1000);
}

// Update cart UI
function updateCartUI() {
  const cartCount = document.querySelector('.cart-count');
  const cartItems = document.getElementById('cartItems');
  const totalAmount = document.querySelector('.total-amount');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart"><p>Your cart is empty</p><p>Add some beautiful accessories!</p></div>';
    totalAmount.textContent = '₹0';
    return;
  }
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  totalAmount.textContent = `₹${total.toFixed(2)}`;
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price}</div>
        <div class="cart-item-quantity">
          <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          <button class="remove-item" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Update quantity
function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  
  item.quantity += change;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }
  
  if (item.quantity > item.maxStock) {
    alert('Cannot add more items than available in stock');
    item.quantity = item.maxStock;
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

// Remove from cart
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartUI();
}

// Toggle cart
function toggleCart() {
  const sidebar = document.getElementById('cartSidebar');
  const overlay = document.getElementById('overlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

// Open checkout
function openCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  const modal = document.getElementById('checkoutModal');
  const overlay = document.getElementById('overlay');
  const orderSummary = document.getElementById('orderSummary');
  const finalAmount = document.querySelector('.final-amount');
  const payAmount = document.getElementById('payAmount');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  orderSummary.innerHTML = cart.map(item => `
    <div class="summary-item">
      <span>${item.name} x ${item.quantity}</span>
      <span>₹${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');
  
  finalAmount.textContent = `₹${total.toFixed(2)}`;
  payAmount.textContent = total.toFixed(2);
  
  modal.classList.add('active');
  overlay.classList.add('active');
  toggleCart();
  
  // Update delivery charges based on cart total
  updateDeliveryCharges();
}

// Update delivery charges based on cart total
function updateDeliveryCharges() {
  const deliveryChargeRow = document.getElementById('deliveryChargeRow');
  const deliveryCharge = document.getElementById('deliveryCharge');
  const finalAmount = document.querySelector('.final-amount');
  const payAmount = document.getElementById('payAmount');
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Free delivery for orders above ₹1000
  const deliveryFee = subtotal >= 1000 ? 0 : 40;
  
  if (deliveryFee > 0) {
    deliveryChargeRow.style.display = 'flex';
    deliveryCharge.textContent = '₹40';
  } else {
    deliveryChargeRow.style.display = 'flex';
    deliveryCharge.textContent = 'FREE';
  }
  
  const total = subtotal + deliveryFee;
  finalAmount.textContent = `₹${total.toFixed(2)}`;
  payAmount.textContent = total.toFixed(2);
}

// Close checkout
function closeCheckout() {
  const modal = document.getElementById('checkoutModal');
  const overlay = document.getElementById('overlay');
  modal.classList.remove('active');
  overlay.classList.remove('active');
}

// Handle checkout form
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Free delivery for orders above ₹1000, otherwise ₹40
  const deliveryFee = subtotal >= 1000 ? 0 : 40;
  const total = subtotal + deliveryFee;
  
  const orderData = {
    customer: {
      name: document.getElementById('customerName').value,
      phone: document.getElementById('customerPhone').value,
      email: document.getElementById('customerEmail').value
    },
    address: {
      line1: document.getElementById('address1').value,
      line2: document.getElementById('address2').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      pincode: document.getElementById('pincode').value,
      landmark: document.getElementById('landmark').value
    },
    items: cart,
    subtotal: subtotal,
    deliveryCharges: deliveryFee,
    total: total,
    orderDate: new Date().toISOString()
  };
  
  try {
    // Save order first
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Payment details
      const upiId = '9488639502@ibl';
      const name = 'House of Elleora';
      const amount = total.toFixed(2);
      const note = `Order ${result.orderId}`;
      
      // Create payment modal
      showPaymentModal(result.orderId, amount, upiId, deliveryFee);
      
      // Clear cart
      cart = [];
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartUI();
      closeCheckout();
      document.getElementById('checkoutForm').reset();
    }
  } catch (error) {
    alert('Error placing order. Please try again or contact us directly.');
  }
});

// Show payment modal
function showPaymentModal(orderId, amount, upiId, deliveryFee) {
  const modal = document.createElement('div');
  modal.className = 'payment-modal';
  modal.innerHTML = `
    <div class="payment-modal-content">
      <h2>✅ Order Placed Successfully!</h2>
      <p class="order-id">Order ID: <strong>${orderId}</strong></p>
      
      <div class="payment-amount">
        <h3>Amount to Pay: ₹${amount}</h3>
        <p class="delivery-note">${deliveryFee > 0 ? 'Includes ₹40 delivery charges' : 'Free delivery (Order above ₹1000)'}</p>
      </div>
      
      <div class="payment-methods-section">
        <h3>Choose Payment Method:</h3>
        
        <button class="payment-option-btn gpay-btn" onclick="openGPay('${upiId}', '${amount}', '${orderId}')">
          <span class="payment-icon">G</span>
          Pay with Google Pay
        </button>
        
        <button class="payment-option-btn phonepe-btn" onclick="openPhonePe('${upiId}', '${amount}', '${orderId}')">
          <span class="payment-icon">📱</span>
          Pay with PhonePe
        </button>
        
        <button class="payment-option-btn paytm-btn" onclick="openPaytm('${upiId}', '${amount}', '${orderId}')">
          <span class="payment-icon">💳</span>
          Pay with Paytm
        </button>
        
        <div class="manual-payment">
          <p><strong>Or pay manually:</strong></p>
          <div class="upi-details">
            <p>UPI ID: <strong>${upiId}</strong></p>
            <button onclick="copyUPI('${upiId}')" class="copy-btn">Copy UPI ID</button>
          </div>
          <p>Amount: <strong>₹${amount}</strong></p>
          <p>Note: <strong>${orderId}</strong></p>
        </div>
        
        <div class="whatsapp-confirm">
          <p>After payment, send screenshot to:</p>
          <a href="https://wa.me/919488639502?text=Payment%20done%20for%20Order%20${orderId}%20-%20₹${amount}" 
             target="_blank" class="whatsapp-btn">
            💬 Confirm on WhatsApp
          </a>
        </div>
      </div>
      
      <button onclick="closePaymentModal()" class="close-payment-btn">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);
}

// Open GPay
function openGPay(upiId, amount, orderId) {
  const upiUrl = `gpay://upi/pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
  window.location.href = upiUrl;
  
  // Fallback to generic UPI
  setTimeout(() => {
    const genericUPI = `upi://pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
    window.location.href = genericUPI;
  }, 1000);
}

// Open PhonePe
function openPhonePe(upiId, amount, orderId) {
  const upiUrl = `phonepe://pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
  window.location.href = upiUrl;
  
  // Fallback to generic UPI
  setTimeout(() => {
    const genericUPI = `upi://pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
    window.location.href = genericUPI;
  }, 1000);
}

// Open Paytm
function openPaytm(upiId, amount, orderId) {
  const upiUrl = `paytmmp://pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
  window.location.href = upiUrl;
  
  // Fallback to generic UPI
  setTimeout(() => {
    const genericUPI = `upi://pay?pa=${upiId}&pn=House%20of%20Elleora&am=${amount}&cu=INR&tn=Order%20${orderId}`;
    window.location.href = genericUPI;
  }, 1000);
}

// Copy UPI ID
function copyUPI(upiId) {
  navigator.clipboard.writeText(upiId).then(() => {
    alert('UPI ID copied! Open any UPI app and paste it.');
  });
}

// Close payment modal
function closePaymentModal() {
  const modal = document.querySelector('.payment-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.category;
    displayProducts();
  });
});

// Close on overlay click
document.getElementById('overlay').addEventListener('click', () => {
  toggleCart();
  closeCheckout();
});

// Initial load
loadProducts();
