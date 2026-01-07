# AutoParts - Premium Auto Spare Parts E-commerce

Website jual beli sparepart mobil dengan desain futuristik menggunakan kombinasi warna 60% putih, 30% merah, dan 10% hitam.

## 🚀 Fitur Utama

### ✨ Frontend
- **Desain Futuristik** dengan animasi smooth dan gradient modern
- **Responsive Design** - Mobile, Tablet, Desktop friendly
- **Real-time Shopping Cart** dengan counter dan total harga
- **Search & Filter** produk
- **Product Management** dengan rating dan stok

### 💳 Sistem Pembayaran
- **Multiple Payment Methods:**
  - Bank Transfer
  - Credit Card
  - E-Wallet (OVO/GoPay/Dana)
  - Cash on Delivery
- **Real-time Stock Management** - Stok otomatis berkurang setelah pembelian
- **Order Tracking** dengan Order ID dan Transaction ID
- **Payment Confirmation** dengan modal sukses

### 🗄️ Backend
- **RESTful API** dengan PHP
- **SQLite Database** untuk penyimpanan data
- **4 Tabel Database:**
  - `products` - Data produk
  - `orders` - Data pesanan
  - `order_items` - Detail item pesanan
  - `payments` - Data pembayaran
- **Transaction Management** dengan rollback untuk keamanan data
- **Stock Validation** - Cek ketersediaan stok sebelum pembelian

## 📁 Struktur File

```
autoparts/
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker compose setup
├── README.md                  # Dokumentasi
├── public/
│   ├── index.html            # HTML utama
│   ├── app.js                # JavaScript frontend
│   └── api.php               # PHP Backend API
└── db/
    └── autoparts.db          # SQLite database (auto-generated)
```

## 🛠️ Instalasi

### Metode 1: Docker (Recommended)

1. **Clone atau buat struktur folder:**
```bash
mkdir autoparts
cd autoparts
```

2. **Buat file-file yang diperlukan:**
- Dockerfile
- docker-compose.yml
- public/index.html
- public/app.js
- public/api.php

3. **Build dan jalankan container:**
```bash
docker-compose up -d --build
```

4. **Akses website:**
```
http://localhost:8080
```

### Metode 2: Manual (XAMPP/WAMP)

1. **Install PHP 8.2+ dengan SQLite extension**

2. **Copy semua file ke folder htdocs:**
```bash
cp -r public/* /xampp/htdocs/autoparts/
```

3. **Pastikan SQLite enabled:**
```bash
# Cek php.ini
extension=pdo_sqlite
extension=sqlite3
```

4. **Akses website:**
```
http://localhost/autoparts/
```

## 📊 Database Schema

### Products Table
```sql
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    rating REAL NOT NULL,
    stock INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Orders Table
```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    total_amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Order Items Table
```sql
CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
)
```

### Payments Table
```sql
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    payment_method TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id)
)
```

## 🔌 API Endpoints

### GET Endpoints

**Get All Products**
```
GET /api.php?endpoint=products
Response: Array of products
```

**Get Single Product**
```
GET /api.php?endpoint=product&id={product_id}
Response: Product object
```

**Get All Orders**
```
GET /api.php?endpoint=orders
Response: Array of orders
```

**Get Single Order**
```
GET /api.php?endpoint=order&id={order_id}
Response: Order object with items
```

### POST Endpoints

**Checkout & Payment**
```
POST /api.php?endpoint=checkout
Body: {
    "customer_name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "address": "Jl. Example No. 123",
    "payment_method": "bank_transfer",
    "total_amount": 1500000,
    "items": [
        {
            "id": 1,
            "name": "Brake Pad Set",
            "quantity": 2,
            "price": 450000
        }
    ]
}
Response: {
    "success": true,
    "order_id": 1,
    "transaction_id": "TRX17123456789",
    "message": "Order completed successfully"
}
```

**Update Stock**
```
POST /api.php?endpoint=update_stock
Body: {
    "id": 1,
    "stock": 50
}
```

## 🎨 Design System

### Color Palette
- **Primary White (60%)**: #FFFFFF - Background utama
- **Primary Red (30%)**: #DC2626 - Buttons, accents, CTA
- **Primary Black (10%)**: #000000 - Text, footer

### Typography
- Font Family: System fonts (Tailwind default)
- Headings: Bold, 2xl-6xl
- Body: Regular, base-xl

### Components
- Rounded corners: lg-2xl
- Shadows: lg-2xl
- Transitions: 0.3s ease
- Hover effects: Scale, shadow, color change

## 📈 Sample Products

Website sudah include 8 produk sample:
1. Brake Pad Set - Rp 450,000
2. Engine Oil Filter - Rp 150,000
3. Spark Plug Set - Rp 320,000
4. Air Filter - Rp 180,000
5. Shock Absorber - Rp 850,000
6. Radiator - Rp 1,200,000
7. Battery 12V - Rp 950,000
8. Alternator - Rp 1,500,000

## 🧪 Testing

### Test Checkout Flow
1. Browse products
2. Add to cart (minimum 1 item)
3. Open cart modal
4. Click "Proceed to Checkout"
5. Fill customer information
6. Select payment method
7. Confirm payment
8. Verify success modal dengan Order ID dan Transaction ID
9. Check database untuk verify stock reduction
