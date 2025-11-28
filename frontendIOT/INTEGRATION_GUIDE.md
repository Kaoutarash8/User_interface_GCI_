# 🚀 Guide d'Intégration Frontend-Backend

## ✅ Intégration Complète Réalisée

Le frontend React est maintenant **complètement intégré** avec le backend FastAPI !

### 📦 Fichiers Créés/Modifiés

#### Nouveaux fichiers :
- ✅ `src/services/api.js` - Service API pour communiquer avec le backend
- ✅ `src/contexts/AuthContext.jsx` - Contexte d'authentification

#### Fichiers modifiés :
- ✅ `src/pages/LoginPage.jsx` - Connexion avec le backend (mot de passe uniquement)
- ✅ `src/pages/DashboardPage.jsx` - Données réelles du backend
- ✅ `src/pages/HistoryPage.jsx` - Historique depuis le backend
- ✅ `src/pages/ProfilePage.jsx` - Changement de mot de passe
- ✅ `src/components/Layout.jsx` - Déconnexion avec l'API
- ✅ `src/App.jsx` - Protection des routes
- ✅ `package.json` - Ajout d'axios

---

## 🎯 Fonctionnalités Intégrées

### 1. Authentification ✅
- ✅ Connexion avec mot de passe uniquement
- ✅ Déconnexion
- ✅ Protection des routes (redirection si non connecté)
- ✅ Gestion de session avec localStorage

### 2. Dashboard ✅
- ✅ Température actuelle depuis le backend
- ✅ Statut chauffage/ventilateur
- ✅ Mode AUTO/MANUEL
- ✅ Température de confort
- ✅ Graphiques avec données réelles (24h)
- ✅ Comparaison prédiction vs réel
- ✅ Rafraîchissement automatique toutes les 30 secondes

### 3. Historique ✅
- ✅ Température moyenne 24h
- ✅ Heures de chauffage/ventilateur
- ✅ Filtrage par date
- ✅ Tableau avec données réelles
- ✅ Graphiques d'évolution
- ✅ Export CSV/PDF (fonctionnel)

### 4. Profil ✅
- ✅ Changement de mot de passe
- ✅ Validation des mots de passe
- ✅ Messages d'erreur/succès

---

## 🚀 Comment Lancer l'Application Complète

### Étape 1 : Lancer le Backend

```bash
cd backend
python main.py
```

Le backend doit être accessible sur : `http://localhost:8000`

### Étape 2 : Installer les dépendances du Frontend

```bash
cd frontendIOT
npm install
```

Cela installera axios et toutes les dépendances.

### Étape 3 : Lancer le Frontend

```bash
npm run dev
```

Le frontend sera accessible sur : `http://localhost:5173` (ou un autre port si 5173 est occupé)

### Étape 4 : Tester l'Application

1. **Ouvrez** `http://localhost:5173` dans votre navigateur
2. **Connectez-vous** avec le mot de passe : `admin123`
3. **Explorez** le dashboard, l'historique et le profil

---

## 🔧 Configuration

### URL du Backend

Si votre backend est sur un autre port, modifiez dans `src/services/api.js` :

```javascript
const API_BASE_URL = 'http://localhost:8000'; // Changez ici si nécessaire
```

### CORS

Le backend est déjà configuré pour accepter les requêtes depuis :
- `http://localhost:3000`
- `http://localhost:5173` (Vite)
- `http://localhost:8080`

---

## 📝 Endpoints Utilisés

### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion
- `POST /auth/change-password` - Changer le mot de passe

### Dashboard
- `GET /temperature/dashboard` - Données complètes du dashboard

### Historique
- `GET /history/all` - Historique complet (avec filtres optionnels)
- `GET /history/mode/current` - Mode actuel

### Mode
- `POST /history/mode` - Changer le mode (1=AUTO, 0=MANUEL)

---

## 🐛 Dépannage

### Erreur CORS
- Vérifiez que le backend est bien lancé
- Vérifiez que l'URL dans `api.js` correspond au port du backend

### Erreur 401 (Non authentifié)
- Connectez-vous d'abord avec `/auth/login`
- Vérifiez que le mot de passe est correct (`admin123` par défaut)

### Données vides
- Vérifiez que vous avez des données dans la base de données
- Utilisez Swagger UI (`http://localhost:8000/docs`) pour créer des données de test

### Erreur de connexion
- Vérifiez que le backend est bien lancé sur le port 8000
- Vérifiez la console du navigateur pour les erreurs détaillées

---

## 📊 Données de Test

Pour tester l'application avec des données, vous pouvez :

1. **Utiliser Swagger UI** : `http://localhost:8000/docs`
2. **Créer des mesures de température** :
   ```json
   POST /temperature/data
   {
     "timestamp": "2024-12-15T14:30:00",
     "year": 2024,
     "month": 12,
     "day": 15,
     "hour": 14,
     "indoor_temp": 22.5,
     "heater_level": 30,
     "fan_level": 0
   }
   ```

3. **Créer des prédictions** :
   ```json
   POST /temperature/prediction
   {
     "year": 2024,
     "month": 12,
     "day": 15,
     "hour": 14,
     "predicted_temp": 22.8,
     "adjusted_temp": 22.5,
     "outdoor_temp": 15.0,
     "heater_level": 30,
     "fan_speed": 0,
     "comfort_temp": 21.5
   }
   ```

---

## ✅ Checklist de Vérification

- [ ] Backend lancé et accessible sur `http://localhost:8000`
- [ ] Frontend lancé et accessible sur `http://localhost:5173`
- [ ] Connexion fonctionne avec le mot de passe `admin123`
- [ ] Dashboard affiche les données (ou "N/A" si aucune donnée)
- [ ] Historique s'affiche correctement
- [ ] Changement de mode fonctionne
- [ ] Changement de mot de passe fonctionne
- [ ] Déconnexion fonctionne

---

## 🎉 Félicitations !

Votre application web complète est maintenant fonctionnelle avec :
- ✅ Backend FastAPI
- ✅ Frontend React
- ✅ Base de données MySQL
- ✅ Authentification
- ✅ Dashboard en temps réel
- ✅ Historique avec graphiques
- ✅ Gestion du profil

**Bon développement ! 🚀**

