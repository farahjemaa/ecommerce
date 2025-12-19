# 🛒 Application E-Commerce Multi-Tier avec Docker Compose

Une application web complète démontrant une architecture multi-tier containerisée avec Docker Compose.

## 📋 Description du Projet

Ce projet implémente une application e-commerce composée de trois couches indépendantes :

- **Frontend** : Interface utilisateur moderne (HTML/CSS/JavaScript)
- **Backend** : API REST (Node.js/Express)
- **Base de données** : MySQL 8.0 avec persistance des données

Chaque service s'exécute dans son propre conteneur Docker, orchestré par Docker Compose.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DOCKER COMPOSE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   FRONTEND   │    │   BACKEND    │    │   DATABASE   │  │
│  │              │    │              │    │              │  │
│  │  Nginx       │───▶│  Node.js     │───▶│  MySQL 8.0   │  │
│  │  HTML/CSS/JS │    │  Express     │    │              │  │
│  │              │    │  API REST    │    │              │  │
│  │  Port: 8080  │    │  Port: 3000  │    │  Port: 3306  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ◄──────────────── ecommerce-network ────────────────────►  │
│                                                              │
│  Volume: mysql_data (persistance des données)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```



## 🚀 Démarrage Rapide

### Prérequis

- Docker (version 20.10+)
- Docker Compose (version 2.0+)

### Lancer l'application

```bash
# Cloner le projet (si nécessaire)
cd e-commerce

# Construire et démarrer tous les services
docker-compose up --build

# Ou en mode détaché (arrière-plan)
docker-compose up --build -d
```

### Accéder à l'application

| Service  | URL                          | Description              |
|----------|------------------------------|--------------------------|
| Frontend | http://localhost:8080        | Interface utilisateur    |
| Backend  | http://localhost:3000/api    | API REST                 |
| Database | localhost:3306               | MySQL (via client MySQL) |

## 📡 API REST - Endpoints

### Health Check
```bash
GET /api/health
```
Retourne l'état des services backend et database.

### Produits

| Méthode | Endpoint           | Description                    |
|---------|-------------------|--------------------------------|
| GET     | /api/products     | Liste tous les produits        |
| GET     | /api/products/:id | Récupère un produit par ID     |
| POST    | /api/products     | Crée un nouveau produit        |
| PUT     | /api/products/:id | Met à jour un produit existant |
| DELETE  | /api/products/:id | Supprime un produit            |

### Exemple de requête POST
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nouveau Produit",
    "description": "Description du produit",
    "price": 99.99,
    "stock": 50
  }'
```


## ⚙️ Configuration

### Variables d'environnement (dans docker-compose.yml)

| Variable         | Défaut         | Description              |
|-----------------|----------------|--------------------------|
| DB_HOST         | database       | Hôte de la base de données |
| DB_USER         | root           | Utilisateur MySQL        |
| DB_PASSWORD     | rootpassword   | Mot de passe MySQL       |
| DB_NAME         | ecommerce      | Nom de la base de données |
| PORT            | 3000           | Port du backend          |

### Ports exposés

| Service  | Port Conteneur | Port Hôte |
|----------|---------------|-----------|
| Frontend | 80            | 8080      |
| Backend  | 3000          | 3000      |
| Database | 3306          | 3306      |

## 🔧 Concepts Docker Démontrés

### Dockerfile
- Construction d'images personnalisées
- Multi-stage builds (optimisation)
- Copie de fichiers et configuration

### Docker Compose
- Orchestration de plusieurs services
- Définition de dépendances (`depends_on`)
- Health checks pour la séquence de démarrage

### Réseaux Docker
- Réseau bridge personnalisé (`ecommerce-network`)
- Communication inter-conteneurs par nom de service

### Volumes Docker
- Volume nommé pour la persistance MySQL (`mysql_data`)
- Montage de fichiers pour l'initialisation

### Ports et Exposition
- Mappage de ports (hôte:conteneur)
- Exposition sélective des services

## 📊 Fonctionnalités de l'Application

### Frontend
- ✅ Interface moderne et responsive
- ✅ Affichage dynamique des produits
- ✅ Formulaire d'ajout de produits
- ✅ Suppression de produits
- ✅ Indicateurs d'état des services
- ✅ Notifications utilisateur

### Backend
- ✅ API RESTful complète (CRUD)
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Reconnexion automatique à MySQL
- ✅ Health check endpoint

### Base de données
- ✅ Schéma optimisé avec index
- ✅ Données de démonstration
- ✅ Persistance via volume Docker
- ✅ Encodage UTF-8 (caractères spéciaux)

## 🔒 Sécurité (Notes)

> ⚠️ **Important** : Ce projet est destiné à des fins éducatives. Pour un environnement de production :

- Changez les mots de passe par défaut
- Utilisez des secrets Docker ou un gestionnaire de secrets
- Activez HTTPS avec des certificats SSL
- Limitez l'exposition des ports
- Ajoutez une authentification à l'API


## 🐛 Dépannage

### Le backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# S'assurer que MySQL est prêt
docker-compose logs database
```

### Erreur de connexion à la base de données
Le backend attend automatiquement que MySQL soit prêt (health check). Si le problème persiste :
```bash
# Redémarrer les services
docker-compose restart
```

### Reset complet
```bash
# Supprimer tous les conteneurs et volumes
docker-compose down -v

# Reconstruire depuis zéro
docker-compose up --build
```

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.

---



