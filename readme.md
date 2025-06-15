# 🚀 Mon Scrappeur - Application de Scraping

Application de scraping avec backend Node.js/TypeScript et frontend React, containerisée avec Docker.

## 📋 Prérequis

- Docker et Docker Compose installés
- Ports 3000 et 4000 disponibles

## 🏗️ Architecture

### Backend (Port 4000)
- **Image**: `node:22-alpine` (multi-stage optimisée)
- **Technologies**: Node.js, TypeScript, Express, Puppeteer
- **Taille optimisée**: ~200MB (vs ~800MB sans optimisation)

### Frontend (Port 3000)  
- **Image**: `nginx:alpine` (multi-stage optimisée)
- **Technologies**: React, TypeScript, Vite, TailwindCSS
- **Taille optimisée**: ~25MB (vs ~400MB sans optimisation)

## 🚀 Démarrage Rapide

### Production
```bash
# Construire et démarrer
docker-compose up -d

# Vérifier l'état
docker-compose ps

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Développement (avec hot reload)
```bash
# Démarrer en mode développement
docker-compose -f docker-compose.dev.yml up -d

# Arrêter
docker-compose -f docker-compose.dev.yml down
```

## 🔍 Endpoints

### Backend (http://localhost:4000)
- `GET /` - Page d'accueil
- `GET /health` - Health check
- `POST /api/gmb` - Scraping Google My Business
- `POST /api/pj` - Scraping Pages Jaunes

### Frontend (http://localhost:3000)
- Interface utilisateur React
- `GET /health` - Health check

## 🛠️ Optimisations Appliquées

### Images Docker
1. **Multi-stage builds** pour réduire la taille finale
2. **Alpine Linux** comme base (plus léger)
3. **npm cache clean** pour réduire l'espace disque
4. **Utilisateurs non-root** pour la sécurité

### Backend
- Puppeteer configuré avec Chromium système
- Variables d'environnement pour Puppeteer
- Build TypeScript optimisé

### Frontend  
- Build Vite optimisé
- Nginx avec compression gzip
- Headers de sécurité
- Cache des assets statiques
- Support du routing côté client

### Docker Compose
- Health checks automatiques
- Dépendances entre services
- Restart automatique
- Réseau isolé

## 📊 Comparaison des Tailles

| Composant | Avant | Après | Gain |
|-----------|-------|-------|------|
| Backend   | ~800MB | ~200MB | 75% |
| Frontend  | ~400MB | ~25MB | 94% |
| **Total** | **~1.2GB** | **~225MB** | **81%** |

## 🔧 Commandes Utiles

```bash
# Reconstruire une image spécifique
docker-compose build backend
docker-compose build frontend

# Voir les logs d'un service
docker-compose logs backend
docker-compose logs frontend

# Exécuter une commande dans un conteneur
docker-compose exec backend sh
docker-compose exec frontend sh

# Nettoyer les images inutilisées
docker system prune -a
```

## 🐛 Dépannage

### Le frontend ne démarre pas
- Vérifiez les logs : `docker-compose logs frontend`
- Vérifiez que le port 3000 est libre

### Le backend ne démarre pas  
- Vérifiez les logs : `docker-compose logs backend`
- Vérifiez que le port 4000 est libre
- Vérifiez que Puppeteer peut accéder à Chromium

### Problèmes de build
- Nettoyez le cache : `docker-compose build --no-cache`
- Vérifiez l'espace disque disponible

## 📝 Notes Techniques

- **Puppeteer** : Configuré pour utiliser Chromium système (plus léger)
- **Nginx** : Configuré avec compression et headers de sécurité
- **Health Checks** : Implémentés pour monitoring automatique
- **Multi-stage** : Sépare build et runtime pour optimiser la taille
