

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration
const PORT = process.env.PORT || 3000;
const DB_CONFIG = {
    host: process.env.DB_HOST || 'database',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'ecommerce',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Dossier pour les uploads
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuration Multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'product-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});


const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/uploads', express.static(UPLOADS_DIR));


let pool;


async function initializeDatabase() {
    let retries = 10;
    
    while (retries > 0) {
        try {
            console.log(`🔄 Tentative de connexion à MySQL... (${retries} essais restants)`);
            
            pool = mysql.createPool(DB_CONFIG);
            
            
            const connection = await pool.getConnection();
            console.log('✅ Connexion à MySQL établie avec succès!');
            connection.release();
            
            
            await createTables();
            
            return true;
        } catch (error) {
            console.error(`❌ Erreur de connexion à MySQL: ${error.message}`);
            retries--;
            
            if (retries > 0) {
                console.log('⏳ Nouvelle tentative dans 5 secondes...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    
    console.error('💀 Impossible de se connecter à MySQL après plusieurs tentatives');
    return false;
}

async function createTables() {
    
    const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10, 3) NOT NULL,
            stock INT DEFAULT 0,
            image_url VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    await pool.execute(createProductsTable);
    

    try {
        await pool.execute('SELECT image_url FROM products LIMIT 1');
    } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            console.log('📷 Ajout de la colonne image_url...');
            await pool.execute('ALTER TABLE products ADD COLUMN image_url VARCHAR(500)');
        }
    }
    
    console.log('✅ Table "products" vérifiée/créée');
    
   
    const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(50) NOT NULL UNIQUE,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            customer_email VARCHAR(255),
            customer_address TEXT NOT NULL,
            notes TEXT,
            payment_method ENUM('cash', 'card', 'transfer') NOT NULL DEFAULT 'cash',
            status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
            subtotal DECIMAL(10, 3) NOT NULL,
            shipping DECIMAL(10, 3) NOT NULL DEFAULT 0,
            total DECIMAL(10, 3) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    const createOrderItemsTable = `
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_price DECIMAL(10, 3) NOT NULL,
            quantity INT NOT NULL,
            total DECIMAL(10, 3) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    `;
    
    await pool.execute(createOrdersTable);
    await pool.execute(createOrderItemsTable);
    console.log('✅ Tables "orders" et "order_items" vérifiées/créées');
}




app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'disconnected';
    }
    
    res.json({
        status: 'ok',
        service: 'backend-api',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});


function formatProduct(product) {
    return {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock)
    };
}


app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM products ORDER BY created_at DESC'
        );
        // Convertir les prix en nombres
        const products = rows.map(formatProduct);
        res.json(products);
    } catch (error) {
        console.error('Erreur GET /products:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des produits',
            details: error.message 
        });
    }
});


app.get('/api/products/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        
       
        res.json(formatProduct(rows[0]));
    } catch (error) {
        console.error('Erreur GET /products/:id:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération du produit',
            details: error.message 
        });
    }
});


app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock, image_url } = req.body;
        
    
        if (!name || !price) {
            return res.status(400).json({ 
                error: 'Le nom et le prix sont requis' 
            });
        }
        
        
        let finalImageUrl = image_url || null;
        if (req.file) {
            finalImageUrl = req.file.filename;
        }
        
        const [result] = await pool.execute(
            'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description || '', parseFloat(price), parseInt(stock) || 0, finalImageUrl]
        );
        
        const [newProduct] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );
        
        console.log(`✅ Produit créé: ${name} (ID: ${result.insertId})`);
        res.status(201).json(formatProduct(newProduct[0]));
    } catch (error) {
        console.error('Erreur POST /products:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création du produit',
            details: error.message 
        });
    }
});


app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock, image_url } = req.body;
        const { id } = req.params;
        
        // Vérifier si le produit existe
        const [existing] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        
        // Déterminer l'URL de l'image
        let finalImageUrl = existing[0].image_url;
        if (req.file) {
            
            if (existing[0].image_url && !existing[0].image_url.startsWith('http')) {
                const oldImagePath = path.join(UPLOADS_DIR, existing[0].image_url);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            finalImageUrl = req.file.filename;
        } else if (image_url !== undefined) {
            finalImageUrl = image_url;
        }
        
        await pool.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
            [
                name || existing[0].name,
                description !== undefined ? description : existing[0].description,
                price !== undefined ? parseFloat(price) : existing[0].price,
                stock !== undefined ? parseInt(stock) : existing[0].stock,
                finalImageUrl,
                id
            ]
        );
        
        const [updatedProduct] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        
        console.log(`✅ Produit mis à jour: ID ${id}`);
        res.json(formatProduct(updatedProduct[0]));
    } catch (error) {
        console.error('Erreur PUT /products/:id:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour du produit',
            details: error.message 
        });
    }
});


