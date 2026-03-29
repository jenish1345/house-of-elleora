let allProducts = [];
let currentFilter = 'all';

// Load products
async function loadProducts() {
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
    displayProducts();
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

  container.innerHTML = filtered.map(product => {
    const productData = encodeURIComponent(JSON.stringify({
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category
    }));
    
    return `
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
        <button class="add-to-cart-btn" onclick='contactWhatsApp(${productData})' ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Out of Stock' : '💬 Order on WhatsApp'}
        </button>
      </div>
    </div>
  `;
  }).join('');
}

// Contact via WhatsApp for specific product
function contactWhatsApp(productData) {
  const product = JSON.parse(decodeURIComponent(productData));
  
  // Get full image URL
  const imageUrl = product.image.startsWith('http') 
    ? product.image 
    : `${window.location.origin}${product.image}`;
  
  const message = `Hi! I'm interested in:\n\n*${product.name}*\nPrice: ₹${product.price}\n\n📸 Product Image:\n${imageUrl}\n\nCan you provide more details?`;
  
  const whatsappUrl = `https://wa.me/919488639502?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
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

// Initial load
loadProducts();
