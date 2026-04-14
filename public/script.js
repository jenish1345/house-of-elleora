let allProducts = [];
let currentFilter = 'all';
let currentPage = 1;
let totalPages = 1;

// Load products
async function loadProducts() {
  try {
    // Load all pages to get all products
    let page = 1;
    allProducts = [];
    
    while (true) {
      const response = await fetch(`/api/products?page=${page}`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        allProducts = allProducts.concat(data.products);
        page++;
        
        // Stop if we've loaded all pages
        if (page > data.totalPages) break;
      } else {
        break;
      }
    }
    
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

  container.innerHTML = filtered.map((product, index) => `
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
        <button class="add-to-cart-btn" 
                data-product-name="${product.name.replace(/"/g, '&quot;')}" 
                data-product-price="${product.price}" 
                data-product-image="${product.image.replace(/"/g, '&quot;')}"
                onclick="contactWhatsApp(this)" 
                ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Out of Stock' : '💬 Order on WhatsApp'}
        </button>
      </div>
    </div>
  `).join('');
}

// Contact via WhatsApp for specific product
function contactWhatsApp(button) {
  const productName = button.getAttribute('data-product-name');
  const productPrice = button.getAttribute('data-product-price');
  const productImage = button.getAttribute('data-product-image');
  
  // Get full image URL
  const imageUrl = productImage.startsWith('http') 
    ? productImage 
    : `${window.location.origin}${productImage}`;
  
  const message = `Hi! I'm interested in:\n\n*${productName}*\nPrice: ₹${productPrice}\n\n📸 Product Image:\n${imageUrl}\n\nCan you provide more details?`;
  
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