app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await pool.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Produit non trouvé' });
        }
        
        
        if (existing[0].image_url && !existing[0].image_url.startsWith('http')) {
            const imagePath = path.join(UPLOADS_DIR, existing[0].image_url);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        await pool.execute('DELETE FROM products WHERE id = ?', [id]);
        
        console.log(`✅ Produit supprimé: ID ${id}`);
        res.json({ 
            message: 'Produit supprimé avec succès',
            deletedProduct: existing[0]
        });
    } catch (error) {
        console.error('Erreur DELETE /products/:id:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression du produit',
            details: error.message 
        });
    }
});

// Gestion des erreurs Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux. Maximum 5MB.' });
        }
        return res.status(400).json({ error: error.message });
    }
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    next();
});


async function createOrdersTables() {
    const createOrdersTable = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(50) NOT NULL UNIQUE,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            customer_email VARCHAR(255),
            customer_address TEXT NOT NULL,
            notes TEXT,
            payment_method ENUM('cash', 'card', 'transfer') NOT NULL DEFAULT 'cash',
            status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
            subtotal DECIMAL(10, 3) NOT NULL,
            shipping DECIMAL(10, 3) NOT NULL DEFAULT 0,
            total DECIMAL(10, 3) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    
    const createOrderItemsTable = `
        CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            product_price DECIMAL(10, 3) NOT NULL,
            quantity INT NOT NULL,
            total DECIMAL(10, 3) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    `;
    
    await pool.execute(createOrdersTable);
    await pool.execute(createOrderItemsTable);
    console.log('✅ Tables "orders" et "order_items" vérifiées/créées');
}


app.post('/api/orders', async (req, res) => {
    try {
        const { 
            orderNumber, 
            customerName, 
            customerPhone, 
            customerEmail, 
            customerAddress, 
            notes,
            paymentMethod, 
            items, 
            subtotal, 
            shipping, 
            total 
        } = req.body;
        
      
        if (!orderNumber || !customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
            return res.status(400).json({ 
                error: 'Informations de commande incomplètes' 
            });
        }
        
       
        const [orderResult] = await pool.execute(
            `INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, customer_address, notes, payment_method, subtotal, shipping, total, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [orderNumber, customerName, customerPhone, customerEmail || null, customerAddress, notes || null, paymentMethod, subtotal, shipping, total]
        );
        
        const orderId = orderResult.insertId;
        
        
        for (const item of items) {
            await pool.execute(
                `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, total) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
            );
            
            
            await pool.execute(
                'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                [item.quantity, item.id]
            );
        }
        
        console.log(`✅ Commande créée: ${orderNumber} (ID: ${orderId})`);
        res.status(201).json({ 
            success: true, 
            orderId, 
            orderNumber,
            message: 'Commande créée avec succès'
        });
    } catch (error) {
        console.error('Erreur POST /orders:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création de la commande',
            details: error.message 
        });
    }
});


app.get('/api/orders', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        
       
        for (let order of orders) {
            const [items] = await pool.execute(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );
            order.items = items;
            order.subtotal = parseFloat(order.subtotal);
            order.shipping = parseFloat(order.shipping);
            order.total = parseFloat(order.total);
        }
        
        res.json(orders);
    } catch (error) {
        console.error('Erreur GET /orders:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des commandes',
            details: error.message 
        });
    }
});


app.get('/api/orders/:id', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [req.params.id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        const order = orders[0];
        const [items] = await pool.execute(
            'SELECT * FROM order_items WHERE order_id = ?',
            [order.id]
        );
        
        order.items = items;
        order.subtotal = parseFloat(order.subtotal);
        order.shipping = parseFloat(order.shipping);
        order.total = parseFloat(order.total);
        
        res.json(order);
    } catch (error) {
        console.error('Erreur GET /orders/:id:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération de la commande',
            details: error.message 
        });
    }
});


app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Statut invalide' });
        }
        
        const [existing] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        await pool.execute(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        
        console.log(`✅ Commande ${id} mise à jour: statut -> ${status}`);
        res.json({ 
            success: true, 
            message: 'Statut mis à jour',
            newStatus: status
        });
    } catch (error) {
        console.error('Erreur PUT /orders/:id/status:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour du statut',
            details: error.message 
        });
    }
});


app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existing] = await pool.execute(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Commande non trouvée' });
        }
        
        await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
        
        console.log(`✅ Commande supprimée: ID ${id}`);
        res.json({ 
            message: 'Commande supprimée avec succès',
            deletedOrder: existing[0]
        });
    } catch (error) {
        console.error('Erreur DELETE /orders/:id:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression de la commande',
            details: error.message 
        });
    }
});


app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route non trouvée',
        path: req.path 
    });
});


async function startServer() {
    console.log('🚀 Démarrage du serveur Backend API...');
    console.log('====================================');
    
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
        console.error('⚠️ Démarrage sans connexion à la base de données');
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log('====================================');
        console.log(`✅ Serveur démarré sur le port ${PORT}`);
        console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
        console.log(`📷 Uploads disponibles sur http://localhost:${PORT}/api/uploads`);
        console.log('====================================');
    });
}

startServer();
