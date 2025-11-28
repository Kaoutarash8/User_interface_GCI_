

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

1. **Python 3.8+** : [Télécharger Python](https://www.python.org/downloads/)
2. **MySQL** : [Télécharger MySQL](https://dev.mysql.com/downloads/mysql/)
3. **phpMyAdmin** (optionnel mais recommandé) : [Télécharger phpMyAdmin](https://www.phpmyadmin.net/downloads/)

## 📦 Installation

### Étape 1 : Naviguer vers le dossier backend

```bash
cd backend
```

### Étape 2 : Créer un environnement virtuel (recommandé)

**Windows :**
```bash
python -m venv venv
venv\Scripts\activate
```



```

### Étape 3 : Installer les dépendances

```bash
pip install -r requirements.txt
```

## 🚀 Lancement

### Méthode 1 : Avec Python directement

```bash
python main.py
```

### Méthode 2 : Avec uvicorn en ligne de commande

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```


### Accès à l'API

- **API** : http://localhost:8000
- **Documentation interactive (Swagger)** : http://localhost:8000/docs
- **Documentation alternative (ReDoc)** : http://localhost:8000/redoc
