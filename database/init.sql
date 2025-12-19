-- ===================================
-- Script d'initialisation MySQL
-- Application E-Commerce Multi-Tier
-- Prix en Dinars Tunisiens (TND)
-- ===================================

-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS ecommerce
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Utilisation de la base de données
USE ecommerce;

-- ===================================
-- TABLE: products
-- ===================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 3) NOT NULL,
    stock INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_price (price),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- DONNÉES DE DÉMONSTRATION (Prix en TND)
-- ===================================
INSERT INTO products (name, description, price, stock, image_url) VALUES
    ('iPhone 15 Pro Max', 'Smartphone Apple avec puce A17 Pro, écran Super Retina XDR 6.7 pouces, appareil photo 48MP et Dynamic Island.', 4899.000, 15, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500'),
    ('Samsung Galaxy S24 Ultra', 'Smartphone Samsung avec S Pen intégré, écran AMOLED 6.8 pouces, processeur Snapdragon 8 Gen 3 et appareil photo 200MP.', 4299.000, 20, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500'),
    ('MacBook Pro 14 M3', 'Ordinateur portable Apple avec puce M3 Pro, écran Liquid Retina XDR 14 pouces, 18GB RAM et SSD 512GB.', 6999.000, 10, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500'),
    ('AirPods Pro 2', 'Écouteurs sans fil Apple avec réduction de bruit active, audio spatial personnalisé et étui MagSafe.', 899.000, 50, 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=500'),
    ('Apple Watch Series 9', 'Montre connectée avec puce S9, écran Always-On Retina, suivi santé avancé et détection de chute.', 1499.000, 30, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'),
    ('iPad Pro 12.9 M2', 'Tablette Apple avec puce M2, écran Liquid Retina XDR 12.9 pouces, Face ID et support Apple Pencil 2.', 3799.000, 18, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'),
    ('Sony WH-1000XM5', 'Casque audio sans fil premium avec réduction de bruit leader du marché, 30h d''autonomie et audio Hi-Res.', 1199.000, 25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'),
    ('PlayStation 5', 'Console de jeux Sony avec SSD ultra-rapide, ray-tracing, audio 3D et manette DualSense.', 1899.000, 12, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500'),
    ('Nintendo Switch OLED', 'Console de jeux hybride avec écran OLED 7 pouces, support ajustable et haut-parleurs améliorés.', 1099.000, 22, 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=500'),
    ('Canon EOS R6 Mark II', 'Appareil photo hybride plein format 24.2MP, vidéo 4K 60fps, stabilisation sur capteur et AF intelligent.', 7499.000, 8, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500'),
    ('DJI Mini 3 Pro', 'Drone compact avec caméra 4K HDR, détection d''obstacles tri-directionnelle et 34 min d''autonomie.', 2699.000, 15, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=500'),
    ('Dyson V15 Detect', 'Aspirateur sans fil avec laser pour détecter la poussière, écran LCD et 60 min d''autonomie.', 2199.000, 20, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500');

-- ===================================
-- TABLE: categories
-- ===================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE INDEX idx_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des catégories
INSERT INTO categories (name, description) VALUES
    ('Smartphones', 'Téléphones mobiles et accessoires'),
    ('Ordinateurs', 'Laptops, desktops et composants'),
    ('Audio', 'Écouteurs, casques et enceintes'),
    ('Wearables', 'Montres connectées et trackers fitness'),
    ('Gaming', 'Consoles et accessoires gaming'),
    ('Photo & Vidéo', 'Caméras, drones et accessoires');

-- ===================================
-- TABLE: orders (Commandes)
-- ===================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- TABLE: order_items (Articles des commandes)
-- ===================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10, 3) NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- AFFICHAGE DES DONNÉES INSÉRÉES
-- ===================================
SELECT 'Base de données initialisée avec succès!' AS message;
SELECT COUNT(*) AS 'Nombre de produits' FROM products;
SELECT COUNT(*) AS 'Nombre de catégories' FROM categories;
