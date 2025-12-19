/**
 * Application E-Commerce Multi-Tier
 * JavaScript Principal - API, Panier et Utilitaires
 */

// ===================================
// CONFIGURATION
// ===================================
const API_URL = '/api';

// ===================================
// API SERVICE
// ===================================
const API = {
    async getProducts() {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Erreur lors du chargement des produits');
        return response.json();
    },
    
    async getProduct(id) {
        const response = await fetch(`${API_URL}/products/${id}`);
        if (!response.ok) throw new Error('Produit non trouvé');
        return response.json();
    },
    
    async createProduct(formData) {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            body: formData // FormData pour l'upload d'image
        });
        if (!response.ok) throw new Error('Erreur lors de la création');
        return response.json();
    },
    
    async updateProduct(id, formData) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            body: formData
        });
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        return response.json();
    },
    
    async deleteProduct(id) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        return response.json();
    },
    
    async checkHealth() {
        const response = await fetch(`${API_URL}/health`);
        return response.json();
    }
};

// ===================================
// CART MANAGEMENT (LocalStorage)
// ===================================
const Cart = {
    STORAGE_KEY: 'elegance_cart',
    
    getItems() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    saveItems(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },
    
    addItem(product) {
        const items = this.getItems();
        const existingIndex = items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            items[existingIndex].quantity += 1;
        } else {
            items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: 1
            });
        }
        
        this.saveItems(items);
        return items;
    },
    
    removeItem(productId) {
        const items = this.getItems().filter(item => item.id !== productId);
        this.saveItems(items);
        return items;
    },
    
    updateQuantity(productId, quantity) {
        const items = this.getItems();
        const item = items.find(item => item.id === productId);
        
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveItems(items);
        }
        
        return items;
    },
    
    getTotal() {
        return this.getItems().reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    },
    
    getItemCount() {
        return this.getItems().reduce((count, item) => count + item.quantity, 0);
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// ===================================
// UI UTILITIES
// ===================================
function formatPrice(price) {
    // Format en Dinars Tunisiens (TND)
    return new Intl.NumberFormat('fr-TN', {
        style: 'currency',
        currency: 'TND',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
    }).format(price);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        const count = Cart.getItemCount();
        countEl.textContent = count;
        countEl.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Fonction pour obtenir l'URL de l'image
function getImageUrl(product) {
    if (product.image_url) {
        // Si l'image commence par http, c'est une URL externe
        if (product.image_url.startsWith('http')) {
            return product.image_url;
        }
        // Sinon c'est une image uploadée
        return `/api/uploads/${product.image_url}`;
    }
    // Image par défaut si pas d'image
    return 'https://via.placeholder.com/300x300?text=Pas+d%27image';
}

// ===================================
// PRODUCT CARD COMPONENT
// ===================================
function createProductCard(product) {
    const imageUrl = getImageUrl(product);
    
    const stockClass = product.stock > 10 ? '' : product.stock > 0 ? 'low' : 'out';
    const stockText = product.stock > 10 ? `${product.stock} en stock` : 
                      product.stock > 0 ? `Plus que ${product.stock}` : 'Rupture';
    
    return `
        <article class="product-card" data-id="${product.id}">
            <a href="product-detail.html?id=${product.id}" class="product-link">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${escapeHtml(product.name)}" onerror="this.src='https://via.placeholder.com/300x300?text=Image+non+disponible'">
                    ${product.stock <= 0 ? '<span class="out-of-stock-badge">Rupture</span>' : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <p class="product-description">${escapeHtml((product.description || '').substring(0, 80))}...</p>
                    <div class="product-meta">
                        <span class="product-price">${formatPrice(product.price)}</span>
                        <span class="product-stock ${stockClass}">${stockText}</span>
                    </div>
                </div>
            </a>
            <div class="product-actions">
                <button class="btn btn-primary btn-sm add-to-cart-btn" 
                        onclick="addToCart(event, ${product.id})" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <span>Ajouter</span>
                </button>
                <a href="product-detail.html?id=${product.id}" class="btn btn-outline btn-sm">
                    <span>Détails</span>
                </a>
            </div>
        </article>
    `;
}

// ===================================
// CART ACTIONS
// ===================================
async function addToCart(event, productId) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('addToCart appelé avec productId:', productId);
    
    try {
        console.log('Récupération du produit...');
        const product = await API.getProduct(productId);
        console.log('Produit récupéré:', product);
        
        Cart.addItem(product);
        console.log('Produit ajouté au panier');
        
        updateCartCount();
        showNotification(`${product.name} ajouté au panier!`, 'success');
        
        // Animation du bouton
        const btn = event.currentTarget;
        if (btn) {
            btn.classList.add('added');
            setTimeout(() => btn.classList.remove('added'), 1000);
        }
    } catch (error) {
        console.error('Erreur addToCart:', error);
        showNotification('Erreur lors de l\'ajout au panier: ' + error.message, 'error');
    }
}

// ===================================
// THEME MANAGEMENT
// ===================================
const Theme = {
    STORAGE_KEY: 'elegance_theme',
    
    init() {
        // Charger le thème sauvegardé ou utiliser la préférence système
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        
        if (savedTheme) {
            this.setTheme(savedTheme, false);
        } else {
            // Détecter la préférence système
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light', false);
        }
        
        // Écouter les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
    },
    
    setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem(this.STORAGE_KEY, theme);
        }
    },
    
    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Notification du changement
        const themeLabel = newTheme === 'dark' ? '🌙 Mode sombre' : '☀️ Mode clair';
        showNotification(`${themeLabel} activé`, 'success');
    },
    
    get current() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }
};

function toggleTheme() {
    Theme.toggle();
}

// ===================================
// INITIALIZE ON ALL PAGES
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le thème
    Theme.init();
    
    updateCartCount();
    
    // Smooth scroll pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Expose global functions
window.addToCart = addToCart;
window.API = API;
window.Cart = Cart;
window.formatPrice = formatPrice;
window.escapeHtml = escapeHtml;
window.showNotification = showNotification;
window.updateCartCount = updateCartCount;
window.createProductCard = createProductCard;
window.getImageUrl = getImageUrl;
window.toggleTheme = toggleTheme;
window.Theme = Theme;
