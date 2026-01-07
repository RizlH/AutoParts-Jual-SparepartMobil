<?php
// config.php
class Database {
    private $db;
    
    public function __construct() {
        try {
            $this->db = new PDO('sqlite:autoparts.db');
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->initDatabase();
        } catch(PDOException $e) {
            die("Koneksi gagal: " . $e->getMessage());
        }
    }
    
    private function initDatabase() {
        // Buat tabel produk
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                category TEXT NOT NULL,
                image TEXT NOT NULL,
                rating REAL NOT NULL,
                stock INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        // Buat tabel pesanan
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS orders (
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
        ");
        
        // Buat tabel item pesanan
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price INTEGER NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        ");
        
        // Buat tabel pembayaran
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                payment_method TEXT NOT NULL,
                amount INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                transaction_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
        ");
        
        // Masukkan produk contoh jika tabel kosong
        $count = $this->db->query("SELECT COUNT(*) FROM products")->fetchColumn();
        if ($count == 0) {
            $this->insertSampleProducts();
        }
    }
    
    private function insertSampleProducts() {
        $products = [
            ['Set Rem Cakram', 450000, 'Rem', '🔧', 4.8, 25],
            ['Saringan Oli Mesin', 150000, 'Mesin', '⚙️', 4.9, 50],
            ['Set Busi', 320000, 'Mesin', '⚡', 4.7, 30],
            ['Saringan Udara', 180000, 'Mesin', '🌀', 4.6, 40],
            ['Shock Absorber', 850000, 'Suspensi', '🔩', 4.8, 15],
            ['Radiator', 1200000, 'Pendingin', '❄️', 4.9, 10],
            ['Baterai 12V', 950000, 'Kelistrikan', '🔋', 4.7, 20],
            ['Alternator', 1500000, 'Kelistrikan', '⚡', 4.8, 8]
        ];
        
        $stmt = $this->db->prepare("
            INSERT INTO products (name, price, category, image, rating, stock) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        foreach ($products as $product) {
            $stmt->execute($product);
        }
    }
    
    public function getConnection() {
        return $this->db;
    }
}

// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

switch ($method) {
    case 'GET':
        handleGet($db, $endpoint);
        break;
    case 'POST':
        handlePost($db, $endpoint);
        break;
    default:
        echo json_encode(['error' => 'Metode tidak diizinkan']);
}

function handleGet($db, $endpoint) {
    switch ($endpoint) {
        case 'products':
            $stmt = $db->query("SELECT * FROM products WHERE stock > 0 ORDER BY id");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
            
        case 'product':
            $id = isset($_GET['id']) ? $_GET['id'] : 0;
            $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            break;
            
        case 'orders':
            $stmt = $db->query("SELECT * FROM orders ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
            
        case 'order':
            $id = isset($_GET['id']) ? $_GET['id'] : 0;
            $stmt = $db->prepare("
                SELECT o.*, 
                       GROUP_CONCAT(oi.product_name || ' x' || oi.quantity) as items
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.id = ?
                GROUP BY o.id
            ");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
            break;
            
        default:
            echo json_encode(['error' => 'Endpoint tidak ditemukan']);
    }
}

function handlePost($db, $endpoint) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($endpoint) {
        case 'checkout':
            try {
                $db->beginTransaction();
                
                // Buat pesanan
                $stmt = $db->prepare("
                    INSERT INTO orders (customer_name, email, phone, address, total_amount, payment_method)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['customer_name'],
                    $data['email'],
                    $data['phone'],
                    $data['address'],
                    $data['total_amount'],
                    $data['payment_method']
                ]);
                
                $orderId = $db->lastInsertId();
                
                // Masukkan item pesanan dan update stok
                $stmtItem = $db->prepare("
                    INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                $stmtStock = $db->prepare("
                    UPDATE products SET stock = stock - ? WHERE id = ?
                ");
                
                foreach ($data['items'] as $item) {
                    // Cek ketersediaan stok
                    $checkStock = $db->prepare("SELECT stock FROM products WHERE id = ?");
                    $checkStock->execute([$item['id']]);
                    $currentStock = $checkStock->fetchColumn();
                    
                    if ($currentStock < $item['quantity']) {
                        throw new Exception("Stok tidak cukup untuk produk: " . $item['name']);
                    }
                    
                    // Masukkan item pesanan
                    $stmtItem->execute([
                        $orderId,
                        $item['id'],
                        $item['name'],
                        $item['quantity'],
                        $item['price']
                    ]);
                    
                    // Update stok
                    $stmtStock->execute([
                        $item['quantity'],
                        $item['id']
                    ]);
                }
                
                // Buat catatan pembayaran
                $stmtPayment = $db->prepare("
                    INSERT INTO payments (order_id, payment_method, amount, status, transaction_id)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $transactionId = 'TRX' . time() . rand(1000, 9999);
                $stmtPayment->execute([
                    $orderId,
                    $data['payment_method'],
                    $data['total_amount'],
                    'completed',
                    $transactionId
                ]);
                
                // Update status pesanan
                $stmtUpdate = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
                $stmtUpdate->execute([$orderId]);
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId,
                    'message' => 'Pesanan berhasil diproses'
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                echo json_encode([
                    'success' => false,
                    'error' => $e->getMessage()
                ]);
            }
            break;
            
        case 'update_stock':
            try {
                $stmt = $db->prepare("UPDATE products SET stock = ? WHERE id = ?");
                $stmt->execute([$data['stock'], $data['id']]);
                echo json_encode(['success' => true]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
            break;
            
        default:
            echo json_encode(['error' => 'Endpoint tidak ditemukan']);
    }
}
?>