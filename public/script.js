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
        
        <div class="product-image-wrapper" onclick="openQuickView('${product.id}')">
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


// ============================================
// WISHLIST FUNCTIONALITY
// ============================================

let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

function updateWishlistCount() {
  const count = wishlist.length;
  document.querySelector('.wishlist-count').textContent = count;
}

function toggleWishlistSidebar() {
  const sidebar = document.getElementById('wishlistSidebar');
  const overlay = document.getElementById('overlay');
  
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  
  if (sidebar.classList.contains('active')) {
    displayWishlist();
  }
}

function addToWishlist(productId) {
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;
  
  const existingIndex = wishlist.findIndex(item => item.id == productId);
  
  if (existingIndex > -1) {
    // Remove from wishlist
    wishlist.splice(existingIndex, 1);
    showToast('Removed from wishlist', 'success');
  } else {
    // Add to wishlist
    wishlist.push(product);
    showToast('Added to wishlist ❤️', 'success');
  }
  
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  updateWishlistButtons();
  displayWishlist();
}

function displayWishlist() {
  const container = document.getElementById('wishlistItems');
  
  if (wishlist.length === 0) {
    container.innerHTML = `
      <div class="empty-wishlist">
        <div class="empty-wishlist-icon">💔</div>
        <h3>Your wishlist is empty</h3>
        <p>Add items you love to your wishlist</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = wishlist.map(item => `
    <div class="wishlist-item">
      <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
      <div class="wishlist-item-details">
        <div class="wishlist-item-category">${item.category}</div>
        <div class="wishlist-item-name">${item.name}</div>
        <div class="wishlist-item-price">₹${item.price}</div>
        <button class="add-to-cart-from-wishlist" onclick="orderFromWishlist('${item.id}')">
          💬 Order Now
        </button>
      </div>
      <button class="remove-wishlist" onclick="addToWishlist('${item.id}')">×</button>
    </div>
  `).join('');
}

function orderFromWishlist(productId) {
  const product = wishlist.find(p => p.id == productId);
  if (!product) return;
  
  const message = `Hi! I'm interested in:\n\n*${product.name}*\nPrice: ₹${product.price}\n\n📸 Product Image:\n${product.image}\n\nCan you provide more details?`;
  window.open(`https://wa.me/919488639502?text=${encodeURIComponent(message)}`, '_blank');
}

function updateWishlistButtons() {
  document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
    const productId = btn.dataset.productId;
    const isInWishlist = wishlist.some(item => item.id == productId);
    btn.classList.toggle('active', isInWishlist);
    btn.textContent = isInWishlist ? '❤️' : '🤍';
  });
}

// ============================================
// REVIEWS & RATINGS FUNCTIONALITY
// ============================================

let reviews = JSON.parse(localStorage.getItem('reviews')) || {};

function getProductReviews(productId) {
  return reviews[productId] || [];
}

function calculateAverageRating(productId) {
  const productReviews = getProductReviews(productId);
  if (productReviews.length === 0) return 0;
  
  const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / productReviews.length).toFixed(1);
}

function getStarDisplay(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) stars += '⯨';
  stars += '☆'.repeat(5 - Math.ceil(rating));
  return stars;
}

function openReviewModal(productId) {
  const modal = document.getElementById('reviewModal');
  const overlay = document.getElementById('overlay');
  
  document.getElementById('reviewProductId').value = productId;
  document.getElementById('reviewForm').reset();
  document.getElementById('reviewRating').value = '';
  
  // Reset star rating
  document.querySelectorAll('#starRating .star').forEach(star => {
    star.classList.remove('active');
    star.textContent = '☆';
  });
  
  modal.classList.add('active');
  overlay.classList.add('active');
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

// Star rating interaction
document.addEventListener('DOMContentLoaded', () => {
  const starRating = document.getElementById('starRating');
  if (starRating) {
    starRating.addEventListener('click', (e) => {
      if (e.target.classList.contains('star')) {
        const rating = parseInt(e.target.dataset.rating);
        document.getElementById('reviewRating').value = rating;
        
        document.querySelectorAll('#starRating .star').forEach((star, index) => {
          if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
          } else {
            star.classList.remove('active');
            star.textContent = '☆';
          }
        });
      }
    });
  }
});

// Review form submission
document.addEventListener('DOMContentLoaded', () => {
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const productId = document.getElementById('reviewProductId').value;
      const name = document.getElementById('reviewName').value;
      const rating = parseInt(document.getElementById('reviewRating').value);
      const text = document.getElementById('reviewText').value;
      const email = document.getElementById('reviewEmail').value;
      
      if (!rating) {
        showToast('Please select a rating', 'error');
        return;
      }
      
      const review = {
        id: Date.now().toString(),
        productId,
        name,
        rating,
        text,
        email,
        date: new Date().toISOString(),
        verified: !!email
      };
      
      if (!reviews[productId]) {
        reviews[productId] = [];
      }
      
      reviews[productId].push(review);
      localStorage.setItem('reviews', JSON.stringify(reviews));
      
      // Send email notification
      if (email) {
        await sendReviewNotification(review, productId);
      }
      
      showToast('Thank you for your review! 🌟', 'success');
      closeReviewModal();
      
      // Refresh product display if in quick view
      const quickViewModal = document.getElementById('quickViewModal');
      if (quickViewModal.classList.contains('active')) {
        openQuickView(productId);
      }
      
      displayProducts();
    });
  }
});

