// Konfigurasi
const API_URL = 'api.php';

// State
let cart = [];
let products = [];

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('closeCart').addEventListener('click', closeCart);
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('cancelCheckout').addEventListener('click', closeCheckout);
    document.getElementById('confirmPayment').addEventListener('click', processPayment);
    document.getElementById('closeSuccess').addEventListener('click', closeSuccess);
    document.getElementById('searchInput').addEventListener('input', filterProducts);
    
    // Smooth scroll untuk navigasi
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Load Products dari API
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?endpoint=products`);
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Gagal memuat produk', 'error');
    }
}

// Render Products
function renderProducts(productsToRender) {
    const grid = document.getElementById('productsGrid');
    
    if (productsToRender.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-12">Produk tidak ditemukan</div>';
        return;
    }
    
    grid.innerHTML = productsToRender.map(product => `
        <div class="product-card bg-white rounded-xl shadow-lg border-2 border-gray-100 hover:border-red-600 overflow-hidden">
            <div class="bg-gradient-to-br from-red-50 to-white p-8 flex items-center justify-center text-6xl">
                ${product.image}
            </div>
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                        ${product.category}
                    </span>
                    <div class="flex items-center">
                        <svg class="w-4 h-4 text-yellow-500 fill-yellow-500" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span class="ml-1 text-sm text-gray-600">${product.rating}</span>
                    </div>
                </div>
                <h3 class="font-bold text-black text-lg mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-4">Stok: ${product.stock} unit</p>
                <div class="flex items-center justify-between mb-4">
                    <span class="text-2xl font-bold text-red-600">
                        Rp ${parseInt(product.price).toLocaleString('id-ID')}
                    </span>
                </div>
                <button 
                    onclick="addToCart(${product.id})" 
                    class="w-full btn-primary text-white py-3 rounded-lg font-semibold"
                    ${product.stock === 0 ? 'disabled' : ''}
                >
                    ${product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </button>
            </div>
        </div>
    `).join('');
}

// Filter Products
function filterProducts(e) {
    const query = e.target.value.toLowerCase();
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
    );
    renderProducts(filtered);
}

// Tambah ke Keranjang
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product || product.stock === 0) {
        showNotification('Produk tidak tersedia', 'error');
        return;
    }
    
    const cartItem = cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity >= product.stock) {
            showNotification('Stok maksimal tercapai', 'error');
            return;
        }
        cartItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification('Produk ditambahkan ke keranjang', 'success');
}

// Hapus dari Keranjang
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    showNotification('Produk dihapus dari keranjang', 'success');
}

// Update Kuantitas
function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (!cartItem) return;
    
    const newQuantity = cartItem.quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (newQuantity > product.stock) {
        showNotification('Stok maksimal tercapai', 'error');
        return;
    }
    
    cartItem.quantity = newQuantity;
    updateCart();
}

// Update Cart UI
function updateCart() {
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
    
    renderCart();
}

// Render Cart
function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center text-gray-500 py-8">Keranjang Anda kosong</p>';
        totalPrice.textContent = 'Rp 0';
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div class="flex items-center space-x-4 flex-1">
                <div class="text-3xl">${item.image}</div>
                <div class="flex-1">
                    <h4 class="font-bold text-black">${item.name}</h4>
                    <p class="text-sm text-gray-600">Rp ${parseInt(item.price).toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <button 
                    onclick="updateQuantity(${item.id}, -1)" 
                    class="w-8 h-8 bg-gray-200 hover:bg-red-600 hover:text-white rounded-lg font-bold transition-all"
                >
                    -
                </button>
                <span class="font-bold text-black w-8 text-center">${item.quantity}</span>
                <button 
                    onclick="updateQuantity(${item.id}, 1)" 
                    class="w-8 h-8 bg-gray-200 hover:bg-red-600 hover:text-white rounded-lg font-bold transition-all"
                >
                    +
                </button>
                <button 
                    onclick="removeFromCart(${item.id})" 
                    class="ml-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                >
                    ×
                </button>
            </div>
        </div>
    `).join('');
    
    totalPrice.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// Buka/Tutup Cart
function openCart() {
    document.getElementById('cartModal').classList.remove('hidden');
    renderCart();
}

function closeCart() {
    document.getElementById('cartModal').classList.add('hidden');
}

// Buka/Tutup Checkout
function openCheckout() {
    if (cart.length === 0) {
        showNotification('Keranjang Anda kosong', 'error');
        return;
    }
    
    closeCart();
    document.getElementById('checkoutModal').classList.remove('hidden');
    renderCheckoutSummary();
}

function closeCheckout() {
    document.getElementById('checkoutModal').classList.add('hidden');
}

// Render Checkout Summary
function renderCheckoutSummary() {
    const summary = document.getElementById('checkoutSummary');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    summary.innerHTML = cart.map(item => `
        <div class="flex justify-between text-sm mb-2">
            <span class="text-gray-700">${item.name} x${item.quantity}</span>
            <span class="font-semibold text-black">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
    
    document.getElementById('checkoutTotal').textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// Proses Pembayaran
async function processPayment() {
    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    // Validasi
    if (!name || !email || !phone || !address) {
        showNotification('Harap isi semua bidang yang wajib diisi', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Harap masukkan email yang valid', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        customer_name: name,
        email: email,
        phone: phone,
        address: address,
        payment_method: paymentMethod,
        total_amount: total,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
        }))
    };
    
    try {
        const response = await fetch(`${API_URL}?endpoint=checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Kosongkan keranjang
            cart = [];
            updateCart();
            
            // Kosongkan form
            document.getElementById('customerName').value = '';
            document.getElementById('customerEmail').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('customerAddress').value = '';
            
            // Tutup modal checkout
            closeCheckout();
            
            // Tampilkan modal sukses
            document.getElementById('orderId').textContent = result.order_id;
            document.getElementById('transactionId').textContent = result.transaction_id;
            document.getElementById('successModal').classList.remove('hidden');
            
            // Muat ulang produk untuk update stok
            loadProducts();
        } else {
            showNotification(result.error || 'Pembayaran gagal', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Pembayaran gagal. Silakan coba lagi.', 'error');
    }
}

// Tutup Modal Sukses
function closeSuccess() {
    document.getElementById('successModal').classList.add('hidden');
}

// Validasi Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Tampilkan Notifikasi
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-24 right-4 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-semibold fade-in ${
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Fungsi Carousel
document.addEventListener('DOMContentLoaded', () => {
    setupCarousel();
});

function setupCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    let currentSlide = 0;
    
    function showSlide(index) {
        // Sembunyikan semua slide
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Tampilkan slide saat ini
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }
    
    function nextSlide() {
        let nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }
    
    function prevSlide() {
        let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }
    
    // Event Listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
        });
    });
    
    // Auto slide setiap 5 detik
    setInterval(nextSlide, 20000);
    
    // Inisialisasi slide pertama
    showSlide(0);
}