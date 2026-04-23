// Enhanced House of Elleora - Feature-rich version
let allProducts = [];
let currentFilter = 'all';
let currentSort = 'newest';

// Load products with loading state
async function loadProducts() {
  showLoadingSkeleton();
  
  try {
    const response = await fetch('/api/products');
    allProducts = await response.json();
    displayProducts();
    updateCategoryCounts();
  } catch (error) {
    console.error('Error loading products:', error);
    document.getElementById('products').innerHTML = '<p style="text-align: center; color: red;">Error loading products. Please refresh the page.</p>';
  }
}

// Show loading skeleton
function showLoadingSkeleton() {
  const container = document.getElementById('products');
  const skeletonHTML = Array(8).fill(0).map(() => `
    <div class="product-card skeleton">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-text skeleton-title"></div>
        <div class="skeleton-text skeleton-category"></div>
        <div class="skeleton-text skeleton-price"></div>
      </div>
    </div>
  `).join('');
  container.innerHTML = skeletonHTML;
}

// Display products with all filters
function displayProducts() {
  const container = document.getElementById('products');
  
  // Apply filters
  let filtered = allProducts.filter(product => {
    const matchesCategory = currentFilter === 'all' || product.category === currentFilter;
    return matchesCategory;
  });

  // Apply sorting
  filtered = sortProducts(filtered);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <h3>No products found</h3>
        <p>No products in this category</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(product => {
    const isNew = isNewProduct(product.created_at);
    const isLowStock = product.stock > 0 && product.stock < 5;
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        ${isNew ? '<span class="badge badge-new">NEW</span>' : ''}
        ${isLowStock ? `<span class="badge badge-low-stock">Only ${product.stock} left!</span>` : ''}
        
        <div class="product-image-wrapper" onclick="openQuickView('${product.id}')"
          <img src="${product.image}" 
               alt="${product.name}" 
               class="product-image" 
               loading="lazy"
               onerror="this.src='/images/placeholder.jpg'">
          <div class="product-overlay">
            <button class="btn-quick-view">Quick View</button>
          </div>
        </div>
        
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description || ''}</p>
          
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
    `;
  }).join('');
}

// Check if product is new (within last 7 days)
function isNewProduct(createdAt) {
  const productDate = new Date(createdAt);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return productDate > weekAgo;
}

// Sort products
function sortProducts(products) {
  const sorted = [...products];
  
  switch(currentSort) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'newest':
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

// Update category counts
function updateCategoryCounts() {
  const counts = {};
  allProducts.forEach(product => {
    counts[product.category] = (counts[product.category] || 0) + 1;
  });
  
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const category = btn.dataset.category;
    if (category !== 'all') {
      const count = counts[category] || 0;
      const countSpan = btn.querySelector('.category-count');
      if (countSpan) {
        countSpan.textContent = `(${count})`;
      } else {
        btn.innerHTML += ` <span class="category-count">(${count})</span>`;
      }
    }
  });
}

// Sort functionality
function initSort() {
  const sortSelect = document.getElementById('sortSelect');
  if (!sortSelect) return;
  
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    displayProducts();
  });
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

// Contact via WhatsApp
function contactWhatsApp(button) {
  const productName = button.getAttribute('data-product-name');
  const productPrice = button.getAttribute('data-product-price');
  const productImage = button.getAttribute('data-product-image');
  
  const imageUrl = productImage.startsWith('http') 
    ? productImage 
    : `${window.location.origin}${productImage}`;
  
  const message = `Hi! I'm interested in:\n\n*${productName}*\nPrice: ₹${productPrice}\n\n📸 Product Image:\n${imageUrl}\n\nCan you provide more details?`;
  
  const whatsappUrl = `https://wa.me/919488639502?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

// Quick View Modal
function openQuickView(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;
  
  const modal = document.getElementById('quickViewModal');
  if (!modal) return;
  
  document.getElementById('quickViewImage').src = product.image;
  document.getElementById('quickViewName').textContent = product.name;
  document.getElementById('quickViewCategory').textContent = product.category;
  document.getElementById('quickViewPrice').textContent = `₹${product.price}`;
  document.getElementById('quickViewDescription').textContent = product.description || 'No description available';
  document.getElementById('quickViewStock').textContent = product.stock === 0 ? 'Out of Stock' : product.stock < 5 ? `Only ${product.stock} left!` : `${product.stock} in stock`;
  document.getElementById('quickViewStock').className = `product-stock ${product.stock < 5 ? 'low' : ''} ${product.stock === 0 ? 'out' : ''}`;
  
  const orderBtn = document.getElementById('quickViewOrderBtn');
  orderBtn.disabled = product.stock === 0;
  orderBtn.onclick = () => {
    const message = `Hi! I'm interested in:\n\n*${product.name}*\nPrice: ₹${product.price}\n\n📸 Product Image:\n${product.image}\n\nCan you provide more details?`;
    window.open(`https://wa.me/919488639502?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  modal.classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

function closeQuickView() {
  document.getElementById('quickViewModal').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// Back to top button
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  });
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Initialize all features
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  initSort();
  initBackToTop();
});