function displayReviews(productId) {
  const productReviews = getProductReviews(productId);
  
  if (productReviews.length === 0) {
    return `
      <div class="no-reviews">
        <p>No reviews yet. Be the first to review this product!</p>
      </div>
    `;
  }
  
  // Calculate rating breakdown
  const ratingCounts = [0, 0, 0, 0, 0];
  productReviews.forEach(review => {
    ratingCounts[review.rating - 1]++;
  });
  
  const avgRating = calculateAverageRating(productId);
  
  return `
    <div class="rating-summary">
      <div class="average-rating">
        <div class="average-rating-number">${avgRating}</div>
        <div class="average-rating-stars">${getStarDisplay(parseFloat(avgRating))}</div>
        <div class="rating-count">${productReviews.length} reviews</div>
      </div>
      <div class="rating-breakdown">
        ${[5, 4, 3, 2, 1].map(star => {
          const count = ratingCounts[star - 1];
          const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
          return `
            <div class="rating-bar">
              <div class="rating-bar-label">${star} ★</div>
              <div class="rating-bar-fill">
                <div class="rating-bar-progress" style="width: ${percentage}%"></div>
              </div>
              <div class="rating-bar-count">${count}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    ${productReviews.slice().reverse().map(review => `
      <div class="review-item">
        <div class="review-header">
          <div>
            <span class="reviewer-name">${review.name}</span>
            ${review.verified ? '<span class="verified-badge">✓ Verified</span>' : ''}
          </div>
          <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
        </div>
        <div class="review-stars">${getStarDisplay(review.rating)}</div>
        <div class="review-text">${review.text}</div>
      </div>
    `).join('')}
  `;
}

// ============================================
// EMAIL NOTIFICATION FUNCTIONALITY
// ============================================

async function sendReviewNotification(review, productId) {
  const product = allProducts.find(p => p.id == productId);
  
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'review',
        to: review.email,
        subject: 'Thank you for your review!',
        data: {
          customerName: review.name,
          productName: product.name,
          rating: review.rating,
          reviewText: review.text
        }
      })
    });
    
    if (response.ok) {
      console.log('Review notification sent');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

async function sendOrderNotification(orderData) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'order',
        to: orderData.customer.email,
        subject: 'Order Confirmation - House of Elleora',
        data: orderData
      })
    });
    
    if (response.ok) {
      showToast('Order confirmation sent to your email 📧', 'success');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('emailToast');
  const messageEl = document.getElementById('emailToastMessage');
  
  messageEl.textContent = message;
  toast.className = `email-toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// UPDATE DISPLAY FUNCTIONS
// ============================================

// Override the original displayProducts to include wishlist and ratings
const originalDisplayProducts = displayProducts;
displayProducts = function() {
  originalDisplayProducts();
  
  // Add wishlist buttons and ratings to each product card
  document.querySelectorAll('.product-card').forEach(card => {
    const productId = card.dataset.productId;
    const product = allProducts.find(p => p.id == productId);
    
    if (!product) return;
    
    // Add wishlist button
    const imageWrapper = card.querySelector('.product-image-wrapper');
    if (imageWrapper && !imageWrapper.querySelector('.wishlist-heart-btn')) {
      const wishlistBtn = document.createElement('button');
      wishlistBtn.className = 'wishlist-heart-btn';
      wishlistBtn.dataset.productId = productId;
      wishlistBtn.textContent = wishlist.some(item => item.id == productId) ? '❤️' : '🤍';
      wishlistBtn.onclick = (e) => {
        e.stopPropagation();
        addToWishlist(productId);
      };
      if (wishlist.some(item => item.id == productId)) {
        wishlistBtn.classList.add('active');
      }
      imageWrapper.appendChild(wishlistBtn);
    }
    
    // Add rating display
    const productInfo = card.querySelector('.product-info');
    const categoryEl = productInfo.querySelector('.product-category');
    
    if (categoryEl && !productInfo.querySelector('.product-rating')) {
      const avgRating = calculateAverageRating(productId);
      const reviewCount = getProductReviews(productId).length;
      
      if (reviewCount > 0) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'product-rating';
        ratingDiv.innerHTML = `
          <span class="stars">${getStarDisplay(parseFloat(avgRating))}</span>
          <span class="rating-count">(${reviewCount})</span>
        `;
        categoryEl.after(ratingDiv);
      }
    }
  });
};

// Update Quick View to include reviews
const originalOpenQuickView = openQuickView;
openQuickView = function(productId) {
  originalOpenQuickView(productId);
  
  const product = allProducts.find(p => p.id == productId);
  if (!product) return;
  
  const quickViewDetails = document.querySelector('.quick-view-details');
  
  // Add rating display
  const avgRating = calculateAverageRating(productId);
  const reviewCount = getProductReviews(productId).length;
  
  if (!quickViewDetails.querySelector('.product-rating')) {
    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'product-rating';
    ratingDiv.innerHTML = reviewCount > 0 
      ? `<span class="stars">${getStarDisplay(parseFloat(avgRating))}</span>
         <span class="rating-count">(${reviewCount} reviews)</span>`
      : `<span class="rating-count">No reviews yet</span>`;
    
    const categoryEl = quickViewDetails.querySelector('.product-category');
    categoryEl.after(ratingDiv);
  }
  
  // Add reviews section
  if (!quickViewDetails.querySelector('.reviews-section')) {
    const reviewsSection = document.createElement('div');
    reviewsSection.className = 'reviews-section';
    reviewsSection.innerHTML = `
      <div class="reviews-header">
        <h4>Customer Reviews</h4>
        <button class="write-review-btn" onclick="openReviewModal('${productId}')">Write Review</button>
      </div>
      ${displayReviews(productId)}
    `;
    quickViewDetails.appendChild(reviewsSection);
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateWishlistCount();
});


// ============================================
