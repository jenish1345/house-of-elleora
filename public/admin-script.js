let products = [];
let editingId = null;

// Load products
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    products = await response.json();
    displayProducts();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Display products in admin panel
function displayProducts() {
  const container = document.getElementById('productsList');
  
  if (products.length === 0) {
    container.innerHTML = '<p class="no-products">No products yet. Add your first product above!</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-item">
      <img src="${product.image}" alt="${product.name}" class="product-thumb">
      <div class="product-details">
        <h3>${product.name}</h3>
        <p class="category">${product.category}</p>
        <p class="price">₹${product.price}</p>
        <p class="stock ${product.stock < 5 ? 'low-stock' : ''}">
          Stock: ${product.stock} ${product.stock < 5 ? '⚠️' : ''}
        </p>
      </div>
      <div class="product-actions">
        <button class="btn-edit" onclick="editProduct('${product.id}')">Edit</button>
        <button class="btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

// Handle form submission
document.getElementById('productForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('price', document.getElementById('price').value);
  formData.append('stock', document.getElementById('stock').value);
  formData.append('description', document.getElementById('description').value);
  
  const imageFile = document.getElementById('image').files[0];
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      body: formData
    });

    if (response.ok) {
      alert(editingId ? 'Product updated successfully!' : 'Product added successfully!');
      resetForm();
      loadProducts();
    }
  } catch (error) {
    alert('Error saving product: ' + error.message);
  }
});

// Edit product
function editProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  editingId = id;
  document.getElementById('productId').value = id;
  document.getElementById('name').value = product.name;
  document.getElementById('category').value = product.category;
  document.getElementById('price').value = product.price;
  document.getElementById('stock').value = product.stock;
  document.getElementById('description').value = product.description;
  
  document.querySelector('.btn-primary').textContent = 'Update Product';
  document.getElementById('cancelBtn').style.display = 'inline-block';
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete product
async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Product deleted successfully!');
      loadProducts();
    }
  } catch (error) {
    alert('Error deleting product: ' + error.message);
  }
}

// Reset form
function resetForm() {
  editingId = null;
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.querySelector('.btn-primary').textContent = 'Add Product';
  document.getElementById('cancelBtn').style.display = 'none';
}

// Cancel button
document.getElementById('cancelBtn').addEventListener('click', resetForm);

// Initial load
loadProducts();


// Load and display orders
async function loadOrders() {
  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    displayOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

function displayOrders(orders) {
  const container = document.getElementById('ordersList');
  
  if (orders.length === 0) {
    container.innerHTML = '<p class="no-products">No orders yet.</p>';
    return;
  }

  // Sort by newest first
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <strong>Order #${order.orderId}</strong>
          <span class="order-date">${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
      </div>
      <div class="order-body">
        <div class="order-customer">
          <h4>Customer Details</h4>
          <p><strong>${order.customer.name}</strong></p>
          <p>📞 ${order.customer.phone}</p>
          ${order.customer.email ? `<p>📧 ${order.customer.email}</p>` : ''}
        </div>
        <div class="order-address">
          <h4>Delivery Address</h4>
          <p>${order.address.line1}</p>
          ${order.address.line2 ? `<p>${order.address.line2}</p>` : ''}
          <p>${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
          ${order.address.landmark ? `<p>Landmark: ${order.address.landmark}</p>` : ''}
        </div>
        <div class="order-items">
          <h4>Items</h4>
          ${order.items.map(item => `
            <p>${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</p>
          `).join('')}
          <p class="order-total"><strong>Total: ₹${order.total.toFixed(2)}</strong></p>
        </div>
      </div>
      <div class="order-actions">
        <select onchange="updateOrderStatus('${order.orderId}', this.value)" class="status-select">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
    </div>
  `).join('');
}

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      alert('Order status updated!');
      loadOrders();
    }
  } catch (error) {
    alert('Error updating order status');
  }
}

// Load orders on page load
loadOrders();

// Refresh orders every 30 seconds
setInterval(loadOrders, 30000);


// Track last order count for notifications
let lastOrderCount = 0;

// Play notification sound
function playNotificationSound() {
  // Create a simple beep sound
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Enhanced order loading with notification
async function loadOrdersWithNotification() {
  try {
    const response = await fetch('/api/orders');
    const orders = await response.json();
    
    // Check for new orders
    if (lastOrderCount > 0 && orders.length > lastOrderCount) {
      playNotificationSound();
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('🎉 New Order Received!', {
          body: `You have ${orders.length - lastOrderCount} new order(s)`,
          icon: '/logo.png'
        });
      }
    }
    
    lastOrderCount = orders.length;
    displayOrders(orders);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Request notification permission
if (Notification.permission === 'default') {
  Notification.requestPermission();
}

// Replace the interval with notification-enabled version
setInterval(loadOrdersWithNotification, 30000);

// Initial load with notification setup
loadOrdersWithNotification();
