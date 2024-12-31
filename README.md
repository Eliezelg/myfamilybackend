# My Family Backend

API backend pour l'application de gestion des profils familiaux.

## Fonctionnalités

- 🔐 Authentification JWT
- 📸 Gestion des photos
- 👥 Gestion des profils
- 🔄 API RESTful
- 📦 Base de données PostgreSQL avec Prisma

## Technologies utilisées

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT pour l'authentification
- Multer pour la gestion des fichiers
- Sharp pour l'optimisation des images

## Installation

### Prérequis
- Node.js (v14 ou supérieur)
- PostgreSQL
- npm ou yarn

### Configuration

1. Cloner le dépôt :
```bash
git clone https://github.com/Eliezelg/myfamilybackend.git
cd myfamilybackend
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
```
Puis remplir les variables dans le fichier .env :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/family_db"
JWT_SECRET="votre_secret_jwt"
PORT=5000
```

4. Initialiser la base de données :
```bash
npx prisma migrate dev
```

## Démarrage

Pour démarrer le serveur en mode développement :
```bash
npm run dev
```

Le serveur sera accessible à l'adresse : http://localhost:5000

## Tests

Pour lancer les tests :
```bash
npm test
```

## Structure du projet

```
src/
├── config/         # Configuration (base de données, etc.)
├── controllers/    # Contrôleurs de l'API
├── middlewares/    # Middlewares (auth, validation, etc.)
├── models/         # Modèles Prisma
├── routes/         # Routes de l'API
├── services/       # Services métier
├── utils/          # Utilitaires
├── app.js         # Configuration Express
└── server.js      # Point d'entrée
```

## API Endpoints

### Authentification
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token

### Photos
- GET /api/photos
- POST /api/photos/upload
- DELETE /api/photos/:id

### Profils
- GET /api/profiles
- POST /api/profiles
- PUT /api/profiles/:id
- DELETE /api/profiles/:id

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.

## Licence

MIT
