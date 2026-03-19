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
        <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
  
  // Add city change listener for delivery charges
  document.getElementById('city').addEventListener('input', updateDeliveryCharges);
}

// Update delivery charges based on city
function updateDeliveryCharges() {
  const city = document.getElementById('city').value.toLowerCase().trim();
  const deliveryChargeRow = document.getElementById('deliveryChargeRow');
  const deliveryCharge = document.getElementById('deliveryCharge');
  const finalAmount = document.querySelector('.final-amount');
  const payAmount = document.getElementById('payAmount');
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let deliveryFee = 0;
  
  // Check if city is Tuticorin (various spellings)
  const isTuticorin = city.includes('tuticorin') || city.includes('thoothukudi') || city.includes('tuti');
  
  if (!isTuticorin && city.length > 0) {
    deliveryFee = 40;
    deliveryChargeRow.style.display = 'flex';
    deliveryCharge.textContent = '₹40';
  } else {
    deliveryChargeRow.style.display = 'none';
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
  
  const city = document.getElementById('city').value.toLowerCase().trim();
  const isTuticorin = city.includes('tuticorin') || city.includes('thoothukudi') || city.includes('tuti');
  const deliveryFee = (!isTuticorin && city.length > 0) ? 40 : 0;
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      
      // Open GPay payment
      const upiId = 'antonyjenish1345@okhdfcbank';
      const name = 'House of Elleora';
      const amount = total.toFixed(2);
      const note = `Order ${result.orderId}`;
      
      // UPI payment URL
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
      
      // Try to open UPI app
      window.location.href = upiUrl;
      
      // Show confirmation
      setTimeout(() => {
        alert(`Order placed! Order ID: ${result.orderId}\n\nYou will be redirected to GPay/PhonePe/Paytm to complete payment of ₹${amount}\n\nIf payment app doesn't open, please pay to:\nUPI: ${upiId}\nAmount: ₹${amount}\nNote: ${note}\n\n📦 Delivery: ${deliveryFee > 0 ? '₹40 (Outside Tuticorin)' : 'FREE (Tuticorin)'}\n🔄 Returns accepted within 7 days`);
        
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
        closeCheckout();
        document.getElementById('checkoutForm').reset();
      }, 1000);
    }
  } catch (error) {
    alert('Error placing order. Please try again or contact us directly.');
  }
});

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
